import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === '1' || searchParams.get('unreadOnly') === 'true';

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email query parameter is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const collection = db.collection('userNotifications');

    const query = { userEmail: cleanEmail };
    if (unreadOnly) {
      query.read = { $ne: true };
    }

    const [notifications, unreadCount] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 50))
        .toArray(),
      collection.countDocuments({ userEmail: cleanEmail, read: { $ne: true } })
    ]);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount
    });
  } catch (err) {
    console.error('Fetch user notifications error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, userEmail, markToastShown, markRead, markAllRead } = body || {};

    const cleanEmail = String(userEmail || '').toLowerCase().trim();
    if (!cleanEmail && !id) {
      return NextResponse.json({ success: false, message: 'id or userEmail is required.' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('userNotifications');

    if (markAllRead && cleanEmail) {
      await collection.updateMany(
        { userEmail: cleanEmail },
        { $set: { read: true, shownToast: true } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (id) {
      const updateFields = {};
      if (markToastShown) updateFields.shownToast = true;
      if (markRead) updateFields.read = true;

      if (Object.keys(updateFields).length > 0) {
        await collection.updateOne({ id: String(id) }, { $set: updateFields });
      }
      return NextResponse.json({ success: true, message: 'Notification updated.' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update user notification error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}
