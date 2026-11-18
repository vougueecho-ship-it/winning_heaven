/** HQ platform promos only (no distributor office). */
export function hqPromotionQuery() {
  return {
    $or: [
      { distributorId: { $exists: false } },
      { distributorId: null },
      { distributorId: '' }
    ]
  };
}

export function distributorPromotionQuery(distributorId) {
  return { distributorId: String(distributorId || '').trim() };
}

/** Mongo filter: players belonging to platform HQ (not any distributor office). */
export function hqPlayersUserScope() {
  return {
    $or: [
      { distributorId: { $exists: false } },
      { distributorId: null },
      { distributorId: '' }
    ]
  };
}

export function mergeUserScopeWithDistributor(baseQuery, adminDistributorId) {
  const q = { ...baseQuery };
  const distId = String(adminDistributorId || '').trim();
  if (distId) {
    q.distributorId = distId;
    return q;
  }
  const hqScope = hqPlayersUserScope();
  if (Object.keys(q).length > 0) {
    return { $and: [q, hqScope] };
  }
  return hqScope;
}

/** Player may view/claim this promo document. */
export function promotionMatchesPlayer(promo, playerDistributorId) {
  const promoDist = String(promo?.distributorId || '').trim();
  const playerDist = String(playerDistributorId || '').trim();
  if (playerDist) return promoDist === playerDist;
  return !promoDist;
}