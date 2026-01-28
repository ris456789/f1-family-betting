// 2026 F1 Teams and Drivers
export const teams2026 = [
  { id: "mclaren", name: "McLaren", color: "#FF8000" },
  { id: "ferrari", name: "Ferrari", color: "#E80020" },
  { id: "redbull", name: "Red Bull", color: "#3671C6" },
  { id: "mercedes", name: "Mercedes", color: "#27F4D2" },
  { id: "astonmartin", name: "Aston Martin", color: "#229971" },
  { id: "alpine", name: "Alpine", color: "#FF87BC" },
  { id: "haas", name: "Haas", color: "#B6BABD" },
  { id: "racingbulls", name: "Racing Bulls", color: "#6692FF" },
  { id: "williams", name: "Williams", color: "#64C4FF" },
  { id: "audi", name: "Audi", color: "#FF0000" },
  { id: "cadillac", name: "Cadillac", color: "#1E4D2B" }
];

export const drivers2026 = [
  // McLaren
  { code: "NOR", driverId: "norris", name: "Lando Norris", team: "McLaren", teamId: "mclaren", number: 1 },
  { code: "PIA", driverId: "piastri", name: "Oscar Piastri", team: "McLaren", teamId: "mclaren", number: 81 },
  // Ferrari
  { code: "LEC", driverId: "leclerc", name: "Charles Leclerc", team: "Ferrari", teamId: "ferrari", number: 16 },
  { code: "HAM", driverId: "hamilton", name: "Lewis Hamilton", team: "Ferrari", teamId: "ferrari", number: 44 },
  // Red Bull
  { code: "VER", driverId: "verstappen", name: "Max Verstappen", team: "Red Bull", teamId: "redbull", number: 3 },
  { code: "HAD", driverId: "hadjar", name: "Isack Hadjar", team: "Red Bull", teamId: "redbull", number: 6 },
  // Mercedes
  { code: "RUS", driverId: "russell", name: "George Russell", team: "Mercedes", teamId: "mercedes", number: 63 },
  { code: "ANT", driverId: "antonelli", name: "Kimi Antonelli", team: "Mercedes", teamId: "mercedes", number: 12 },
  // Aston Martin
  { code: "ALO", driverId: "alonso", name: "Fernando Alonso", team: "Aston Martin", teamId: "astonmartin", number: 14 },
  { code: "STR", driverId: "stroll", name: "Lance Stroll", team: "Aston Martin", teamId: "astonmartin", number: 18 },
  // Alpine
  { code: "GAS", driverId: "gasly", name: "Pierre Gasly", team: "Alpine", teamId: "alpine", number: 10 },
  { code: "COL", driverId: "colapinto", name: "Franco Colapinto", team: "Alpine", teamId: "alpine", number: 43 },
  // Haas
  { code: "OCO", driverId: "ocon", name: "Esteban Ocon", team: "Haas", teamId: "haas", number: 31 },
  { code: "BEA", driverId: "bearman", name: "Oliver Bearman", team: "Haas", teamId: "haas", number: 87 },
  // Racing Bulls
  { code: "LAW", driverId: "lawson", name: "Liam Lawson", team: "Racing Bulls", teamId: "racingbulls", number: 30 },
  { code: "LIN", driverId: "lindblad", name: "Arvid Lindblad", team: "Racing Bulls", teamId: "racingbulls", number: 41 },
  // Williams
  { code: "ALB", driverId: "albon", name: "Alex Albon", team: "Williams", teamId: "williams", number: 23 },
  { code: "SAI", driverId: "sainz", name: "Carlos Sainz", team: "Williams", teamId: "williams", number: 55 },
  // Audi
  { code: "HUL", driverId: "hulkenberg", name: "Nico Hulkenberg", team: "Audi", teamId: "audi", number: 27 },
  { code: "BOR", driverId: "bortoleto", name: "Gabriel Bortoleto", team: "Audi", teamId: "audi", number: 5 },
  // Cadillac
  { code: "PER", driverId: "perez", name: "Sergio Perez", team: "Cadillac", teamId: "cadillac", number: 11 },
  { code: "BOT", driverId: "bottas", name: "Valtteri Bottas", team: "Cadillac", teamId: "cadillac", number: 77 }
];

export function getTeamColor(teamId) {
  const team = teams2026.find(t => t.id === teamId);
  return team?.color || '#666666';
}

export function getDriverByCode(code) {
  return drivers2026.find(d => d.code === code);
}

export function getTeamById(teamId) {
  return teams2026.find(t => t.id === teamId);
}
