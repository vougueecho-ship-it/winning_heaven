import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { healOrphanedDistributorPlayer } from '../../../../lib/orphanDistributorPlayer';
import { isDeviceBlocked, trackDeviceSession } from '../../../../lib/deviceBlock';

export async function POST(req) {
  try {
    const { email, password, deviceId, deviceFingerprint, hardwareFingerprint, isApp, appType, deviceModel } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const inputEmail = email.toLowerCase().trim();
    const cleanDeviceId = deviceId ? String(deviceId).trim() : '';

    const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
      .toLowerCase()
      .trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

    if (envAdminEmail && envAdminPassword) {
      if (inputEmail === envAdminEmail) {
        if (password === envAdminPassword) {
          return NextResponse.json({
            success: true,
            message: 'Login successful!',
            user: {
              name: 'System Admin',
              email: envAdminEmail,
              role: 'admin',
              coins: 0,
              referralCode: '',
              isSubscribed: false,
              distributorId: '',
              allowedGameIds: []
            }
          });
        }
        return NextResponse.json(
          { success: false, message: 'Incorrect email or password.' },
          { status: 401 }
        );
      }
    }

    const db = await getDb();

    // Device block check
    if (await isDeviceBlocked(db, cleanDeviceId, deviceFingerprint, hardwareFingerprint)) {
      return NextResponse.json(
        { success: false, message: 'This device has been permanently blocked by Super Admin.' },
        { status: 403 }
      );
    }

    const usersCollection = db.collection('users');

    const matchedUser = await usersCollection.findOne({
      email: inputEmail,
      password: password
    });

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, message: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    if (matchedUser.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Please contact customer support.' },
        { status: 403 }
      );
    }

    // Anti-Multi-Account check for player logins: Block if device is bound to another player account
    if (matchedUser.role === 'user' && cleanDeviceId) {
      const settings = await db.collection('settings').findOne({ id: 'global_settings' });
      const enforceDeviceLimit = settings?.enforceDeviceLimit !== false; // Default true

      if (enforceDeviceLimit) {
        const existingDeviceUser = await usersCollection.findOne({
          deviceId: cleanDeviceId,
          email: { $ne: inputEmail },
          role: 'user'
        });

        if (existingDeviceUser) {
          return NextResponse.json(
            { success: false, message: 'Strict Device Lock: Only 1 account is allowed per device. This device is already linked to another account.' },
            { status: 400 }
          );
        }
      }

      // Update deviceId on successful login
      const clientIp = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
      await usersCollection.updateOne(
        { _id: matchedUser._id },
        { $set: { deviceId: cleanDeviceId, lastLoginIp: clientIp, lastLoginAt: new Date().toISOString() } }
      );
    }

    // Deleted distributor → player stays, but game accounts reset so they can re-request.
    const user = await healOrphanedDistributorPlayer(db, matchedUser);

    const clientIp = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
    const userAgent = req.headers.get('user-agent') || '';

    // Track active device session
    trackDeviceSession(db, {
      email: user.email,
      name: user.name,
      role: user.role,
      deviceId: cleanDeviceId,
      deviceFingerprint,
      hardwareFingerprint,
      userAgent,
      ip: clientIp,
      isApp,
      appType,
      deviceModel
    }).catch((e) => console.warn('trackDeviceSession on login:', e?.message || e));

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: { name: user.name, email: user.email, role: user.role, coins: user.coins || 0, referralCode: user.referralCode || '', isSubscribed: user.isSubscribed || false, distributorId: user.distributorId || '', allowedGameIds: user.allowedGameIds || [] }
    });
  } catch (err) {
    console.error('Login API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during login: ' + err.message },
      { status: 500 }
    );
  }
}
