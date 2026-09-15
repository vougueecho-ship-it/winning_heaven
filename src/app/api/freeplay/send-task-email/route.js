import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDb } from '../../../../lib/mongodb';

export async function POST(req) {
  try {
    const { email, name, gameTitle = 'Selected Game' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const taskId = 'FP-' + Math.floor(100000 + Math.random() * 900000).toString();

    // Optional: Log task dispatch in MongoDB for reference
    try {
      const db = await getDb();
      await db.collection('freeplayTasks').insertOne({
        taskId,
        email: cleanEmail,
        gameTitle,
        sentAt: new Date(),
        createdAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('Error logging freeplay task in db:', dbErr);
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || 'verified@winningheaven.com';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '0761071Na@';

    // If no password configured, log in console for development mode
    if (!smtpPass) {
      console.log(`[SMTP DEV MODE] Freeplay task email sent to ${cleanEmail} (Task #${taskId})`);
      return NextResponse.json({
        success: true,
        message: 'Freeplay task email generated! (Dev mode)',
        taskId
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Premium Anti-Spam & Deliverability HTML Email Template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Winning Heaven Freeplay Verification Task</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #04060f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #04060f; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #0e1224 0%, #060919 100%); border: 1.5px solid #ffc800; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
                
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 32px 20px 20px 20px; background: linear-gradient(135deg, #182042 0%, #080b1a 100%); border-bottom: 1px solid rgba(255, 200, 0, 0.25);">
                    <div style="font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase;">
                      WINNING<span style="color: #ffc800;">HEAVEN</span>
                    </div>
                    <div style="font-size: 11px; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; text-transform: uppercase;">
                      VIP Casino & Gaming Lounge
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 30px 25px 25px 25px; text-align: center;">
                    
                    <!-- Gold Pill Badge -->
                    <div style="display: inline-block; background: rgba(255, 200, 0, 0.12); border: 1px solid rgba(255, 200, 0, 0.4); color: #ffc800; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                      🎁 $3 Freeplay Bonus Task • #${taskId}
                    </div>

                    <h2 style="font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 12px 0;">
                      Claim Your Freeplay for ${gameTitle}
                    </h2>

                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 22px 0; text-align: left;">
                      Hello ${name ? `<strong>${name}</strong>` : 'Player'},<br><br>
                      To claim your <strong>$3 Freeplay Bonus Credits</strong> for <strong>${gameTitle}</strong>, please complete this simple 30-second verification task:
                    </p>

                    <!-- Instruction Card -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,200,0,0.25); border-radius: 14px; margin-bottom: 22px; text-align: left;">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffc800; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">1</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              If this email landed in your <strong>Spam / Junk folder</strong>, click <strong style="color: #00ff66;">"Report Not Spam"</strong> or <strong>"Move to Inbox"</strong>.
                            </span>
                          </div>

                          <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffc800; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">2</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              Open your <strong>Primary Inbox</strong> and take a screenshot showing this Winning Heaven email in your Inbox.
                            </span>
                          </div>

                          <div style="display: flex; align-items: flex-start;">
                            <span style="display: inline-block; background: #ffc800; color: #000; font-weight: 900; font-size: 12px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">3</span>
                            <span style="font-size: 13.5px; color: #ffffff; line-height: 1.4;">
                              Return to the <strong>Winning Heaven Lobby</strong>, upload your screenshot in the Freeplay Task window, and submit!
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Privacy Note -->
                    <div style="background: rgba(0, 240, 255, 0.08); border: 1px dashed rgba(0, 240, 255, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 22px; text-align: left;">
                      <p style="font-size: 12px; color: #67e8f9; margin: 0; line-height: 1.5;">
                        🔒 <strong>Privacy Tip:</strong> You may draw lines over or blur out your other personal emails visible in your inbox screenshot.
                      </p>
                    </div>

                    <!-- Task ID Box -->
                    <div style="background: #020308; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; display: inline-block; margin-bottom: 20px;">
                      <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block;">Task Reference ID</span>
                      <strong style="font-size: 18px; color: #ffc800; font-family: monospace; letter-spacing: 2px;">${taskId}</strong>
                    </div>

                    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                      Our 24/7 staff will verify your Inbox screenshot and credit your $3 Freeplay immediately!
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px; background: #03050c; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #64748b; line-height: 1.6;">
                    <p style="margin: 0 0 6px 0; color: #cbd5e1; font-weight: 600;">
                      Winning Heaven • 24/7 Sweepstakes Gaming Lounge
                    </p>
                    <p style="margin: 0;">
                      Sent to ${cleanEmail} from verified@winningheaven.com
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

    // Plain text alternative
    const textTemplate = `
Winning Heaven - $3 Freeplay Bonus Task (Task #${taskId})
=========================================================

Hello ${name || 'Player'},

To claim your $3 Freeplay Bonus for ${gameTitle}, please complete this quick verification task:

1. If this email landed in your Spam/Junk folder, click "Report Not Spam" or "Move to Inbox".
2. Open your Primary Inbox and take a screenshot showing this email inside your Inbox.
3. You can draw lines/mask any personal emails below it.
4. Return to Winning Heaven and upload your screenshot to get your $3 Freeplay approved!

Task Reference: ${taskId}
Official Sender: verified@winningheaven.com
    `;

    // Send Mail
    await transporter.sendMail({
      from: `"Winning Heaven Verified" <${smtpUser}>`,
      to: cleanEmail,
      subject: `Winning Heaven: $3 Freeplay Verification & Inbox Task 🎁 [${taskId}]`,
      text: textTemplate,
      html: htmlTemplate,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Freeplay task email sent to ${cleanEmail}! Please check your Spam / Inbox.`,
      taskId
    });

  } catch (error) {
    console.error('Freeplay Task Email dispatch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification task email. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
