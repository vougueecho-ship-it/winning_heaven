import { cache } from './cache';
import { invalidateTypeBDistributorCache } from './typeBDistributors';
import { clearSessionRevoke } from './sessionRevoke';

/**
 * Re-insert distributor row and re-link players + ops traffic (same id as before delete).
 */
export async function restoreDistributorFromArchive(db, deletedRecord, overrides = {}) {
  const {
    deletedAt,
    _id,
    deletedEntityType,
    deletedBy,
    linkedPlayerEmails,
    formerDistributorId,
    wipeGameAccess,
    restoreGameTitles,
    ...distOriginal
  } = deletedRecord;

  const cleanEmail = String(distOriginal.email || deletedRecord.email || '').toLowerCase().trim();

  const clash = await db.collection('distributors').findOne({
    $or: [{ id: distOriginal.id }, { email: cleanEmail }]
  });
  if (clash) {
    return { success: false, message: 'An active distributor with this id/email already exists.' };
  }

  const distId = String(distOriginal.id || formerDistributorId || '').trim();
  if (!distId) {
    return { success: false, message: 'Distributor id missing from archive.' };
  }

  const restoredDoc = {
    ...distOriginal,
    id: distId,
    email: cleanEmail || distOriginal.email,
    name: overrides.name !== undefined ? String(overrides.name).trim() : distOriginal.name,
    password: overrides.password !== undefined ? String(overrides.password).trim() : distOriginal.password,
    type: overrides.type !== undefined ? overrides.type : distOriginal.type,
    commissionRate:
      overrides.commissionRate !== undefined
        ? parseFloat(overrides.commissionRate)
        : parseFloat(distOriginal.commissionRate || 0),
    websiteCommissionRate:
      overrides.websiteCommissionRate !== undefined
        ? parseFloat(overrides.websiteCommissionRate)
        : parseFloat(distOriginal.websiteCommissionRate || 0),
    role: 'distributor',
    restoredAt: new Date().toISOString()
  };

  await db.collection('distributors').insertOne(restoredDoc);

  const emailsFromArchive = Array.isArray(linkedPlayerEmails)
    ? linkedPlayerEmails.map((e) => String(e || '').toLowerCase().trim()).filter(Boolean)
    : [];
  const formerLinked = await db
    .collection('users')
    .find({ formerDistributorId: distId, role: 'user' }, { projection: { email: 1 } })
    .toArray();
  const emailsFromFormer = formerLinked.map((u) => String(u.email || '').toLowerCase().trim()).filter(Boolean);
  const playerEmails = [...new Set([...emailsFromArchive, ...emailsFromFormer])];

  const distType = String(restoredDoc.type || 'A');
  const distName = String(restoredDoc.name || '');
  const distTag = {
    distributorId: distId,
    distributorType: distType,
    distributorName: distName
  };

  if (playerEmails.length > 0) {
    await Promise.all([
      db.collection('users').updateMany(
        {
          role: 'user',
          $or: [{ email: { $in: playerEmails } }, { formerDistributorId: distId }]
        },
        { $set: distTag, $unset: { formerDistributorId: '' } }
      ),
      db.collection('accountRequests').updateMany({ userEmail: { $in: playerEmails } }, { $set: distTag }),
      db.collection('transactions').updateMany({ userEmail: { $in: playerEmails } }, { $set: distTag }),
      db.collection('coinsNotifications').updateMany({ userEmail: { $in: playerEmails } }, { $set: distTag }),
      db.collection('supportMessages').updateMany({ userEmail: { $in: playerEmails } }, { $set: { distributorId: distId } })
    ]);
  }

  await db.collection('deletedUsers').deleteOne({ email: cleanEmail || `distributor:${distId}` });
  if (cleanEmail) clearSessionRevoke(cleanEmail);
  cache.del('admin_stats');
  cache.del('distributors_enriched');
  invalidateTypeBDistributorCache();

  return {
    success: true,
    distributor: restoredDoc,
    reLinkedPlayers: playerEmails.length,
    message: `Distributor restored with same ID. ${playerEmails.length} player(s) re-linked.`
  };
}