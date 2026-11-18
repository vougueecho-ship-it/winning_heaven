/**
 * Build and resolve live payment links for all admin-configured gateways.
 * Placeholders in redirectUrl: {amount}, {code}, {note}
 */

const GENERIC_TAGS = new Set(['stripe-checkout', 'stripe-pay', 'cashapp-pay', 'paypal-pay', 'venmo-pay', 'none', 'n/a', '']);

export function normalizePayTag(raw) {
  return String(raw || '').trim();
}

export function isGenericPayTag(tag) {
  const t = normalizePayTag(tag).toLowerCase();
  if (!t) return true;
  if (GENERIC_TAGS.has(t)) return true;
  // Auto placeholders saved when admin leaves tag empty (any theme)
  if (/^[a-z0-9_-]+-pay$/.test(t)) return true;
  if (/^[a-z0-9_-]+-checkout$/.test(t)) return true;
  return false;
}

/** Cashtag / handle row on player deposit — only when admin entered a real tag */
export function getPlayerDisplayTag(gateway) {
  const raw = normalizePayTag(
    gateway?.accountNumber ||
      gateway?.recipientTag ||
      gateway?.tag ||
      gateway?.handle ||
      gateway?.accountName ||
      ''
  );
  if (!raw || isGenericPayTag(raw)) return '';
  return raw;
}

/** Admin save: template URL with {amount} / {code} when redirect is empty */
export function buildGatewayRedirectTemplate(theme, tag) {
  const themeKey = String(theme || '').toLowerCase().trim();
  const raw = normalizePayTag(tag);
  if (!raw || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.startsWith('http') ? raw : '';
  }
  if (isGenericPayTag(raw)) return '';

  if (themeKey === 'cashapp') {
    const clean = raw.replace(/^\$/, '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!clean) return '';
    return `https://cash.app/$${clean}/{amount}`;
  }

  if (themeKey === 'paypal') {
    let user = raw.replace(/^\$/, '').trim();
    if (user.includes('@')) {
      user = user.split('@')[0];
    }
    user = user.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!user) return '';
    return `https://www.paypal.com/paypalme/${user}/{amount}`;
  }

  if (themeKey === 'venmo') {
    let user = raw.replace(/^@/, '').trim();
    user = user.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!user) return '';
    return `https://venmo.com/?txn=pay&audience=private&recipients=${encodeURIComponent(user)}&amount={amount}&note={code}`;
  }

  if (themeKey === 'stripe') {
    return '';
  }

  return '';
}

export function isHttpPayUrl(url) {
  const u = normalizePayTag(url);
  return u.startsWith('http://') || u.startsWith('https://');
}

/** Built-in auto templates where {amount} in the URL is intentional */
export function isBuiltinAmountTemplate(url) {
  const u = String(url || '').toLowerCase();
  return (
    u.includes('cash.app/$') ||
    u.includes('paypal.com/paypalme/') ||
    (u.includes('venmo.com/') && u.includes('amount={amount}'))
  );
}

export function hasPayUrlPlaceholders(url) {
  return /\{amount\}|\{code\}|\{note\}/i.test(String(url || ''));
}

/** Custom partner URLs (cashtap, Stripe checkout, etc.) — open as configured, no path amount injection */
export function finalizeCustomPayRedirect(url, { noteCode = '' } = {}) {
  let out = normalizePayTag(url);
  if (!out) return '';

  out = out
    .replace(/\{amount\}/gi, '')
    .replace(/\{code\}/gi, encodeURIComponent(String(noteCode || '')))
    .replace(/\{note\}/gi, encodeURIComponent(String(noteCode || '')));

  // Clean accidental double slashes after stripping {amount} (keep https://)
  out = out.replace(/([^:]\/)\/+/g, '$1');
  return out;
}

export function applyPayUrlPlaceholders(url, { amount = '', noteCode = '' } = {}) {
  if (!url) return '';
  const amt = amount === '' || amount === null || amount === undefined
    ? ''
    : encodeURIComponent(String(parseFloat(amount) || amount));
  const note = encodeURIComponent(String(noteCode || ''));
  return String(url)
    .replace(/\{amount\}/gi, amt)
    .replace(/\{code\}/gi, note)
    .replace(/\{note\}/gi, note);
}

export function resolveGatewayPayUrl(gateway, { amount = '', noteCode = '' } = {}) {
  if (!gateway) return '';

  const rawTag = normalizePayTag(
    gateway.accountNumber ||
      gateway.recipientTag ||
      gateway.tag ||
      gateway.handle ||
      gateway.accountName ||
      ''
  );

  let payUrl = normalizePayTag(gateway.redirectUrl || gateway.payUrl || gateway.link || '');

  if (!payUrl && isHttpPayUrl(rawTag)) {
    payUrl = rawTag;
  }

  // Custom full URL: never append Cash App amount paths; strip stray {amount} from old saves
  if (payUrl && isHttpPayUrl(payUrl) && !isBuiltinAmountTemplate(payUrl)) {
    if (!hasPayUrlPlaceholders(payUrl)) {
      return payUrl;
    }
    return finalizeCustomPayRedirect(payUrl, { noteCode });
  }

  const themeLower = String(gateway.theme || '').toLowerCase();
  const nameLower = String(gateway.name || '').toLowerCase();

  if (!payUrl && !isGenericPayTag(rawTag)) {
    const template = buildGatewayRedirectTemplate(themeLower, rawTag);
    if (template) {
      payUrl = applyPayUrlPlaceholders(template, { amount, noteCode });
    }
  }

  if (!payUrl) {
    const isCashApp =
      themeLower === 'cashapp' || nameLower.includes('cash app') || nameLower.includes('cashapp');
    if (isCashApp && rawTag && !isGenericPayTag(rawTag)) {
      const cleanCashtag = rawTag.replace(/^\$/, '').replace(/[^a-zA-Z0-9_-]/g, '');
      if (cleanCashtag) {
        const amtNum = parseFloat(amount || 0).toFixed(2);
        payUrl = `https://cash.app/$${cleanCashtag}/${amtNum}`;
      }
    }
  }

  if (payUrl && hasPayUrlPlaceholders(payUrl)) {
    payUrl = applyPayUrlPlaceholders(payUrl, { amount, noteCode });
  }

  return payUrl;
}

export function gatewaySupportsLivePayLink(gateway) {
  if (!gateway) return false;
  const tag = normalizePayTag(gateway.tag);
  if (gateway.redirectUrl || gateway.payUrl || gateway.link) return true;
  if (tag.startsWith('http://') || tag.startsWith('https://')) return true;
  if (!isGenericPayTag(tag) && buildGatewayRedirectTemplate(gateway.theme, tag)) return true;
  return false;
}

export function getGatewayPayButtonStyle(gateway) {
  const theme = String(gateway?.theme || '').toLowerCase();
  const name = String(gateway?.name || '').toLowerCase();

  if (theme === 'stripe' || name.includes('stripe')) {
    return {
      border: '1.5px solid #635bff',
      background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(99, 91, 255, 0.45)',
      icon: 'fa-brands fa-stripe'
    };
  }
  if (theme === 'cashapp' || name.includes('cash app') || name.includes('cashapp')) {
    return {
      border: '1.5px solid #00d632',
      background: 'linear-gradient(135deg, #00d632 0%, #009922 100%)',
      color: '#000000',
      shadow: '0 0 25px rgba(0, 214, 50, 0.45)',
      icon: 'fa-solid fa-dollar-sign'
    };
  }
  if (theme === 'paypal' || name.includes('paypal')) {
    return {
      border: '1.5px solid #0079c1',
      background: 'linear-gradient(135deg, #0079c1 0%, #00457c 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(0, 121, 193, 0.45)',
      icon: 'fa-brands fa-paypal'
    };
  }
  if (theme === 'venmo' || name.includes('venmo')) {
    return {
      border: '1.5px solid #008cff',
      background: 'linear-gradient(135deg, #008cff 0%, #0066cc 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(0, 140, 255, 0.45)',
      icon: 'fa-brands fa-cc-venmo'
    };
  }
  if (theme === 'zelle' || name.includes('zelle')) {
    return {
      border: '1.5px solid #7413dc',
      background: 'linear-gradient(135deg, #7413dc 0%, #5a0fb0 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(116, 19, 220, 0.45)',
      icon: 'fa-solid fa-bolt'
    };
  }
  if (theme === 'chime' || name.includes('chime')) {
    return {
      border: '1.5px solid #2ecc71',
      background: 'linear-gradient(135deg, #2ecc71 0%, #1e9e57 100%)',
      color: '#000000',
      shadow: '0 0 25px rgba(46, 204, 113, 0.45)',
      icon: 'fa-solid fa-building-columns'
    };
  }
  if (theme === 'crypto' || name.includes('crypto') || name.includes('usdt')) {
    return {
      border: '1.5px solid #a855f7',
      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(168, 85, 247, 0.45)',
      icon: 'fa-brands fa-bitcoin'
    };
  }
  if (theme === 'applepay' || name.includes('apple pay')) {
    return {
      border: '1.5px solid #ffffff',
      background: 'linear-gradient(135deg, #1c1c1e 0%, #000000 100%)',
      color: '#ffffff',
      shadow: '0 0 25px rgba(255, 255, 255, 0.2)',
      icon: 'fa-brands fa-apple-pay'
    };
  }
  if (theme === 'googlepay' || name.includes('google pay')) {
    return {
      border: '1.5px solid #4285f4',
      background: 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)',
      color: '#1f1f1f',
      shadow: '0 0 25px rgba(66, 133, 244, 0.35)',
      icon: 'fa-brands fa-google-pay'
    };
  }

  return {
    border: '1.5px solid var(--gold-primary)',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
    color: '#000000',
    shadow: '0 0 25px rgba(255, 200, 0, 0.45)',
    icon: 'fa-solid fa-arrow-up-right-from-square'
  };
}