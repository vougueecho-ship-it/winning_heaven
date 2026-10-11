import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { blockDevicePermanently, unlinkDeviceRecord, unblockDevice, trackDeviceSession, parseUserAgent, getRolePostTitle } from '../../../../lib/deviceBlock';

function isSuperAdminUser(adminRole, adminEmail) {
  if (adminRole) {
    const roles = String(adminRole).toLowerCase().split(',').map(r => r.trim());
    if (roles.includes('admin') || roles.includes('super_admin')) return true;
  }
  const clean = String(adminEmail || '').toLowerCase().trim();
  if (!clean) return false;
  const allowed = [
    'admin@winningheaven.com',
    (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim()
  ].filter(Boolean);
  return allowed.includes(clean);
}

// GET list of active & inactive & blocked devices (Super Admin Only)
// Active devices are prioritized at the top!
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole') || '';
    const adminEmail = searchParams.get('adminEmail') || '';

    if (!isSuperAdminUser(adminRole, adminEmail)) {
      return NextResponse.json({ success: false, message: 'Access denied. Super Admin access required.' }, { status: 403 });
    }

    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = await getDb();
    const sessionsCollection = db.collection('deviceSessions');
    const blockedCollection = db.collection('blockedDevices');

    // 1. Automatically register/update the Super Admin's current device session
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Current Session';
    const userAgent = req.headers.get('user-agent') || '';
    const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@winningheaven.com').toLowerCase().trim();
    const adminEmailClean = String(adminEmail || envAdminEmail).toLowerCase().trim();

    await trackDeviceSession(db, {
      email: adminEmailClean,
      name: 'Super Admin (Owner)',
      role: 'admin',
      deviceId: `super-admin-${Buffer.from(adminEmailClean).toString('hex').slice(0, 10)}`,
      userAgent,
      ip
    }).catch(() => {});

    // 2. Fetch live users, distributors, agents, deviceSessions, and blocked list
    const [allUsers, allDists, allAgents, allSessions, blockedList] = await Promise.all([
      db.collection('users').find(
        { email: { $exists: true, $ne: '' } },
        { projection: { email: 1, name: 1, role: 1, deviceId: 1, deviceFingerprint: 1, hardwareFingerprint: 1, userAgent: 1, registrationUserAgent: 1, lastLoginIp: 1, registrationIp: 1, lastActive: 1, lastLoginAt: 1, createdAt: 1 } }
      ).toArray(),
      db.collection('distributors').find(
        { email: { $exists: true, $ne: '' } },
        { projection: { email: 1, name: 1, role: 1, lastActive: 1, createdAt: 1 } }
      ).toArray(),
      db.collection('agents').find(
        { email: { $exists: true, $ne: '' } },
        { projection: { email: 1, name: 1, role: 1, lastActive: 1, createdAt: 1 } }
      ).toArray(),
      sessionsCollection.find({}).sort({ lastActive: -1 }).toArray(),
      blockedCollection.find({}).toArray()
    ]);

    const roleMap = new Map();
    const nameMap = new Map();

    allUsers.forEach((u) => {
      if (u.email) {
        const em = u.email.toLowerCase().trim();
        roleMap.set(em, u.role || 'player');
        if (u.name) nameMap.set(em, u.name);
      }
    });

    allDists.forEach((d) => {
      if (d.email) {
        const em = d.email.toLowerCase().trim();
        roleMap.set(em, d.role || 'distributor');
        if (d.name) nameMap.set(em, d.name);
      }
    });

    allAgents.forEach((a) => {
      if (a.email) {
        const em = a.email.toLowerCase().trim();
        roleMap.set(em, a.role || 'agent');
        if (a.name) nameMap.set(em, a.name);
      }
    });

    if (envAdminEmail) {
      roleMap.set(envAdminEmail, 'admin');
      nameMap.set(envAdminEmail, 'Super Admin (Owner)');
    }

    // 3. Blocked sets
    const blockedDeviceIds = new Set(blockedList.map((b) => b.deviceId).filter(Boolean));
    const blockedFingerprints = new Set(blockedList.map((b) => b.deviceFingerprint).filter(Boolean));
    const blockedEmails = new Set(blockedList.map((b) => b.email?.toLowerCase().trim()).filter(Boolean));

    // 4. Index existing device sessions by email
    const sessionsByEmail = new Map();
    allSessions.forEach((session) => {
      if (!session.email) return;
      const em = session.email.toLowerCase().trim();
      if (!sessionsByEmail.has(em)) sessionsByEmail.set(em, []);
      sessionsByEmail.get(em).push(session);
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rawDevices = [];

    // 5. First include all recorded device sessions
    allSessions.forEach((session) => {
      const emailKey = session.email?.toLowerCase().trim() || '';
      const isBlocked = blockedDeviceIds.has(session.deviceId) ||
        blockedFingerprints.has(session.deviceFingerprint) ||
        blockedEmails.has(emailKey);

      const uaParsed = session.userAgent ? parseUserAgent(session.userAgent, session.isApp, session.appType, session.deviceModel) : null;
      const liveRole = (emailKey === envAdminEmail || emailKey === adminEmailClean)
        ? 'admin'
        : (roleMap.get(emailKey) || session.role || 'player');

      const postInfo = getRolePostTitle(liveRole);
      const lastActiveDate = session.lastActive ? new Date(session.lastActive) : (session.createdAt ? new Date(session.createdAt) : null);
      const isActiveToday = Boolean(!isBlocked && lastActiveDate && lastActiveDate >= oneDayAgo);

      rawDevices.push({
        ...session,
        id: session._id?.toString() || `${emailKey}_${session.deviceId}`,
        name: nameMap.get(emailKey) || session.name || emailKey.split('@')[0],
        email: emailKey,
        role: liveRole,
        rolesList: postInfo.roles,
        postTitle: postInfo.title,
        postEmoji: postInfo.emoji,
        postColor: postInfo.color,
        badges: postInfo.badges,
        deviceName: session.deviceName || uaParsed?.deviceName || 'Android Smartphone',
        os: uaParsed?.os || session.os || 'Android',
        browser: session.browser || uaParsed?.browser || 'Chrome Browser',
        isApp: session.isApp !== undefined ? Boolean(session.isApp) : (uaParsed?.isApp || false),
        ip: session.ip || '—',
        lastActive: lastActiveDate,
        createdAt: session.createdAt ? new Date(session.createdAt) : lastActiveDate,
        isBlocked,
        isActiveToday,
        status: isBlocked ? 'PERMANENTLY_BLOCKED' : (isActiveToday ? 'ACTIVE' : 'INACTIVE')
      });
    });

    // 6. Guarantee EVERY user in allUsers has a device entry
    allUsers.forEach((u) => {
      if (!u.email) return;
      const emailKey = u.email.toLowerCase().trim();
      const existingUserSessions = sessionsByEmail.get(emailKey);

      // If user already has active session records in deviceSessions, they are already in rawDevices
      if (existingUserSessions && existingUserSessions.length > 0) return;

      const isBlocked = (u.deviceId && blockedDeviceIds.has(u.deviceId)) ||
        (u.deviceFingerprint && blockedFingerprints.has(u.deviceFingerprint)) ||
        blockedEmails.has(emailKey);

      const userUa = u.userAgent || u.registrationUserAgent || '';
      const uaParsed = userUa ? parseUserAgent(userUa) : null;
      const liveRole = (emailKey === envAdminEmail || emailKey === adminEmailClean)
        ? 'admin'
        : (roleMap.get(emailKey) || u.role || 'player');

      const postInfo = getRolePostTitle(liveRole);
      const lastActiveDate = u.lastActive ? new Date(u.lastActive) : (u.lastLoginAt ? new Date(u.lastLoginAt) : (u.createdAt ? new Date(u.createdAt) : null));
      const isActiveToday = Boolean(!isBlocked && lastActiveDate && lastActiveDate >= oneDayAgo);

      rawDevices.push({
        id: u._id?.toString() || `usr_${Buffer.from(emailKey).toString('hex').slice(0, 12)}`,
        name: u.name || emailKey.split('@')[0],
        email: emailKey,
        role: liveRole,
        rolesList: postInfo.roles,
        postTitle: postInfo.title,
        postEmoji: postInfo.emoji,
        postColor: postInfo.color,
        badges: postInfo.badges,
        deviceId: u.deviceId || (u.deviceFingerprint ? `fp-${u.deviceFingerprint.slice(0, 16)}` : `dev-${Buffer.from(emailKey).toString('hex').slice(0, 16)}`),
        deviceFingerprint: u.deviceFingerprint || '',
        hardwareFingerprint: u.hardwareFingerprint || '',
        deviceName: uaParsed?.deviceName || 'Android Smartphone',
        os: uaParsed?.os || 'Android',
        browser: uaParsed?.browser || 'Chrome Browser',
        isApp: uaParsed?.isApp || false,
        ip: u.lastLoginIp || u.registrationIp || '—',
        lastActive: lastActiveDate,
        createdAt: u.createdAt ? new Date(u.createdAt) : (lastActiveDate || now),
        isBlocked,
        isActiveToday,
        status: isBlocked ? 'PERMANENTLY_BLOCKED' : (isActiveToday ? 'ACTIVE' : 'INACTIVE')
      });
    });

    // 7. Guarantee EVERY distributor is included
    allDists.forEach((d) => {
      if (!d.email) return;
      const emailKey = d.email.toLowerCase().trim();
      const existingDistSessions = sessionsByEmail.get(emailKey);
      if (existingDistSessions && existingDistSessions.length > 0) return;

      const postInfo = getRolePostTitle('distributor');
      const lastActiveDate = d.lastActive ? new Date(d.lastActive) : (d.createdAt ? new Date(d.createdAt) : null);
      const isActiveToday = Boolean(lastActiveDate && lastActiveDate >= oneDayAgo);

      rawDevices.push({
        id: d._id?.toString() || `dist_${Buffer.from(emailKey).toString('hex').slice(0, 12)}`,
        name: d.name || 'Distributor Office',
        email: emailKey,
        role: 'distributor',
        rolesList: ['distributor'],
        postTitle: postInfo.title,
        postEmoji: postInfo.emoji,
        postColor: postInfo.color,
        badges: postInfo.badges,
        deviceId: `dist-${Buffer.from(emailKey).toString('hex').slice(0, 16)}`,
        deviceFingerprint: '',
        hardwareFingerprint: '',
        deviceName: 'Computer / PC',
        os: 'Windows / Mac',
        browser: 'Chrome Browser',
        isApp: false,
        ip: '—',
        lastActive: lastActiveDate,
        createdAt: d.createdAt ? new Date(d.createdAt) : now,
        isBlocked: false,
        isActiveToday,
        status: isActiveToday ? 'ACTIVE' : 'INACTIVE'
      });
    });

    // 8. Guarantee EVERY agent (affiliate) is included
    allAgents.forEach((a) => {
      if (!a.email) return;
      const emailKey = a.email.toLowerCase().trim();
      const existingAgentSessions = sessionsByEmail.get(emailKey);
      if (existingAgentSessions && existingAgentSessions.length > 0) return;

      const postInfo = getRolePostTitle('agent');
      const lastActiveDate = a.lastActive ? new Date(a.lastActive) : (a.createdAt ? new Date(a.createdAt) : null);
      const isActiveToday = Boolean(lastActiveDate && lastActiveDate >= oneDayAgo);

      rawDevices.push({
        id: a._id?.toString() || `agent_${Buffer.from(emailKey).toString('hex').slice(0, 12)}`,
        name: a.name || 'Affiliate Agent',
        email: emailKey,
        role: 'agent',
        rolesList: ['agent'],
        postTitle: postInfo.title,
        postEmoji: postInfo.emoji,
        postColor: postInfo.color,
        badges: postInfo.badges,
        deviceId: `agent-${Buffer.from(emailKey).toString('hex').slice(0, 16)}`,
        deviceFingerprint: '',
        hardwareFingerprint: '',
        deviceName: 'Smartphone / PC',
        os: 'Android / iOS',
        browser: 'Chrome Browser',
        isApp: false,
        ip: '—',
        lastActive: lastActiveDate,
        createdAt: a.createdAt ? new Date(a.createdAt) : now,
        isBlocked: false,
        isActiveToday,
        status: isActiveToday ? 'ACTIVE' : 'INACTIVE'
      });
    });

    // 9. Deduplicate devices per user by email + deviceId/hardware
    const deduplicatedMap = new Map();
    for (const dev of rawDevices) {
      const emailKey = String(dev.email || '').toLowerCase().trim();
      const devId = String(dev.deviceId || '').trim();
      const devName = String(dev.deviceName || dev.os || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const appKey = dev.isApp ? 'app' : 'browser';

      const key = `${emailKey}__${devId || devName}__${appKey}`;
      const existing = deduplicatedMap.get(key);

      if (!existing) {
        deduplicatedMap.set(key, dev);
      } else {
        const devDate = dev.lastActive ? new Date(dev.lastActive).getTime() : 0;
        const existingDate = existing.lastActive ? new Date(existing.lastActive).getTime() : 0;
        if (devDate > existingDate || (dev.isActiveToday && !existing.isActiveToday)) {
          deduplicatedMap.set(key, dev);
        }
      }
    }

    const devices = Array.from(deduplicatedMap.values());

    // 10. CRITICAL SORTING: Active devices show AT THE TOP!
    // Active devices (active in last 24h) first, then sorted by most recent lastActive date!
    devices.sort((a, b) => {
      // 1. Active devices COME FIRST at the top!
      if (a.isActiveToday && !b.isActiveToday) return -1;
      if (!a.isActiveToday && b.isActiveToday) return 1;

      // 2. Unblocked before blocked
      if (!a.isBlocked && b.isBlocked) return -1;
      if (a.isBlocked && !b.isBlocked) return 1;

      // 3. Most recently active timestamp first (descending)
      const aTime = a.lastActive ? new Date(a.lastActive).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.lastActive ? new Date(b.lastActive).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });

    // 11. Compute Global Stats
    const stats = {
      totalDevices: devices.length,
      activeToday: devices.filter((d) => d.isActiveToday).length,
      staffDevices: devices.filter((d) => d.rolesList && !d.rolesList.includes('player') && d.rolesList.length > 0).length,
      blockedCount: devices.filter((d) => d.isBlocked).length
    };

    // 12. Apply Role Filter
    let filteredDevices = devices;
    if (roleFilter) {
      const rf = roleFilter.toLowerCase().trim();
      filteredDevices = filteredDevices.filter((d) => {
        const rList = d.rolesList || [];
        const rStr = String(d.role || '').toLowerCase();

        if (rf === 'financial_admin' || rf === 'finance') {
          return rList.includes('financial_admin') || rStr.includes('financial');
        }
        if (rf === 'coins_admin' || rf === 'coins') {
          return rList.includes('coins_admin') || rStr.includes('coins');
        }
        if (rf === 'support_admin' || rf === 'support') {
          return rList.includes('support_admin') || rStr.includes('support');
        }
        if (rf === 'operation_admin' || rf === 'operation') {
          return rList.includes('operation_admin') || rStr.includes('operation');
        }
        if (rf === 'admin' || rf === 'super_admin') {
          return rList.includes('admin') || rStr.includes('admin') || d.email?.toLowerCase() === envAdminEmail || d.email?.toLowerCase() === adminEmailClean;
        }
        if (rf === 'distributor') {
          return rList.includes('distributor') || rStr.includes('distributor');
        }
        if (rf === 'distributor_staff') {
          return rList.includes('distributor_staff') || rStr.includes('distributor_staff');
        }
        if (rf === 'agent' || rf === 'affiliate') {
          return rList.includes('agent') || rStr.includes('agent') || rStr.includes('affiliate');
        }
        if (rf === 'player' || rf === 'user') {
          return rList.includes('player') && !rList.some((r) => ['admin', 'financial_admin', 'coins_admin', 'support_admin', 'operation_admin', 'distributor', 'distributor_staff', 'agent'].includes(r));
        }
        if (rf === 'staff') {
          return rList.some((r) => ['financial_admin', 'coins_admin', 'support_admin', 'distributor_staff', 'operation_admin'].includes(r));
        }
        return rList.includes(rf) || rStr.includes(rf);
      });
    }

    // 13. Apply Search Filter
    if (search.trim()) {
      const sLower = search.trim().toLowerCase();
      filteredDevices = filteredDevices.filter((d) => {
        const em = String(d.email || '').toLowerCase();
        const nm = String(d.name || '').toLowerCase();
        const pt = String(d.postTitle || '').toLowerCase();
        const ro = String(d.role || '').toLowerCase();
        const did = String(d.deviceId || '').toLowerCase();
        const ipAddr = String(d.ip || '').toLowerCase();
        const devName = String(d.deviceName || '').toLowerCase();
        const osName = String(d.os || '').toLowerCase();
        const brName = String(d.browser || '').toLowerCase();
        const stName = String(d.status || '').toLowerCase();

        return (
          em.includes(sLower) ||
          nm.includes(sLower) ||
          pt.includes(sLower) ||
          ro.includes(sLower) ||
          did.includes(sLower) ||
          ipAddr.includes(sLower) ||
          devName.includes(sLower) ||
          osName.includes(sLower) ||
          brName.includes(sLower) ||
          stName.includes(sLower)
        );
      });
    }

    // 14. Apply Status Filter
    if (statusFilter === 'BLOCKED') {
      filteredDevices = filteredDevices.filter((d) => d.isBlocked);
    } else if (statusFilter === 'ACTIVE') {
      filteredDevices = filteredDevices.filter((d) => d.isActiveToday && !d.isBlocked);
    } else if (statusFilter === 'INACTIVE') {
      filteredDevices = filteredDevices.filter((d) => !d.isActiveToday && !d.isBlocked);
    }

    // 15. Pagination
    const totalCount = filteredDevices.length;
    const skip = (page - 1) * limit;
    const paginatedDevices = filteredDevices.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      devices: paginatedDevices,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      stats
    });
  } catch (err) {
    console.error('Fetch devices API error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// POST perform device operations: block, unblock, or unlink (Super Admin Only)
export async function POST(req) {
  try {
    const { action, adminRole, adminEmail, email, deviceId, deviceFingerprint, reason } = await req.json();

    if (!isSuperAdminUser(adminRole, adminEmail)) {
      return NextResponse.json({ success: false, message: 'Access denied. Super Admin access required.' }, { status: 403 });
    }

    const db = await getDb();

    // 1. Unlink / Release Device Lock
    if (action === 'unlink' || action === 'release_lock') {
      if (!email && !deviceId && !deviceFingerprint) {
        return NextResponse.json({ success: false, message: 'Email, Device ID, or Fingerprint is required to release device lock.' }, { status: 400 });
      }

      const result = await unlinkDeviceRecord(db, { email, deviceId, deviceFingerprint });
      return NextResponse.json({
        success: true,
        message: `Device lock successfully released! ${email ? `(Email: ${email})` : ''} The user can now register or log in on this device.`,
        result
      });
    }

    // 2. Unblock Device
    if (action === 'unblock') {
      if (!deviceId && !deviceFingerprint) {
        return NextResponse.json({ success: false, message: 'Device ID or Device Fingerprint is required to unblock a device.' }, { status: 400 });
      }

      const result = await unblockDevice(db, { deviceId, deviceFingerprint });
      return NextResponse.json({
        success: true,
        message: 'Device has been successfully unblocked! Normal logins are restored for this device.',
        result
      });
    }

    // 3. Default: Permanent Block
    if (!deviceId && !deviceFingerprint) {
      return NextResponse.json({ success: false, message: 'Device ID or Device Fingerprint is required to block a device.' }, { status: 400 });
    }

    const record = await blockDevicePermanently(db, {
      deviceId,
      deviceFingerprint,
      blockedBy: adminEmail || 'super_admin',
      reason: reason || 'Permanently blocked by Super Admin'
    });

    return NextResponse.json({
      success: true,
      message: 'Device has been permanently blocked from logging in across all accounts.',
      blockedRecord: record
    });
  } catch (err) {
    console.error('Device action API error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// DELETE unlink / release device binding (Super Admin Only)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole') || '';
    const adminEmail = searchParams.get('adminEmail') || '';
    const email = searchParams.get('email') || '';
    const deviceId = searchParams.get('deviceId') || '';
    const deviceFingerprint = searchParams.get('deviceFingerprint') || '';

    if (!isSuperAdminUser(adminRole, adminEmail)) {
      return NextResponse.json({ success: false, message: 'Access denied. Super Admin access required.' }, { status: 403 });
    }

    if (!email && !deviceId && !deviceFingerprint) {
      return NextResponse.json({ success: false, message: 'Email, Device ID, or Fingerprint is required to unlink a device.' }, { status: 400 });
    }

    const db = await getDb();
    const result = await unlinkDeviceRecord(db, { email, deviceId, deviceFingerprint });

    return NextResponse.json({
      success: true,
      message: `Device lock released successfully! ${email ? `(Email: ${email})` : ''}`,
      result
    });
  } catch (err) {
    console.error('Delete/unlink device API error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}
