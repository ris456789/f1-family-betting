import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// In-memory storage for when Supabase is not configured
const mockPredictions = [];

// GET /api/predictions/:raceId - Get all predictions for a race
router.get('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    const { userId } = req.query;

    if (!supabase) {
      let filtered = mockPredictions.filter(p => p.race_id === raceId);
      if (userId) {
        filtered = filtered.filter(p => p.user_id === userId);
      }
      return res.json(filtered);
    }

    let query = supabase
      .from('predictions')
      .select('*, users(name, emoji)')
      .eq('race_id', raceId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// POST /api/predictions - Create or update a prediction
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      raceId,
      raceYear,
      raceRound,
      p1,
      p2,
      p3,
      top10,
      fastestLap,
      polePosition,
      dnfDrivers,
      safetyCar,
      redFlag,
      driverOfTheDay,
      winningMarginBracket
    } = req.body;

    if (!userId || !raceId) {
      return res.status(400).json({ error: 'userId and raceId are required' });
    }

    const prediction = {
      user_id: userId,
      race_id: raceId,
      race_year: raceYear || new Date().getFullYear(),
      race_round: raceRound,
      p1,
      p2,
      p3,
      top_10: top10,
      fastest_lap: fastestLap,
      pole_position: polePosition,
      dnf_drivers: dnfDrivers || [],
      safety_car: safetyCar,
      red_flag: redFlag,
      driver_of_the_day: driverOfTheDay,
      winning_margin_bracket: winningMarginBracket,
      updated_at: new Date().toISOString()
    };

    if (!supabase) {
      // Mock storage
      const existingIndex = mockPredictions.findIndex(
        p => p.user_id === userId && p.race_id === raceId
      );

      if (existingIndex >= 0) {
        mockPredictions[existingIndex] = {
          ...mockPredictions[existingIndex],
          ...prediction
        };
        return res.json(mockPredictions[existingIndex]);
      } else {
        const newPrediction = {
          id: Date.now().toString(),
          ...prediction,
          created_at: new Date().toISOString()
        };
        mockPredictions.push(newPrediction);
        return res.status(201).json(newPrediction);
      }
    }

    // Check if prediction already exists
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('race_id', raceId)
      .single();

    let result;
    if (existing) {
      // Update existing prediction
      const { data, error } = await supabase
        .from('predictions')
        .update(prediction)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new prediction
      const { data, error } = await supabase
        .from('predictions')
        .insert([{ ...prediction, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.status(existing ? 200 : 201).json(result);
  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({ error: 'Failed to save prediction' });
  }
});

// GET /api/predictions/user/:userId - Get all predictions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!supabase) {
      return res.json(mockPredictions.filter(p => p.user_id === userId));
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('race_round', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching user predictions:', error);
    res.status(500).json({ error: 'Failed to fetch user predictions' });
  }
});

// DELETE /api/predictions/:id - Delete a prediction
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase) {
      const index = mockPredictions.findIndex(p => p.id === req.params.id);
      if (index >= 0) {
        mockPredictions.splice(index, 1);
      }
      return res.json({ message: 'Prediction deleted' });
    }

    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ error: 'Failed to delete prediction' });
  }
});

export default router;
