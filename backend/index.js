import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import usersRoutes from './routes/users.js';
import racesRoutes from './routes/races.js';
import predictionsRoutes from './routes/predictions.js';
import resultsRoutes from './routes/results.js';
import scoringRoutes from './routes/scoring.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationsRoutes from './routes/notifications.js';
import { startNotificationScheduler } from './services/notificationService.js';
import { startRaceResultsScheduler } from './services/raceResultsScheduler.js';

dotenv.config({ path: join(__dirname, '.env') });

// Startup diagnostics — helps debug Railway env var injection
console.log('[Startup] Env vars present:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  FROM_EMAIL: !!process.env.FROM_EMAIL,
  APP_URL: !!process.env.APP_URL,
  PORT: process.env.PORT || '(default 3001)',
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
      resend: !!process.env.RESEND_API_KEY,
      appUrl: process.env.APP_URL || null,
    }
  });
});

app.listen(PORT, () => {
  console.log(`F1 Betting API running on port ${PORT}`);

  // Start the notification scheduler
  if (process.env.ENABLE_NOTIFICATIONS !== 'false') {
    startNotificationScheduler();
  }

  // Start the race results auto-fetcher
  if (process.env.ENABLE_AUTO_RESULTS !== 'false') {
    startRaceResultsScheduler();
  }
});
