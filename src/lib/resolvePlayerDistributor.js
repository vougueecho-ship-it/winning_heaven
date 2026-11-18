/**
 * Resolve which distributor office owns a player (for support, settings, routing).
 */

export function isPlatformPlayer(userDoc) {
  const id = String(userDoc?.distributorId || '').trim();
  return !id;
}

async function inheritDistributorFromReferrer(db, userDoc) {
  if (!userDoc) return '';
  const ref = String(userDoc.referredBy || '').trim();
  if (!ref) return '';

  const referrer = await db.collection('users').findOne(
    {
      $or: [{ email: ref.toLowerCase() }, { referralCode: ref.toUpperCase() }]
    },
    { projection: { distributorId: 1, role: 1 } }
  );
  if (!referrer || String(referrer.role || 'user') !== 'user') return '';
  return String(referrer.distributorId || '').trim();
}

async function validateDistributorId(db, distId) {
  const id = String(distId || '').trim();
  if (!id) return null;
  const row = await db.collection('distributors').findOne({ id }, { projection: { id: 1, type: 1, name: 1 } });
  return row || null;
}

/**
 * @returns {{ distId: string, distType: string, distName: string, userDoc: object|null, updatedUser: boolean }}
 */
export async function resolvePlayerDistributor(db, userEmail, options = {}) {
  const emailKey = String(userEmail || '').toLowerCase().trim();
  const hint = String(options.hintDistributorId || '').trim();

  let userDoc = options.userDoc || null;
  if (!userDoc && emailKey) {
    userDoc = await db.collection('users').findOne({ email: emailKey });
  }

  let distId = String(userDoc?.distributorId || '').trim();
  let updatedUser = false;

  if (!distId && userDoc && String(userDoc.role || 'user') === 'user') {
    distId = await inheritDistributorFromReferrer(db, userDoc);
    if (distId) {
      await db.collection('users').updateOne({ email: emailKey }, { $set: { distributorId: distId } });
      userDoc = { ...userDoc, distributorId: distId };
      updatedUser = true;
    }
  }

  if (!distId && hint && userDoc && String(userDoc.role || 'user') === 'user') {
    const distributor = await validateDistributorId(db, hint);
    if (distributor) {
      distId = hint;
      await db.collection('users').updateOne({ email: emailKey }, { $set: { distributorId: distId } });
      userDoc = { ...userDoc, distributorId: distId };
      updatedUser = true;
    }
  }

  let distType = '';
  let distName = '';
  if (distId) {
    const distributor = await validateDistributorId(db, distId);
    if (distributor) {
      distType = distributor.type || 'A';
      distName = distributor.name || '';
    } else {
      distId = '';
    }
  }

  return { distId, distType, distName, userDoc, updatedUser };
}

/** Emails of players tied to any distributor (for HQ inbox filtering). */
export async function emailsBelongingToDistributors(db, emails) {
  const list = [...new Set((emails || []).map((e) => String(e || '').toLowerCase().trim()).filter(Boolean))];
  if (!list.length) return new Set();

  const rows = await db
    .collection('users')
    .find(
      {
        email: { $in: list },
        role: 'user',
        distributorId: { $exists: true, $nin: [null, ''] }
      },
      { projection: { email: 1 } }
    )
    .toArray();

  return new Set(rows.map((r) => String(r.email || '').toLowerCase().trim()).filter(Boolean));
}