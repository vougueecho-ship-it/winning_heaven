import { getDb } from './mongodb';
import { revokeSession, clearSessionRevoke } from './sessionRevoke';

/**
 * Extracts specific hardware model, smartphone brand or desktop device type.
 */
export function detectDeviceModel(uaString = '', clientModel = '') {
  if (clientModel && clientModel !== 'K' && clientModel !== 'unknown' && clientModel !== 'undefined') {
    return clientModel;
  }
  const ua = String(uaString || '');

  // iOS check
  if (/iPhone/i.test(ua)) return 'Apple iPhone';
  if (/iPad/i.test(ua)) return 'Apple iPad';
  if (/iPod/i.test(ua)) return 'Apple iPod';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Apple Mac / MacBook';
  if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10/11 PC';
  if (/Windows NT/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'Linux PC';

  // Android Model Extraction
  // Look for: Linux; Android <version>; <model> (Build|;|)|AppleWebKit
  const match = ua.match(/Android\s+[\d\.]+;\s*([^;)\/]+?)(?:\s+Build|\s*;|\s*\)|\s*AppleWebKit)/i);
  let rawModel = match ? match[1].trim() : '';

  // Clean raw model
  rawModel = rawModel.replace(/Build\/.*$/i, '').replace(/[\r\n\t]/g, '').trim();

  // If model is just "K" (Chrome Android 10+ user-agent reduction placeholder) or empty
  if (!rawModel || rawModel === 'K' || rawModel === 'Mobile') {
    if (/Mobile/i.test(ua)) return 'Android Smartphone';
    if (/Tablet/i.test(ua)) return 'Android Tablet';
    return 'Android Device';
  }

  // Model brand identification and formatting
  if (/^SM-|^GT-|^SCH-|^SGH-|^SHV-|^Galaxy/i.test(rawModel)) {
    return `Samsung Galaxy (${rawModel})`;
  }
  if (/^Pixel/i.test(rawModel)) {
    return `Google ${rawModel}`;
  }
  if (/^Redmi|^POCO|^Mi\s|^220|^210|^230|^240|^M20|^M21|^2106|^2201/i.test(rawModel)) {
    return `Xiaomi / Redmi (${rawModel})`;
  }
  if (/^CPH|^RMX|^OnePlus|^NE2|^KB2|^IN2/i.test(rawModel)) {
    if (/^RMX/i.test(rawModel)) return `Realme (${rawModel})`;
    if (/^CPH/i.test(rawModel)) return `Oppo / OnePlus (${rawModel})`;
    return `OnePlus (${rawModel})`;
  }
  if (/^V2|^V1|^vivo/i.test(rawModel)) {
    return `Vivo (${rawModel})`;
  }
  if (/^moto|^XT/i.test(rawModel)) {
    return `Motorola (${rawModel})`;
  }
  if (/^Infinix|^X6/i.test(rawModel)) {
    return `Infinix (${rawModel})`;
  }
  if (/^TECNO|^KG|^BD/i.test(rawModel)) {
    return `Tecno (${rawModel})`;
  }
  if (/^HUAWEI|^HONOR|^VOG-|^ELE-/i.test(rawModel)) {
    return `Huawei / Honor (${rawModel})`;
  }
  if (/^Xperia|^SO-/i.test(rawModel)) {
    return `Sony Xperia (${rawModel})`;
  }

  return rawModel;
}

/**
 * Parses user agent string into human-friendly OS, Device Model & Browser / App details.
 */
export function parseUserAgent(uaString = '', isApp = false, appType = '', clientModel = '') {
  const ua = String(uaString || '');
  let os = 'Unknown OS';
  let browser = 'Web Browser';
  let deviceName = detectDeviceModel(ua, clientModel);
  let isInstalledApp = Boolean(isApp);

  // Check if UA indicates WebView / APK / TWA / App
  const isWebView = /;\s*wv\)|Version\/4\.0.*Chrome\/|WinningHeavenApp|WinningHeaven|com\.winningheaven/i.test(ua);
  if (isWebView || isApp || appType === 'PWA_APP' || appType === 'ANDROID_APK' || appType === 'APP') {
    isInstalledApp = true;
  }

  // OS Detection
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (iPhone/iPad)';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser vs App Detection
  if (isInstalledApp) {
    browser = isWebView ? 'Winning Heaven App (APK)' : 'Winning Heaven App (Installed)';
  } else {
    if (/Edg/i.test(ua)) browser = 'Edge Browser';
    else if (/Brave/i.test(ua)) browser = 'Brave Browser';
    else if (/OPR|Opera/i.test(ua)) browser = 'Opera Browser';
    else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox Browser';
    else if (/CriOS/i.test(ua)) browser = 'Chrome (iOS)';
    else if (/Chrome/i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Chrome Browser';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari Browser';
    else browser = 'Web Browser';
  }

  return {
    os,
    browser,
    deviceName,
    isApp: isInstalledApp,
    appType: isInstalledApp ? 'APP' : 'BROWSER',
    raw: ua
  };
}

/**
 * Maps an individual role key to its badge metadata.
 */
export function getSingleRoleInfo(role = '') {
  const r = String(role || '').toLowerCase().trim();
  switch (r) {
    case 'admin':
    case 'super_admin':
    case 'owner':
      return { role: 'admin', title: 'Super Admin (Owner)', emoji: '👑', color: '#facc15' };
    case 'financial_admin':
    case 'financial':
    case 'finance':
      return { role: 'financial_admin', title: 'Financial Admin', emoji: '💳', color: '#38bdf8' };
    case 'coins_admin':
    case 'coins':
      return { role: 'coins_admin', title: 'Coins Staff', emoji: '🪙', color: '#a855f7' };
    case 'support_admin':
    case 'support':
      return { role: 'support_admin', title: 'Support Agent', emoji: '🎧', color: '#4ade80' };
    case 'operation_admin':
    case 'operation':
    case 'operations':
      return { role: 'operation_admin', title: 'Operations Admin', emoji: '⚙️', color: '#fb923c' };
    case 'distributor':
      return { role: 'distributor', title: 'Distributor Office', emoji: '🏢', color: '#fb923c' };
    case 'distributor_staff':
      return { role: 'distributor_staff', title: 'Distributor Staff', emoji: '👔', color: '#f472b6' };
    case 'agent':
    case 'affiliate':
    case 'affiliate_agent':
      return { role: 'agent', title: 'Affiliate Agent', emoji: '💼', color: '#818cf8' };
    default:
      return null;
  }
}

/**
 * Returns human-friendly Post / Role title and badges for single or multiple assigned roles.
 */
export function getRolePostTitle(role = '') {
  const roleStr = Array.isArray(role) ? role.join(',') : String(role || '');
  const rawParts = roleStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  
  const matchedRoles = [];
  for (const part of rawParts) {
    const info = getSingleRoleInfo(part);
    if (info && !matchedRoles.some(m => m.role === info.role)) {
      matchedRoles.push(info);
    }
  }

  // If no staff/admin roles matched, return Player Account
  if (matchedRoles.length === 0) {
    return {
      title: 'Player Account',
      emoji: '🎮',
      color: '#94a3b8',
      roles: ['player'],
      badges: [{ role: 'player', title: 'Player Account', emoji: '🎮', color: '#94a3b8' }]
    };
  }

  // If super admin is present, it takes top priority
  const hasAdmin = matchedRoles.find(m => m.role === 'admin');
  const primary = hasAdmin || matchedRoles[0];

  return {
    title: matchedRoles.map(m => m.title).join(' & '),
    emoji: primary.emoji,
    color: primary.color,
    roles: matchedRoles.map(m => m.role),
    badges: matchedRoles
  };
}

/**
 * Check if a device ID, fingerprint, user email, or IP is permanently blocked in blockedDevices collection or users collection.
 */
export async function isDeviceBlocked(db, deviceId, deviceFingerprint, hardwareFingerprint = '', email = '', ip = '') {
  const cleanId = typeof deviceId === 'string' ? deviceId.trim() : '';
  const cleanFp = typeof deviceFingerprint === 'string' ? deviceFingerprint.trim() : '';
  const cleanHfp = typeof hardwareFingerprint === 'string' ? hardwareFingerprint.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
  const cleanIp = typeof ip === 'string' && ip !== '127.0.0.1' && ip !== '::1' && ip !== '—' && ip !== 'Current Session' ? ip.trim() : '';

  if (!cleanId && !cleanFp && !cleanHfp && !cleanEmail && !cleanIp) return false;

  const conditions = [];
  if (cleanId) conditions.push({ deviceId: cleanId });
  if (cleanFp) conditions.push({ deviceFingerprint: cleanFp });
  if (cleanHfp) conditions.push({ hardwareFingerprint: cleanHfp });
  if (cleanEmail) conditions.push({ email: cleanEmail });
  if (cleanIp) conditions.push({ ip: cleanIp });

  // 1. Direct match in blockedDevices collection
  if (conditions.length > 0) {
    const blocked = await db.collection('blockedDevices').findOne({
      $or: conditions
    });
    if (blocked) return true;
  }

  // 2. Check users collection if email is provided
  if (cleanEmail) {
    const user = await db.collection('users').findOne(
      { email: cleanEmail },
      { projection: { isDeviceBlocked: 1, deviceId: 1, deviceFingerprint: 1, hardwareFingerprint: 1, status: 1 } }
    );
    if (user) {
      if (user.isDeviceBlocked || user.status === 'blocked') return true;

      // If user has a registered device in MongoDB that is blocked
      const userDevConditions = [];
      if (user.deviceId) userDevConditions.push({ deviceId: String(user.deviceId).trim() });
      if (user.deviceFingerprint) userDevConditions.push({ deviceFingerprint: String(user.deviceFingerprint).trim() });
      if (user.hardwareFingerprint) userDevConditions.push({ hardwareFingerprint: String(user.hardwareFingerprint).trim() });

      if (userDevConditions.length > 0) {
        const devBlocked = await db.collection('blockedDevices').findOne({ $or: userDevConditions });
        if (devBlocked) return true;
      }
    }
  }

  // 3. If hardware/device identifiers are provided, check if any user marked with isDeviceBlocked shares them
  if (cleanId || cleanFp || cleanHfp) {
    const devMatch = [];
    if (cleanId) devMatch.push({ deviceId: cleanId });
    if (cleanFp) devMatch.push({ deviceFingerprint: cleanFp });
    if (cleanHfp) devMatch.push({ hardwareFingerprint: cleanHfp });

    const matchedBlockedUser = await db.collection('users').findOne(
      { isDeviceBlocked: true, $or: devMatch },
      { projection: { _id: 1 } }
    );
    if (matchedBlockedUser) return true;
  }

  return false;
}

/**
 * Permanently block a device ID, fingerprint, IP, and associated user account.
 * Irreversible operation that also revokes live sessions so requests are killed immediately.
 */
export async function blockDevicePermanently(db, { email, deviceId, deviceFingerprint, hardwareFingerprint, ip, blockedBy, reason }) {
  const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
  const cleanId = typeof deviceId === 'string' ? deviceId.trim() : '';
  const cleanFp = typeof deviceFingerprint === 'string' ? deviceFingerprint.trim() : '';
  const cleanHfp = typeof hardwareFingerprint === 'string' ? hardwareFingerprint.trim() : '';
  const cleanIp = typeof ip === 'string' && ip !== '127.0.0.1' && ip !== '::1' && ip !== '—' && ip !== 'Current Session' ? ip.trim() : '';

  if (!cleanId && !cleanFp && !cleanHfp && !cleanEmail && !cleanIp) {
    throw new Error('Email, Device ID, IP, or Fingerprint is required to block a device.');
  }

  const allDeviceIds = new Set();
  const allFingerprints = new Set();
  const allHardwareFps = new Set();
  const allIps = new Set();

  if (cleanId) allDeviceIds.add(cleanId);
  if (cleanFp) allFingerprints.add(cleanFp);
  if (cleanHfp) allHardwareFps.add(cleanHfp);
  if (cleanIp) allIps.add(cleanIp);

  // If email is provided, gather all associated device identifiers from users, deviceSessions & supportMessages
  if (cleanEmail) {
    const userDoc = await db.collection('users').findOne({ email: cleanEmail });
    if (userDoc) {
      if (userDoc.deviceId) allDeviceIds.add(String(userDoc.deviceId).trim());
      if (userDoc.deviceFingerprint) allFingerprints.add(String(userDoc.deviceFingerprint).trim());
      if (userDoc.hardwareFingerprint) allHardwareFps.add(String(userDoc.hardwareFingerprint).trim());
      if (userDoc.lastLoginIp && userDoc.lastLoginIp !== '127.0.0.1' && userDoc.lastLoginIp !== '::1') allIps.add(String(userDoc.lastLoginIp).trim());
      if (userDoc.registrationIp && userDoc.registrationIp !== '127.0.0.1' && userDoc.registrationIp !== '::1') allIps.add(String(userDoc.registrationIp).trim());
    }

    const sessions = await db.collection('deviceSessions').find({ email: cleanEmail }).toArray();
    for (const s of sessions) {
      if (s.deviceId) allDeviceIds.add(String(s.deviceId).trim());
      if (s.deviceFingerprint) allFingerprints.add(String(s.deviceFingerprint).trim());
      if (s.hardwareFingerprint) allHardwareFps.add(String(s.hardwareFingerprint).trim());
      if (s.ip && s.ip !== '127.0.0.1' && s.ip !== '::1' && s.ip !== '—') allIps.add(String(s.ip).trim());
    }

    // Also gather from supportMessages (for guests or users who chatted)
    const supportMsgs = await db.collection('supportMessages').find(
      { userEmail: cleanEmail },
      { projection: { deviceId: 1, deviceFingerprint: 1, hardwareFingerprint: 1, ip: 1 } }
    ).toArray();
    for (const sm of supportMsgs) {
      if (sm.deviceId) allDeviceIds.add(String(sm.deviceId).trim());
      if (sm.deviceFingerprint) allFingerprints.add(String(sm.deviceFingerprint).trim());
      if (sm.hardwareFingerprint) allHardwareFps.add(String(sm.hardwareFingerprint).trim());
      if (sm.ip && sm.ip !== '127.0.0.1' && sm.ip !== '::1' && sm.ip !== '—') allIps.add(String(sm.ip).trim());
    }

    // Set permanent block flag on user document if exists
    await db.collection('users').updateOne(
      { email: cleanEmail },
      {
        $set: {
          isDeviceBlocked: true,
          status: 'blocked',
          deviceBlockedAt: new Date(),
          deviceBlockReason: reason || 'Permanently blocked by Admin'
        }
      }
    );

    // Immediately revoke live session in memory so useSessionGuard kicks them out
    revokeSession(cleanEmail);
  }

  const record = {
    email: cleanEmail,
    deviceId: cleanId || Array.from(allDeviceIds)[0] || '',
    deviceFingerprint: cleanFp || Array.from(allFingerprints)[0] || '',
    hardwareFingerprint: cleanHfp || Array.from(allHardwareFps)[0] || '',
    ip: cleanIp || Array.from(allIps)[0] || '',
    allDeviceIds: Array.from(allDeviceIds),
    allFingerprints: Array.from(allFingerprints),
    allHardwareFps: Array.from(allHardwareFps),
    allIps: Array.from(allIps),
    blockedBy: blockedBy || 'admin',
    reason: reason || 'Permanently blocked by Admin',
    isPermanent: true,
    blockedAt: new Date()
  };

  // Upsert into blockedDevices for fast exact queries
  const bulkBlockOps = [];
  if (cleanEmail) {
    bulkBlockOps.push({
      updateOne: {
        filter: { email: cleanEmail },
        update: { $set: { email: cleanEmail, blockedAt: new Date(), blockedBy, reason, isPermanent: true } },
        upsert: true
      }
    });
  }
  allDeviceIds.forEach((id) => {
    if (id) {
      bulkBlockOps.push({
        updateOne: {
          filter: { deviceId: id },
          update: { $set: { deviceId: id, email: cleanEmail, blockedAt: new Date(), blockedBy, reason, isPermanent: true } },
          upsert: true
        }
      });
    }
  });
  allFingerprints.forEach((fp) => {
    if (fp) {
      bulkBlockOps.push({
        updateOne: {
          filter: { deviceFingerprint: fp },
          update: { $set: { deviceFingerprint: fp, email: cleanEmail, blockedAt: new Date(), blockedBy, reason, isPermanent: true } },
          upsert: true
        }
      });
    }
  });
  allHardwareFps.forEach((hfp) => {
    if (hfp) {
      bulkBlockOps.push({
        updateOne: {
          filter: { hardwareFingerprint: hfp },
          update: { $set: { hardwareFingerprint: hfp, email: cleanEmail, blockedAt: new Date(), blockedBy, reason, isPermanent: true } },
          upsert: true
        }
      });
    }
  });
  allIps.forEach((ipAddr) => {
    if (ipAddr) {
      bulkBlockOps.push({
        updateOne: {
          filter: { ip: ipAddr },
          update: { $set: { ip: ipAddr, email: cleanEmail, blockedAt: new Date(), blockedBy, reason, isPermanent: true } },
          upsert: true
        }
      });
    }
  });

  if (bulkBlockOps.length > 0) {
    await db.collection('blockedDevices').bulkWrite(bulkBlockOps).catch(() => {});
  }

  // Update status in deviceSessions collection
  const sessionFilter = [];
  if (cleanEmail) sessionFilter.push({ email: cleanEmail });
  allDeviceIds.forEach((id) => { if (id) sessionFilter.push({ deviceId: id }); });
  allFingerprints.forEach((fp) => { if (fp) sessionFilter.push({ deviceFingerprint: fp }); });

  if (sessionFilter.length > 0) {
    await db.collection('deviceSessions').updateMany(
      { $or: sessionFilter },
      { $set: { status: 'PERMANENTLY_BLOCKED', blockedAt: new Date() } }
    );
  }

  return record;
}

/**
 * Log or update an active device session in MongoDB.
 */
export async function trackDeviceSession(db, { email, name, role, deviceId, deviceFingerprint, hardwareFingerprint, userAgent, ip, isApp, appType, deviceModel }) {
  if (!email) return;

  const cleanEmail = email.toLowerCase().trim();
  const cleanFp = typeof deviceFingerprint === 'string' ? deviceFingerprint.trim() : '';
  const cleanHfp = typeof hardwareFingerprint === 'string' ? hardwareFingerprint.trim() : '';
  let cleanId = typeof deviceId === 'string' ? deviceId.trim() : '';

  if (!cleanId) {
    if (cleanFp) {
      cleanId = `fp-${cleanFp.slice(0, 16)}`;
    } else if (cleanHfp) {
      cleanId = `hfp-${cleanHfp.slice(0, 16)}`;
    } else {
      // Deterministic fallback ID based on user and user-agent
      cleanId = `dev-${Buffer.from(`${cleanEmail}:${userAgent || 'web'}`).toString('hex').slice(0, 16)}`;
    }
  }

  const uaParsed = parseUserAgent(userAgent, isApp, appType, deviceModel);
  const postInfo = getRolePostTitle(role);

  const sessionDoc = {
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    role: role || 'player',
    postTitle: postInfo.title,
    postEmoji: postInfo.emoji,
    postColor: postInfo.color,
    deviceId: cleanId,
    deviceFingerprint: cleanFp,
    hardwareFingerprint: cleanHfp,
    deviceName: uaParsed.deviceName,
    os: uaParsed.os,
    browser: uaParsed.browser,
    isApp: uaParsed.isApp,
    appType: uaParsed.appType,
    userAgent: uaParsed.raw,
    ip: ip || 'Unknown',
    lastActive: new Date(),
    status: 'ACTIVE'
  };

  const lookupKey = cleanId ? { email: cleanEmail, deviceId: cleanId } : { email: cleanEmail };

  await db.collection('deviceSessions').updateOne(
    lookupKey,
    {
      $set: sessionDoc,
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  // If real client fingerprint ID is present, remove old server fallback session records
  if (cleanId.startsWith('did_') || cleanId.startsWith('fp_') || cleanId.startsWith('hfp_')) {
    db.collection('deviceSessions').deleteMany({
      email: cleanEmail,
      deviceId: { $regex: '^dev-' }
    }).catch(() => {});
  }
}

/**
 * Unlinks / clears device binding from user(s) and sessions in MongoDB.
 * Frees the device so new accounts can be registered from it without triggering the duplicate account error.
 */
export async function unlinkDeviceRecord(db, { email, deviceId, deviceFingerprint, hardwareFingerprint }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  const cleanId = deviceId ? String(deviceId).trim() : '';
  const cleanFp = deviceFingerprint ? String(deviceFingerprint).trim() : '';
  const cleanHfp = hardwareFingerprint ? String(hardwareFingerprint).trim() : '';

  if (!cleanEmail && !cleanId && !cleanFp && !cleanHfp) {
    throw new Error('Email, Device ID, or Fingerprint is required to unlink a device.');
  }

  // If email is provided, fetch user first to capture their deviceId and deviceFingerprint
  let targetUser = null;
  if (cleanEmail) {
    targetUser = await db.collection('users').findOne({ email: cleanEmail });
  }

  const effectiveDeviceId = cleanId || (targetUser?.deviceId ? String(targetUser.deviceId).trim() : '');
  const effectiveFingerprint = cleanFp || (targetUser?.deviceFingerprint ? String(targetUser.deviceFingerprint).trim() : '');
  const effectiveHardwareFp = cleanHfp || (targetUser?.hardwareFingerprint ? String(targetUser.hardwareFingerprint).trim() : '');

  const userConditions = [];
  if (cleanEmail) userConditions.push({ email: cleanEmail });
  if (effectiveDeviceId) userConditions.push({ deviceId: effectiveDeviceId });
  if (effectiveFingerprint) userConditions.push({ deviceFingerprint: effectiveFingerprint });
  if (effectiveHardwareFp) userConditions.push({ hardwareFingerprint: effectiveHardwareFp });

  // 1. Unset deviceId, deviceFingerprint & hardwareFingerprint in users collection
  const usersResult = await db.collection('users').updateMany(
    { $or: userConditions },
    {
      $unset: {
        deviceId: '',
        deviceFingerprint: '',
        hardwareFingerprint: '',
        registrationIp: '',
        registrationUserAgent: ''
      }
    }
  );

  // 2. Remove from deviceSessions collection
  const sessionConditions = [];
  if (cleanEmail) sessionConditions.push({ email: cleanEmail });
  if (effectiveDeviceId) sessionConditions.push({ deviceId: effectiveDeviceId });
  if (effectiveFingerprint) sessionConditions.push({ deviceFingerprint: effectiveFingerprint });
  if (effectiveHardwareFp) sessionConditions.push({ hardwareFingerprint: effectiveHardwareFp });

  const sessionResult = await db.collection('deviceSessions').deleteMany({
    $or: sessionConditions
  });

  // 3. Also remove from blockedDevices if present
  if (effectiveDeviceId || effectiveFingerprint) {
    const blockConditions = [];
    if (effectiveDeviceId) blockConditions.push({ deviceId: effectiveDeviceId });
    if (effectiveFingerprint) blockConditions.push({ deviceFingerprint: effectiveFingerprint });
    await db.collection('blockedDevices').deleteMany({
      $or: blockConditions
    });
  }

  // 4. Also remove isDeviceBlocked flag from users
  if (cleanEmail) {
    await db.collection('users').updateOne(
      { email: cleanEmail },
      { $unset: { isDeviceBlocked: '', deviceBlockedAt: '', deviceBlockReason: '' } }
    );
    clearSessionRevoke(cleanEmail);
  }

  return {
    success: true,
    matchedUsers: usersResult.matchedCount,
    modifiedUsers: usersResult.modifiedCount,
    deletedSessions: sessionResult.deletedCount,
    unlinkedEmail: cleanEmail,
    effectiveDeviceId,
    effectiveFingerprint
  };
}

/**
 * Unblocks a permanently blocked device.
 */
export async function unblockDevice(db, { email, deviceId, deviceFingerprint, hardwareFingerprint, ip }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  const cleanId = deviceId ? String(deviceId).trim() : '';
  const cleanFp = deviceFingerprint ? String(deviceFingerprint).trim() : '';
  const cleanHfp = hardwareFingerprint ? String(hardwareFingerprint).trim() : '';
  const cleanIp = ip ? String(ip).trim() : '';

  if (!cleanId && !cleanFp && !cleanHfp && !cleanEmail && !cleanIp) {
    throw new Error('Email, Device ID, IP, or Fingerprint is required to unblock a device.');
  }

  const conditions = [];
  if (cleanEmail) conditions.push({ email: cleanEmail });
  if (cleanId) conditions.push({ deviceId: cleanId });
  if (cleanFp) conditions.push({ deviceFingerprint: cleanFp });
  if (cleanHfp) conditions.push({ hardwareFingerprint: cleanHfp });
  if (cleanIp) conditions.push({ ip: cleanIp });

  // If email is provided, gather any user device identifiers
  if (cleanEmail) {
    const userDoc = await db.collection('users').findOne({ email: cleanEmail });
    if (userDoc) {
      if (userDoc.deviceId) conditions.push({ deviceId: String(userDoc.deviceId).trim() });
      if (userDoc.deviceFingerprint) conditions.push({ deviceFingerprint: String(userDoc.deviceFingerprint).trim() });
      if (userDoc.hardwareFingerprint) conditions.push({ hardwareFingerprint: String(userDoc.hardwareFingerprint).trim() });
    }

    await db.collection('users').updateOne(
      { email: cleanEmail },
      { $unset: { isDeviceBlocked: '', deviceBlockedAt: '', deviceBlockReason: '' }, $set: { status: 'active' } }
    );

    clearSessionRevoke(cleanEmail);
  }

  const deleteResult = await db.collection('blockedDevices').deleteMany({
    $or: conditions
  });

  await db.collection('deviceSessions').updateMany(
    { $or: conditions },
    { $set: { status: 'ACTIVE' }, $unset: { blockedAt: '' } }
  );

  return {
    success: true,
    unblockedCount: deleteResult.deletedCount
  };
}
