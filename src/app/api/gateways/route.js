import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { cache } from '../../../lib/cache';
import { buildGatewayRedirectTemplate, normalizePayTag } from '../../../lib/gatewayPayLink';

const PLATFORM_GATEWAY_QUERY = {
  $or: [
    { distributorId: { $exists: false } },
    { distributorId: null },
    { distributorId: '' }
  ]
};

// GET all gateways
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let distributorId = String(searchParams.get('distributorId') || '').trim();
    const email = String(searchParams.get('email') || '').trim().toLowerCase();

    const db = await getDb();

    // Resolve distributor from player email when session id is missing/stale
    if (!distributorId && email) {
      const user = await db.collection('users').findOne(
        { email },
        { projection: { distributorId: 1 } }
      );
      distributorId = String(user?.distributorId || '').trim();
    }

    const cacheKey = distributorId ? `gateways_dist_${distributorId}` : 'gateways_all';
    const cachedGateways = cache.get(cacheKey);
    if (cachedGateways) {
      return NextResponse.json({ success: true, gateways: cachedGateways });
    }

    const gatewaysCollection = db.collection('gateways');

    let query = PLATFORM_GATEWAY_QUERY;
    if (distributorId) {
      const dist = await db.collection('distributors').findOne(
        { id: distributorId },
        { projection: { type: 1 } }
      );
      if (dist?.type === 'B') {
        // Type B: players only see methods that distributor added
        query = { distributorId };
      } else if (!dist) {
        // Unknown id — never leak platform payment methods
        cache.set(cacheKey, [], 30);
        return NextResponse.json({ success: true, gateways: [] });
      }
      // Type A: intentional — players use main platform gateways
    }

    const gateways = await gatewaysCollection.find(query).toArray();

    cache.set(cacheKey, gateways, 30);
    return NextResponse.json({ success: true, gateways });
  } catch (err) {
    console.error('Fetch Gateways API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// POST new gateway (Admin action)
export async function POST(req) {
  try {
    const gateway = await req.json();
    if (!gateway.name) {
      return NextResponse.json({ success: false, message: 'Gateway name is required.' }, { status: 400 });
    }

    const theme = gateway.theme || 'chime';
    const depositMode = gateway.depositMode === 'support_request' ? 'support_request' : 'active';
    const isVisibleOnDeposit = gateway.isVisibleOnDeposit !== false;
    const tag = normalizePayTag(gateway.tag);
    let redirectUrl = String(gateway.redirectUrl || '').trim();
    if (!redirectUrl && tag) {
      redirectUrl = buildGatewayRedirectTemplate(theme, tag);
    }
    const isStripe = theme === 'stripe';
    const walletThemes = ['applepay', 'googlepay'];
    if (depositMode !== 'support_request' && !tag && !redirectUrl && !walletThemes.includes(theme)) {
      return NextResponse.json(
        { success: false, message: 'Add a payment tag/handle or a Pay redirect URL.' },
        { status: 400 }
      );
    }
    if (isStripe && !redirectUrl) {
      return NextResponse.json(
        { success: false, message: 'Stripe requires a Pay redirect URL (your Stripe payment link).' },
        { status: 400 }
      );
    }
    const isLinkPay =
      Boolean(redirectUrl) ||
      ['cashapp', 'paypal', 'venmo', 'stripe', 'applepay', 'googlepay'].includes(theme);
    const savedTag =
      tag ||
      (depositMode === 'support_request' || isLinkPay ? `${theme}-pay` : '');

    const db = await getDb();
    const gatewaysCollection = db.collection('gateways');

    const newGateway = {
      id: gateway.id || Date.now().toString(),
      name: gateway.name,
      subtitle: gateway.subtitle || '',
      tag: savedTag,
      phone: gateway.phone || '',
      theme,
      qrImage:
        gateway.qrImage && !String(gateway.qrImage).includes('/api/gateways/image')
          ? gateway.qrImage
          : !redirectUrl
            ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(savedTag || gateway.name)}`
            : '',
      redirectUrl,
      isWithdrawActive: Boolean(gateway.isWithdrawActive),
      requireNameOnTag: Boolean(gateway.requireNameOnTag),
      requireTag: Boolean(gateway.requireTag),
      requirePhoneOnTag: Boolean(gateway.requirePhoneOnTag),
      requireEmailOnTag: Boolean(gateway.requireEmailOnTag),
      isVisibleOnDeposit,
      depositMode
    };

    await gatewaysCollection.insertOne(newGateway);
    
    // Invalidate caches
    cache.del('gateways_all');
    if (newGateway.id) cache.del(`gateway_image_${newGateway.id}`);

    return NextResponse.json({ success: true, gateway: newGateway, message: 'Payment gateway added successfully!' });
  } catch (err) {
    console.error('Create Gateway API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// PUT (update) gateway (Admin action)
export async function PUT(req) {
  try {
    const gateway = await req.json();
    if (!gateway.id) {
      return NextResponse.json({ success: false, message: 'Gateway ID is required.' }, { status: 400 });
    }

    const db = await getDb();
    const gatewaysCollection = db.collection('gateways');

    const theme = gateway.theme || 'chime';
    const tag = normalizePayTag(gateway.tag);
    let redirectUrl =
      gateway.redirectUrl !== undefined ? String(gateway.redirectUrl || '').trim() : undefined;
    if (redirectUrl !== undefined && !redirectUrl && tag) {
      redirectUrl = buildGatewayRedirectTemplate(theme, tag);
    }

    const updateFields = {
      name: gateway.name,
      subtitle: gateway.subtitle,
      tag: gateway.tag,
      phone: gateway.phone,
      theme: gateway.theme,
      qrImage: gateway.qrImage,
      redirectUrl,
      isWithdrawActive: gateway.isWithdrawActive !== undefined ? Boolean(gateway.isWithdrawActive) : undefined,
      requireNameOnTag: gateway.requireNameOnTag !== undefined ? Boolean(gateway.requireNameOnTag) : undefined,
      requireTag: gateway.requireTag !== undefined ? Boolean(gateway.requireTag) : undefined,
      requirePhoneOnTag: gateway.requirePhoneOnTag !== undefined ? Boolean(gateway.requirePhoneOnTag) : undefined,
      requireEmailOnTag: gateway.requireEmailOnTag !== undefined ? Boolean(gateway.requireEmailOnTag) : undefined,
      isVisibleOnDeposit:
        gateway.isVisibleOnDeposit !== undefined ? gateway.isVisibleOnDeposit !== false : undefined,
      depositMode:
        gateway.depositMode !== undefined
          ? gateway.depositMode === 'support_request'
            ? 'support_request'
            : 'active'
          : undefined
    };

    // Admin edit form sends public proxy URL (/api/gateways/image?id=...) if not re-uploaded.
    // Never overwrite stored Mongo image with the proxy URL string.
    if (typeof updateFields.qrImage === 'string' && updateFields.qrImage.includes('/api/gateways/image')) {
      delete updateFields.qrImage;
    }

    // Clean undefined fields
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    await gatewaysCollection.updateOne({ id: gateway.id }, { $set: updateFields });
    
    // Invalidate caches
    cache.del('gateways_all');
    cache.del(`gateway_image_${gateway.id}`);

    return NextResponse.json({ success: true, message: 'Payment gateway updated successfully!' });
  } catch (err) {
    console.error('Update Gateway API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// DELETE gateway (Admin action)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Gateway ID parameter is required.' }, { status: 400 });
    }

    const db = await getDb();
    const gatewaysCollection = db.collection('gateways');

    await gatewaysCollection.deleteOne({ id });
    
    // Invalidate caches
    cache.del('gateways_all');
    cache.del(`gateway_image_${id}`);

    return NextResponse.json({ success: true, message: 'Payment gateway deleted successfully!' });
  } catch (err) {
    console.error('Delete Gateway API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

