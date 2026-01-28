import express from 'express';
import supabase from '../db/supabase.js';
import { calculateScore } from '../services/scoringService.js';

const router = express.Router();

// In-memory storage for when Supabase is not configured
const mockScores = [];

// POST /api/scoring/:raceId/calculate - Calculate scores for a race
router.post('/:raceId/calculate', async (req, res) => {
  try {
    const { raceId } = req.params;

    // Get race results
    let raceResult;
    if (!supabase) {
      // For mock mode, expect results in request body
      raceResult = req.body.raceResult;
      if (!raceResult) {
        return res.status(400).json({ error: 'Race results required in mock mode' });
      }
    } else {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
        .eq('race_id', raceId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Race results not found. Fetch results first.' });
      }
      raceResult = data;
    }

    // Get all predictions for this race
    let predictions;
    if (!supabase) {
      predictions = req.body.predictions || [];
    } else {
      const { data, error } = await supabase
        .from('predictions')
        .select('*, users(name)')
        .eq('race_id', raceId);

      if (error) throw error;
      predictions = data || [];
    }

    if (predictions.length === 0) {
      return res.json({ message: 'No predictions found for this race', scores: [] });
    }

    // Transform race result to scoring format
    const resultForScoring = {
      p1: raceResult.p1,
      p2: raceResult.p2,
      p3: raceResult.p3,
      top10: raceResult.top_10 || raceResult.top10,
      fastestLap: raceResult.fastest_lap || raceResult.fastestLap,
      polePosition: raceResult.pole_position || raceResult.polePosition,
      dnfDrivers: raceResult.dnf_drivers || raceResult.dnfDrivers,
      safetyCar: raceResult.safety_car ?? raceResult.safetyCar,
      redFlag: raceResult.red_flag ?? raceResult.redFlag,
      driverOfTheDay: raceResult.driver_of_the_day || raceResult.driverOfTheDay,
      winningMargin: raceResult.winning_margin ?? raceResult.winningMargin
    };

    // Calculate scores for each prediction
    const scores = predictions.map(prediction => {
      const predictionForScoring = {
        p1: prediction.p1,
        p2: prediction.p2,
        p3: prediction.p3,
        top10: prediction.top_10 || prediction.top10,
        fastestLap: prediction.fastest_lap || prediction.fastestLap,
        polePosition: prediction.pole_position || prediction.polePosition,
        dnfDrivers: prediction.dnf_drivers || prediction.dnfDrivers,
        safetyCar: prediction.safety_car ?? prediction.safetyCar,
        redFlag: prediction.red_flag ?? prediction.redFlag,
        driverOfTheDay: prediction.driver_of_the_day || prediction.driverOfTheDay,
        winningMarginBracket: prediction.winning_margin_bracket || prediction.winningMarginBracket
      };

      const breakdown = calculateScore(predictionForScoring, resultForScoring);

      return {
        prediction_id: prediction.id,
        user_id: prediction.user_id,
        user_name: prediction.users?.name || 'Unknown',
        race_id: raceId,
        breakdown,
        total_points: breakdown.total
      };
    });

    // Store scores in database
    if (supabase) {
      for (const score of scores) {
        const scoreRecord = {
          prediction_id: score.prediction_id,
          user_id: score.user_id,
          race_id: raceId,
          race_year: raceResult.race_year,
          race_round: raceResult.race_round,
          points_breakdown: score.breakdown,
          total_points: score.total_points,
          calculated_at: new Date().toISOString()
        };

        // Upsert score
        const { data: existing } = await supabase
          .from('scores')
          .select('id')
          .eq('prediction_id', score.prediction_id)
          .single();

        if (existing) {
          await supabase
            .from('scores')
            .update(scoreRecord)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('scores')
            .insert([scoreRecord]);
        }
      }
    } else {
      // Mock storage
      scores.forEach(score => {
        const existingIndex = mockScores.findIndex(
          s => s.prediction_id === score.prediction_id
        );
        if (existingIndex >= 0) {
          mockScores[existingIndex] = score;
        } else {
          mockScores.push({ id: Date.now().toString(), ...score });
        }
      });
    }

    // Sort by total points descending
    scores.sort((a, b) => b.total_points - a.total_points);

    res.json({
      raceId,
      scoresCalculated: scores.length,
      scores
    });
  } catch (error) {
    console.error('Error calculating scores:', error);
    res.status(500).json({ error: 'Failed to calculate scores', details: error.message });
  }
});

// GET /api/scoring/:raceId - Get calculated scores for a race
router.get('/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;

    if (!supabase) {
      const scores = mockScores.filter(s => s.race_id === raceId);
      return res.json(scores);
    }

    const { data, error } = await supabase
      .from('scores')
      .select('*, users(name, emoji)')
      .eq('race_id', raceId)
      .order('total_points', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

export default router;
