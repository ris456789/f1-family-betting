import express from 'express';
import supabase from '../db/supabase.js';
import ergastService from '../services/ergastService.js';
import scrapingService from '../services/scrapingService.js';
import { transformRaceResults } from '../services/scoringService.js';

const router = express.Router();

// In-memory storage for when Supabase is not configured
const mockResults = [];

// GET /api/results/:raceId - Get stored results for a race
router.get('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;

    if (!supabase) {
      const result = mockResults.find(r => r.race_id === raceId);
      if (!result) {
        return res.status(404).json({ error: 'Results not found' });
      }
      return res.json(result);
    }

    const { data, error } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return res.status(404).json({ error: 'Results not found for this race' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// POST /api/results/:raceId/fetch - Fetch and store results from APIs
router.post('/:raceId/fetch', async (req, res) => {
  try {
    const { raceId } = req.params;
    const { year, round, raceName } = req.body;

    if (!year || !round) {
      return res.status(400).json({ error: 'Year and round are required' });
    }

    // Fetch race results from Ergast API
    const ergastResults = await ergastService.getRaceResults(year, round);

    if (!ergastResults || ergastResults.length === 0) {
      return res.status(404).json({ error: 'Race results not available yet' });
    }

    // Fetch supplementary data (safety car, red flag, DOTD)
    let supplementaryData = {};
    if (raceName) {
      supplementaryData = await scrapingService.getAllSupplementaryData(year, round, raceName);
    }

    // Transform results to our format
    const transformedResults = transformRaceResults(ergastResults, supplementaryData);

    const raceResult = {
      race_id: raceId,
      race_year: year,
      race_round: round,
      race_name: raceName,
      ...transformedResults,
      raw_results: ergastResults,
      scraping_status: supplementaryData.scrapingStatus || {},
      fetched_at: new Date().toISOString()
    };

    if (!supabase) {
      const existingIndex = mockResults.findIndex(r => r.race_id === raceId);
      if (existingIndex >= 0) {
        mockResults[existingIndex] = raceResult;
      } else {
        mockResults.push({ id: Date.now().toString(), ...raceResult });
      }
      return res.json(raceResult);
    }

    // Upsert to database
    const { data: existing } = await supabase
      .from('race_results')
      .select('id')
      .eq('race_id', raceId)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('race_results')
        .update(raceResult)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('race_results')
        .insert([raceResult])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching race results:', error);
    res.status(500).json({ error: 'Failed to fetch race results', details: error.message });
  }
});

// PUT /api/results/:raceId - Manually update results (for fields scraping missed)
router.put('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    const updates = req.body;

    // Only allow updating specific fields manually
    const allowedFields = ['safety_car', 'red_flag', 'driver_of_the_day', 'winning_margin'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    if (!supabase) {
      const index = mockResults.findIndex(r => r.race_id === raceId);
      if (index >= 0) {
        mockResults[index] = { ...mockResults[index], ...filteredUpdates };
        return res.json(mockResults[index]);
      }
      return res.status(404).json({ error: 'Results not found' });
    }

    const { data, error } = await supabase
      .from('race_results')
      .update(filteredUpdates)
      .eq('race_id', raceId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating results:', error);
    res.status(500).json({ error: 'Failed to update results' });
  }
});

export default router;
