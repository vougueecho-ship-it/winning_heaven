import { cache } from './cache';
import { getDb } from './mongodb';

const DEFAULT_DOC_ID = 'frontend_settings';

/** Keys distributors may override for their players (lobby + rules + bonuses). */
export const DISTRIBUTOR_PLAYER_SETTING_KEYS = [
  'signupFreeplay',
  'firstDepositBonus',
  'regularDepositBonus',
  'minimumDepositLimit',
  'minimumWithdrawalLimit',
  'freeplayMinWithdraw',
  'freeplayMaxCashout',
  'freeplayUnlockDeposit',
  'defaultMinWithdraw',
  'withdrawTier1Multiplier',
  'withdrawTier2Multiplier',
  'withdrawTier1MinDeposit',
  'withdrawTier1MaxDeposit',
  'withdrawTier1Basis',
  'withdrawTier2Basis',
  'withdrawCalculationBasis',
  'customCashoutRules',
  'cashoutRules',
  'cashoutTiers',
  'cashoutNotice',
  'withdrawNotice',
  'lobbyHeroPromo',
  'lobbyFreeplayValue',
  'lobbyFreeplayLabel',
  'lobbyFreeplayCondition',
  'lobbyFreeplayClaimBtn',
  'lobbyBullet1Title',
  'lobbyBullet1Desc',
  'lobbyBullet2Title',
  'lobbyBullet2Desc',
  'lobbyBullet3Title',
  'lobbyBullet3Desc'
];

export async function loadPlatformFrontendSettings(db) {
  const cached = cache.get('frontend_settings_all');
  if (cached) return cached;

  const conn = db || (await getDb());
  const row = await conn.collection('settings').findOne({ id: DEFAULT_DOC_ID });
  const settings = row || {};
  cache.set('frontend_settings_all', settings, 60);
  return settings;
}

export function pickDistributorPlayerSettings(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const key of DISTRIBUTOR_PLAYER_SETTING_KEYS) {
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  return out;
}

export async function loadMergedFrontendSettings(db, distributorId) {
  const distId = String(distributorId || '').trim();
  const cacheKey = distId ? `frontend_settings_merged_${distId}` : 'frontend_settings_merged_hq';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const conn = db || (await getDb());
  const base = { ...(await loadPlatformFrontendSettings(conn)) };

  if (distId) {
    const dist = await conn.collection('distributors').findOne(
      { id: distId },
      { projection: { playerSettings: 1 } }
    );
    const overrides = pickDistributorPlayerSettings(dist?.playerSettings);
    Object.assign(base, overrides);
  }

  cache.set(cacheKey, base, 45);
  return base;
}

export async function loadMergedFrontendSettingsForEmail(db, userEmail) {
  const emailKey = String(userEmail || '').toLowerCase().trim();
  if (!emailKey) return loadMergedFrontendSettings(db, '');

  const conn = db || (await getDb());
  const user = await conn.collection('users').findOne(
    { email: emailKey },
    { projection: { distributorId: 1 } }
  );
  return loadMergedFrontendSettings(conn, user?.distributorId || '');
}

export function invalidateMergedFrontendSettingsCache(distributorId) {
  const distId = String(distributorId || '').trim();
  if (distId) cache.del(`frontend_settings_merged_${distId}`);
  cache.del('frontend_settings_merged_hq');
  cache.del('frontend_settings_all');
}