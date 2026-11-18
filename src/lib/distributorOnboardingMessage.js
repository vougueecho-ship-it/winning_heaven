/**
 * URLs + WhatsApp-ready onboarding copy for distributor partners.
 */
export function resolveSiteBase() {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return fromEnv || window.location.origin;
  }
  return fromEnv || 'https://winningheaven.com';
}

export function buildDistributorPortalUrl(base = resolveSiteBase()) {
  const root = String(base || resolveSiteBase()).replace(/\/$/, '');
  return `${root}/distributor`;
}

export function buildPlayerSignupUrl(distributorId, base = resolveSiteBase()) {
  const root = String(base || resolveSiteBase()).replace(/\/$/, '');
  const url = new URL(`${root}/`);
  url.searchParams.set('dist', String(distributorId || '').trim());
  return url.toString();
}

export function buildDistributorWhatsAppMessage({
  name = 'Partner',
  email = '',
  password = '',
  distributorId = '',
  type = 'A',
  portalUrl = '',
  playerUrl = ''
}) {
  const portal = portalUrl || buildDistributorPortalUrl();
  const players = playerUrl || buildPlayerSignupUrl(distributorId);
  const typeLabel = type === 'B' ? 'Type B (Independent Website)' : 'Type A (Standard Network)';

  const passwordBlock = password
    ? `Password: ${password}`
    : 'Password: Use the password provided by HQ (or reset with Super Admin).';

  return [
    '🎰 *Winning Heaven — Distributor Partner Access*',
    '',
    `Hello *${name}*,`,
    '',
    'Welcome to the Winning Heaven partner program. Your operations portal is live — use it to manage players, deposits, support, and commissions under your network.',
    '',
    `📋 *Partner type:* ${typeLabel}`,
    `🆔 *Partner ID:* ${distributorId}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '🔐 *DISTRIBUTOR LOGIN (your admin panel)*',
    `🔗 ${portal}`,
    `📧 Email: ${email}`,
    `🔑 ${passwordBlock}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '👥 *PLAYER SIGNUP LINK (share with customers)*',
    'New players who register from this link stay under your panel:',
    `🔗 ${players}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '✅ *Quick start*',
    '1. Log in to your distributor portal',
    '2. Copy the player link from Overview → share on WhatsApp / social',
    '3. Process player requests, coins, and support in real time',
    '',
    'Please change your password after first login if HQ issued a temporary one.',
    '',
    '_Winning Heaven HQ · Partner Success Team_'
  ].join('\n');
}