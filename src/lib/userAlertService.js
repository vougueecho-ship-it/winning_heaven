import nodemailer from 'nodemailer';
import { sendUserPush } from './pushNotifications';
import { publishAdminEvent } from './adminEvents';

let cachedTransporter = null;

function getMailTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || 'verified@winningheaven.com';
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '0761071Na@';

  if (!smtpPass) {
    console.warn('[userAlertService] No SMTP password configured.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return cachedTransporter;
}

/**
 * Builds a mobile-responsive, anti-spam HTML email matching Winning Heaven luxury gold styling.
 */
function buildAlertEmailHtml({
  title,
  badgeText,
  badgeColor = '#10b981', // default emerald
  badgeBg = 'rgba(16, 185, 129, 0.15)',
  userName,
  message,
  details = [],
  credentials = null,
  actionButton = null,
  siteUrl = 'https://winningheaven.com'
}) {
  const safeTitle = title || 'Account Notification';
  const safeBadge = badgeText || title || 'NOTIFICATION';
  const safeName = userName || 'Player';
  const btn = actionButton || { text: 'OPEN WINNING HEAVEN', url: `${siteUrl}/lobby` };
  const targetUrl = btn.url.startsWith('http') ? btn.url : `${siteUrl}${btn.url.startsWith('/') ? '' : '/'}${btn.url}`;

  let detailsRows = '';
  if (Array.isArray(details) && details.length > 0) {
    detailsRows = details
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 14px; color: #94a3b8; font-size: 13px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.06);">
            ${item.label || ''}
          </td>
          <td align="right" style="padding: 10px 14px; color: #ffffff; font-size: 13px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.06);">
            ${item.value || ''}
          </td>
        </tr>
      `
      )
      .join('');
  }

  let credentialsCard = '';
  if (credentials && (credentials.username || credentials.password)) {
    credentialsCard = `
      <div style="margin: 22px 0; background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%); border: 1.5px dashed #fbbf24; border-radius: 14px; padding: 18px 20px; text-align: left;">
        <div style="color: #fbbf24; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px;">
          🎮 Game Credentials Ready ${credentials.gameTitle ? `— ${credentials.gameTitle}` : ''}
        </div>
        ${
          credentials.username
            ? `
          <div style="margin-bottom: 8px;">
            <span style="color: #94a3b8; font-size: 12px; font-weight: 600; display: inline-block; width: 85px;">Username:</span>
            <span style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 800; color: #ffffff; background: #03050c; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">${credentials.username}</span>
          </div>
        `
            : ''
        }
        ${
          credentials.password
            ? `
          <div>
            <span style="color: #94a3b8; font-size: 12px; font-weight: 600; display: inline-block; width: 85px;">Password:</span>
            <span style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 800; color: #fbbf24; background: #03050c; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(251,191,36,0.3);">${credentials.password}</span>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #04060f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #04060f; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #0e1224 0%, #060919 100%); border: 1.5px solid rgba(251, 191, 36, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 30px 20px 20px 20px; background: linear-gradient(135deg, #182042 0%, #080b1a 100%); border-bottom: 1px solid rgba(251, 191, 36, 0.25);">
                  <div style="font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase;">
                    WINNING<span style="color: #fbbf24;">HEAVEN</span>
                  </div>
                  <div style="font-size: 11px; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; text-transform: uppercase;">
                    VIP Sweepstakes Casino & Gaming Lounge
                  </div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 30px 28px 25px 28px; text-align: center;">
                  
                  <!-- Badge -->
                  <div style="display: inline-block; background: ${badgeBg}; border: 1px solid ${badgeColor}; color: ${badgeColor}; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
                    ${safeBadge}
                  </div>

                  <h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 14px 0;">
                    ${safeTitle}
                  </h2>

                  <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0; text-align: left;">
                    Hello <strong>${safeName}</strong>,<br>
                    ${message}
                  </p>

                  ${credentialsCard}

                  ${
                    detailsRows
                      ? `
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; background: rgba(3, 5, 12, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden;">
                      ${detailsRows}
                    </table>
                  `
                      : ''
                  }

                  <!-- CTA Button -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0 10px 0;">
                    <tr>
                      <td align="center">
                        <a href="${targetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #04050b; font-size: 14px; font-weight: 900; text-decoration: none; padding: 14px 34px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.45);">
                          ${btn.text} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #03050c; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                  <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin: 0 0 8px 0;">
                    Winning Heaven VIP Support is active 24/7. Need assistance? Reply to our live chat in the lobby.
                  </p>
                  <p style="font-size: 10px; color: #475569; margin: 0;">
                    &copy; ${new Date().getFullYear()} Winning Heaven. All rights reserved. Instant 24/7 Redemptions.
                  </p>
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

/**
 * Universal User Notification & Alert Service:
 * 1. Persistent DB record (`userNotifications`)
 * 2. Mobile Native APK Push (Capacitor FCM / APNs)
 * 3. Chrome / Desktop / Safari Web Push (VAPID)
 * 4. Transactional HTML Email (Hostinger SMTP)
 * 5. Realtime SSE / Live Alert Broadcast
 */
export async function notifyUser(
  db,
  {
    userEmail,
    title,
    message,
    type = 'general',
    url = '/lobby',
    details = [],
    credentials = null,
    badgeText = null,
    badgeColor = null,
    badgeBg = null,
    emailSubject = null,
    actionButton = null,
    metadata = {}
  } = {}
) {
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: 'User email is required.' };
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://winningheaven.com'
  ).replace(/\/$/, '');

  const resolvedUrl = url || '/lobby';
  const notificationId = (Date.now() + Math.floor(Math.random() * 1000)).toString();
  const now = new Date().toISOString();

  // Determine badge styling based on type
  let safeBadge = badgeText || title;
  let safeBadgeColor = badgeColor || '#10b981';
  let safeBadgeBg = badgeBg || 'rgba(16, 185, 129, 0.15)';

  if (/reject|decline|fail/i.test(type)) {
    safeBadgeColor = '#ef4444';
    safeBadgeBg = 'rgba(239, 68, 68, 0.15)';
  } else if (/hold|wait|pending/i.test(type)) {
    safeBadgeColor = '#f59e0b';
    safeBadgeBg = 'rgba(245, 158, 11, 0.15)';
  } else if (/cred|account|ready/i.test(type)) {
    safeBadgeColor = '#38bdf8';
    safeBadgeBg = 'rgba(56, 189, 248, 0.15)';
  }

  // 1. Store persistent alert in MongoDB
  const notificationDoc = {
    id: notificationId,
    userEmail: cleanEmail,
    title,
    message,
    type,
    url: resolvedUrl,
    details: Array.isArray(details) ? details : [],
    credentials: credentials || null,
    badgeText: safeBadge,
    badgeColor: safeBadgeColor,
    read: false,
    shownToast: false,
    createdAt: now,
    metadata: metadata || {}
  };

  try {
    await db.collection('userNotifications').insertOne(notificationDoc);
  } catch (err) {
    console.error('[userAlertService] Failed to insert userNotification:', err);
  }

  // 2. Send Push Notification (Native APK + Chrome Web Push)
  try {
    await sendUserPush(db, {
      userEmail: cleanEmail,
      title,
      body: message,
      url: resolvedUrl,
      tag: `${type}-${notificationId}`,
      soundUrl: '/api/settings/audio',
      data: {
        id: notificationId,
        type,
        url: resolvedUrl
      }
    });
  } catch (pushErr) {
    console.error('[userAlertService] Push send error:', pushErr?.message || pushErr);
  }

  // 3. Send Email Notification via SMTP
  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const userDoc = await db
        .collection('users')
        .findOne({ email: cleanEmail }, { projection: { name: 1 } });
      const userName = userDoc?.name || 'Player';

      const emailHtml = buildAlertEmailHtml({
        title,
        badgeText: safeBadge,
        badgeColor: safeBadgeColor,
        badgeBg: safeBadgeBg,
        userName,
        message,
        details,
        credentials,
        actionButton,
        siteUrl
      });

      const smtpUser = process.env.SMTP_USER || 'verified@winningheaven.com';
      await transporter.sendMail({
        from: `"Winning Heaven VIP" <${smtpUser}>`,
        to: cleanEmail,
        subject: emailSubject || `${title} | Winning Heaven VIP`,
        html: emailHtml
      });
    }
  } catch (mailErr) {
    console.error('[userAlertService] Email delivery error:', mailErr?.message || mailErr);
  }

  // 4. Publish Realtime Event for open browser tabs
  try {
    publishAdminEvent('user-alert', {
      id: notificationId,
      userEmail: cleanEmail,
      title,
      message,
      type,
      url: resolvedUrl
    });
  } catch (pubErr) {
    console.warn('[userAlertService] Event publish error:', pubErr?.message || pubErr);
  }

  return { success: true, notificationId };
}

/**
 * Fire-and-forget non-blocking wrapper:
 * Allows admin API endpoints to return immediately without waiting for SMTP/FCM delivery.
 */
export function notifyUserAsync(db, alertData) {
  Promise.resolve()
    .then(() => notifyUser(db, alertData))
    .catch((err) => console.error('[notifyUserAsync] Uncaught error:', err));
}
