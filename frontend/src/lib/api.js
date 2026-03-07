import { supabase } from './supabase';
import { races2026 } from '../data/races2026';
import { drivers2025 } from '../data/drivers2025';

// ============================================
// USERS
// ============================================

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, emoji, email, notify_qualifying, is_host, has_pin, created_at')
    .order('name');

  if (error) throw error;
  return data;
}

export async function verifyPin(userId, pin) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('pin', pin)
    .single();

  if (error || !data) return false;
  return true;
}

export async function setUserPin(userId, pin) {
  const { data, error } = await supabase
    .from('users')
    .update({ pin: pin || null, has_pin: !!pin })
    .eq('id', userId)
    .select('id, name, emoji, email, notify_qualifying, is_host, has_pin, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function createUser(name, emoji = '👤', is_host = false, email = null) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, emoji, is_host, email, notify_qualifying: !!email }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// RACES (from local data)
// ============================================

// Normalize race data to the shape expected by UI components
function normalizeRace(race) {
  return {
    ...race,
    raceName: race.name,
    circuitName: race.circuit,
  };
}

export function getRaces(year = 2026) {
  return races2026
    .filter(r => new Date(r.date).getFullYear() === parseInt(year))
    .map(normalizeRace);
}

export function getNextRace() {
  const now = new Date();
  const upcoming = races2026
    .filter(r => new Date(`${r.date}T${r.time}`) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return upcoming[0] ? normalizeRace(upcoming[0]) : null;
}

export function getDrivers() {
  return drivers2025.map(d => ({
    driverId: d.driverId,
    code: d.code,
    name: d.name,
    fullName: d.name,
    team: d.team,
    teamColor: d.teamColor,
    headshot: d.headshot,
    number: d.number,
  }));
}

// ============================================
// PREDICTIONS
// ============================================

export async function getPredictions(raceId, userId = null) {
  let query = supabase
    .from('predictions')
    .select('*')
    .eq('race_id', raceId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function savePrediction(prediction) {
  const { userId, raceId, raceYear, raceRound, ...predictionData } = prediction;

  // Convert camelCase to snake_case for database
  const dbPrediction = {
    user_id: userId,
    race_id: raceId,
    race_year: raceYear,
    race_round: raceRound,
    p1: predictionData.p1,
    p2: predictionData.p2,
    p3: predictionData.p3,
    top_10: predictionData.top10 || [],
    fastest_lap: predictionData.fastestLap,
    pole_position: predictionData.polePosition,
    dnf_drivers: predictionData.dnfDrivers || [],
    safety_car: predictionData.safetyCar,
    red_flag: predictionData.redFlag,
    driver_of_the_day: predictionData.driverOfTheDay,
    winning_margin_bracket: predictionData.winningMarginBracket,
    updated_at: new Date().toISOString()
  };

  // Upsert - insert or update if exists
  const { data, error } = await supabase
    .from('predictions')
    .upsert(dbPrediction, {
      onConflict: 'user_id,race_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// RACE RESULTS
// ============================================

export async function getRaceResult(raceId) {
  const { data, error } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function saveRaceResult(raceId, resultData) {
  const { data, error } = await supabase
    .from('race_results')
    .upsert({
      race_id: raceId,
      ...resultData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'race_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRaceResultManualData(raceId, manualData) {
  const { data, error } = await supabase
    .from('race_results')
    .update({
      safety_car: manualData.safety_car,
      red_flag: manualData.red_flag,
      driver_of_the_day: manualData.driver_of_the_day,
      updated_at: new Date().toISOString()
    })
    .eq('race_id', raceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// LEADERBOARD & SCORES
// ============================================

export async function getLeaderboard(year = new Date().getFullYear()) {
  // Get all scores for the year with user info
  const { data: scores, error } = await supabase
    .from('scores')
    .select(`
      user_id,
      total_points,
      race_id,
      users (
        id,
        name,
        emoji
      )
    `)
    .eq('race_year', year);

  if (error) throw error;

  // Aggregate scores by user
  const userScores = {};
  scores.forEach(score => {
    const userId = score.user_id;
    if (!userScores[userId]) {
      userScores[userId] = {
        user_id: userId,
        user_name: score.users?.name || 'Unknown',
        emoji: score.users?.emoji || '👤',
        total_points: 0,
        races_predicted: 0
      };
    }
    userScores[userId].total_points += score.total_points || 0;
    userScores[userId].races_predicted += 1;
  });

  // Convert to array and sort by points
  return Object.values(userScores)
    .sort((a, b) => b.total_points - a.total_points);
}

export async function getRaceLeaderboard(raceId) {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      users (
        id,
        name,
        emoji
      )
    `)
    .eq('race_id', raceId)
    .order('total_points', { ascending: false });

  if (error) throw error;

  return data.map((score, index) => ({
    ...score,
    user_name: score.users?.name || 'Unknown',
    emoji: score.users?.emoji || '👤',
    position: index + 1
  }));
}

export async function getCompletedRaces(year = new Date().getFullYear()) {
  const { data, error } = await supabase
    .from('race_results')
    .select('race_id, race_year, race_round, race_name')
    .eq('race_year', year)
    .order('race_round', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================
// SCORING
// ============================================

const POINTS = {
  EXACT_PODIUM: 15,
  PODIUM_IN_TOP3: 10,
  FASTEST_LAP: 5,
  POLE_POSITION: 5,
  TOP_10_EXACT: 5,
  DNF_CORRECT: 5,
  SAFETY_CAR: 5,
  RED_FLAG: 8,
  DOTD: 5,
  WINNING_MARGIN: 5
};

function getWinningMarginBracket(seconds) {
  if (seconds === null || seconds === undefined) return null;
  if (seconds <= 5) return '0-5s';
  if (seconds <= 10) return '5-10s';
  if (seconds <= 20) return '10-20s';
  if (seconds <= 30) return '20-30s';
  return '30s+';
}

export function calculateScore(prediction, result) {
  const breakdown = {};
  let total = 0;

  const predTop10 = prediction.top_10 || [];
  const resultTop10 = result.top_10 || [];
  const resultPodium = resultTop10.slice(0, 3);

  // Positions 1–3: podium scoring
  let podiumPoints = 0;
  for (let i = 0; i < 3; i++) {
    const driver = predTop10[i];
    if (!driver) continue;
    if (resultTop10[i] === driver) {
      podiumPoints += POINTS.EXACT_PODIUM;
    } else if (resultPodium.includes(driver)) {
      podiumPoints += POINTS.PODIUM_IN_TOP3;
    }
  }
  if (podiumPoints > 0) { breakdown.podium = podiumPoints; total += podiumPoints; }

  // Positions 4–10: proximity scoring
  let top10Points = 0;
  for (let i = 3; i < 10; i++) {
    const driver = predTop10[i];
    if (!driver) continue;
    const predictedPos = i + 1;
    const actualIndex = resultTop10.indexOf(driver);
    if (actualIndex === -1) continue;
    const actualPos = actualIndex + 1;
    top10Points += Math.max(0, POINTS.TOP_10_EXACT - Math.abs(predictedPos - actualPos));
  }
  if (top10Points > 0) { breakdown.top_10 = top10Points; total += top10Points; }

  // Fastest lap: 5 pts
  if (prediction.fastest_lap && prediction.fastest_lap === result.fastest_lap) {
    breakdown.fastest_lap = POINTS.FASTEST_LAP;
    total += POINTS.FASTEST_LAP;
  }

  // Pole position: 5 pts
  if (prediction.pole_position && prediction.pole_position === result.pole_position) {
    breakdown.pole_position = POINTS.POLE_POSITION;
    total += POINTS.POLE_POSITION;
  }

  // DNF predictions
  const predDnf = prediction.dnf_drivers || [];
  const resultDnf = result.dnf_drivers || [];
  let dnfPoints = 0;
  predDnf.forEach(driver => {
    if (resultDnf.includes(driver)) dnfPoints += POINTS.DNF_CORRECT;
  });
  if (dnfPoints > 0) { breakdown.dnf = dnfPoints; total += dnfPoints; }

  // Safety car
  if (prediction.safety_car === true && result.safety_car === true) {
    breakdown.safety_car = POINTS.SAFETY_CAR;
    total += POINTS.SAFETY_CAR;
  }

  // Red flag
  if (prediction.red_flag === true && result.red_flag === true) {
    breakdown.red_flag = POINTS.RED_FLAG;
    total += POINTS.RED_FLAG;
  }

  // Driver of the Day
  if (prediction.driver_of_the_day && prediction.driver_of_the_day === result.driver_of_the_day) {
    breakdown.dotd = POINTS.DOTD;
    total += POINTS.DOTD;
  }

  // Winning margin
  const resultBracket = getWinningMarginBracket(result.winning_margin);
  if (prediction.winning_margin_bracket && prediction.winning_margin_bracket === resultBracket) {
    breakdown.winning_margin = POINTS.WINNING_MARGIN;
    total += POINTS.WINNING_MARGIN;
  }

  return { breakdown, total };
}

export async function calculateAndSaveScores(raceId) {
  // Get race result
  const result = await getRaceResult(raceId);
  if (!result) {
    throw new Error('Race results not found');
  }

  // Get all predictions for this race
  const predictions = await getPredictions(raceId);

  // Calculate and save scores for each prediction
  const scores = [];
  for (const prediction of predictions) {
    const { breakdown, total } = calculateScore(prediction, result);

    const scoreData = {
      prediction_id: prediction.id,
      user_id: prediction.user_id,
      race_id: raceId,
      race_year: prediction.race_year,
      race_round: prediction.race_round,
      points_breakdown: breakdown,
      total_points: total,
      calculated_at: new Date().toISOString()
    };

    // Upsert score
    const { data, error } = await supabase
      .from('scores')
      .upsert(scoreData, {
        onConflict: 'prediction_id'
      })
      .select()
      .single();

    if (error) throw error;
    scores.push(data);
  }

  return { scoresCalculated: scores.length, scores };
}

// ============================================
// RACE POTS (money tracking)
// ============================================

const BUY_IN = 10.00;
const HOST_CUT = 1.00;

export function calcPot(paidCount, winnerCount = 1) {
  const totalCollected = BUY_IN * paidCount;
  const hostTotal = HOST_CUT * paidCount;
  const prizePool = (BUY_IN - HOST_CUT) * paidCount;
  const prizePerWinner = winnerCount > 0 ? prizePool / winnerCount : 0;
  return { totalCollected, hostTotal, prizePool, prizePerWinner, BUY_IN, HOST_CUT };
}

export async function getRacePot(raceId) {
  const { data, error } = await supabase
    .from('race_pots')
    .select('*')
    .eq('race_id', raceId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertRacePot(raceId, raceName) {
  const { data, error } = await supabase
    .from('race_pots')
    .upsert({ race_id: raceId, race_name: raceName, buy_in: BUY_IN, host_cut: HOST_CUT },
      { onConflict: 'race_id', ignoreDuplicates: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function togglePlayerPaid(raceId, raceName, userId, currentPaidIds) {
  const alreadyPaid = currentPaidIds.includes(userId);
  const newPaidIds = alreadyPaid
    ? currentPaidIds.filter(id => id !== userId)
    : [...currentPaidIds, userId];

  const { data, error } = await supabase
    .from('race_pots')
    .upsert({
      race_id: raceId,
      race_name: raceName,
      buy_in: BUY_IN,
      host_cut: HOST_CUT,
      paid_user_ids: newPaidIds,
      updated_at: new Date().toISOString()
    }, { onConflict: 'race_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function payOutWinners(raceId, winnerUserIds, prizePerWinner) {
  const { data, error } = await supabase
    .from('race_pots')
    .update({
      winner_user_ids: winnerUserIds,
      prize_per_winner: prizePerWinner,
      status: 'paid_out',
      updated_at: new Date().toISOString()
    })
    .eq('race_id', raceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSeasonPotSummary(year = new Date().getFullYear()) {
  const { data, error } = await supabase
    .from('race_pots')
    .select('*')
    .like('race_id', `${year}_%`);
  if (error) throw error;
  return data || [];
}

// ============================================
// NOTIFICATIONS / EMAIL (calls backend API)
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function sendTestEmailToUser(email, name) {
  const res = await fetch(`${API_URL}/api/notifications/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send test email');
  return data;
}

export async function autoFetchRaceResults(raceId) {
  const res = await fetch(`${API_URL}/api/results/${raceId}/auto-fetch`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Auto-fetch failed');
  return data;
}

export async function sendPaymentConfirmationEmail(email, name, emoji, raceName, prizePool) {
  const res = await fetch(`${API_URL}/api/notifications/payment-confirmed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, emoji, raceName, prizePool })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send confirmation');
  return data;
}

export async function triggerNotificationCheck() {
  const res = await fetch(`${API_URL}/api/notifications/trigger`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to trigger notifications');
  return data;
}

// ============================================
// FETCH RACE RESULTS FROM OPENF1
// ============================================

export async function fetchRaceResultsFromAPI(year, round, raceName) {
  // For now, we'll create a placeholder result structure
  // In production, you'd fetch from OpenF1 API
  // The OpenF1 API has CORS restrictions, so this would need a proxy or serverless function

  // Try to fetch from OpenF1 (may fail due to CORS)
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/position?session_key=latest&position<=10`
    );

    if (response.ok) {
      const data = await response.json();
      // Process OpenF1 data...
      // This is simplified - real implementation would need more logic
    }
  } catch (e) {
    console.log('OpenF1 fetch failed (expected due to CORS):', e.message);
  }

  // Return a structure that can be manually filled in via Admin page
  const raceId = `${year}_${round}`;

  const resultData = {
    race_id: raceId,
    race_year: year,
    race_round: round,
    race_name: raceName,
    p1: null,
    p2: null,
    p3: null,
    top_10: [],
    fastest_lap: null,
    pole_position: null,
    dnf_drivers: [],
    safety_car: false,
    red_flag: false,
    driver_of_the_day: null,
    winning_margin: null,
    fetched_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('race_results')
    .upsert(resultData, { onConflict: 'race_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
