/**
 * Points system configuration
 */
export const POINTS = {
  EXACT_PODIUM: 15,      // P1, P2, or P3 — exact position
  PODIUM_IN_TOP3: 10,    // Picked for podium, in top 3 but wrong spot
  FASTEST_LAP: 5,
  POLE_POSITION: 5,
  TOP_10_EXACT: 5,       // P4–P10 exact position
  // P4–P10 proximity: max(0, 5 - abs(predicted - actual))
  DNF_CORRECT: 5,
  SAFETY_CAR: 5,
  RED_FLAG: 8,
  DOTD: 5,
  WINNING_MARGIN: 5
};

/**
 * Winning margin brackets (in seconds)
 */
const MARGIN_BRACKETS = [
  { min: 0, max: 5, label: '0-5s' },
  { min: 5, max: 10, label: '5-10s' },
  { min: 10, max: 20, label: '10-20s' },
  { min: 20, max: 30, label: '20-30s' },
  { min: 30, max: Infinity, label: '30s+' }
];

/**
 * Get the margin bracket for a given time
 */
function getMarginBracket(seconds) {
  return MARGIN_BRACKETS.find(b => seconds >= b.min && seconds < b.max);
}

/**
 * Calculate score for a single prediction against race results
 */
export function calculateScore(prediction, raceResult) {
  const breakdown = {
    podium: 0,
    top_10: 0,
    fastestLap: 0,
    polePosition: 0,
    dnf: 0,
    safetyCar: 0,
    redFlag: 0,
    dotd: 0,
    winningMargin: 0,
    total: 0
  };

  const predTop10 = prediction.top10 || prediction.top_10 || [];
  const actualTop10 = raceResult.top10 || raceResult.top_10 || [];
  const actualPodium = actualTop10.slice(0, 3);

  // Positions 1–3: podium scoring
  for (let i = 0; i < 3; i++) {
    const driver = predTop10[i];
    if (!driver) continue;
    if (actualTop10[i] === driver) {
      breakdown.podium += POINTS.EXACT_PODIUM;       // Exact podium spot
    } else if (actualPodium.includes(driver)) {
      breakdown.podium += POINTS.PODIUM_IN_TOP3;     // In top 3, wrong spot
    }
  }

  // Positions 4–10: proximity scoring (5 pts exact, -1 per position off, min 0)
  for (let i = 3; i < 10; i++) {
    const driver = predTop10[i];
    if (!driver) continue;
    const predictedPos = i + 1;
    const actualIndex = actualTop10.indexOf(driver);
    if (actualIndex === -1) continue; // Not in top 10
    const actualPos = actualIndex + 1;
    const pts = Math.max(0, POINTS.TOP_10_EXACT - Math.abs(predictedPos - actualPos));
    breakdown.top_10 += pts;
  }

  // Fastest Lap: 5 pts
  if (prediction.fastestLap && prediction.fastestLap === raceResult.fastestLap) {
    breakdown.fastestLap = POINTS.FASTEST_LAP;
  }

  // Pole Position: 5 pts
  if (prediction.polePosition && prediction.polePosition === raceResult.polePosition) {
    breakdown.polePosition = POINTS.POLE_POSITION;
  }

  // DNF predictions
  const predictedDNFs = prediction.dnfDrivers || [];
  const actualDNFs = raceResult.dnfDrivers || [];
  predictedDNFs.forEach(driverId => {
    if (actualDNFs.includes(driverId)) breakdown.dnf += POINTS.DNF_CORRECT;
  });

  // Safety Car
  if (prediction.safetyCar === true && raceResult.safetyCar === true) {
    breakdown.safetyCar = POINTS.SAFETY_CAR;
  }

  // Red Flag
  if (prediction.redFlag === true && raceResult.redFlag === true) {
    breakdown.redFlag = POINTS.RED_FLAG;
  }

  // Driver of the Day
  if (prediction.driverOfTheDay && prediction.driverOfTheDay === raceResult.driverOfTheDay) {
    breakdown.dotd = POINTS.DOTD;
  }

  // Winning Margin
  if (prediction.winningMarginBracket && raceResult.winningMargin !== null) {
    const actualBracket = getMarginBracket(raceResult.winningMargin);
    if (actualBracket && prediction.winningMarginBracket === actualBracket.label) {
      breakdown.winningMargin = POINTS.WINNING_MARGIN;
    }
  }

  // Total
  breakdown.total = breakdown.podium + breakdown.top_10 + breakdown.fastestLap +
    breakdown.polePosition + breakdown.dnf + breakdown.safetyCar +
    breakdown.redFlag + breakdown.dotd + breakdown.winningMargin;

  return breakdown;
}

/**
 * Calculate scores for all predictions for a race
 */
export function calculateRaceScores(predictions, raceResult) {
  return predictions.map(prediction => ({
    predictionId: prediction.id,
    oderId: prediction.userId,
    breakdown: calculateScore(prediction, raceResult)
  }));
}

/**
 * Calculate season standings from all race scores
 */
export function calculateSeasonStandings(allScores) {
  const standings = {};

  allScores.forEach(score => {
    if (!standings[score.userId]) {
      standings[score.userId] = {
        userId: score.userId,
        totalPoints: 0,
        raceCount: 0,
        wins: 0, // Races where they had highest score
        avgPoints: 0
      };
    }

    standings[score.userId].totalPoints += score.breakdown.total;
    standings[score.userId].raceCount += 1;
  });

  // Calculate averages and sort
  const sortedStandings = Object.values(standings)
    .map(s => ({
      ...s,
      avgPoints: s.raceCount > 0 ? (s.totalPoints / s.raceCount).toFixed(1) : 0
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign positions
  return sortedStandings.map((s, index) => ({
    ...s,
    position: index + 1
  }));
}

/**
 * Transform race results from Ergast format to our scoring format
 */
export function transformRaceResults(ergastResults, supplementaryData = {}) {
  const dnfStatuses = ['Retired', 'Accident', 'Collision', 'Engine', 'Gearbox',
    'Hydraulics', 'Electrical', 'Suspension', 'Brakes', 'Puncture',
    'Did not finish', 'DNF', 'DNS', 'Disqualified'];

  const top10 = ergastResults
    .filter(r => r.position <= 10)
    .sort((a, b) => a.position - b.position)
    .map(r => r.driverId);

  const dnfDrivers = ergastResults
    .filter(r => dnfStatuses.some(status =>
      r.status.toLowerCase().includes(status.toLowerCase())
    ))
    .map(r => r.driverId);

  const fastestLapDriver = ergastResults.find(r => r.fastestLap)?.driverId || null;

  // Extract winning margin from time gap to P2
  let winningMargin = null;
  const p2Result = ergastResults.find(r => r.position === 2);
  if (p2Result?.time) {
    const match = p2Result.time.match(/(\d+):?(\d+)?\.(\d+)/);
    if (match) {
      const minutes = match[2] ? parseInt(match[1]) : 0;
      const seconds = match[2] ? parseInt(match[2]) : parseInt(match[1]);
      const ms = parseInt(match[3]) / 1000;
      winningMargin = minutes * 60 + seconds + ms;
    }
  }

  return {
    p1: top10[0] || null,
    p2: top10[1] || null,
    p3: top10[2] || null,
    top10,
    fastestLap: fastestLapDriver,
    polePosition: ergastResults.find(r => r.grid === 1)?.driverId || null,
    dnfDrivers,
    safetyCar: supplementaryData.safetyCar ?? null,
    redFlag: supplementaryData.redFlag ?? null,
    driverOfTheDay: supplementaryData.driverOfTheDay ?? null,
    winningMargin: supplementaryData.winningMargin ?? winningMargin
  };
}

export default {
  POINTS,
  calculateScore,
  calculateRaceScores,
  calculateSeasonStandings,
  transformRaceResults
};
