import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import {
  DISTRIBUTOR_PLAYER_SETTING_KEYS,
  invalidateMergedFrontendSettingsCache,
  loadMergedFrontendSettings,
  pickDistributorPlayerSettings
} from '../../../../lib/playerFrontendSettings';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const distributorId = String(searchParams.get('distributorId') || '').trim();
    if (!distributorId) {
      return NextResponse.json({ success: false, message: 'distributorId is required.' }, { status: 400 });
    }

    const db = await getDb();
    const dist = await db.collection('distributors').findOne(
      { id: distributorId },
      { projection: { playerSettings: 1, name: 1 } }
    );
    if (!dist) {
      return NextResponse.json({ success: false, message: 'Distributor not found.' }, { status: 404 });
    }

    const merged = await loadMergedFrontendSettings(db, distributorId);
    const overrides = pickDistributorPlayerSettings(dist.playerSettings || {});

    return NextResponse.json({
      success: true,
      distributorId,
      overrides,
      mergedPreview: pickDistributorPlayerSettings(merged),
      signupLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://winningheaven.com'}/?distributor=${encodeURIComponent(distributorId)}`
    });
  } catch (err) {
    console.error('GET distributor player-settings:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const distributorId = String(body.distributorId || '').trim();
    const playerSettings = body.playerSettings || body.settings || {};

    if (!distributorId) {
      return NextResponse.json({ success: false, message: 'distributorId is required.' }, { status: 400 });
    }

    const db = await getDb();
    const dist = await db.collection('distributors').findOne({ id: distributorId });
    if (!dist) {
      return NextResponse.json({ success: false, message: 'Distributor not found.' }, { status: 404 });
    }

    const next = pickDistributorPlayerSettings(playerSettings);
    for (const key of DISTRIBUTOR_PLAYER_SETTING_KEYS) {
      if (playerSettings[key] === null || playerSettings[key] === '') {
        delete next[key];
      }
    }

    await db.collection('distributors').updateOne(
      { id: distributorId },
      { $set: { playerSettings: next, playerSettingsUpdatedAt: new Date().toISOString() } }
    );

    invalidateMergedFrontendSettingsCache(distributorId);

    return NextResponse.json({
      success: true,
      message: 'Player rules & bonuses saved for your office.',
      overrides: next
    });
  } catch (err) {
    console.error('PUT distributor player-settings:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}