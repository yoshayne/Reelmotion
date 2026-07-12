import * as Brevo from "@getbrevo/brevo";

const APP_URL = process.env.APP_URL ?? "https://reelmotionapp.com";
const ADMIN_EMAIL = "romediastudios@gmail.com";
const FROM_EMAIL = "noreply@reelmotionapp.com";
const FROM_NAME = "ReelMotion";

let _client: Brevo.TransactionalEmailsApi | null = null;

function client(): Brevo.TransactionalEmailsApi {
  if (!_client) {
    const api = new Brevo.TransactionalEmailsApi();
    (api as any).authentications["apiKey"].apiKey = process.env.BREVO_API_KEY ?? "";
    _client = api;
  }
  return _client;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[email] BREVO_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    const msg = new Brevo.SendSmtpEmail();
    msg.sender = { name: FROM_NAME, email: FROM_EMAIL };
    msg.to = [{ email: to }];
    msg.subject = subject;
    msg.htmlContent = html;
    await client().sendTransacEmail(msg);
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body { margin:0; padding:0; background:#000; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; color:#fff; }
  .wrap { max-width:560px; margin:0 auto; padding:40px 24px; }
  .logo { font-size:22px; font-weight:900; letter-spacing:-0.03em; margin-bottom:32px; }
  .logo span { color:#E8001D; }
  .card { background:#111; border:1px solid #222; border-radius:16px; padding:32px; margin-bottom:24px; }
  h1 { font-size:22px; font-weight:900; margin:0 0 8px; }
  p { font-size:15px; line-height:1.6; color:rgba(255,255,255,0.75); margin:0 0 16px; }
  .btn { display:inline-block; background:#E8001D; color:#fff; text-decoration:none; font-weight:800; font-size:14px; letter-spacing:0.05em; padding:14px 28px; border-radius:10px; margin-top:8px; }
  .divider { border:none; border-top:1px solid #222; margin:24px 0; }
  .small { font-size:12px; color:rgba(255,255,255,0.3); line-height:1.5; }
  .badge { display:inline-block; background:rgba(232,0,29,0.15); color:#E8001D; border:1px solid rgba(232,0,29,0.3); border-radius:6px; font-size:12px; font-weight:700; padding:4px 10px; margin-bottom:16px; }
  .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #1a1a1a; font-size:14px; }
  .row .label { color:rgba(255,255,255,0.4); }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">REEL<span>MOTION</span></div>
  ${body}
  <hr class="divider"/>
  <p class="small">© 2026 ReelMotion. All rights reserved.<br/>
  Questions? Reply to this email or visit <a href="${APP_URL}/support" style="color:#E8001D;">reelmotionapp.com/support</a></p>
</div>
</body>
</html>`;
}

// ─── User emails ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const name = firstName || "there";
  await send(to, "Welcome to ReelMotion — Watch The Culture", layout(`
    <div class="card">
      <div class="badge">WELCOME</div>
      <h1>You're in, ${name}.</h1>
      <p>ReelMotion is the home for independent film culture — original stories, emerging filmmakers, and content you won't find anywhere else.</p>
      <p>Your account is ready. Browse free content now, or become a full member to unlock everything.</p>
      <a class="btn" href="${APP_URL}/browse">Start Watching</a>
    </div>
    <div class="card">
      <h1 style="font-size:16px;">Become a Member</h1>
      <p>Get unlimited access to all films, series, and exclusive content for just $2.08/month with an annual plan.</p>
      <a class="btn" href="${APP_URL}/subscribe">Join the Community →</a>
    </div>
  `));
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  firstName: string,
  plan: "monthly" | "yearly",
  amount: string,
  nextBillingDate: string
): Promise<void> {
  const name = firstName || "there";
  const planLabel = plan === "yearly" ? "Annual Membership" : "Monthly Membership";
  await send(to, "You're a ReelMotion Member — Welcome to the Community", layout(`
    <div class="card">
      <div class="badge">MEMBERSHIP CONFIRMED</div>
      <h1>You're officially a member, ${name}.</h1>
      <p>Your ${planLabel} is active. You now have unlimited access to all films, series, and exclusive ReelMotion content.</p>
      <div class="row"><span class="label">Plan</span><span>${planLabel}</span></div>
      <div class="row"><span class="label">Amount</span><span>${amount}</span></div>
      <div class="row"><span class="label">Next billing</span><span>${nextBillingDate}</span></div>
      <br/>
      <a class="btn" href="${APP_URL}/browse">Start Watching</a>
    </div>
    <p class="small">Manage your membership anytime at <a href="${APP_URL}/account" style="color:#E8001D;">Account Settings</a>.</p>
  `));
}

export async function sendPaymentReceiptEmail(
  to: string,
  firstName: string,
  plan: "monthly" | "yearly",
  amount: string,
  nextBillingDate: string
): Promise<void> {
  const name = firstName || "there";
  const planLabel = plan === "yearly" ? "Annual Membership" : "Monthly Membership";
  await send(to, `ReelMotion Payment Receipt — ${amount}`, layout(`
    <div class="card">
      <div class="badge">PAYMENT RECEIVED</div>
      <h1>Payment confirmed, ${name}.</h1>
      <p>Thanks for your continued support of independent film.</p>
      <div class="row"><span class="label">Plan</span><span>${planLabel}</span></div>
      <div class="row"><span class="label">Amount charged</span><span>${amount}</span></div>
      <div class="row"><span class="label">Next billing date</span><span>${nextBillingDate}</span></div>
      <br/>
      <a class="btn" href="${APP_URL}/browse">Keep Watching</a>
    </div>
    <p class="small">To manage your subscription, visit <a href="${APP_URL}/account" style="color:#E8001D;">Account Settings</a>.</p>
  `));
}

export async function sendPaymentFailedEmail(to: string, firstName: string): Promise<void> {
  const name = firstName || "there";
  await send(to, "Action required — ReelMotion payment failed", layout(`
    <div class="card">
      <div class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3);">PAYMENT FAILED</div>
      <h1>We couldn't process your payment, ${name}.</h1>
      <p>Your ReelMotion membership payment didn't go through. Your access may be interrupted if this isn't resolved.</p>
      <p>Please update your payment method to keep your membership active.</p>
      <a class="btn" href="${APP_URL}/account">Update Payment Method</a>
    </div>
    <p class="small">If you believe this is an error, reply to this email and we'll help you out.</p>
  `));
}

export async function sendCancellationEmail(
  to: string,
  firstName: string,
  accessUntil: string
): Promise<void> {
  const name = firstName || "there";
  await send(to, "Your ReelMotion membership has been canceled", layout(`
    <div class="card">
      <h1>Membership canceled, ${name}.</h1>
      <p>Your cancellation has been processed. You'll continue to have full access to ReelMotion until <strong>${accessUntil}</strong>.</p>
      <p>After that date your account will revert to free access. You can rejoin anytime.</p>
      <a class="btn" href="${APP_URL}/subscribe">Rejoin ReelMotion</a>
    </div>
    <p class="small">Changed your mind? You can resubscribe before ${accessUntil} with no interruption.</p>
  `));
}

export async function sendRenewalReminderEmail(
  to: string,
  firstName: string,
  plan: "monthly" | "yearly",
  amount: string,
  renewalDate: string
): Promise<void> {
  const name = firstName || "there";
  const planLabel = plan === "yearly" ? "Annual Membership" : "Monthly Membership";
  await send(to, `Your ReelMotion membership renews in 7 days — ${amount}`, layout(`
    <div class="card">
      <div class="badge">RENEWAL REMINDER</div>
      <h1>Your membership renews soon, ${name}.</h1>
      <p>Just a heads up — your ${planLabel} will automatically renew on <strong>${renewalDate}</strong> for <strong>${amount}</strong>.</p>
      <p>No action needed if you want to continue. You can manage or cancel anytime before then.</p>
      <a class="btn" href="${APP_URL}/account">Manage Membership</a>
    </div>
  `));
}

export async function sendAccessExpiringEmail(to: string, firstName: string, expiryDate: string): Promise<void> {
  const name = firstName || "there";
  await send(to, "Your ReelMotion access ends tomorrow", layout(`
    <div class="card">
      <div class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border-color:rgba(245,158,11,0.3);">ACCESS EXPIRING</div>
      <h1>Don't lose your access, ${name}.</h1>
      <p>Your ReelMotion membership access expires tomorrow on <strong>${expiryDate}</strong>.</p>
      <p>Rejoin now to keep watching — your watch history and account are saved.</p>
      <a class="btn" href="${APP_URL}/subscribe">Renew Membership</a>
    </div>
  `));
}

export async function sendNeverSubscribedNudgeEmail(to: string, firstName: string): Promise<void> {
  const name = firstName || "there";
  await send(to, "Still thinking about joining ReelMotion?", layout(`
    <div class="card">
      <h1>You're missing the culture, ${name}.</h1>
      <p>You signed up for ReelMotion but haven't joined as a member yet. Unlock every film, series, and exclusive drop for just <strong>$2.08/month</strong> with an annual plan.</p>
      <a class="btn" href="${APP_URL}/subscribe">Join the Community</a>
    </div>
    <div class="card">
      <h1 style="font-size:16px;">What you get</h1>
      <div class="row"><span>All films & series</span><span>✓</span></div>
      <div class="row"><span>Early access to new releases</span><span>✓</span></div>
      <div class="row"><span>Filmmaker Q&As & events</span><span>✓</span></div>
      <div class="row"><span>Support independent film culture</span><span>✓</span></div>
    </div>
  `));
}

export async function sendWinBackEmail(to: string, firstName: string): Promise<void> {
  const name = firstName || "there";
  await send(to, "We miss you at ReelMotion", layout(`
    <div class="card">
      <h1>Come back, ${name}.</h1>
      <p>It's been a while since you've been part of the community. A lot of new content has dropped since you left.</p>
      <p>Rejoin as a member and get back to watching independent film culture, filmmaker stories, and exclusive content.</p>
      <a class="btn" href="${APP_URL}/subscribe">Rejoin ReelMotion</a>
    </div>
  `));
}

// ─── Admin notification emails ─────────────────────────────────────────────────

export async function notifyAdminNewUser(userEmail: string, displayName: string | null): Promise<void> {
  await send(ADMIN_EMAIL, `New ReelMotion sign-up: ${userEmail}`, layout(`
    <div class="card">
      <div class="badge">NEW USER</div>
      <h1>New member signed up</h1>
      <div class="row"><span class="label">Email</span><span>${userEmail}</span></div>
      <div class="row"><span class="label">Name</span><span>${displayName || "—"}</span></div>
      <br/>
      <a class="btn" href="${APP_URL}/admin">View in Admin</a>
    </div>
  `));
}

export async function notifyAdminNewSubscription(
  userEmail: string,
  plan: "monthly" | "yearly",
  amount: string
): Promise<void> {
  await send(ADMIN_EMAIL, `New subscriber: ${userEmail} — ${plan} ${amount}`, layout(`
    <div class="card">
      <div class="badge">NEW SUBSCRIBER</div>
      <h1>New subscription purchased</h1>
      <div class="row"><span class="label">Email</span><span>${userEmail}</span></div>
      <div class="row"><span class="label">Plan</span><span>${plan === "yearly" ? "Annual" : "Monthly"} — ${amount}</span></div>
      <br/>
      <a class="btn" href="${APP_URL}/admin">View in Admin</a>
    </div>
  `));
}

export async function notifyAdminPaymentFailed(userEmail: string): Promise<void> {
  await send(ADMIN_EMAIL, `Payment failed: ${userEmail}`, layout(`
    <div class="card">
      <div class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3);">PAYMENT FAILED</div>
      <h1>Member payment failed</h1>
      <div class="row"><span class="label">Email</span><span>${userEmail}</span></div>
      <p>The user has been notified. You may want to follow up manually.</p>
      <a class="btn" href="${APP_URL}/admin">View in Admin</a>
    </div>
  `));
}

export async function notifyAdminCancellation(userEmail: string): Promise<void> {
  await send(ADMIN_EMAIL, `Cancellation: ${userEmail}`, layout(`
    <div class="card">
      <div class="badge">CANCELLATION</div>
      <h1>Membership canceled</h1>
      <div class="row"><span class="label">Email</span><span>${userEmail}</span></div>
      <a class="btn" href="${APP_URL}/admin">View in Admin</a>
    </div>
  `));
}

export async function notifyAdminContestEntry(
  submitterEmail: string,
  submitterName: string
): Promise<void> {
  await send(ADMIN_EMAIL, `New contest entry: ${submitterName}`, layout(`
    <div class="card">
      <div class="badge">CONTEST ENTRY</div>
      <h1>New submission received</h1>
      <div class="row"><span class="label">Name</span><span>${submitterName}</span></div>
      <div class="row"><span class="label">Email</span><span>${submitterEmail}</span></div>
      <br/>
      <a class="btn" href="${APP_URL}/admin">View Submissions</a>
    </div>
  `));
}
