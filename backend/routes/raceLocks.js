import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// In-memory storage for when Supabase is not configured
const mockLocks = new Map();

// GET /api/race-locks - all active lock overrides
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.json(Array.from(mockLocks.values()));
    }

    const { data, error } = await supabase.from('race_locks').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching race locks:', error);
    res.status(500).json({ error: 'Failed to fetch race locks' });
  }
});

// PUT /api/race-locks/:raceId - set or update an override
router.put('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    const { qualifyingDate, qualifyingTime } = req.body;

    if (!qualifyingDate || !qualifyingTime) {
      return res.status(400).json({ error: 'qualifyingDate and qualifyingTime are required' });
    }

    const record = {
      race_id: raceId,
      qualifying_date: qualifyingDate,
      qualifying_time: qualifyingTime,
      updated_at: new Date().toISOString()
    };

    if (!supabase) {
      mockLocks.set(raceId, record);
      return res.json(record);
    }

    const { data, error } = await supabase
      .from('race_locks')
      .upsert(record, { onConflict: 'race_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error setting race lock:', error);
    res.status(500).json({ error: 'Failed to set race lock' });
  }
});

// DELETE /api/race-locks/:raceId - clear an override (revert to scheduled time)
router.delete('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;

    if (!supabase) {
      mockLocks.delete(raceId);
      return res.json({ message: 'Override cleared' });
    }

    const { error } = await supabase.from('race_locks').delete().eq('race_id', raceId);
    if (error) throw error;
    res.json({ message: 'Override cleared' });
  } catch (error) {
    console.error('Error clearing race lock:', error);
    res.status(500).json({ error: 'Failed to clear race lock' });
  }
});

export default router;
