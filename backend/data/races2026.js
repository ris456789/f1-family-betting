// 2026 F1 Race Calendar (updated — Bahrain & Saudi Arabia cancelled)
export const races2026 = [
  // ── PAST RACES — do not change round numbers or race_ids ──
  { round: 1,  name: "Australian Grand Prix",    circuit: "Albert Park Circuit",            country: "Australia",    date: "2026-03-08", time: "04:00:00Z", qualifyingDate: "2026-03-07", qualifyingTime: "19:00:00Z" },
  { round: 2,  name: "Chinese Grand Prix",        circuit: "Shanghai International Circuit", country: "China",        date: "2026-03-15", time: "08:00:00Z", qualifyingDate: "2026-03-14", qualifyingTime: "08:00:00Z" },
  // ── UPCOMING RACES ──
  { round: 3,  name: "Japanese Grand Prix",       circuit: "Suzuka Circuit",                 country: "Japan",        date: "2026-03-29", time: "05:00:00Z", qualifyingDate: "2026-03-28", qualifyingTime: "05:00:00Z" },
  { round: 4,  name: "Miami Grand Prix",          circuit: "Miami International Autodrome",  country: "USA",          date: "2026-05-03", time: "20:00:00Z", qualifyingDate: "2026-05-01", qualifyingTime: "20:00:00Z" },
  { round: 5,  name: "Canadian Grand Prix",       circuit: "Circuit Gilles Villeneuve",      country: "Canada",       date: "2026-05-24", time: "19:00:00Z", qualifyingDate: "2026-05-22", qualifyingTime: "19:00:00Z" },
  { round: 6,  name: "Monaco Grand Prix",         circuit: "Circuit de Monaco",              country: "Monaco",       date: "2026-06-07", time: "13:00:00Z", qualifyingDate: "2026-06-06", qualifyingTime: "13:00:00Z" },
  { round: 7,  name: "Spanish Grand Prix",        circuit: "Circuit de Barcelona-Catalunya", country: "Spain",        date: "2026-06-14", time: "13:00:00Z", qualifyingDate: "2026-06-13", qualifyingTime: "13:00:00Z" },
  { round: 8,  name: "Austrian Grand Prix",       circuit: "Red Bull Ring",                  country: "Austria",      date: "2026-06-28", time: "13:00:00Z", qualifyingDate: "2026-06-27", qualifyingTime: "13:00:00Z" },
  { round: 9,  name: "British Grand Prix",        circuit: "Silverstone Circuit",            country: "UK",           date: "2026-07-05", time: "14:00:00Z", qualifyingDate: "2026-07-03", qualifyingTime: "14:00:00Z" },
  { round: 10, name: "Belgian Grand Prix",        circuit: "Circuit de Spa-Francorchamps",   country: "Belgium",      date: "2026-07-19", time: "13:00:00Z", qualifyingDate: "2026-07-18", qualifyingTime: "13:00:00Z" },
  { round: 11, name: "Hungarian Grand Prix",      circuit: "Hungaroring",                    country: "Hungary",      date: "2026-07-26", time: "13:00:00Z", qualifyingDate: "2026-07-25", qualifyingTime: "13:00:00Z" },
  { round: 12, name: "Dutch Grand Prix",          circuit: "Circuit Zandvoort",              country: "Netherlands",  date: "2026-08-23", time: "13:00:00Z", qualifyingDate: "2026-08-21", qualifyingTime: "13:00:00Z" },
  { round: 13, name: "Italian Grand Prix",        circuit: "Autodromo Nazionale Monza",      country: "Italy",        date: "2026-09-06", time: "13:00:00Z", qualifyingDate: "2026-09-05", qualifyingTime: "13:00:00Z" },
  { round: 14, name: "Madrid Grand Prix",         circuit: "Circuito de Madrid",             country: "Spain",        date: "2026-09-13", time: "13:00:00Z", qualifyingDate: "2026-09-12", qualifyingTime: "13:00:00Z" },
  { round: 15, name: "Azerbaijan Grand Prix",     circuit: "Baku City Circuit",              country: "Azerbaijan",   date: "2026-09-26", time: "11:00:00Z", qualifyingDate: "2026-09-25", qualifyingTime: "11:00:00Z" },
  { round: 16, name: "Singapore Grand Prix",      circuit: "Marina Bay Street Circuit",      country: "Singapore",    date: "2026-10-11", time: "12:00:00Z", qualifyingDate: "2026-10-09", qualifyingTime: "12:00:00Z" },
  { round: 17, name: "United States Grand Prix",  circuit: "Circuit of the Americas",        country: "USA",          date: "2026-10-25", time: "20:00:00Z", qualifyingDate: "2026-10-24", qualifyingTime: "20:00:00Z" },
  { round: 18, name: "Mexico City Grand Prix",    circuit: "Autodromo Hermanos Rodriguez",   country: "Mexico",       date: "2026-11-01", time: "20:00:00Z", qualifyingDate: "2026-10-31", qualifyingTime: "20:00:00Z" },
  { round: 19, name: "São Paulo Grand Prix",      circuit: "Autodromo Jose Carlos Pace",     country: "Brazil",       date: "2026-11-08", time: "17:00:00Z", qualifyingDate: "2026-11-07", qualifyingTime: "17:00:00Z" },
  { round: 20, name: "Las Vegas Grand Prix",      circuit: "Las Vegas Street Circuit",       country: "USA",          date: "2026-11-22", time: "06:00:00Z", qualifyingDate: "2026-11-21", qualifyingTime: "06:00:00Z" },
  { round: 21, name: "Qatar Grand Prix",          circuit: "Lusail International Circuit",   country: "Qatar",        date: "2026-11-29", time: "15:00:00Z", qualifyingDate: "2026-11-28", qualifyingTime: "15:00:00Z" },
  { round: 22, name: "Abu Dhabi Grand Prix",      circuit: "Yas Marina Circuit",             country: "UAE",          date: "2026-12-06", time: "13:00:00Z", qualifyingDate: "2026-12-05", qualifyingTime: "13:00:00Z" },
];

export function getRaceByRound(round) {
  return races2026.find(r => r.round === parseInt(round));
}

export function getAllRaces() {
  return races2026;
}

export function formatRace(race) {
  return {
    round: race.round,
    raceName: race.name,
    circuitName: race.circuit,
    country: race.country,
    date: race.date,
    time: race.time,
    qualifyingDate: race.qualifyingDate,
    qualifyingTime: race.qualifyingTime,
  };
}

export default { races2026, getRaceByRound, getAllRaces, formatRace };
