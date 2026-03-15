import express from 'express';
import { sendTestEmail, sendPaymentConfirmation, sendResultsEmail } from '../services/emailService.js';
import { triggerNotificationCheck, getNotificationStatus } from '../services/notificationService.js';
import supabase from '../db/supabase.js';
import { races2026 } from '../data/races2026.js';
import { PARTICIPANT_EMAILS } from '../data/participants.js';

const router = express.Router();

// POST /api/notifications/test - Send a test email
router.post('/test', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await sendTestEmail(email, name || 'there');

    if (result.success) {
      res.json({ message: 'Test email sent successfully', ...result });
    } else {
      res.status(500).json({ error: 'Failed to send test email', details: result.error });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// POST /api/notifications/payment-confirmed - Send payment confirmation email
router.post('/payment-confirmed', async (req, res) => {
  try {
    const { email, name, emoji, raceName, prizePool } = req.body;
    if (!email || !raceName) {
      return res.status(400).json({ error: 'email and raceName are required' });
    }
    const result = await sendPaymentConfirmation(email, name || 'there', emoji || '👤', raceName, prizePool || 0);
    if (result.success) {
      res.json({ message: 'Payment confirmation sent', ...result });
    } else {
      res.status(500).json({ error: 'Failed to send confirmation', details: result.error });
    }
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({ error: 'Failed to send payment confirmation' });
  }
});

// POST /api/notifications/trigger - Manually trigger notification check
router.post('/trigger', async (req, res) => {
  try {
    await triggerNotificationCheck();
    res.json({ message: 'Notification check triggered' });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    res.status(500).json({ error: 'Failed to trigger notifications' });
  }
});

// POST /api/notifications/resend-results/:raceId - Resend results emails for a race
router.post('/resend-results/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    const [yearStr, roundStr] = raceId.split('_');

    if (!supabase) {
      return res.status(400).json({ error: 'Supabase not configured' });
    }

    // Get scores for this race
    const { data: scores, error: scoresErr } = await supabase
      .from('scores')
      .select('user_id, total_points, users(id, name, emoji)')
      .eq('race_id', raceId)
      .order('total_points', { ascending: false });

    if (scoresErr) throw scoresErr;
    if (!scores || scores.length === 0) {
      return res.status(404).json({ error: 'No scores found for this race. Calculate scores first.' });
    }

    const leaderboard = scores.map(s => ({
      user_id: s.user_id,
      user_name: s.users?.name || 'Unknown',
      emoji: s.users?.emoji || '👤',
      total_points: s.total_points
    }));

    // Get users with emails
    const { data: dbUsers } = await supabase.from('users').select('id, name, emoji, email');
    const users = (PARTICIPANT_EMAILS || []).map(email => {
      const dbUser = (dbUsers || []).find(u => u.email?.toLowerCase() === email.toLowerCase());
      return dbUser ? { ...dbUser, email } : { id: email, name: email.split('@')[0], emoji: '👤', email };
    }).filter(u => u.email);

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users with emails found' });
    }

    // Find race info
    const race = races2026.find(r => `2026_${r.round}` === raceId);
    if (!race) {
      return res.status(404).json({ error: `Race ${raceId} not found` });
    }
    const raceForEmail = { ...race, raceName: race.name, circuitName: race.circuit };

    let sent = 0;
    let failed = 0;
    for (const user of users) {
      const result = await sendResultsEmail(user, raceForEmail, leaderboard);
      if (result.success) sent++;
      else failed++;
      await new Promise(r => setTimeout(r, 600)); // Resend rate limit
    }

    res.json({ message: `Results emails sent: ${sent} succeeded, ${failed} failed`, sent, failed });
  } catch (error) {
    console.error('Error resending results emails:', error);
    res.status(500).json({ error: 'Failed to resend results emails', details: error.message });
  }
});

// GET /api/notifications/status/:raceId - Get notification status for a race
router.get('/status/:raceId', async (req, res) => {
  try {
    const status = await getNotificationStatus(req.params.raceId);
    res.json(status);
  } catch (error) {
    console.error('Error getting notification status:', error);
    res.status(500).json({ error: 'Failed to get notification status' });
  }
});

export default router;
