import express from 'express';
import { sendTestEmail, sendPaymentConfirmation } from '../services/emailService.js';
import { triggerNotificationCheck, getNotificationStatus } from '../services/notificationService.js';

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
