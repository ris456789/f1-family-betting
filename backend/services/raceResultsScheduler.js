import cron from 'node-cron';
import axios from 'axios';
import supabase from '../db/supabase.js';
import { getRaceResults } from './f1DataService.js';
import { getAllSupplementaryData } from './scrapingService.js';
import { transformRaceResults, calculateScore } from './scoringService.js';
import { sendResultsEmail } from './emailService.js';
import { races2026 } from '../data/races2026.js';
import { PARTICIPANT_EMAILS } from '../data/participants.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// A race takes ~2 hours. We start checking 30 min after the scheduled start
// and keep trying for up to 5 hours in case of delays or slow Wikipedia updates.
const RESULTS_AVAILABLE_AFTER_HOURS = 0.5;
const RESULTS_GIVE_UP_AFTER_HOURS = 5;

// ─────────────────────────────────────────
// DNF detection via OpenF1 race control messages
// ─────────────────────────────────────────
async function getDNFDriverNumbers(sessionKey) {
  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/race_control`, {
      params: { session_key: sessionKey },
      timeout: 10000
    });
    const retired = new Set();
    for (const msg of response.data) {
      if (msg.message && /RETIRED/i.test(msg.message)) {
        const match = msg.message.match(/CAR\s+(\d+)/i);
        if (match) retired.add(parseInt(match[1]));
      }
    }
    return [...retired];
  } catch (e) {
    console.warn('[ResultsFetcher] Could not fetch race control messages:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────
// Fetch race session key from OpenF1
// ─────────────────────────────────────────
async function getRaceSessionKey(year, raceDate) {
  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
      params: { year, session_name: 'Race' },
      timeout: 10000
    });
    const sessions = response.data;
    if (!sessions || sessions.length === 0) return null;

    // Match by date
    const session = sessions.find(s => {
      const d = new Date(s.date_start).toISOString().split('T')[0];
      return d === raceDate;
    });
    return session?.session_key || null;
  } catch (e) {
    console.warn('[ResultsFetcher] Could not fetch session key:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────
// Fetch, transform, and save race results
// ─────────────────────────────────────────
async function fetchAndSaveRaceResults(race) {
  const raceId = `2026_${race.round}`;
  const year = 2026;

  console.log(`[ResultsFetcher] Attempting to fetch results for ${race.name}...`);

  try {
    const rawResults = await getRaceResults(year, race.round);

    if (!rawResults || rawResults.length < 5) {
      console.log(`[ResultsFetcher] Results not available yet for ${race.name} (got ${rawResults?.length ?? 0} entries)`);
      return false;
    }

    // Enhance DNF list using race control messages
    const sessionKey = await getRaceSessionKey(year, race.date);
    if (sessionKey) {
      const dnfNumbers = await getDNFDriverNumbers(sessionKey);
      if (dnfNumbers.length > 0) {
        // Map driver numbers → driverIds via OpenF1 drivers endpoint
        try {
          const driversRes = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
            params: { session_key: sessionKey },
            timeout: 10000
          });
          const sessionDrivers = driversRes.data;
          dnfNumbers.forEach(num => {
            const d = sessionDrivers.find(sd => sd.driver_number === num);
            if (d) {
              const r = rawResults.find(r => r.driverCode === d.name_acronym);
              if (r) r.status = 'Retired';
            }
          });
        } catch (e) {
          console.warn('[ResultsFetcher] Could not map DNF driver numbers:', e.message);
        }
      }
    }

    // Scrape Wikipedia for safety car, red flag, winning margin
    // and F1.com for Driver of the Day
    const supplementary = await getAllSupplementaryData(year, race.round, race.name);

    const transformed = transformRaceResults(rawResults, supplementary);

    const raceResult = {
      race_id: raceId,
      race_year: year,
      race_round: race.round,
      race_name: race.name,
      p1: transformed.p1,
      p2: transformed.p2,
      p3: transformed.p3,
      top_10: transformed.top10,
      fastest_lap: transformed.fastestLap,
      pole_position: transformed.polePosition,
      dnf_drivers: transformed.dnfDrivers,
      safety_car: transformed.safetyCar,
      red_flag: transformed.redFlag,
      driver_of_the_day: transformed.driverOfTheDay,
      winning_margin: transformed.winningMargin,
      scraping_status: supplementary.scrapingStatus || {},
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('race_results')
      .upsert(raceResult, { onConflict: 'race_id' });

    if (error) throw error;

    console.log(
      `[ResultsFetcher] Saved results for ${race.name} — ` +
      `P1: ${transformed.p1}, P2: ${transformed.p2}, P3: ${transformed.p3} | ` +
      `SC: ${transformed.safetyCar}, RF: ${transformed.redFlag}`
    );
    return true;
  } catch (err) {
    console.error(`[ResultsFetcher] Error for ${race.name}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────
// Calculate and save scores for a race
// ─────────────────────────────────────────
async function calculateAndSaveScores(raceId) {
  try {
    const { data: raceResult, error: rErr } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .single();

    if (rErr || !raceResult) {
      console.log(`[Scoring] No results in DB for ${raceId}`);
      return 0;
    }

    const { data: predictions, error: pErr } = await supabase
      .from('predictions')
      .select('*, users(name)')
      .eq('race_id', raceId);

    if (pErr || !predictions || predictions.length === 0) {
      console.log(`[Scoring] No predictions found for ${raceId}`);
      return 0;
    }

    const resultForScoring = {
      p1: raceResult.p1,
      p2: raceResult.p2,
      p3: raceResult.p3,
      top10: raceResult.top_10,
      fastestLap: raceResult.fastest_lap,
      polePosition: raceResult.pole_position,
      dnfDrivers: raceResult.dnf_drivers,
      safetyCar: raceResult.safety_car,
      redFlag: raceResult.red_flag,
      driverOfTheDay: raceResult.driver_of_the_day,
      winningMargin: raceResult.winning_margin
    };

    for (const prediction of predictions) {
      const predForScoring = {
        p1: prediction.p1,
        p2: prediction.p2,
        p3: prediction.p3,
        top10: prediction.top_10,
        fastestLap: prediction.fastest_lap,
        polePosition: prediction.pole_position,
        dnfDrivers: prediction.dnf_drivers,
        safetyCar: prediction.safety_car,
        redFlag: prediction.red_flag,
        driverOfTheDay: prediction.driver_of_the_day,
        winningMarginBracket: prediction.winning_margin_bracket
      };

      const breakdown = calculateScore(predForScoring, resultForScoring);

      const { error } = await supabase
        .from('scores')
        .upsert({
          prediction_id: prediction.id,
          user_id: prediction.user_id,
          race_id: raceId,
          race_year: raceResult.race_year,
          race_round: raceResult.race_round,
          points_breakdown: breakdown,
          total_points: breakdown.total,
          calculated_at: new Date().toISOString()
        }, { onConflict: 'prediction_id' });

      if (error) console.error(`[Scoring] Error saving score for prediction ${prediction.id}:`, error.message);
    }

    console.log(`[Scoring] Calculated scores for ${predictions.length} predictions for ${raceId}`);

    // Send results email to all participants
    try {
      let dbUsers = [];
      if (supabase) {
        const { data } = await supabase.from('users').select('id, name, emoji, email');
        dbUsers = data || [];
      }

      const users = PARTICIPANT_EMAILS.map(email => {
        const dbUser = dbUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
        return dbUser
          ? { ...dbUser, email }
          : { id: email, name: email.split('@')[0], emoji: '👤', email };
      });

      if (users.length > 0) {
        // Build leaderboard from saved scores
        const { data: scores } = await supabase
          .from('scores')
          .select('user_id, total_points, users(id, name, emoji)')
          .eq('race_id', raceId)
          .order('total_points', { ascending: false });

        const leaderboard = (scores || []).map((s, i) => ({
          user_id: s.user_id,
          user_name: s.users?.name || 'Unknown',
          emoji: s.users?.emoji || '👤',
          total_points: s.total_points
        }));

        const race = races2026.find(r => `2026_${r.round}` === raceId);
        if (race) {
          const raceForEmail = { ...race, raceName: race.name, circuitName: race.circuit };
          for (const user of users) {
            await sendResultsEmail(user, raceForEmail, leaderboard).catch(e =>
              console.warn(`[Results Email] Failed for ${user.email}:`, e.message)
            );
          }
          console.log(`[Results Email] Sent to ${users.length} user(s) for ${race.name}`);
        }
      }
    } catch (emailErr) {
      console.warn('[Results Email] Error sending results emails:', emailErr.message);
    }

    return predictions.length;
  } catch (err) {
    console.error(`[Scoring] Error for ${raceId}:`, err.message);
    return 0;
  }
}

// ─────────────────────────────────────────
// Main check — called by cron
// ─────────────────────────────────────────
async function checkRecentlyFinishedRaces() {
  if (!supabase) {
    console.log('[ResultsFetcher] Supabase not configured, skipping');
    return;
  }

  const now = new Date();

  const racesToProcess = races2026.filter(race => {
    const raceStart = new Date(`${race.date}T${race.time}`);
    const checkStart = new Date(raceStart.getTime() + RESULTS_AVAILABLE_AFTER_HOURS * 3600000);
    const checkEnd = new Date(raceStart.getTime() + RESULTS_GIVE_UP_AFTER_HOURS * 3600000);
    return now >= checkStart && now <= checkEnd;
  });

  if (racesToProcess.length === 0) return;

  for (const race of racesToProcess) {
    const raceId = `2026_${race.round}`;

    // Check if we already have results with P1 filled in
    const { data: existing } = await supabase
      .from('race_results')
      .select('id, p1')
      .eq('race_id', raceId)
      .single();

    if (existing?.p1) {
      // Results already saved — check if scores exist
      const { data: scores } = await supabase
        .from('scores')
        .select('id')
        .eq('race_id', raceId)
        .limit(1);

      if (!scores || scores.length === 0) {
        console.log(`[ResultsFetcher] Results exist for ${race.name}, running scoring...`);
        await calculateAndSaveScores(raceId);
      }
      // Both results and scores done — nothing to do
      continue;
    }

    // Try to fetch results
    const fetched = await fetchAndSaveRaceResults(race);
    if (fetched) {
      await calculateAndSaveScores(raceId);
    }
  }
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────
export function startRaceResultsScheduler() {
  console.log('[ResultsFetcher] Starting race results scheduler...');

  // Check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await checkRecentlyFinishedRaces();
    } catch (err) {
      console.error('[ResultsFetcher] Scheduler error:', err.message);
    }
  });

  console.log('[ResultsFetcher] Scheduler running — checks every 5 minutes after each race');
}

// Manual trigger for admin or testing
export async function triggerResultsFetch(year, round) {
  const race = races2026.find(r => r.round === parseInt(round));
  if (!race) throw new Error(`Round ${round} not found`);

  const raceId = `${year}_${round}`;
  const fetched = await fetchAndSaveRaceResults(race);
  if (fetched) {
    const scored = await calculateAndSaveScores(raceId);
    return { fetched: true, scored };
  }
  return { fetched: false, scored: 0, message: 'Results not available yet from OpenF1' };
}

export default { startRaceResultsScheduler, triggerResultsFetch };
