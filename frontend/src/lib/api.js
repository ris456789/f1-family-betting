import { supabase } from './supabase';
import { races2026 } from '../data/races2026';
import { drivers2025 } from '../data/drivers2025';

// ============================================
// USERS
// ============================================

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createUser(name, emoji = '👤', is_host = false) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, emoji, is_host }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// RACES (from local data)
// ============================================

export function getRaces(year = 2026) {
  // Use local race data instead of API
  return races2026.filter(r => {
    const raceYear = new Date(r.date).getFullYear();
    return raceYear === parseInt(year);
  });
}

export function getNextRace() {
  const now = new Date();
  const upcoming = races2026
    .filter(r => new Date(r.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return upcoming[0] || null;
}

export function getDrivers() {
  // Return drivers from local data
  return drivers2025.map(d => ({
    driverId: d.driverId,
    code: d.code,
    name: d.name,
    team: d.team,
    teamColor: d.teamColor,
    headshot: d.headshot
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
  EXACT_P1: 25,
  EXACT_P2: 18,
  EXACT_P3: 15,
  FASTEST_LAP: 10,
  POLE_POSITION: 10,
  TOP_10_EXACT: 5,
  TOP_10_IN_LIST: 2,
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

  // Podium predictions
  if (prediction.p1 === result.p1) {
    breakdown.p1 = POINTS.EXACT_P1;
    total += POINTS.EXACT_P1;
  }
  if (prediction.p2 === result.p2) {
    breakdown.p2 = POINTS.EXACT_P2;
    total += POINTS.EXACT_P2;
  }
  if (prediction.p3 === result.p3) {
    breakdown.p3 = POINTS.EXACT_P3;
    total += POINTS.EXACT_P3;
  }

  // Fastest lap
  if (prediction.fastest_lap && prediction.fastest_lap === result.fastest_lap) {
    breakdown.fastest_lap = POINTS.FASTEST_LAP;
    total += POINTS.FASTEST_LAP;
  }

  // Pole position
  if (prediction.pole_position && prediction.pole_position === result.pole_position) {
    breakdown.pole_position = POINTS.POLE_POSITION;
    total += POINTS.POLE_POSITION;
  }

  // Top 10 predictions
  const predTop10 = prediction.top_10 || [];
  const resultTop10 = result.top_10 || [];
  let top10Points = 0;

  predTop10.forEach((driver, index) => {
    if (resultTop10[index] === driver) {
      top10Points += POINTS.TOP_10_EXACT;
    } else if (resultTop10.includes(driver)) {
      top10Points += POINTS.TOP_10_IN_LIST;
    }
  });

  if (top10Points > 0) {
    breakdown.top_10 = top10Points;
    total += top10Points;
  }

  // DNF predictions
  const predDnf = prediction.dnf_drivers || [];
  const resultDnf = result.dnf_drivers || [];
  let dnfPoints = 0;

  predDnf.forEach(driver => {
    if (resultDnf.includes(driver)) {
      dnfPoints += POINTS.DNF_CORRECT;
    }
  });

  if (dnfPoints > 0) {
    breakdown.dnf = dnfPoints;
    total += dnfPoints;
  }

  // Safety car
  if (prediction.safety_car === result.safety_car && result.safety_car === true) {
    breakdown.safety_car = POINTS.SAFETY_CAR;
    total += POINTS.SAFETY_CAR;
  }

  // Red flag
  if (prediction.red_flag === result.red_flag && result.red_flag === true) {
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
