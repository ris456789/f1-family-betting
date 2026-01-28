import express from 'express';
import ergastService from '../services/ergastService.js';
import { getDriversWithHeadshots } from '../services/openf1Service.js';
import { drivers2026, teams2026 } from '../data/drivers2026.js';

const router = express.Router();

// GET /api/races - Get full season schedule
router.get('/', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const schedule = await ergastService.getRaceSchedule(year);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching race schedule:', error);
    res.status(500).json({ error: 'Failed to fetch race schedule' });
  }
});

// GET /api/races/upcoming - Get upcoming races
router.get('/upcoming', async (req, res) => {
  try {
    const upcoming = await ergastService.getUpcomingRaces();
    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming races:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming races' });
  }
});

// GET /api/races/next - Get the next race
router.get('/next', async (req, res) => {
  try {
    const nextRace = await ergastService.getNextRace();
    if (!nextRace) {
      return res.status(404).json({ error: 'No upcoming races found' });
    }
    res.json(nextRace);
  } catch (error) {
    console.error('Error fetching next race:', error);
    res.status(500).json({ error: 'Failed to fetch next race' });
  }
});

// GET /api/races/:round/drivers - Get drivers for a race
router.get('/:round/drivers', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    // For 2026, use our static data with headshots
    if (parseInt(year) >= 2026) {
      const driversWithHeadshots = await getDriversWithHeadshots();
      return res.json(driversWithHeadshots);
    }

    // For earlier years, use Ergast API
    const drivers = await ergastService.getDriversWithTeams(year);
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/races/drivers/2026 - Get 2026 drivers with headshots
router.get('/drivers/2026', async (req, res) => {
  try {
    const driversWithHeadshots = await getDriversWithHeadshots();
    res.json(driversWithHeadshots);
  } catch (error) {
    console.error('Error fetching 2026 drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/races/teams/2026 - Get 2026 teams
router.get('/teams/2026', async (req, res) => {
  res.json(teams2026);
});

// GET /api/races/:round/qualifying - Get qualifying results
router.get('/:round/qualifying', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const results = await ergastService.getQualifyingResults(year, req.params.round);
    res.json(results);
  } catch (error) {
    console.error('Error fetching qualifying results:', error);
    res.status(500).json({ error: 'Failed to fetch qualifying results' });
  }
});

export default router;
