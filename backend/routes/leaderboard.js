import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET /api/leaderboard - Get season leaderboard
router.get('/', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    if (!supabase) {
      // Return mock leaderboard
      return res.json([
        { position: 1, user_id: '1', user_name: 'Dad', emoji: '👨', total_points: 150, races_predicted: 5, avg_points: 30 },
        { position: 2, user_id: '2', user_name: 'Mom', emoji: '👩', total_points: 135, races_predicted: 5, avg_points: 27 },
        { position: 3, user_id: '3', user_name: 'Wyatt', emoji: '🏎️', total_points: 120, races_predicted: 5, avg_points: 24 }
      ]);
    }

    // Aggregate scores by user for the season
    const { data: scores, error } = await supabase
      .from('scores')
      .select('user_id, total_points, users(name, emoji)')
      .eq('race_year', year);

    if (error) throw error;

    // Group by user and calculate totals
    const userTotals = {};
    scores.forEach(score => {
      if (!userTotals[score.user_id]) {
        userTotals[score.user_id] = {
          user_id: score.user_id,
          user_name: score.users?.name || 'Unknown',
          emoji: score.users?.emoji || '👤',
          total_points: 0,
          races_predicted: 0
        };
      }
      userTotals[score.user_id].total_points += score.total_points;
      userTotals[score.user_id].races_predicted += 1;
    });

    // Convert to array and sort
    const leaderboard = Object.values(userTotals)
      .map(user => ({
        ...user,
        avg_points: user.races_predicted > 0
          ? Math.round(user.total_points / user.races_predicted * 10) / 10
          : 0
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((user, index) => ({
        position: index + 1,
        ...user
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/leaderboard/:raceId - Get leaderboard for a specific race
router.get('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;

    if (!supabase) {
      return res.json([
        { position: 1, user_id: '1', user_name: 'Dad', emoji: '👨', total_points: 45 },
        { position: 2, user_id: '3', user_name: 'Wyatt', emoji: '🏎️', total_points: 38 },
        { position: 3, user_id: '2', user_name: 'Mom', emoji: '👩', total_points: 32 }
      ]);
    }

    const { data, error } = await supabase
      .from('scores')
      .select('user_id, total_points, points_breakdown, users(name, emoji)')
      .eq('race_id', raceId)
      .order('total_points', { ascending: false });

    if (error) throw error;

    const leaderboard = (data || []).map((score, index) => ({
      position: index + 1,
      user_id: score.user_id,
      user_name: score.users?.name || 'Unknown',
      emoji: score.users?.emoji || '👤',
      total_points: score.total_points,
      breakdown: score.points_breakdown
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching race leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch race leaderboard' });
  }
});

// GET /api/leaderboard/history - Get all races with results for the season
router.get('/history/races', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    if (!supabase) {
      return res.json([
        { race_id: '2024_1', race_name: 'Bahrain Grand Prix', race_round: 1, completed: true },
        { race_id: '2024_2', race_name: 'Saudi Arabian Grand Prix', race_round: 2, completed: true }
      ]);
    }

    const { data, error } = await supabase
      .from('race_results')
      .select('race_id, race_name, race_round')
      .eq('race_year', year)
      .order('race_round', { ascending: true });

    if (error) throw error;

    const races = (data || []).map(race => ({
      ...race,
      completed: true
    }));

    res.json(races);
  } catch (error) {
    console.error('Error fetching race history:', error);
    res.status(500).json({ error: 'Failed to fetch race history' });
  }
});

export default router;
