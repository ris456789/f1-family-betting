// 2025 Australian Grand Prix - Hardcoded Results for Mock Trial
export const mockRaceResults = {
  raceId: "2025_1",
  raceName: "Australian Grand Prix",
  circuit: "Albert Park",
  circuitFull: "Albert Park Circuit",
  country: "Australia",
  locality: "Melbourne",
  date: "2025-03-16",
  time: "05:00:00Z",
  circuitImage: "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Track%20Outline/Australia.png",
  flagEmoji: "🇦🇺",

  // Race Results
  p1: "NOR",
  p2: "VER",
  p3: "RUS",
  top10: ["NOR", "VER", "RUS", "HAM", "LEC", "PIA", "SAI", "ALO", "GAS", "OCO"],
  fastestLap: "VER",
  polePosition: "NOR",
  dnfs: ["STR", "TSU"],
  safetyCar: true,
  redFlag: false,
  driverOfTheDay: "NOR",
  winningMarginSeconds: 3.8
};

// Race info for display
export const mockRaceInfo = {
  round: 1,
  name: "Australian Grand Prix",
  circuit: "Albert Park",
  country: "Australia",
  date: "2025-03-16",
  time: "05:00:00Z",
  qualifyingDate: "2025-03-15",
  qualifyingTime: "06:00:00Z"
};

// Scoring system
export const POINTS_SYSTEM = {
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

// Calculate score from prediction vs actual
export function calculateMockScore(prediction, actual = mockRaceResults) {
  let totalScore = 0;
  const breakdown = [];

  // P1 - Winner
  const p1Correct = prediction.p1 === actual.p1;
  breakdown.push({
    category: "Race Winner (P1)",
    predicted: prediction.p1,
    actual: actual.p1,
    correct: p1Correct,
    points: p1Correct ? POINTS_SYSTEM.EXACT_P1 : 0,
    maxPoints: POINTS_SYSTEM.EXACT_P1
  });
  if (p1Correct) totalScore += POINTS_SYSTEM.EXACT_P1;

  // P2 - Second Place
  const p2Correct = prediction.p2 === actual.p2;
  breakdown.push({
    category: "Second Place (P2)",
    predicted: prediction.p2,
    actual: actual.p2,
    correct: p2Correct,
    points: p2Correct ? POINTS_SYSTEM.EXACT_P2 : 0,
    maxPoints: POINTS_SYSTEM.EXACT_P2
  });
  if (p2Correct) totalScore += POINTS_SYSTEM.EXACT_P2;

  // P3 - Third Place
  const p3Correct = prediction.p3 === actual.p3;
  breakdown.push({
    category: "Third Place (P3)",
    predicted: prediction.p3,
    actual: actual.p3,
    correct: p3Correct,
    points: p3Correct ? POINTS_SYSTEM.EXACT_P3 : 0,
    maxPoints: POINTS_SYSTEM.EXACT_P3
  });
  if (p3Correct) totalScore += POINTS_SYSTEM.EXACT_P3;

  // Pole Position
  const poleCorrect = prediction.polePosition === actual.polePosition;
  breakdown.push({
    category: "Pole Position",
    predicted: prediction.polePosition,
    actual: actual.polePosition,
    correct: poleCorrect,
    points: poleCorrect ? POINTS_SYSTEM.POLE_POSITION : 0,
    maxPoints: POINTS_SYSTEM.POLE_POSITION
  });
  if (poleCorrect) totalScore += POINTS_SYSTEM.POLE_POSITION;

  // Fastest Lap
  const flCorrect = prediction.fastestLap === actual.fastestLap;
  breakdown.push({
    category: "Fastest Lap",
    predicted: prediction.fastestLap,
    actual: actual.fastestLap,
    correct: flCorrect,
    points: flCorrect ? POINTS_SYSTEM.FASTEST_LAP : 0,
    maxPoints: POINTS_SYSTEM.FASTEST_LAP
  });
  if (flCorrect) totalScore += POINTS_SYSTEM.FASTEST_LAP;

  // Top 10
  let top10ExactPoints = 0;
  let top10InListPoints = 0;
  const predTop10 = prediction.top10 || [];

  predTop10.forEach((driver, index) => {
    if (actual.top10[index] === driver) {
      top10ExactPoints += POINTS_SYSTEM.TOP_10_EXACT;
    } else if (actual.top10.includes(driver)) {
      top10InListPoints += POINTS_SYSTEM.TOP_10_IN_LIST;
    }
  });

  breakdown.push({
    category: "Top 10 (Exact Position)",
    predicted: `${top10ExactPoints / POINTS_SYSTEM.TOP_10_EXACT} exact`,
    actual: "-",
    correct: top10ExactPoints > 0,
    points: top10ExactPoints,
    maxPoints: POINTS_SYSTEM.TOP_10_EXACT * 10
  });
  breakdown.push({
    category: "Top 10 (In List)",
    predicted: `${top10InListPoints / POINTS_SYSTEM.TOP_10_IN_LIST} in list`,
    actual: "-",
    correct: top10InListPoints > 0,
    points: top10InListPoints,
    maxPoints: POINTS_SYSTEM.TOP_10_IN_LIST * 10
  });
  totalScore += top10ExactPoints + top10InListPoints;

  // DNFs
  let dnfPoints = 0;
  const predDnfs = prediction.dnfDrivers || [];
  predDnfs.forEach(driver => {
    if (actual.dnfs.includes(driver)) {
      dnfPoints += POINTS_SYSTEM.DNF_CORRECT;
    }
  });
  breakdown.push({
    category: "DNF Predictions",
    predicted: predDnfs.join(", ") || "None",
    actual: actual.dnfs.join(", "),
    correct: dnfPoints > 0,
    points: dnfPoints,
    maxPoints: POINTS_SYSTEM.DNF_CORRECT * 5
  });
  totalScore += dnfPoints;

  // Safety Car
  const scCorrect = prediction.safetyCar === actual.safetyCar;
  breakdown.push({
    category: "Safety Car",
    predicted: prediction.safetyCar ? "Yes" : "No",
    actual: actual.safetyCar ? "Yes" : "No",
    correct: scCorrect,
    points: scCorrect ? POINTS_SYSTEM.SAFETY_CAR : 0,
    maxPoints: POINTS_SYSTEM.SAFETY_CAR
  });
  if (scCorrect) totalScore += POINTS_SYSTEM.SAFETY_CAR;

  // Red Flag
  const rfCorrect = prediction.redFlag === actual.redFlag;
  breakdown.push({
    category: "Red Flag",
    predicted: prediction.redFlag ? "Yes" : "No",
    actual: actual.redFlag ? "Yes" : "No",
    correct: rfCorrect,
    points: rfCorrect ? POINTS_SYSTEM.RED_FLAG : 0,
    maxPoints: POINTS_SYSTEM.RED_FLAG
  });
  if (rfCorrect) totalScore += POINTS_SYSTEM.RED_FLAG;

  // Driver of the Day
  const dotdCorrect = prediction.driverOfTheDay === actual.driverOfTheDay;
  breakdown.push({
    category: "Driver of the Day",
    predicted: prediction.driverOfTheDay,
    actual: actual.driverOfTheDay,
    correct: dotdCorrect,
    points: dotdCorrect ? POINTS_SYSTEM.DOTD : 0,
    maxPoints: POINTS_SYSTEM.DOTD
  });
  if (dotdCorrect) totalScore += POINTS_SYSTEM.DOTD;

  // Winning Margin
  const actualUnder5 = actual.winningMarginSeconds < 5;
  const marginCorrect = prediction.winningMarginUnder5s === actualUnder5;
  breakdown.push({
    category: "Winning Margin",
    predicted: prediction.winningMarginUnder5s ? "Under 5s" : "Over 5s",
    actual: `${actual.winningMarginSeconds}s (${actualUnder5 ? "Under 5s" : "Over 5s"})`,
    correct: marginCorrect,
    points: marginCorrect ? POINTS_SYSTEM.WINNING_MARGIN : 0,
    maxPoints: POINTS_SYSTEM.WINNING_MARGIN
  });
  if (marginCorrect) totalScore += POINTS_SYSTEM.WINNING_MARGIN;

  // Calculate max possible score
  const maxPossible = breakdown.reduce((sum, item) => sum + item.maxPoints, 0);

  return {
    totalScore,
    maxPossible,
    percentage: Math.round((totalScore / maxPossible) * 100),
    breakdown
  };
}

// Get rating based on score
export function getScoreRating(score) {
  if (score >= 120) return { emoji: "🏆", title: "Championship Material!", color: "#FFD700" };
  if (score >= 100) return { emoji: "🥇", title: "Expert Predictor!", color: "#C0C0C0" };
  if (score >= 80) return { emoji: "🥈", title: "Great Job!", color: "#CD7F32" };
  if (score >= 60) return { emoji: "🥉", title: "Solid Effort!", color: "#27F4D2" };
  if (score >= 40) return { emoji: "🏎️", title: "Getting There!", color: "#FF8000" };
  return { emoji: "🔧", title: "Keep Practicing!", color: "#B6BABD" };
}
