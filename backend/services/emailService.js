import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (_resend) return _resend;
  if (process.env.RESEND_API_KEY) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM_EMAIL = () => process.env.FROM_EMAIL || 'F1 Family Betting <onboarding@resend.dev>';

// ─────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#15151e;border-radius:16px;overflow:hidden;border:1px solid #2a2a3e;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#e10600 0%,#c00000 50%,#1a0000 100%);padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 2px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);">F1 FAMILY BETTING</p>
                <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">🏎️ Race Week</p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:36px;line-height:1;">🏁</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:36px 40px;">${body}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#0d0d1a;padding:20px 40px;border-top:1px solid #2a2a3e;">
          <p style="margin:0;color:#444;font-size:11px;text-align:center;letter-spacing:0.5px;">
            F1 Family Betting &bull; Notifications are on because you play with us &bull; Talk to Rishita to unsubscribe
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function raceBox(race) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e2e;border-left:4px solid #e10600;border-radius:0 8px 8px 0;margin:24px 0;">
  <tr>
    <td style="padding:20px 24px;">
      <p style="margin:0 0 4px 0;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#e10600;font-weight:700;">Round ${race.round} &bull; ${race.country}</p>
      <p style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#ffffff;">${race.raceName}</p>
      <p style="margin:0 0 6px 0;font-size:13px;color:#888;">📍 ${race.circuitName}</p>
    </td>
  </tr>
</table>`;
}

function timingRow(label, dateStr, timeStr) {
  const dt = new Date(`${dateStr}T${timeStr}`);
  const formatted = dt.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
  <tr>
    <td style="background:#1a1a2e;border-radius:8px;padding:14px 18px;">
      <p style="margin:0 0 3px 0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">${label}</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">${formatted}</p>
    </td>
  </tr>
</table>`;
}

function ctaButton(text, url) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
  <tr>
    <td align="center">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#e10600,#ff4d4d);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:50px;letter-spacing:0.3px;">${text}</a>
    </td>
  </tr>
</table>`;
}

function potBadge(prizePool) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,165,0,0.06));border:1px solid rgba(255,215,0,0.25);border-radius:10px;padding:16px 20px;text-align:center;">
      <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#ffd700;">This Week's Prize Pool</p>
      <p style="margin:0;font-size:34px;font-weight:900;color:#ffd700;">$${prizePool.toFixed(0)}</p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#999;">Winner takes all &bull; Split on tie</p>
    </td>
  </tr>
</table>`;
}

async function send(to, subject, html) {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email Mock] → ${to} | ${subject}`);
    return { success: true, mock: true };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL(), to, subject, html });
    if (error) {
      console.error(`[Email] Failed → ${to}:`, error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Sent → ${to} | ${subject}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error(`[Email] Error → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────
// Email 1: Qualifying reminder (1 hr before)
// ─────────────────────────────────────────

export async function sendQualifyingReminder(user, race) {
  if (!user.email) return { success: false, error: 'No email address' };

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;

  const body = `
<p style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#ffffff;">Hey ${user.emoji} ${user.name}! ⏰</p>
<p style="margin:0 0 28px 0;font-size:15px;color:#aaa;line-height:1.6;">
  Qualifying starts in <strong style="color:#e10600;">about 1 hour</strong> — once it begins, predictions are locked forever.
  Don't miss your chance to score points this week!
</p>

${raceBox(race)}
${timingRow('Qualifying — Predictions lock at', race.qualifyingDate, race.qualifyingTime)}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#1a1a2e;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 12px 0;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Points up for grabs</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#ccc;">🥇 P1 / P2 / P3 exact</td>
          <td align="right" style="font-size:13px;color:#e10600;font-weight:700;">15 pts each</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#ccc;">🎖️ Podium pick, wrong spot</td>
          <td align="right" style="font-size:13px;color:#e10600;font-weight:700;">10 pts</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#ccc;">🎯 P4–P10 exact</td>
          <td align="right" style="font-size:13px;color:#e10600;font-weight:700;">5 pts (−1 per pos off)</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#ccc;">⚡ Fastest Lap + 🏁 Pole</td>
          <td align="right" style="font-size:13px;color:#e10600;font-weight:700;">5 pts each</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#ccc;">🚩 Red Flag + 🚗 Safety Car</td>
          <td align="right" style="font-size:13px;color:#e10600;font-weight:700;">8 / 5 pts</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

${ctaButton('Lock In My Predictions →', `${appUrl}/predict/${raceId}`)}

<p style="margin:20px 0 0 0;font-size:12px;color:#555;text-align:center;">
  Predictions auto-lock when qualifying begins. No extensions!
</p>`;

  return send(
    user.email,
    `⏰ ${user.name}, predictions for ${race.raceName} lock in 1 hour!`,
    layout(body)
  );
}

// ─────────────────────────────────────────
// Email 2: Race day reminder (2 hrs before)
// ─────────────────────────────────────────

export async function sendRaceReminder(user, race, potPaidCount = 0) {
  if (!user.email) return { success: false, error: 'No email address' };

  const prizePool = potPaidCount * 9; // $10 - $1 host cut

  const body = `
<p style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#ffffff;">It's race day, ${user.emoji} ${user.name}! 🏎️</p>
<p style="margin:0 0 28px 0;font-size:15px;color:#aaa;line-height:1.6;">
  The cars are on the grid. Your predictions are locked in. Time to watch and see if you called it right!
</p>

${raceBox(race)}
${timingRow('Lights out', race.date, race.time)}

${potPaidCount > 0 ? potBadge(prizePool) : ''}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#1a1a2e;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#fff;">Your predictions are locked. Here's what you need to watch for:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:3px 0;font-size:13px;color:#aaa;">🏎️ Who crosses the line P1, P2, P3?</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:#aaa;">⚡ Watch for fastest lap in the final few laps</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:#aaa;">🚗 Will there be a safety car?</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:#aaa;">🚩 Any red flags or stoppages?</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:#aaa;">💀 Which drivers might DNF?</td></tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
  <tr>
    <td style="background:linear-gradient(135deg,#e10600,#c00000);border-radius:10px;padding:18px 20px;text-align:center;">
      <p style="margin:0;font-size:17px;font-weight:800;color:#ffffff;">Good luck out there — may your picks be on the podium! 🏆</p>
    </td>
  </tr>
</table>`;

  return send(
    user.email,
    `🏎️ Race day! ${race.raceName} starts in ~2 hours, ${user.name}!`,
    layout(body)
  );
}

// ─────────────────────────────────────────
// Email 3: Payment confirmation
// ─────────────────────────────────────────

export async function sendPaymentConfirmation(email, name, emoji = '👤', raceName, prizePool) {
  if (!email) return { success: false, error: 'No email address' };

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const body = `
<p style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#ffffff;">You're in the pot, ${emoji} ${name}! 💰</p>
<p style="margin:0 0 28px 0;font-size:15px;color:#aaa;line-height:1.6;">
  Your $10 payment for this week's race has been confirmed. You're officially in — good luck!
</p>

${potBadge(prizePool)}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
  <tr>
    <td style="background:#1a1a2e;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 4px 0;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;">This week's race</p>
      <p style="margin:0 0 16px 0;font-size:19px;font-weight:700;color:#ffffff;">${raceName}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#aaa;">Buy-in</td>
          <td align="right" style="font-size:13px;color:#fff;font-weight:600;">$10</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#aaa;">Your share of the prize pool</td>
          <td align="right" style="font-size:13px;color:#ffd700;font-weight:700;">$9</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#aaa;">Total prize pool (so far)</td>
          <td align="right" style="font-size:13px;color:#ffd700;font-weight:700;">$${prizePool.toFixed(0)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0 4px 0;font-size:11px;color:#555;border-top:1px solid #2a2a3e;margin-top:8px;">
            🛠️ $1 of your buy-in is an optional tip to the developer who built and maintains this app — thank you!
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr>
    <td style="background:#1e2a1e;border:1px solid #2d4a2d;border-radius:10px;padding:16px 20px;">
      <p style="margin:0;font-size:14px;color:#6abf6a;font-weight:600;">
        ✅ Payment confirmed &bull; You're officially competing this race week!
      </p>
    </td>
  </tr>
</table>

${ctaButton('View This Week\'s Predictions →', appUrl)}

<p style="margin:20px 0 0 0;font-size:12px;color:#555;text-align:center;">
  If this was a mistake, contact Rishita to sort it out.
</p>`;

  return send(
    email,
    `✅ ${name}, you're in the pot for ${raceName}!`,
    layout(body)
  );
}

// ─────────────────────────────────────────
// Test email
// ─────────────────────────────────────────

export async function sendTestEmail(email, name = 'there') {
  const body = `
<p style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#ffffff;">Hey ${name}! 👋</p>
<p style="margin:0 0 28px 0;font-size:15px;color:#aaa;line-height:1.6;">
  Your F1 Family Betting notifications are all set up and working perfectly!
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="background:#1a1a2e;border-radius:10px;padding:18px 20px;">
      <p style="margin:0 0 14px 0;font-size:13px;font-weight:600;color:#fff;">You'll automatically receive:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#aaa;">⏰ <strong style="color:#fff;">1 hour before qualifying</strong></td>
        </tr>
        <tr>
          <td style="padding:2px 0 6px 40px;font-size:12px;color:#666;">Reminder to lock in your predictions before they close</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#aaa;">🏎️ <strong style="color:#fff;">2 hours before the race</strong></td>
        </tr>
        <tr>
          <td style="padding:2px 0 6px 40px;font-size:12px;color:#666;">Race day reminder with what to watch for</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#aaa;">💰 <strong style="color:#fff;">When your payment is confirmed</strong></td>
        </tr>
        <tr>
          <td style="padding:2px 0 0 40px;font-size:12px;color:#666;">Confirmation you're in the pot with current prize pool</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:linear-gradient(135deg,#e10600,#c00000);border-radius:10px;padding:18px 20px;text-align:center;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">You're all set — see you on the grid! 🏁</p>
    </td>
  </tr>
</table>`;

  return send(
    email,
    `✅ ${name}, your F1 Family Betting notifications are active!`,
    layout(body)
  );
}

export default { sendQualifyingReminder, sendRaceReminder, sendPaymentConfirmation, sendTestEmail };
