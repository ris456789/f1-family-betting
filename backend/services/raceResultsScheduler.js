import axios from 'axios';
import supabase from '../db/supabase.js';
import { getRaceResults, getOfficialResults } from './f1DataService.js';
import { getAllSupplementaryData } from './scrapingService.js';
import { transformRaceResults, calculateScore } from './scoringService.js';
import { races2026 } from '../data/races2026.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

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
    // Try Jolpi.ca (Ergast mirror) first — gives official classification + proper DNF status
    let rawResults = await getOfficialResults(year, race.round);
    let source = 'jolpi';

    if (!rawResults || rawResults.length < 5) {
      console.log(`[ResultsFetcher] Jolpi not ready for ${race.name}, falling back to OpenF1...`);
      rawResults = await getRaceResults(year, race.round);
      source = 'openf1';
    }

    if (!rawResults || rawResults.length < 5) {
      console.log(`[ResultsFetcher] Results not available yet for ${race.name} (got ${rawResults?.length ?? 0} entries)`);
      return false;
    }

    console.log(`[ResultsFetcher] Using ${source} data for ${race.name} (${rawResults.length} drivers)`);

    // If using OpenF1 fallback, enhance DNF list via race control messages
    if (source === 'openf1') {
      const sessionKey = await getRaceSessionKey(year, race.date);
      if (sessionKey) {
        const dnfNumbers = await getDNFDriverNumbers(sessionKey);
        if (dnfNumbers.length > 0) {
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
    return predictions.length;
  } catch (err) {
    console.error(`[Scoring] Error for ${raceId}:`, err.message);
    return 0;
  }
}

// Fetch results only — does NOT score or email
export async function triggerResultsFetch(year, round) {
  const race = races2026.find(r => r.round === parseInt(round));
  if (!race) throw new Error(`Round ${round} not found`);

  const fetched = await fetchAndSaveRaceResults(race);
  if (fetched) return { fetched: true };
  return { fetched: false, message: 'Results not available yet from Jolpi/OpenF1' };
}

// Score only — call this after results are confirmed correct
export async function triggerScoreCalculation(raceId) {
  const scored = await calculateAndSaveScores(raceId);
  return { scored };
}

export default { startRaceResultsScheduler, triggerResultsFetch };
