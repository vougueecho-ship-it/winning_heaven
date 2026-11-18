import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import {
  clearDistributorMailCache,
  publicEmailSettings,
  verifyDistributorSmtpSettings,
  resolveMailContext,
  sendResolvedMail
} from '../../../../lib/distributorMail';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const distributorId = searchParams.get('distributorId');
    if (!distributorId) {
      return NextResponse.json({ success: false, message: 'distributorId is required.' }, { status: 400 });
    }

    const db = await getDb();
    const dist = await db.collection('distributors').findOne({ id: distributorId }, { projection: { emailSettings: 1, name: 1 } });
    if (!dist) {
      return NextResponse.json({ success: false, message: 'Distributor not found.' }, { status: 404 });
    }

    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://winningheaven.com').replace(/\/$/, '');
    return NextResponse.json({
      success: true,
      emailSettings: publicEmailSettings(dist.emailSettings || {}),
      distributorName: dist.name || '',
      signupLink: `${siteBase}/?distributor=${encodeURIComponent(distributorId)}`
    });
  } catch (err) {
    console.error('GET distributor email-settings:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { distributorId, emailSettings } = body || {};
    if (!distributorId || !emailSettings) {
      return NextResponse.json({ success: false, message: 'distributorId and emailSettings are required.' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('distributors').findOne({ id: distributorId });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Distributor not found.' }, { status: 404 });
    }

    const prev = existing.emailSettings || {};
    const nextPass =
      emailSettings.smtpPass && String(emailSettings.smtpPass).trim() && emailSettings.smtpPass !== '********'
        ? String(emailSettings.smtpPass).trim()
        : prev.smtpPass || '';

    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://winningheaven.com').replace(/\/$/, '');
    const defaultPlayerLink = `${siteBase}/?distributor=${encodeURIComponent(distributorId)}`;
    const smtpUserVal = String(emailSettings.smtpUser || prev.smtpUser || '').trim();
    const officeName = String(existing.name || '').trim() || 'Your Casino';

    const merged = {
      fromName: String(emailSettings.fromName || prev.fromName || officeName).trim(),
      brandName: String(emailSettings.brandName || prev.brandName || officeName).trim(),
      tagline: String(emailSettings.tagline || prev.tagline || '').trim(),
      siteUrl: defaultPlayerLink,
      smtpHost: String(emailSettings.smtpHost || prev.smtpHost || '').trim(),
      smtpPort: Number(emailSettings.smtpPort || prev.smtpPort || 465),
      smtpUser: smtpUserVal,
      smtpPass: nextPass,
      replyTo: smtpUserVal || String(prev.replyTo || '').trim(),
      updatedAt: new Date().toISOString()
    };

    if (!merged.smtpHost || !merged.smtpUser || !merged.smtpPass) {
      return NextResponse.json({
        success: false,
        message: 'SMTP host, username, and app password are required.'
      }, { status: 400 });
    }

    await db.collection('distributors').updateOne({ id: distributorId }, { $set: { emailSettings: merged } });
    clearDistributorMailCache(distributorId);

    return NextResponse.json({
      success: true,
      message: 'Email delivery settings saved.',
      emailSettings: publicEmailSettings(merged)
    });
  } catch (err) {
    console.error('PUT distributor email-settings:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

/** POST — test SMTP or send test email to distributor inbox */
export async function POST(req) {
  try {
    const body = await req.json();
    const { distributorId, action = 'verify', testEmail } = body || {};
    if (!distributorId) {
      return NextResponse.json({ success: false, message: 'distributorId is required.' }, { status: 400 });
    }

    const db = await getDb();
    const dist = await db.collection('distributors').findOne({ id: distributorId });
    if (!dist) {
      return NextResponse.json({ success: false, message: 'Distributor not found.' }, { status: 404 });
    }

    const es = dist.emailSettings || {};
    if (!es.smtpHost || !es.smtpUser || !es.smtpPass) {
      return NextResponse.json({ success: false, message: 'Save SMTP settings first.' }, { status: 400 });
    }

    await verifyDistributorSmtpSettings(es);

    if (action === 'send_test') {
      const to = (testEmail || dist.email || '').toLowerCase().trim();
      if (!to) {
        return NextResponse.json({ success: false, message: 'testEmail is required.' }, { status: 400 });
      }
      const ctx = await resolveMailContext(db, { distributorId });
      await sendResolvedMail(ctx, {
        to,
        subject: `${es.brandName || dist.name || 'Portal'} — SMTP test OK`,
        text: 'This is a test email from your distributor mail settings. Player OTP and promo emails will use this sender.',
        html: `<p>SMTP test successful for <strong>${es.brandName || dist.name}</strong>.</p>`
      });
    }

    return NextResponse.json({ success: true, message: action === 'send_test' ? 'Test email sent.' : 'SMTP connection verified.' });
  } catch (err) {
    console.error('POST distributor email-settings:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'SMTP verification failed. Check host, port, and app password.'
    }, { status: 400 });
  }
}