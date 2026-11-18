/**
 * Support chat routing: distributor office players → distributor inbox only (not HQ).
 */

/** Mongo $match for HQ / platform support inbox (no distributor-linked players). */
export function hqSupportListMatch() {
  return {
    $or: [
      { distributorId: { $exists: false } },
      { distributorId: null },
      { distributorId: '' }
    ]
  };
}

/**
 * Resolve distributor context for a support thread from the player user doc (+ optional hint).
 * Backfills user.distributorId from a valid hint and re-tags orphan support messages.
 */
export async function resolveSupportDistributor(db, userEmail, options = {}) {
  const emailKey = String(userEmail || '').toLowerCase().trim();
  const hint = String(options.hintDistributorId || '').trim();

  let userDoc = options.userDoc || null;
  if (!userDoc && emailKey) {
    userDoc = await db.collection('users').findOne({ email: emailKey });
  }

  let distId = String(userDoc?.distributorId || '').trim();

  if (!distId && hint && userDoc && String(userDoc.role || 'user') === 'user') {
    const distributor = await db.collection('distributors').findOne({ id: hint });
    if (distributor) {
      distId = hint;
      await db.collection('users').updateOne({ email: emailKey }, { $set: { distributorId: distId } });
      userDoc = { ...userDoc, distributorId: distId };
    }
  }

  let distType = '';
  let distName = '';
  if (distId) {
    const distributor = await db.collection('distributors').findOne({ id: distId });
    if (distributor) {
      distType = distributor.type || 'A';
      distName = distributor.name || '';
    } else {
      distId = '';
    }
  }

  if (distId && emailKey) {
    await db.collection('supportMessages').updateMany(
      {
        userEmail: emailKey,
        $or: [
          { distributorId: { $exists: false } },
          { distributorId: null },
          { distributorId: '' }
        ]
      },
      { $set: { distributorId: distId, distributorType: distType, distributorName: distName } }
    );
  }

  return { distId, distType, distName, userDoc };
}