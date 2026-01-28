/**
 * Points system configuration
 */
export const POINTS = {
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
    p1: 0,
    p2: 0,
    p3: 0,
    fastestLap: 0,
    polePosition: 0,
    top10Exact: 0,
    top10InList: 0,
    dnf: 0,
    safetyCar: 0,
    redFlag: 0,
    dotd: 0,
    winningMargin: 0,
    total: 0
  };

  // P1 (Winner)
  if (prediction.p1 === raceResult.p1) {
    breakdown.p1 = POINTS.EXACT_P1;
  }

  // P2 (Second Place)
  if (prediction.p2 === raceResult.p2) {
    breakdown.p2 = POINTS.EXACT_P2;
  }

  // P3 (Third Place)
  if (prediction.p3 === raceResult.p3) {
    breakdown.p3 = POINTS.EXACT_P3;
  }

  // Fastest Lap
  if (prediction.fastestLap === raceResult.fastestLap) {
    breakdown.fastestLap = POINTS.FASTEST_LAP;
  }

  // Pole Position
  if (prediction.polePosition === raceResult.polePosition) {
    breakdown.polePosition = POINTS.POLE_POSITION;
  }

  // Top 10 predictions
  const predictedTop10 = prediction.top10 || [];
  const actualTop10 = raceResult.top10 || [];

  predictedTop10.forEach((driverId, index) => {
    if (actualTop10[index] === driverId) {
      // Exact position match
      breakdown.top10Exact += POINTS.TOP_10_EXACT;
    } else if (actualTop10.includes(driverId)) {
      // Driver in top 10 but wrong position
      breakdown.top10InList += POINTS.TOP_10_IN_LIST;
    }
  });

  // DNF predictions
  const predictedDNFs = prediction.dnfDrivers || [];
  const actualDNFs = raceResult.dnfDrivers || [];

  predictedDNFs.forEach(driverId => {
    if (actualDNFs.includes(driverId)) {
      breakdown.dnf += POINTS.DNF_CORRECT;
    }
  });

  // Safety Car
  if (prediction.safetyCar === raceResult.safetyCar) {
    breakdown.safetyCar = POINTS.SAFETY_CAR;
  }

  // Red Flag
  if (prediction.redFlag === raceResult.redFlag) {
    breakdown.redFlag = POINTS.RED_FLAG;
  }

  // Driver of the Day
  if (prediction.driverOfTheDay === raceResult.driverOfTheDay) {
    breakdown.dotd = POINTS.DOTD;
  }

  // Winning Margin
  if (prediction.winningMarginBracket && raceResult.winningMargin !== null) {
    const actualBracket = getMarginBracket(raceResult.winningMargin);
    if (actualBracket && prediction.winningMarginBracket === actualBracket.label) {
      breakdown.winningMargin = POINTS.WINNING_MARGIN;
    }
  }

  // Calculate total
  breakdown.total = Object.values(breakdown).reduce((sum, val) => {
    if (typeof val === 'number') return sum + val;
    return sum;
  }, 0) - breakdown.total; // Subtract total itself since it was initialized to 0

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
