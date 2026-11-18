import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { cache } from '../../../../lib/cache';
import { publishAdminEvent } from '../../../../lib/adminEvents';
import { notifyStaffAndDistributorAsync } from '../../../../lib/pushNotifications';
import { isDeviceBlocked, trackDeviceSession } from '../../../../lib/deviceBlock';
import { paymentMethodDisplayName } from '../../../../lib/depositGateways';
import { resolveSupportDistributor } from '../../../../lib/supportDistributor';

const DEDUPE_MS = 15 * 60 * 1000;

function buildActivationMessage(methodName, amount, gameTitle) {
  const amt = amount > 0 ? `$${Number(amount).toFixed(2)}` : 'my deposit';
  const gamePart = gameTitle ? ` for ${gameTitle}` : '';
  return (
    `Hi VIP Support — I need the active ${methodName} payment details ` +
    `(payment link, QR code, and cashtag/handle) to complete ${amt}${gamePart}. Thank you!`
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userEmail = String(body.userEmail || '').toLowerCase().trim();
    const theme = String(body.theme || '').toLowerCase().trim();
    const methodName = String(body.methodName || paymentMethodDisplayName(theme)).trim();
    const amount = parseFloat(body.amount) || 0;
    const gameTitle = String(body.gameTitle || '').trim();
    const userName = String(body.userName || '').trim();
    const { deviceId, deviceFingerprint, hardwareFingerprint, distributorId: clientDistributorId } = body;

    if (!userEmail) {
      return NextResponse.json({ success: false, message: 'User email is required.' }, { status: 400 });
    }
    if (!theme) {
      return NextResponse.json({ success: false, message: 'Payment method is required.' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
    const clientUserAgent = req.headers.get('user-agent') || '';

    const db = await getDb();

    const isBlocked = await isDeviceBlocked(
      db,
      deviceId,
      deviceFingerprint,
      hardwareFingerprint,
      userEmail,
      clientIp
    );
    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          isBlocked: true,
          message: 'Your account and device have been permanently blocked from customer support.'
        },
        { status: 403 }
      );
    }

    const { distId, distType, distName, userDoc } = await resolveSupportDistributor(db, userEmail, {
      hintDistributorId: clientDistributorId
    });

    const supportCollection = db.collection('supportMessages');
    const sinceIso = new Date(Date.now() - DEDUPE_MS).toISOString();

    const existing = await supportCollection.findOne({
      userEmail,
      senderType: 'player',
      messageCategory: 'payment_activation_request',
      paymentTheme: theme,
      timestamp: { $gte: sinceIso }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        deduped: true,
        message: existing,
        notice: 'Your request is already with support. Check live chat for a reply.'
      });
    }

    const text = buildActivationMessage(methodName, amount, gameTitle);
    const resolvedName = (() => {
      if (userName && !/^support\s*agent$/i.test(userName)) return userName;
      return userDoc?.name || 'Player';
    })();

    const newMsg = {
      id: `${Date.now()}${Math.floor(Math.random() * 100)}`,
      userEmail,
      userName: resolvedName,
      message: text,
      attachment: '',
      hasAttachment: false,
      senderType: 'player',
      senderEmail: userEmail,
      read: false,
      timestamp: new Date().toISOString(),
      distributorId: distId,
      distributorType: distType,
      distributorName: distName,
      deviceId: deviceId || userDoc?.deviceId || '',
      deviceFingerprint: deviceFingerprint || userDoc?.deviceFingerprint || '',
      hardwareFingerprint: hardwareFingerprint || userDoc?.hardwareFingerprint || '',
      ip: clientIp || userDoc?.lastLoginIp || '',
      userAgent: clientUserAgent,
      replyTo: null,
      isEdited: false,
      editedAt: null,
      reactions: {},
      messageCategory: 'payment_activation_request',
      paymentTheme: theme,
      paymentMethodName: methodName,
      requestedAmount: amount,
      requestedGame: gameTitle
    };

    await supportCollection.insertOne(newMsg);

    trackDeviceSession(db, {
      email: userEmail,
      name: resolvedName,
      role: userDoc?.role || 'player',
      deviceId: newMsg.deviceId,
      deviceFingerprint: newMsg.deviceFingerprint,
      hardwareFingerprint: newMsg.hardwareFingerprint,
      userAgent: clientUserAgent,
      ip: clientIp
    }).catch(() => {});

    cache.del('admin_stats');
    publishAdminEvent('support', { distributorId: distId || '', senderType: 'player' });

    notifyStaffAndDistributorAsync(
      db,
      {
        title: 'Payment Details Requested',
        body: `${resolvedName}: needs active ${methodName} (link / QR / tag)`,
        adminUrl: '/admin/support',
        distributorUrl: '/distributor/support',
        url: '/admin/support',
        tag: `pay-req-${newMsg.id}`,
        alertKind: 'support'
      },
      distId
    );

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err) {
    console.error('[payment-activation-request]', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}