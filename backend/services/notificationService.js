import cron from 'node-cron';
import axios from 'axios';
import supabase from '../db/supabase.js';
import { sendQualifyingReminder, sendQualifyingDayBeforeReminder, sendRaceReminder } from './emailService.js';
import { races2026, formatRace } from '../data/races2026.js';
import { PARTICIPANT_EMAILS } from '../data/participants.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

const QUALIFYING_DAY_BEFORE_MINUTES = 1440; // Send 1 day before qualifying
const QUALIFYING_1HR_MINUTES = 60;          // Send 1 hr before qualifying
const RACE_REMIND_MINUTES = 120;            // Send 2 hrs before race

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

async function getQualifyingSessionTime(year, round) {
  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
      params: { year, session_name: 'Qualifying' },
      timeout: 8000
    });
    const sessions = response.data;
    if (!sessions || sessions.length === 0) return null;
    const session = sessions[round - 1];
    return session?.date_start ? new Date(session.date_start) : null;
  } catch {
    return null;
  }
}

function getEstimatedQualifyingTime(race) {
  const r = formatRace(race);
  return new Date(`${r.qualifyingDate}T${r.qualifyingTime}`);
}

function getRaceTime(race) {
  return new Date(`${race.date}T${race.time}`);
}

async function getNotifiableUsers() {
  // Always use the hardcoded participant email list
  // Enrich with DB user data (name, emoji, id) where available
  let dbUsers = [];
  if (supabase) {
    const { data } = await supabase.from('users').select('*');
    dbUsers = data || [];
  }

  return PARTICIPANT_EMAILS.map(email => {
    const dbUser = dbUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return dbUser
      ? { ...dbUser, email }
      : { id: email, name: email.split('@')[0], emoji: '👤', email, notify_qualifying: true };
  });
}

async function wasNotificationSent(userId, raceId, type) {
  if (!supabase) return false;
  const { data } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('race_id', raceId)
    .eq('notification_type', type)
    .single();
  return !!data;
}

async function logNotification(userId, raceId, type, status, errorMessage = null) {
  if (!supabase) return;
  const { error: logErr } = await supabase.from('notification_log').upsert({
    user_id: userId,
    race_id: raceId,
    notification_type: type,
    status,
    error_message: errorMessage,
    sent_at: new Date().toISOString()
  }, { onConflict: 'user_id,race_id,notification_type' });
  if (logErr) console.error(`[Notification] Failed to log ${type} for ${userId}:`, logErr.message);
}

async function getPotPaidCount(raceId) {
  if (!supabase) return 0;
  try {
    const { data } = await supabase
      .from('race_pots')
      .select('paid_user_ids')
      .eq('race_id', raceId)
      .single();
    return data?.paid_user_ids?.length || 0;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────
// Check qualifying reminders
// ─────────────────────────────────────────

async function checkQualifyingReminders() {
  const now = new Date();
  const upcoming = races2026
    .filter(r => new Date(`${r.date}T${r.time}`) > now)
    .slice(0, 2);

  for (const race of upcoming) {
    const raceId = `2026_${race.round}`;
    const formatted = formatRace(race);

    let qualifyingTime = getEstimatedQualifyingTime(race);
    const daysUntilRace = (new Date(`${race.date}T${race.time}`) - now) / 86400000;
    if (daysUntilRace <= 3) {
      const live = await getQualifyingSessionTime(2026, race.round);
      if (live) qualifyingTime = live;
    }

    const minutesUntil = (qualifyingTime - now) / 60000;
    if (minutesUntil <= 0 || minutesUntil > QUALIFYING_DAY_BEFORE_MINUTES) continue;

    const users = await getNotifiableUsers();

    // Day-before reminder (within 24 hrs, not yet sent)
    if (minutesUntil > QUALIFYING_1HR_MINUTES) {
      console.log(`[Notification] Qualifying for ${race.name} in ~${Math.round(minutesUntil / 60)}h — sending day-before reminders`);
      for (const user of users) {
        const alreadySent = await wasNotificationSent(user.id, raceId, 'qualifying_day_b4');
        if (alreadySent) continue;

        const result = await sendQualifyingDayBeforeReminder(user, formatted);
        await logNotification(user.id, raceId, 'qualifying_day_b4',
          result.success ? 'sent' : 'failed', result.error);
        await new Promise(r => setTimeout(r, 600));
      }
    }

    // 1-hour reminder (within 1 hr, not yet sent)
    if (minutesUntil <= QUALIFYING_1HR_MINUTES) {
      console.log(`[Notification] Qualifying for ${race.name} in ${Math.round(minutesUntil)} min — sending 1hr reminders`);
      for (const user of users) {
        const alreadySent = await wasNotificationSent(user.id, raceId, 'qualifying_1hr');
        if (alreadySent) continue;

        const result = await sendQualifyingReminder(user, formatted);
        await logNotification(user.id, raceId, 'qualifying_1hr',
          result.success ? 'sent' : 'failed', result.error);
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }
}

// ─────────────────────────────────────────
// Check race day reminders
// ─────────────────────────────────────────

async function checkRaceReminders() {
  const now = new Date();
  const upcoming = races2026
    .filter(r => new Date(`${r.date}T${r.time}`) > now)
    .slice(0, 2);

  for (const race of upcoming) {
    const raceId = `2026_${race.round}`;
    const formatted = formatRace(race);
    const raceTime = getRaceTime(race);

    const minutesUntil = (raceTime - now) / 60000;
    if (minutesUntil <= 0 || minutesUntil > RACE_REMIND_MINUTES) continue;

    console.log(`[Notification] Race ${race.name} in ${Math.round(minutesUntil)} min — sending race day emails`);

    const users = await getNotifiableUsers();
    const potPaidCount = await getPotPaidCount(raceId);

    for (const user of users) {
      const alreadySent = await wasNotificationSent(user.id, raceId, 'race_day');
      if (alreadySent) continue;

      const result = await sendRaceReminder(user, formatted, potPaidCount);
      await logNotification(user.id, raceId, 'race_day',
        result.success ? 'sent' : 'failed', result.error);
      await new Promise(r => setTimeout(r, 600)); // Resend rate limit: 2 req/sec
    }
  }
}

// ─────────────────────────────────────────
// Combined check (called by cron)
// ─────────────────────────────────────────

async function runNotificationCheck() {
  console.log('[Notification] Running check...');
  await Promise.all([
    checkQualifyingReminders(),
    checkRaceReminders()
  ]);
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

export function startNotificationScheduler() {
  console.log('[Notification] Starting scheduler (every 15 min)...');

  cron.schedule('*/15 * * * *', async () => {
    try { await runNotificationCheck(); }
    catch (err) { console.error('[Notification] Scheduler error:', err); }
  });

  // Run once on startup
  runNotificationCheck().catch(console.error);

  console.log('[Notification] Scheduler started');
}

export async function triggerNotificationCheck() {
  return runNotificationCheck();
}

export async function getNotificationStatus(raceId) {
  if (!supabase) return { configured: false };

  const { data: logs } = await supabase
    .from('notification_log')
    .select('*, users(name, email)')
    .eq('race_id', raceId);

  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, notify_qualifying')
    .not('email', 'is', null);

  return {
    configured: true,
    usersWithEmail: users?.length || 0,
    notificationsSent: logs || []
  };
}

export default { startNotificationScheduler, triggerNotificationCheck, getNotificationStatus };
