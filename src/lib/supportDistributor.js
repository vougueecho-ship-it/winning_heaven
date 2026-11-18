import { resolvePlayerDistributor } from './resolvePlayerDistributor';

/** Player messages + threads for one distributor office (matches support list logic). */
export async function buildDistributorSupportScope(db, distributorId) {
  const id = String(distributorId || '').trim();
  if (!id) return null;

  const playerEmails = await db.collection('users').distinct('email', {
    distributorId: id,
    role: 'user'
  });
  const emailList = playerEmails.map((e) => String(e || '').toLowerCase().trim()).filter(Boolean);
  const or = [{ distributorId: id }];
  if (emailList.length) or.push({ userEmail: { $in: emailList } });
  return { $or: or };
}

/** Unread player chats for distributor sidebar badge / alerts. */
export async function distributorSupportUnreadQuery(db, distributorId) {
  const scope = await buildDistributorSupportScope(db, distributorId);
  if (!scope) return null;
  return {
    senderType: 'player',
    read: false,
    ...scope
  };
}

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