import { cache } from './cache';
import { publishAdminEvent } from './adminEvents';
import { notifyStaffAndDistributorAsync } from './pushNotifications';

export function gameTitleRegex(cleanTitle) {
  const t = String(cleanTitle || '').trim();
  return new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export async function playerNeedsGameCredentials(db, userEmail, gameTitle) {
  const cleanEmail = String(userEmail || '').toLowerCase().trim();
  const cleanTitle = String(gameTitle || '').trim();
  if (!cleanEmail || !cleanTitle || cleanTitle === 'Lobby') return false;

  const acc = await db.collection('gameAccounts').findOne(
    { userEmail: cleanEmail, gameTitle: gameTitleRegex(cleanTitle) },
    { projection: { username: 1, password: 1 } }
  );
  if (!acc) return true;
  const u = String(acc.username || '').trim();
  const p = String(acc.password || '').trim();
  return !u || !p;
}

export async function resolveDistributorMeta(db, distributorId) {
  const id = String(distributorId || '').trim();
  if (!id) return { distributorId: '', distributorType: '', distributorName: '' };
  const dist = await db.collection('distributors').findOne({ id }, { projection: { type: 1, name: 1 } });
  return {
    distributorId: id,
    distributorType: dist?.type || '',
    distributorName: dist?.name || ''
  };
}

/**
 * Create or refresh a PENDING accountRequests row (may stay hidden until coins approval).
 */
export async function upsertAwaitingCredentialsRequest(db, opts = {}) {
  const {
    userEmail,
    gameTitle,
    distributorId = '',
    distributorType = '',
    distributorName = '',
    transactionId = '',
    freeplayPending = false,
    freeplayAmount = 0,
    hasScreenshot = false,
    note = '',
    awaitingCoinsApproval = true
  } = opts;

  const cleanEmail = String(userEmail || '').toLowerCase().trim();
  const cleanTitle = String(gameTitle || '').trim();
  if (!cleanEmail || !cleanTitle) return { action: 'skip' };

  const needs = await playerNeedsGameCredentials(db, cleanEmail, cleanTitle);
  if (!needs) return { action: 'has_credentials' };

  const requestsCollection = db.collection('accountRequests');
  const existing = await requestsCollection.findOne({
    userEmail: cleanEmail,
    gameTitle: gameTitleRegex(cleanTitle),
    status: 'PENDING'
  });

  const now = new Date().toISOString();
  const fields = {
    gameTitle: cleanTitle,
    userEmail: cleanEmail,
    status: 'PENDING',
    distributorId,
    distributorType,
    distributorName,
    needsCredentials: true,
    awaitingCoinsApproval: Boolean(awaitingCoinsApproval),
    coinsApprovedAt: awaitingCoinsApproval ? '' : now,
    ...(transactionId ? { linkedTransactionId: String(transactionId), freeplayTransactionId: String(transactionId) } : {}),
    ...(freeplayPending ? { freeplayPending: true, freeplayAmount: parseFloat(freeplayAmount) || 0 } : {}),
    hasScreenshot: Boolean(hasScreenshot),
    note: note || (freeplayPending ? 'Freeplay — set credentials after coins approval' : 'Set game username & password'),
    updatedAt: now
  };

  if (existing) {
    await requestsCollection.updateOne({ _id: existing._id }, { $set: fields });
    return { action: 'updated', requestId: existing.id, distributorId: fields.distributorId };
  }

  const newId = (Date.now() + Math.floor(Math.random() * 100)).toString();
  await requestsCollection.insertOne({
    id: newId,
    date: now,
    createdAt: now,
    ...fields
  });
  return { action: 'created', requestId: newId, distributorId: fields.distributorId };
}

/**
 * After finance/coins approval: show row in Requests + push staff to set credentials.
 */
export async function activateCredentialsAccountRequest(db, opts = {}) {
  const {
    userEmail,
    gameTitle,
    transactionId = '',
    source = 'coins_approved',
    distributorId: distOverride = '',
    freeplayPending = false,
    freeplayAmount = 0,
    hasScreenshot = false
  } = opts;

  const cleanEmail = String(userEmail || '').toLowerCase().trim();
  const cleanTitle = String(gameTitle || '').trim();
  if (!cleanEmail || !cleanTitle) return { activated: false };

  if (!(await playerNeedsGameCredentials(db, cleanEmail, cleanTitle))) {
    return { activated: false, reason: 'has_credentials' };
  }

  const requestsCollection = db.collection('accountRequests');
  const now = new Date().toISOString();

  let req = await requestsCollection.findOne({
    userEmail: cleanEmail,
    gameTitle: gameTitleRegex(cleanTitle),
    status: 'PENDING'
  });

  let distId = distOverride || req?.distributorId || '';
  if (!req) {
    const user = await db.collection('users').findOne({ email: cleanEmail }, { projection: { distributorId: 1 } });
    const meta = await resolveDistributorMeta(db, user?.distributorId || distOverride);
    distId = meta.distributorId;
    const insert = await upsertAwaitingCredentialsRequest(db, {
      userEmail: cleanEmail,
      gameTitle: cleanTitle,
      ...meta,
      transactionId,
      freeplayPending: freeplayPending || source === 'freeplay_coins',
      freeplayAmount,
      hasScreenshot,
      awaitingCoinsApproval: false,
      note: 'Coins approved — enter game username & password in Requests'
    });
    if (insert.action === 'has_credentials' || insert.action === 'skip') {
      return { activated: false, reason: insert.action };
    }
    req = await requestsCollection.findOne({ id: insert.requestId });
  } else {
    distId = req.distributorId || distId;
    await requestsCollection.updateOne(
      { _id: req._id },
      {
        $set: {
          awaitingCoinsApproval: false,
          needsCredentials: true,
          coinsApprovedAt: now,
          ...(transactionId ? { linkedTransactionId: String(transactionId) } : {}),
          updatedAt: now
        }
      }
    );
  }

  cache.del('admin_stats');
  publishAdminEvent('requests', {
    distributorId: distId || '',
    gameTitle: cleanTitle,
    needsCredentials: true
  });

  notifyStaffAndDistributorAsync(
    db,
    {
      title: 'Set game credentials',
      body: `${cleanEmail} · ${cleanTitle} — coins approved; add username & password in Requests`,
      adminUrl: '/admin/requests',
      distributorUrl: '/distributor/requests',
      url: '/admin/requests',
      tag: `creds-${req?.id || transactionId}`,
      gameTitle: cleanTitle,
      alertKind: 'game'
    },
    distId
  );

  return { activated: true, id: req?.id };
}

/** Mongo filter: hide rows still waiting on coins approval (admin lists + badge counts). */
export function excludeAwaitingCoinsApprovalFilter() {
  return {
    $or: [
      { awaitingCoinsApproval: { $ne: true } },
      { awaitingCoinsApproval: { $exists: false } },
      { awaitingCoinsApproval: null }
    ]
  };
}