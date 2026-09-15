/**
 * Cashout minimum from last successful deposit:
 * - $5 - $19   → amount × 5
 * - $20 - $49  → amount × 6
 * - $50 - $99  → amount × 5
 * - $100+      → amount × 20
 * Returns null when there is no usable last deposit.
 */
export function getDepositBasedMinWithdraw(lastDepositAmount, tiers = null) {
  const deposit = Number(lastDepositAmount);
  if (!Number.isFinite(deposit) || deposit <= 0) return null;

  if (Array.isArray(tiers) && tiers.length > 0) {
    for (const t of tiers) {
      const rangeStr = String(t.depositRange || '').replace(/[^0-9\-+]/g, '');
      const multVal = parseFloat(String(t.multiplier || '').replace(/[^0-9.]/g, '')) || 5;
      if (rangeStr.includes('+')) {
        const minVal = parseFloat(rangeStr.replace('+', ''));
        if (deposit >= minVal) return Math.round(deposit * multVal * 100) / 100;
      } else if (rangeStr.includes('-')) {
        const [minVal, maxVal] = rangeStr.split('-').map(Number);
        if (deposit >= minVal && deposit <= maxVal) {
          return Math.round(deposit * multVal * 100) / 100;
        }
      }
    }
  }

  let multiplier = 5;
  if (deposit >= 20 && deposit < 50) {
    multiplier = 6;
  } else if (deposit >= 50 && deposit < 100) {
    multiplier = 5;
  } else if (deposit >= 100) {
    multiplier = 20;
  }
  return Math.round(deposit * multiplier * 100) / 100;
}

export function findLastSuccessDeposit(transactions, { userEmail, gameTitle } = {}) {
  const email = String(userEmail || '').toLowerCase().trim();
  const game = String(gameTitle || '').toLowerCase().trim();
  const rows = (Array.isArray(transactions) ? transactions : [])
    .filter((t) => {
      if (String(t.type || '').toUpperCase() !== 'DEPOSIT') return false;
      if (String(t.status || '').toUpperCase() !== 'SUCCESS') return false;
      if (email && String(t.userEmail || '').toLowerCase().trim() !== email) return false;
      if (game && String(t.gameTitle || '').toLowerCase().trim() !== game) return false;
      return true;
    })
    .sort((a, b) => {
      const ta = Date.parse(a.createdAt || a.date || 0) || 0;
      const tb = Date.parse(b.createdAt || b.date || 0) || 0;
      if (tb !== ta) return tb - ta;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  return rows[0] || null;
}
