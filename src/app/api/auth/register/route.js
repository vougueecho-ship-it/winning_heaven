import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import crypto from 'crypto';

// Generate a short unique alphanumeric referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F8B12C"
}

// GET checks if an email exists and returns registration details for otp flows
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email query is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return NextResponse.json({ success: true, exists: false });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      name: user.name
    });
  } catch (err) {
    console.error('Email Check API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error checking email: ' + err.message },
      { status: 500 }
    );
  }
}

// POST registers a new user
export async function POST(req) {
  try {
    const { email, password, name, otp, role, referredBy, distributorId, agentCode, campaign, allowedGameIds, deviceId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Missing required registration fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanDeviceId = deviceId ? String(deviceId).trim() : '';
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email is already registered.' },
        { status: 400 }
      );
    }

    const isStaffRole = role && role !== 'user';

    // Anti-Multi-Account check: Prevent duplicate registrations from the same device
    if (!isStaffRole) {
      const settings = await db.collection('settings').findOne({ id: 'global_settings' });
      const enforceDeviceLimit = settings?.enforceDeviceLimit !== false; // Default true

      if (enforceDeviceLimit) {
        const clientIp = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
        const deviceOrIpFilter = [
          cleanDeviceId ? { deviceId: cleanDeviceId } : null,
          clientIp ? { registrationIp: clientIp } : null
        ].filter(Boolean);

        if (deviceOrIpFilter.length > 0) {
          const existingDeviceUser = await usersCollection.findOne({
            $or: deviceOrIpFilter,
            email: { $ne: cleanEmail },
            role: 'user'
          });

          if (existingDeviceUser) {
            return NextResponse.json(
              { success: false, message: 'Strict Device Lock: Only 1 account is allowed per device. An account is already registered on this device.' },
              { status: 400 }
            );
          }
        }
      }
    }

    // Verify OTP for standard player registrations
    if (!isStaffRole) {
      if (!otp) {
        return NextResponse.json(
          { success: false, message: 'Email verification code is required.' },
          { status: 400 }
        );
      }

      const otpsCollection = db.collection('emailOtps');
      const validOtp = await otpsCollection.findOne({
        email: cleanEmail,
        otp: String(otp).trim(),
        expiresAt: { $gt: new Date() }
      });

      if (!validOtp) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired verification code. Please request a new OTP.' },
          { status: 400 }
        );
      }

      // Cleanup used OTP
      await otpsCollection.deleteMany({ email: cleanEmail });
    }

    // Generate a unique referral code for this new user
    let referralCode = generateReferralCode();
    // Ensure uniqueness
    while (await usersCollection.findOne({ referralCode })) {
      referralCode = generateReferralCode();
    }

    // Resolve the referrer: look up by referralCode, store their email and inherit distributorId/agentCode
    let resolvedReferrer = '';
    let inheritedDistributorId = '';
    let inheritedAgentCode = '';
    if (referredBy) {
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

    // Extract client IP if available
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
    const registrationIp = forwarded.split(',')[0].trim();

    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Stored as-is to preserve local credentials migration compatibility
      role: role || 'user',
      coins: 100,
      referralCode,
      referredBy: resolvedReferrer,
      distributorId: distributorId || inheritedDistributorId || '',
      agentCode: agentCode || inheritedAgentCode || '',
      campaign: campaign || 'organic',
      deviceId: cleanDeviceId || '',
      registrationIp: registrationIp || '',
      createdAt: new Date().toISOString()
    };

    const roleStr = (role || 'user').toLowerCase();
    if (roleStr.split(',').map((r) => r.trim()).includes('coins_admin')) {
      const { validateAllowedGameIds } = await import('../../../../lib/staffGameAccess');
      const validation = await validateAllowedGameIds(db, allowedGameIds || []);
      if (!validation.valid) {
        return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
      }
      newUser.allowedGameIds = validation.allowedGameIds;
    }

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;

    return NextResponse.json({
      success: true,
      message: 'Account successfully registered!',
      user: { name: newUser.name, email: newUser.email, role: newUser.role, coins: newUser.coins, referralCode: newUser.referralCode, isSubscribed: false }
    });
  } catch (err) {
    console.error('Registration API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during registration: ' + err.message },
      { status: 500 }
    );
  }
}

// PUT updates user's password (Forgot Password reset case)
export async function PUT(req) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found.' },
        { status: 404 }
      );
    }

    await usersCollection.updateOne(
      { email: cleanEmail },
      { $set: { password: newPassword.trim() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated!'
    });
  } catch (err) {
    console.error('Password Reset API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during password reset: ' + err.message },
      { status: 500 }
    );
  }
}
