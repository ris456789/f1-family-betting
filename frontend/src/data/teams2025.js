// 2025 F1 Teams with Car Images
export const teams2025 = [
  {
    id: "redbull",
    name: "Red Bull Racing",
    color: "#3671C6",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/red-bull-racing.png"
  },
  {
    id: "mclaren",
    name: "McLaren",
    color: "#FF8000",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/mclaren.png"
  },
  {
    id: "ferrari",
    name: "Ferrari",
    color: "#E80020",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/ferrari.png"
  },
  {
    id: "mercedes",
    name: "Mercedes",
    color: "#27F4D2",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/mercedes.png"
  },
  {
    id: "astonmartin",
    name: "Aston Martin",
    color: "#229971",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/aston-martin.png"
  },
  {
    id: "alpine",
    name: "Alpine",
    color: "#FF87BC",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/alpine.png"
  },
  {
    id: "haas",
    name: "Haas",
    color: "#B6BABD",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/haas.png"
  },
  {
    id: "racingbulls",
    name: "Racing Bulls",
    color: "#6692FF",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/rb.png"
  },
  {
    id: "williams",
    name: "Williams",
    color: "#64C4FF",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/williams.png"
  },
  {
    id: "sauber",
    name: "Kick Sauber",
    color: "#52E252",
    carImage: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/kick-sauber.png"
  }
];

export function getTeamById(id) {
  return teams2025.find(t => t.id === id);
}

export function getTeamColor(id) {
  const team = getTeamById(id);
  return team?.color || '#666666';
}
