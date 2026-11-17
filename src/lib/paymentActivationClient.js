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
      hardwareFingerprint
    })
  });
  return res.json();
}