import cron from 'node-cron';
import axios from 'axios';
import supabase from '../db/supabase.js';
import { sendQualifyingReminder, sendRaceReminder } from './emailService.js';
import { races2026, formatRace } from '../data/races2026.js';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

const QUALIFYING_REMIND_MINUTES = 60;  // Send 1 hr before qualifying
const RACE_REMIND_MINUTES = 120;       // Send 2 hrs before race

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
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .not('email', 'is', null)
    .eq('notify_qualifying', true);
  if (error) { console.error('[Notification] Error fetching users:', error); return []; }
  return data || [];
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
  await supabase.from('notification_log').upsert({
    user_id: userId,
    race_id: raceId,
    notification_type: type,
    status,
    error_message: errorMessage,
    sent_at: new Date().toISOString()
  }, { onConflict: 'user_id,race_id,notification_type' });
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
    if (daysUntilRace <= 2) {
      const live = await getQualifyingSessionTime(2026, race.round);
      if (live) qualifyingTime = live;
    }

    const minutesUntil = (qualifyingTime - now) / 60000;
    if (minutesUntil <= 0 || minutesUntil > QUALIFYING_REMIND_MINUTES) continue;

    console.log(`[Notification] Qualifying for ${race.name} in ${Math.round(minutesUntil)} min — sending reminders`);

    const users = await getNotifiableUsers();
    for (const user of users) {
      const alreadySent = await wasNotificationSent(user.id, raceId, 'qualifying');
      if (alreadySent) continue;

      const result = await sendQualifyingReminder(user, formatted);
      await logNotification(user.id, raceId, 'qualifying',
        result.success ? 'sent' : 'failed', result.error);
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
