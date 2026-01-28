// 2026 F1 Race Calendar
export const races2026 = [
  { round: 1, name: "Australian Grand Prix", circuit: "Albert Park", country: "Australia", date: "2026-03-06", time: "05:00:00Z" },
  { round: 2, name: "Chinese Grand Prix", circuit: "Shanghai", country: "China", date: "2026-03-20", time: "07:00:00Z" },
  { round: 3, name: "Japanese Grand Prix", circuit: "Suzuka", country: "Japan", date: "2026-04-03", time: "05:00:00Z" },
  { round: 4, name: "Bahrain Grand Prix", circuit: "Sakhir", country: "Bahrain", date: "2026-04-17", time: "15:00:00Z" },
  { round: 5, name: "Saudi Arabian Grand Prix", circuit: "Jeddah", country: "Saudi Arabia", date: "2026-05-01", time: "17:00:00Z" },
  { round: 6, name: "Miami Grand Prix", circuit: "Miami", country: "USA", date: "2026-05-08", time: "20:00:00Z" },
  { round: 7, name: "Emilia Romagna Grand Prix", circuit: "Imola", country: "Italy", date: "2026-05-22", time: "13:00:00Z" },
  { round: 8, name: "Monaco Grand Prix", circuit: "Monaco", country: "Monaco", date: "2026-05-29", time: "13:00:00Z" },
  { round: 9, name: "Spanish Grand Prix", circuit: "Barcelona", country: "Spain", date: "2026-06-12", time: "13:00:00Z" },
  { round: 10, name: "Canadian Grand Prix", circuit: "Montreal", country: "Canada", date: "2026-06-19", time: "18:00:00Z" },
  { round: 11, name: "Austrian Grand Prix", circuit: "Spielberg", country: "Austria", date: "2026-07-03", time: "13:00:00Z" },
  { round: 12, name: "British Grand Prix", circuit: "Silverstone", country: "UK", date: "2026-07-17", time: "14:00:00Z" },
  { round: 13, name: "Belgian Grand Prix", circuit: "Spa", country: "Belgium", date: "2026-07-31", time: "13:00:00Z" },
  { round: 14, name: "Hungarian Grand Prix", circuit: "Budapest", country: "Hungary", date: "2026-08-07", time: "13:00:00Z" },
  { round: 15, name: "Dutch Grand Prix", circuit: "Zandvoort", country: "Netherlands", date: "2026-08-28", time: "13:00:00Z" },
  { round: 16, name: "Italian Grand Prix", circuit: "Monza", country: "Italy", date: "2026-09-04", time: "13:00:00Z" },
  { round: 17, name: "Azerbaijan Grand Prix", circuit: "Baku", country: "Azerbaijan", date: "2026-09-18", time: "11:00:00Z" },
  { round: 18, name: "Singapore Grand Prix", circuit: "Marina Bay", country: "Singapore", date: "2026-10-02", time: "12:00:00Z" },
  { round: 19, name: "United States Grand Prix", circuit: "Austin", country: "USA", date: "2026-10-23", time: "19:00:00Z" },
  { round: 20, name: "Mexico City Grand Prix", circuit: "Mexico City", country: "Mexico", date: "2026-10-30", time: "20:00:00Z" },
  { round: 21, name: "São Paulo Grand Prix", circuit: "Interlagos", country: "Brazil", date: "2026-11-13", time: "17:00:00Z" },
  { round: 22, name: "Las Vegas Grand Prix", circuit: "Las Vegas", country: "USA", date: "2026-11-20", time: "06:00:00Z" },
  { round: 23, name: "Qatar Grand Prix", circuit: "Lusail", country: "Qatar", date: "2026-12-04", time: "14:00:00Z" },
  { round: 24, name: "Abu Dhabi Grand Prix", circuit: "Yas Marina", country: "UAE", date: "2026-12-11", time: "13:00:00Z" }
];

export function getRaceByRound(round) {
  return races2026.find(r => r.round === parseInt(round));
}

export function getUpcomingRaces() {
  const now = new Date();
  return races2026.filter(race => {
    const raceDate = new Date(`${race.date}T${race.time}`);
    return raceDate > now;
  });
}

export function getNextRace() {
  const upcoming = getUpcomingRaces();
  return upcoming[0] || null;
}
