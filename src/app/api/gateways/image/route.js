import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { cache } from '../../../../lib/cache';
import { parseDataUrlImage } from '../../../../lib/gameImages';

/**
 * Serve a gateway QR as binary (not base64 JSON) — keeps /api/gateways lean.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Gateway id required.' }, { status: 400 });
    }

    const perKey = `gateway_image_${id}`;
    let image = cache.get(perKey);

    const db = await getDb();

    if (!image) {
      const gateway = await db.collection('gateways').findOne(
        { id: String(id) },
        { projection: { _id: 0, qrImage: 1, tag: 1, name: 1 } }
      );
      image = gateway?.qrImage || null;
      if (image) cache.set(perKey, image, 300);
    }

    // Detect circular/self-referential redirects or missing image and provide dynamic QR fallback
    if (!image || (typeof image === 'string' && image.includes('/api/gateways/image'))) {
      const gateway = await db.collection('gateways').findOne(
        { id: String(id) },
        { projection: { _id: 0, tag: 1, name: 1 } }
      );
      const text = gateway?.tag || gateway?.name || 'Payment';
      return NextResponse.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`, 302);
    }

    if (!String(image).startsWith('data:')) {
      if (
        String(image).startsWith('http://') ||
        String(image).startsWith('https://')
      ) {
        return NextResponse.redirect(image, 302);
      }
      if (String(image).startsWith('/')) {
        return NextResponse.redirect(new URL(image, req.url), 302);
      }
      return NextResponse.redirect(new URL('/' + String(image).replace(/^\//, ''), req.url), 302);
    }

    const parsed = parseDataUrlImage(image);
    if (!parsed) {
      const gateway = await db.collection('gateways').findOne(
        { id: String(id) },
        { projection: { _id: 0, tag: 1, name: 1 } }
      );
      const text = gateway?.tag || gateway?.name || 'Payment';
      return NextResponse.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`, 302);
    }

    return new NextResponse(parsed.buffer, {
      status: 200,
      headers: {
        'Content-Type': parsed.mime,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
      }
    });
  } catch (err) {
    console.error('Gateway image API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

