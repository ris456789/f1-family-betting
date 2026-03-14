// 2026 F1 Race Calendar (Hardcoded)
export const races2026 = [
  { round: 1,  name: "Australian Grand Prix",    circuit: "Albert Park Circuit",            country: "Australia",    date: "2026-03-08", time: "04:00:00Z", qualifyingDate: "2026-03-07", qualifyingTime: "19:00:00Z" },
  { round: 2,  name: "Chinese Grand Prix",        circuit: "Shanghai International Circuit", country: "China",        date: "2026-03-15", time: "08:00:00Z", qualifyingDate: "2026-03-14", qualifyingTime: "08:00:00Z" },
  { round: 3,  name: "Japanese Grand Prix",       circuit: "Suzuka International Circuit",   country: "Japan",        date: "2026-04-05", time: "05:00:00Z", qualifyingDate: "2026-04-04", qualifyingTime: "05:00:00Z" },
  { round: 4,  name: "Bahrain Grand Prix",        circuit: "Bahrain International Circuit",  country: "Bahrain",      date: "2026-04-19", time: "15:00:00Z", qualifyingDate: "2026-04-18", qualifyingTime: "15:00:00Z" },
  { round: 5,  name: "Saudi Arabian Grand Prix",  circuit: "Jeddah Corniche Circuit",        country: "Saudi Arabia", date: "2026-05-03", time: "17:00:00Z", qualifyingDate: "2026-05-02", qualifyingTime: "17:00:00Z" },
  { round: 6,  name: "Miami Grand Prix",          circuit: "Miami International Autodrome",  country: "USA",          date: "2026-05-10", time: "20:00:00Z", qualifyingDate: "2026-05-09", qualifyingTime: "20:00:00Z" },
  { round: 7,  name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari",  country: "Italy",        date: "2026-05-24", time: "13:00:00Z", qualifyingDate: "2026-05-23", qualifyingTime: "13:00:00Z" },
  { round: 8,  name: "Monaco Grand Prix",         circuit: "Circuit de Monaco",              country: "Monaco",       date: "2026-05-31", time: "13:00:00Z", qualifyingDate: "2026-05-30", qualifyingTime: "13:00:00Z" },
  { round: 9,  name: "Spanish Grand Prix",        circuit: "Circuit de Barcelona-Catalunya", country: "Spain",        date: "2026-06-14", time: "13:00:00Z", qualifyingDate: "2026-06-13", qualifyingTime: "13:00:00Z" },
  { round: 10, name: "Canadian Grand Prix",       circuit: "Circuit Gilles Villeneuve",      country: "Canada",       date: "2026-06-21", time: "18:00:00Z", qualifyingDate: "2026-06-20", qualifyingTime: "18:00:00Z" },
  { round: 11, name: "Austrian Grand Prix",       circuit: "Red Bull Ring",                  country: "Austria",      date: "2026-07-05", time: "13:00:00Z", qualifyingDate: "2026-07-04", qualifyingTime: "13:00:00Z" },
  { round: 12, name: "British Grand Prix",        circuit: "Silverstone Circuit",            country: "UK",           date: "2026-07-19", time: "14:00:00Z", qualifyingDate: "2026-07-18", qualifyingTime: "14:00:00Z" },
  { round: 13, name: "Belgian Grand Prix",        circuit: "Circuit de Spa-Francorchamps",   country: "Belgium",      date: "2026-08-02", time: "13:00:00Z", qualifyingDate: "2026-08-01", qualifyingTime: "13:00:00Z" },
  { round: 14, name: "Hungarian Grand Prix",      circuit: "Hungaroring",                    country: "Hungary",      date: "2026-08-09", time: "13:00:00Z", qualifyingDate: "2026-08-08", qualifyingTime: "13:00:00Z" },
  { round: 15, name: "Dutch Grand Prix",          circuit: "Circuit Zandvoort",              country: "Netherlands",  date: "2026-08-30", time: "13:00:00Z", qualifyingDate: "2026-08-29", qualifyingTime: "13:00:00Z" },
  { round: 16, name: "Italian Grand Prix",        circuit: "Autodromo Nazionale Monza",      country: "Italy",        date: "2026-09-06", time: "13:00:00Z", qualifyingDate: "2026-09-05", qualifyingTime: "13:00:00Z" },
  { round: 17, name: "Azerbaijan Grand Prix",     circuit: "Baku City Circuit",              country: "Azerbaijan",   date: "2026-09-20", time: "11:00:00Z", qualifyingDate: "2026-09-19", qualifyingTime: "11:00:00Z" },
  { round: 18, name: "Singapore Grand Prix",      circuit: "Marina Bay Street Circuit",      country: "Singapore",    date: "2026-10-04", time: "12:00:00Z", qualifyingDate: "2026-10-03", qualifyingTime: "12:00:00Z" },
  { round: 19, name: "United States Grand Prix",  circuit: "Circuit of the Americas",        country: "USA",          date: "2026-10-25", time: "19:00:00Z", qualifyingDate: "2026-10-24", qualifyingTime: "19:00:00Z" },
  { round: 20, name: "Mexico City Grand Prix",    circuit: "Autodromo Hermanos Rodriguez",   country: "Mexico",       date: "2026-11-01", time: "20:00:00Z", qualifyingDate: "2026-10-31", qualifyingTime: "20:00:00Z" },
  { round: 21, name: "São Paulo Grand Prix",      circuit: "Autodromo Jose Carlos Pace",     country: "Brazil",       date: "2026-11-15", time: "17:00:00Z", qualifyingDate: "2026-11-14", qualifyingTime: "17:00:00Z" },
  { round: 22, name: "Las Vegas Grand Prix",      circuit: "Las Vegas Street Circuit",       country: "USA",          date: "2026-11-22", time: "06:00:00Z", qualifyingDate: "2026-11-21", qualifyingTime: "06:00:00Z" },
  { round: 23, name: "Qatar Grand Prix",          circuit: "Lusail International Circuit",   country: "Qatar",        date: "2026-12-06", time: "14:00:00Z", qualifyingDate: "2026-12-05", qualifyingTime: "14:00:00Z" },
  { round: 24, name: "Abu Dhabi Grand Prix",      circuit: "Yas Marina Circuit",             country: "UAE",          date: "2026-12-13", time: "13:00:00Z", qualifyingDate: "2026-12-12", qualifyingTime: "13:00:00Z" },
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
