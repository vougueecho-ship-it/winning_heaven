import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { isDeviceBlocked } from '../../../../lib/deviceBlock';

// GET: Check player's claimed Halloween bonus
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();

    const user = await db.collection('users').findOne(
      { email: cleanEmail },
      { projection: { email: 1, claimedHalloweenBonus: 1, pendingDepositBonusPercent: 1 } }
    );

    return NextResponse.json({
      success: true,
      claimedBonus: user?.claimedHalloweenBonus || null,
      bonusPercent: user?.pendingDepositBonusPercent || user?.claimedHalloweenBonus?.bonusPercent || 0
    });
  } catch (err) {
    console.error('Fetch Halloween Claim error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: Player claims a Halloween bonus (No promo code needed!)
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, pumpkinId, name, bonusPercent } = body;

    if (!email || !bonusPercent) {
      return NextResponse.json({
        success: false,
        message: 'Missing email or bonus percentage.'
      }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();

    // Check device / user permanent block
    const isBlocked = await isDeviceBlocked(db, null, null, null, cleanEmail);
    if (isBlocked) {
      return NextResponse.json({
        success: false,
        message: 'Device or account is blocked.'
      }, { status: 403 });
    }

    const user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User account not found.'
      }, { status: 404 });
    }

    const numPercent = Math.max(0, parseFloat(bonusPercent) || 0);
    const bonusObj = {
      id: pumpkinId || 1,
      name: name || 'Jackpot Pumpkin',
      bonusPercent: numPercent,
      claimedAt: new Date().toISOString()
    };

    // Permanently arm the bonus on the user's account
    await db.collection('users').updateOne(
      { email: cleanEmail },
      {
        $set: {
          claimedHalloweenBonus: bonusObj,
          pendingDepositBonusPercent: numPercent,
          pendingBonusPromoTitle: `Halloween ${bonusObj.name}`
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `🎃 ${bonusObj.name} Activated! You will receive +${numPercent}% Extra Coins on your deposits!`,
      claimedBonus: bonusObj
    });
  } catch (err) {
    console.error('Claim Halloween bonus error:', err);
    return NextResponse.json({
      success: false,
      message: 'Server error claiming bonus: ' + err.message
    }, { status: 500 });
  }
}
