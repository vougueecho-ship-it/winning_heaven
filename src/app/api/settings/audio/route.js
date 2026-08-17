import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { cache } from '../../../../lib/cache';

/**
 * GET /api/settings/audio
 * Serves the custom notification sound as binary audio/mpeg or redirects to URL.
 */
export async function GET(req) {
  try {
    const cachedAudio = cache.get('notification_audio_binary');
    if (cachedAudio) {
      return new NextResponse(cachedAudio.buffer, {
        status: 200,
        headers: {
          'Content-Type': cachedAudio.mime || 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Accept-Ranges': 'bytes'
        }
      });
    }

    const db = await getDb();
    const settings = await db.collection('settings').findOne(
      { id: 'frontend_settings' },
      { projection: { _id: 0, notificationSoundUrl: 1 } }
    );

    const sound = settings?.notificationSoundUrl;

    if (!sound) {
      return NextResponse.redirect('https://raw.githubusercontent.com/AUTOMATIC1111/stable-diffusion-webui/master/notification.mp3', 302);
    }

    if (!sound.startsWith('data:')) {
      if (sound.startsWith('http://') || sound.startsWith('https://')) {
        return NextResponse.redirect(sound, 302);
      }
      if (sound.startsWith('/')) {
        return NextResponse.redirect(new URL(sound, req.url), 302);
      }
      return NextResponse.redirect(new URL('/' + sound.replace(/^\//, ''), req.url), 302);
    }

    // Parse data URL: data:audio/mpeg;base64,...
    const commaIdx = sound.indexOf(',');
    if (commaIdx === -1) {
      return NextResponse.json({ success: false, message: 'Invalid audio data URL.' }, { status: 500 });
    }

    const meta = sound.slice(5, commaIdx);
    const mime = meta.split(';')[0] || 'audio/mpeg';
    const base64 = sound.slice(commaIdx + 1);
    const buffer = Buffer.from(base64, 'base64');

    cache.set('notification_audio_binary', { buffer, mime }, 300);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(buffer.length)
      }
    });
  } catch (err) {
    console.error('Fetch Audio API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

/**
 * POST /api/settings/audio
 * Direct upload endpoint for MP3 / audio notification tone.
 */
export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let soundDataUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') || formData.get('audio');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ success: false, message: 'Audio file is required.' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = file.type || 'audio/mpeg';
      soundDataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    } else {
      const body = await req.json();
      soundDataUrl = String(body.audio || body.sound || body.notificationSoundUrl || '').trim();
    }

    if (!soundDataUrl) {
      return NextResponse.json({ success: false, message: 'Audio data is required.' }, { status: 400 });
    }

    const db = await getDb();
    await db.collection('settings').updateOne(
      { id: 'frontend_settings' },
      { $set: { notificationSoundUrl: soundDataUrl } },
      { upsert: true }
    );

    // Invalidate caches
    cache.del('notification_audio_binary');
    cache.del('frontend_settings_all');

    return NextResponse.json({
      success: true,
      message: 'Notification sound updated successfully!',
      url: `/api/settings/audio?v=${soundDataUrl.length}`
    });
  } catch (err) {
    console.error('Upload Audio API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}
