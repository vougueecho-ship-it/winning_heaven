import { resolvePlayerDistributor } from './resolvePlayerDistributor';

/** Mongo $match for HQ / platform support inbox (no distributor-linked messages). */
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
 * Resolve distributor + backfill orphan support messages for this player.
 */
export async function resolveSupportDistributor(db, userEmail, options = {}) {
  const emailKey = String(userEmail || '').toLowerCase().trim();
  const { distId, distType, distName, userDoc } = await resolvePlayerDistributor(db, userEmail, {
    hintDistributorId: options.hintDistributorId,
    userDoc: options.userDoc
  });

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