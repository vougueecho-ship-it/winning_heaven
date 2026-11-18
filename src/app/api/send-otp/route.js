import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { buildOtpEmailHtml, resolveMailContext, sendResolvedMail } from '../../../lib/distributorMail';

export async function POST(req) {
  try {
    const { email, name, purpose = 'register', deviceId, distributorId = '' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanDeviceId = deviceId ? String(deviceId).trim() : '';
    const db = await getDb();
    const usersCollection = db.collection('users');

    // If registering, check if email is already taken or device is already registered
    if (purpose === 'register') {
      const existing = await usersCollection.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists. Please sign in.' },
          { status: 400 }
        );
      }

      const settings = await db.collection('settings').findOne({ id: 'global_settings' });
      const enforceDeviceLimit = settings?.enforceDeviceLimit !== false; // Default true
      if (enforceDeviceLimit) {
        const clientIp = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
        const deviceOrIpFilter = [
          cleanDeviceId ? { deviceId: cleanDeviceId } : null,
          clientIp ? { registrationIp: clientIp } : null
        ].filter(Boolean);

        if (deviceOrIpFilter.length > 0) {
          const existingDevice = await usersCollection.findOne({
            $or: deviceOrIpFilter,
            email: { $ne: cleanEmail },
            role: 'user'
          });
          if (existingDevice) {
            return NextResponse.json(
              { success: false, message: 'Strict Device Lock: Only 1 account is allowed per device. An account is already registered on this device.' },
              { status: 400 }
            );
          }
        }
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

    let mailCtx;
    try {
      mailCtx = await resolveMailContext(db, {
        distributorId: String(distributorId || '').trim(),
        userEmail: cleanEmail
      });
    } catch (ctxErr) {
      return NextResponse.json({
        success: false,
        message: ctxErr.message || 'Email delivery is not configured for this portal. Contact your operator.'
      }, { status: 503 });
    }

    if (!mailCtx.transporter) {
      console.log(`[SMTP DEV MODE] Verification code for ${cleanEmail}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'Verification code generated! (Dev mode)'
      });
    }

    const brand = mailCtx.brandName || mailCtx.fromName || 'Winning Heaven';
    const siteUrl = mailCtx.siteUrl || 'https://winningheaven.com';
    const useHtml = buildOtpEmailHtml({
      otp,
      name,
      brandName: brand,
      siteUrl,
      tagline: mailCtx.tagline
    });
    const textTemplate = `Hello ${name || 'Player'},\n\nYour ${brand} verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nThank you,\n${brand}\n${siteUrl}`;

    const mailOptions = {
      to: cleanEmail,
      subject: `${otp} is your ${brand} verification code`,
      text: textTemplate,
      html: useHtml,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        Importance: 'High',
        'List-Unsubscribe': `<mailto:${mailCtx.replyTo || mailCtx.smtpUser}?subject=unsubscribe>`
      }
    };

    await sendResolvedMail(mailCtx, mailOptions);

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
