import nodemailer from 'nodemailer';
import { cache } from './cache';

const transporterCache = new Map();

function hqConfig() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || 'verified@winningheaven.com';
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://winningheaven.com').replace(/\/$/, '');
  return {
    source: 'hq',
    enabled: Boolean(smtpPass),
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    fromName: 'Winning Heaven',
    replyTo: smtpUser,
    brandName: 'Winning Heaven',
    siteUrl
  };
}

function createTransport(cfg) {
  const port = Number(cfg.smtpPort || 465);
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port,
    secure: port === 465,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass
    },
    tls: { rejectUnauthorized: false }
  });
}

export function clearDistributorMailCache(distributorId) {
  if (distributorId) transporterCache.delete(distributorId);
  cache.del(`dist_email_cfg_${distributorId}`);
}

export function publicEmailSettings(emailSettings = {}) {
  const es = { ...emailSettings };
  delete es.smtpPass;
  return {
    ...es,
    hasPassword: Boolean(emailSettings?.smtpPass)
  };
}

export async function resolveDistributorId(db, { distributorId, userEmail }) {
  const explicit = String(distributorId || '').trim();
  if (explicit) return explicit;
  const email = String(userEmail || '').toLowerCase().trim();
  if (!email) return '';
  const user = await db.collection('users').findOne({ email }, { projection: { distributorId: 1 } });
  return user?.distributorId || '';
}

async function loadDistributorEmailSettings(db, distributorId) {
  const cacheKey = `dist_email_cfg_${distributorId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const doc = await db.collection('distributors').findOne(
    { id: distributorId },
    { projection: { name: 1, emailSettings: 1 } }
  );
  const payload = {
    name: doc?.name || '',
    emailSettings: doc?.emailSettings || null
  };
  cache.set(cacheKey, payload, 60);
  return payload;
}

function isSmtpComplete(es) {
  return Boolean(es?.smtpHost && es?.smtpUser && es?.smtpPass);
}

/**
 * Resolves SMTP + branding for a player email.
 * Distributor players always use the distributor mailbox — never HQ.
 */
export async function resolveMailContext(db, { distributorId, userEmail } = {}) {
  const distId = await resolveDistributorId(db, { distributorId, userEmail });
  if (!distId) {
    const hq = hqConfig();
    return {
      ...hq,
      distributorId: '',
      transporter: hq.enabled ? createTransport(hq) : null,
      fromHeader: `"${hq.fromName}" <${hq.smtpUser}>`
    };
  }

  const { name, emailSettings } = await loadDistributorEmailSettings(db, distId);
  const es = emailSettings || {};
  const siteUrl = String(es.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://winningheaven.com').replace(/\/$/, '');

  if (!isSmtpComplete(es)) {
    const err = new Error(
      'Distributor SMTP is not configured. Open Email & SMTP in your distributor panel and save host, username, and app password.'
    );
    err.code = 'DIST_SMTP_INCOMPLETE';
    throw err;
  }

  const cfg = {
    source: 'distributor',
    distributorId: distId,
    smtpHost: es.smtpHost,
    smtpPort: Number(es.smtpPort || 465),
    smtpUser: es.smtpUser,
    smtpPass: es.smtpPass,
    fromName: (es.fromName || name || 'Player Support').trim(),
    replyTo: (es.replyTo || es.smtpUser).trim(),
    brandName: (es.brandName || es.fromName || name || 'Gaming Lounge').trim(),
    siteUrl,
    tagline: es.tagline || ''
  };
  let transporter = transporterCache.get(distId);
  if (!transporter) {
    transporter = createTransport(cfg);
    transporterCache.set(distId, transporter);
  }
  return {
    ...cfg,
    transporter,
    fromHeader: `"${cfg.fromName}" <${cfg.smtpUser}>`
  };
}

export async function sendResolvedMail(ctx, mailOptions) {
  if (!ctx?.transporter) {
    console.log('[distributorMail] Dev/simulator — email not sent:', mailOptions?.subject);
    return { simulated: true };
  }
  const options = {
    ...mailOptions,
    from: mailOptions.from || ctx.fromHeader,
    replyTo: mailOptions.replyTo || ctx.replyTo || ctx.smtpUser
  };
  return ctx.transporter.sendMail(options);
}

export function buildOtpEmailHtml({ otp, name, brandName = 'Winning Heaven', siteUrl = 'https://winningheaven.com', tagline = '' }) {
  const safeBrand = brandName || 'Winning Heaven';
  const footerLine = tagline || 'Fast payouts • 24/7 support';
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeBrand} Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #04060f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #04060f; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: linear-gradient(180deg, #0e1224 0%, #060919 100%); border: 1.5px solid #ffc800; border-radius: 20px; overflow: hidden;">
                <tr>
                  <td align="center" style="padding: 35px 20px 20px 20px;">
                    <div style="font-size: 22px; font-weight: 900; color: #ffc800; text-transform: uppercase;">${safeBrand}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px 25px 30px; text-align: center;">
                    <p style="font-size: 14px; color: #cbd5e1;">Hello ${name ? `<strong>${name}</strong>` : 'Player'}, your verification code:</p>
                    <div style="font-family: monospace; font-size: 36px; font-weight: 900; color: #ffd700; letter-spacing: 8px;">${otp}</div>
                    <p style="font-size: 12px; color: #94a3b8;">Valid 10 minutes.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 16px; font-size: 11px; color: #64748b;">
                    © ${new Date().getFullYear()} ${safeBrand} · ${footerLine}<br/>
                    <a href="${siteUrl}" style="color:#94a3b8;">${siteUrl}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

export async function verifyDistributorSmtpSettings(settings) {
  const port = Number(settings.smtpPort || 465);
  const transport = nodemailer.createTransport({
    host: settings.smtpHost,
    port,
    secure: port === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
    tls: { rejectUnauthorized: false }
  });
  await transport.verify();
  return true;
}