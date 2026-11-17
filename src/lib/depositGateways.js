/**
 * Player deposit list: visible gateways + optional teaser cards (Cash App, Apple Pay, Google Pay).
 */

const THEME_LABELS = {
  cashapp: 'Cash App',
  applepay: 'Apple Pay',
  googlepay: 'Google Pay',
  chime: 'Chime',
  stripe: 'Stripe',
  paypal: 'PayPal',
  venmo: 'Venmo',
  zelle: 'Zelle',
  crypto: 'Crypto'
};

export function paymentMethodDisplayName(theme) {
  return THEME_LABELS[String(theme || '').toLowerCase()] || 'Payment Method';
}

function gatewayIsActiveDeposit(g) {
  if (!g || g.depositMode === 'support_request') return false;
  if (g.isTeaser) return false;
  return true;
}

function hasActiveThemeGateway(dbGateways, theme) {
  return (dbGateways || []).some(
    (g) =>
      String(g.theme || '').toLowerCase() === theme &&
      g.isVisibleOnDeposit !== false &&
      gatewayIsActiveDeposit(g)
  );
}

/**
 * @param {object[]} dbGateways - raw from /api/gateways
 * @param {object} frontendSettings
 */
export function mergeDepositGatewaysForPlayer(dbGateways, frontendSettings = {}) {
  const list = [];
  const themesInList = new Set();

  for (const g of dbGateways || []) {
    if (g.isVisibleOnDeposit === false) continue;
    const depositMode = g.depositMode === 'support_request' ? 'support_request' : 'active';
    list.push({ ...g, depositMode });
    themesInList.add(String(g.theme || '').toLowerCase());
  }

  const teaserThemes = [
    {
      theme: 'cashapp',
      show: frontendSettings.cashappActive !== false
    },
    {
      theme: 'applepay',
      show: frontendSettings.applePayTeaser === true
    },
    {
      theme: 'googlepay',
      show: frontendSettings.googlePayTeaser === true
    }
  ];

  for (const { theme, show } of teaserThemes) {
    if (!show) continue;
    if (themesInList.has(theme)) continue;
    if (hasActiveThemeGateway(dbGateways, theme)) continue;

    list.push({
      id: `teaser-${theme}`,
      name: paymentMethodDisplayName(theme),
      subtitle: 'Request active payment details from VIP Support',
      theme,
      tag: `${theme}-pay`,
      depositMode: 'support_request',
      isTeaser: true,
      qrImage: '',
      redirectUrl: '',
      isVisibleOnDeposit: true
    });
    themesInList.add(theme);
  }

  return list;
}

export function isSupportRequestGateway(g) {
  if (!g) return false;
  return g.depositMode === 'support_request' || Boolean(g.isTeaser);
}