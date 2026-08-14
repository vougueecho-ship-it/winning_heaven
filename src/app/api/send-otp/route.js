import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDb } from '../../../lib/mongodb';

export async function POST(req) {
  try {
    const { email, name, purpose = 'register' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const usersCollection = db.collection('users');

    // If registering, check if email is already taken
    if (purpose === 'register') {
      const existing = await usersCollection.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists. Please sign in.' },
          { status: 400 }
        );
      }
    }

    // Generate secure 6-digit numerical OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in MongoDB emailOtps collection with 10-minute expiry
    const otpsCollection = db.collection('emailOtps');
    await otpsCollection.deleteMany({ email: cleanEmail });
    await otpsCollection.insertOne({
      email: cleanEmail,
      otp,
      purpose,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || 'verified@winningheaven.com';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '0761071Na@';

    // If no password configured, log code in console for development safety
    if (!smtpPass) {
      console.log(`[SMTP DEV MODE] Verification code for ${cleanEmail}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'Verification code generated! (Dev mode)'
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465 SSL, false for 587 TLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Premium Anti-Spam HTML Email Template for Inbox Delivery
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Winning Heaven Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #04060f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #04060f; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: linear-gradient(180deg, #0e1224 0%, #060919 100%); border: 1.5px solid #ffc800; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 35px 20px 20px 20px; background: linear-gradient(135deg, #182042 0%, #080b1a 100%); border-bottom: 1px solid rgba(255, 200, 0, 0.25);">
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
                  <td style="padding: 35px 30px 25px 30px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255, 200, 0, 0.1); border: 1px solid rgba(255, 200, 0, 0.3); color: #ffc800; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
                      Email Verification Code
                    </div>

                    <h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0;">
                      Verify Your Account
                    </h2>

                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 25px 0;">
                      Hello ${name ? `<strong>${name}</strong>` : 'Player'},<br>
                      Use the 6-digit verification code below to complete your Winning Heaven registration.
                    </p>

                    <!-- Big OTP Code Box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                      <tr>
                        <td align="center">
                          <div style="background: #03050c; border: 2px dashed #ffc800; border-radius: 14px; padding: 18px 25px; display: inline-block; box-shadow: 0 0 25px rgba(255, 200, 0, 0.15);">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffd700; display: block; margin-left: 8px;">
                              ${otp}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">
                      ⏱ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
                    </p>
                  </td>
                </tr>

                <!-- Security Notice -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 15px; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
                      If you did not request this verification code, please ignore this email. Your account remains secure.
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px; background: #020308; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #475569; line-height: 1.5;">
                    © 2026 WinningHeaven.com. All rights reserved.<br>
                    Fast Payouts • 24/7 Operations • Licensed VIP Gaming
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text fallback (essential for spam filter inbox scoring)
    const textTemplate = `Hello ${name || 'Player'},\n\nYour Winning Heaven verification code is: ${otp}\n\nThis code is valid for 10 minutes.\nPlease enter this code to complete your registration.\n\nThank you,\nWinning Heaven Team\nhttps://winningheaven.com`;

    const mailOptions = {
      from: `"Winning Heaven" <${smtpUser}>`,
      to: cleanEmail,
      replyTo: smtpUser,
      subject: `${otp} is your Winning Heaven verification code`,
      text: textTemplate,
      html: htmlTemplate,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`
      }
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email inbox!'
    });
  } catch (error) {
    console.error('SMTP Email dispatch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send verification email. Please check your email address or try again.'
    }, { status: 500 });
  }
}
