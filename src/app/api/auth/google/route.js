import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { healOrphanedDistributorPlayer } from '../../../../lib/orphanDistributorPlayer';
import crypto from 'crypto';

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(req) {
  try {
    const { email, name, referredBy, distributorId, agentCode, campaign, deviceId } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Google account details missing.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const cleanEmail = email.toLowerCase().trim();
    const cleanDeviceId = deviceId ? String(deviceId).trim() : '';
    let matchedUser = await usersCollection.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (matchedUser && matchedUser.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Please contact customer support.' },
        { status: 403 }
      );
    }

    if (!matchedUser) {
      // Anti-Multi-Account check: Block if this device is already registered to another account
      if (cleanDeviceId) {
        const settings = await db.collection('settings').findOne({ id: 'global_settings' });
        const enforceDeviceLimit = settings?.enforceDeviceLimit !== false; // Default true

        if (enforceDeviceLimit) {
          const existingDeviceUser = await usersCollection.findOne({
            deviceId: cleanDeviceId,
            email: { $ne: cleanEmail }
          });

          if (existingDeviceUser) {
            return NextResponse.json(
              { success: false, message: 'You already have an account from this device.' },
              { status: 400 }
            );
          }
        }
      }

      // Generate a unique referral code
      let referralCode = generateReferralCode();
      while (await usersCollection.findOne({ referralCode })) {
        referralCode = generateReferralCode();
      }

      // Resolve the referrer by referralCode and inherit distributorId/agentCode
      let resolvedReferrer = '';
      let inheritedDistributorId = '';
      let inheritedAgentCode = '';
      if (referredBy && referredBy !== 'null' && referredBy !== 'undefined') {
        const referrer = await usersCollection.findOne({ referralCode: referredBy.trim() });
        if (referrer) {
          resolvedReferrer = referrer.email;
          if (referrer.distributorId) {
            inheritedDistributorId = referrer.distributorId;
          }
          if (referrer.agentCode) {
            inheritedAgentCode = referrer.agentCode;
          }
        }
      }

      const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
      const registrationIp = forwarded.split(',')[0].trim();

      // Automatically register brand-new Google users
      matchedUser = {
        name: name.trim(),
        email: cleanEmail,
        password: 'OAuth-Google-Login',
        role: 'user',
        coins: 100,
        referralCode,
        referredBy: resolvedReferrer,
        distributorId: (distributorId && distributorId !== 'null' && distributorId !== 'undefined') ? distributorId : (inheritedDistributorId || ''),
        agentCode: (agentCode && agentCode !== 'null' && agentCode !== 'undefined') ? agentCode : (inheritedAgentCode || ''),
        campaign: campaign || 'organic',
        deviceId: cleanDeviceId || '',
        registrationIp: registrationIp || '',
        createdAt: new Date().toISOString()
      };
      const result = await usersCollection.insertOne(matchedUser);
      matchedUser._id = result.insertedId;
      isNewUser = true;
    } else if (!matchedUser.deviceId && cleanDeviceId) {
      // Backfill deviceId on login for existing users
      await usersCollection.updateOne(
        { _id: matchedUser._id },
        { $set: { deviceId: cleanDeviceId } }
      );
      matchedUser.deviceId = cleanDeviceId;
    }

    // Deleted distributor → player stays, but game accounts reset so they can re-request.
    if (!isNewUser) {
      matchedUser = await healOrphanedDistributorPlayer(db, matchedUser);
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Google account registered successfully!' : 'Welcome back!',
      isNewUser,
      user: {
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        coins: matchedUser.coins || 100,
        referralCode: matchedUser.referralCode || '',
        isSubscribed: matchedUser.isSubscribed || false,
        distributorId: matchedUser.distributorId || '',
        allowedGameIds: matchedUser.allowedGameIds || []
      }
    });
  } catch (err) {
    console.error('Google OAuth API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during Google authentication: ' + err.message },
      { status: 500 }
    );
  }
}
