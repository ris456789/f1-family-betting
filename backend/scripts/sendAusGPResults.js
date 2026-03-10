// One-time script: send Australian GP results email to all participants
// Run with: node scripts/sendAusGPResults.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import supabase from '../db/supabase.js';
import { Resend } from 'resend';
import { PARTICIPANT_EMAILS } from '../data/participants.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'F1 Family Betting <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const RACE_ID = '2026_1';

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#15151e;border-radius:16px;overflow:hidden;border:1px solid #2a2a3e;">
      <tr>
        <td style="background:linear-gradient(135deg,#e10600 0%,#c00000 50%,#1a0000 100%);padding:28px 40px;">
          <p style="margin:0 0 2px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);">F1 FAMILY BETTING</p>
          <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;">🏎️ Australian Grand Prix</p>
        </td>
      </tr>
      <tr><td style="padding:36px 40px;">${body}</td></tr>
      <tr>
        <td style="background:#0d0d1a;padding:20px 40px;border-top:1px solid #2a2a3e;">
          <p style="margin:0;color:#444;font-size:11px;text-align:center;">F1 Family Betting &bull; Round 1 &bull; 2026 Season</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function run() {
  // Fetch race result from DB
  const { data: result, error: rErr } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', RACE_ID)
    .single();

  if (rErr || !result) {
    console.error('No results found for', RACE_ID, rErr?.message);
    process.exit(1);
  }

  // Fetch DB users to enrich emails with names
  const { data: dbUsers } = await supabase.from('users').select('id, name, emoji, email');

  const top10 = result.top_10 || [];
  const [p1, p2, p3] = top10;

  // Map driverIds to display names using DB users or just show the id
  const podiumRows = [
    { pos: '🥇', driverId: p1 },
    { pos: '🥈', driverId: p2 },
    { pos: '🥉', driverId: p3 },
  ].filter(r => r.driverId).map(r => `
<tr>
  <td style="padding:10px 0;font-size:16px;color:#ffffff;">
    ${r.pos} <strong>${r.driverId}</strong>
  </td>
</tr>`).join('');

  const body = `
<p style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#ffffff;">🏁 The Australian GP is done!</p>
<p style="margin:0 0 28px 0;font-size:15px;color:#aaa;line-height:1.6;">
  Round 1 of the 2026 season is in the books. Here's how the top 3 finished at Albert Park:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:10px;padding:20px 24px;margin:0 0 28px 0;">
  <tr><td>
    <p style="margin:0 0 14px 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#e10600;font-weight:700;">Race Podium</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${podiumRows}
    </table>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#e10600,#c00000);border-radius:10px;padding:20px 24px;margin:0 0 28px 0;text-align:center;">
  <tr><td>
    <p style="margin:0;font-size:17px;font-weight:800;color:#ffffff;">See you next race week! 🏎️</p>
    <p style="margin:8px 0 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Round 2 — Chinese Grand Prix — Shanghai</p>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td align="center">
      <a href="${APP_URL}/history" style="display:inline-block;background:#1e1e2e;border:1px solid #3a3a5e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:50px;">View Full Results →</a>
    </td>
  </tr>
</table>`;

  const html = layout(body);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Send to all participants (throttled to respect Resend's 2 req/sec limit)
  let sent = 0;
  for (const email of PARTICIPANT_EMAILS) {
    const dbUser = dbUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const name = dbUser?.name || email.split('@')[0];

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `🏁 Australian GP done — here's the podium!`,
        html
      });
      if (error) {
        console.error(`  ✗ ${email}: ${error.message}`);
      } else {
        console.log(`  ✓ ${email} (${name})`);
        sent++;
      }
    } catch (e) {
      console.error(`  ✗ ${email}: ${e.message}`);
    }
    await sleep(600);
  }

  console.log(`\nDone — sent to ${sent}/${PARTICIPANT_EMAILS.length} participants.`);
}

run().catch(e => { console.error(e); process.exit(1); });
