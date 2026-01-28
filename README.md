# F1 Family Betting App

A full-stack web application for Formula 1 race predictions among family members. Compete to see who can best predict race outcomes!

## Features

- **Race Predictions**: Predict podium finishes, top 10 order, fastest lap, pole position, DNFs, and more
- **Automatic Results**: Fetches race results from the Ergast F1 API
- **Scoring System**: Comprehensive points system for various prediction types
- **Season Leaderboard**: Track standings throughout the season
- **Race History**: View past predictions and results
- **Mobile Responsive**: Works great on phones and tablets

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Data Sources**: Ergast F1 API + web scraping for supplementary data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Supabase account (free tier works)

### 1. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `database/schema.sql`
4. Copy your project URL and anon key from Settings > API

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

The backend will start on http://localhost:3001

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

## Environment Variables

### Backend (`backend/.env`)

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3001/api
```

## Points System

| Prediction | Points |
|------------|--------|
| Winner (P1) exact | 25 |
| Second (P2) exact | 18 |
| Third (P3) exact | 15 |
| Fastest Lap correct | 10 |
| Pole Position correct | 10 |
| Top 10 - exact position | 5 |
| Top 10 - in list but wrong position | 2 |
| DNF prediction correct | 5 |
| Safety Car correct | 5 |
| Red Flag correct | 8 |
| Driver of the Day correct | 5 |
| Winning Margin bracket correct | 5 |

## Usage

1. **Select a User**: Click the user dropdown in the header to select or create a player
2. **Make Predictions**: Go to the next race and fill out your predictions before qualifying starts
3. **View Results**: After the race, the host can fetch results from the Admin page
4. **Check Standings**: View the leaderboard to see season standings

## Admin Functions

The Admin page allows the host to:
- Fetch race results from the API
- Manually enter data that can't be auto-fetched (Safety Car, Red Flag, DOTD)
- Calculate scores for all predictions

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a user

### Races
- `GET /api/races` - Get season schedule
- `GET /api/races/next` - Get next upcoming race
- `GET /api/races/:round/drivers` - Get drivers for a race

### Predictions
- `GET /api/predictions/:raceId` - Get predictions for a race
- `POST /api/predictions` - Create/update a prediction

### Results
- `GET /api/results/:raceId` - Get stored results
- `POST /api/results/:raceId/fetch` - Fetch results from API
- `PUT /api/results/:raceId` - Manually update result fields

### Scoring
- `POST /api/scoring/:raceId/calculate` - Calculate scores for a race
- `GET /api/scoring/:raceId` - Get calculated scores

### Leaderboard
- `GET /api/leaderboard` - Get season standings
- `GET /api/leaderboard/:raceId` - Get standings for a specific race

## Development

The app works with or without Supabase configured. Without Supabase credentials, it uses in-memory mock data that resets on server restart.

## License

MIT
