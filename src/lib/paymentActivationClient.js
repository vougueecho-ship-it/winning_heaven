function readPlayerDistributorHint() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('winning_heaven_session');
    if (raw) {
      const s = JSON.parse(raw);
      const id = String(s?.distributorId || '').trim();
      if (id) return id;
    }
  } catch {
    /* ignore */
  }
  try {
    return String(localStorage.getItem('winning_heaven_distributor_id') || '').trim();
  } catch {
    return '';
  }
}

/** POST payment activation request + optional device fields from sessionStorage */
export async function submitPaymentActivationRequest({
  userEmail,
  userName,
  theme,
  methodName,
  amount,
  gameTitle
}) {
  let deviceId = '';
  let deviceFingerprint = '';
  let hardwareFingerprint = '';
  try {
    deviceId = sessionStorage.getItem('wh_device_id') || '';
    deviceFingerprint = sessionStorage.getItem('wh_device_fp') || '';
    hardwareFingerprint = sessionStorage.getItem('wh_hw_fp') || '';
  } catch {
    /* ignore */
  }

  const res = await fetch('/api/support/payment-activation-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail,
      userName,
      theme,
      methodName,
      amount,
      gameTitle,
      deviceId,
      deviceFingerprint,
      hardwareFingerprint,
      distributorId: readPlayerDistributorHint()
    })
  });
  return res.json();
}