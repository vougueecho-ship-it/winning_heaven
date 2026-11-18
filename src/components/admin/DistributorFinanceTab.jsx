'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function DistributorFinanceTab({ distSession, onInspectProof }) {
  const distId = distSession?.id || '';
  const distEmail = distSession?.email || '';
  const distType = distSession?.type || 'A';

  const { data: statsData, mutate: mutateStats } = useSWR(
    distId ? `/api/distributors/stats?distributorId=${distId}` : null,
    fetcher
  );
  const stats = statsData?.stats || {};

  const { data: commTxData, mutate: mutateCommTx } = useSWR(
    distEmail ? `/api/transactions?email=${encodeURIComponent(distEmail)}&type=COMMISSION_WITHDRAW` : null,
    fetcher
  );

  const { data: webCommTxData, mutate: mutateWebCommTx } = useSWR(
    distType === 'B' && distEmail
      ? `/api/transactions?email=${encodeURIComponent(distEmail)}&type=WEBSITE_COMMISSION_PAYMENT`
      : null,
    fetcher
  );

  const { data: settingsData } = useSWR('/api/settings', fetcher);
  const usdtAddress = settingsData?.settings?.usdtAddress || '';
  const usdtQrCode = settingsData?.settings?.usdtQrCode || '';

  const webPaymentsList = webCommTxData?.transactions || [];
  const totalWebPaid = webPaymentsList
    .filter((tx) => tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const dueWebsiteCommission = Math.max(0, (stats.websiteCommissionEarned || 0) - totalWebPaid);

  const [commAmount, setCommAmount] = useState('');
  const [commCode, setCommCode] = useState('');
  const [commGateway, setCommGateway] = useState('Cash App');
  const [commMsg, setCommMsg] = useState('');
  const [isSubmittingComm, setIsSubmittingComm] = useState(false);

  const [webAmount, setWebAmount] = useState('');
  const [webCode, setWebCode] = useState('');
  const [webScreenshot, setWebScreenshot] = useState('');
  const [webMsg, setWebMsg] = useState('');
  const [webMsgOk, setWebMsgOk] = useState(true);
  const [isSubmittingWeb, setIsSubmittingWeb] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const webProofInputRef = useRef(null);

  const earnedWebsiteCommission = stats.websiteCommissionEarned || 0;

  const [lookupDate, setLookupDate] = useState(() => {
    const d = new Date(Date.now() - 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [lookupStats, setLookupStats] = useState({});
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (!distId || !lookupDate) return;
    setLookupLoading(true);
    fetch(`/api/distributors/stats/by-date?distributorId=${distId}&date=${lookupDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLookupStats(data);
      })
      .finally(() => setLookupLoading(false));
  }, [distId, lookupDate]);

  const handleRequestCommWithdraw = async (e) => {
    e.preventDefault();
    const reqVal = parseFloat(commAmount);
    if (isNaN(reqVal) || reqVal <= 0) {
      alert('Enter a valid amount.');
      return;
    }
    const commWithdrawals = commTxData?.transactions || [];
    const totalWithdrawn = commWithdrawals
      .filter((tx) => tx.status === 'SUCCESS' || tx.status === 'PENDING')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0) - parseFloat(tx.payoutHold || 0), 0);
    const available = Math.max(0, (stats.commissionEarned || 0) - totalWithdrawn);
    if (reqVal > available) {
      alert(`Max available: $${available.toFixed(2)}`);
      return;
    }
    setIsSubmittingComm(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: distEmail,
          amount: reqVal,
          gateway: commGateway,
          code: commCode,
          type: 'COMMISSION_WITHDRAW',
          gameTitle: 'Distributor Payout',
          status: 'PENDING'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCommAmount('');
        setCommCode('');
        setCommMsg('Payout request submitted!');
        mutateCommTx();
        mutateStats();
      } else {
        setCommMsg(data.message || 'Request failed.');
      }
    } catch {
      setCommMsg('Server error.');
    } finally {
      setIsSubmittingComm(false);
    }
  };

  const handleRequestWebPayment = async (e) => {
    e.preventDefault();
    if (!webAmount || !webCode || !webScreenshot) {
      alert('Amount, TxID, and screenshot are required.');
      return;
    }
    const reqVal = parseFloat(webAmount);
    if (isNaN(reqVal) || reqVal <= 0) return;
    setIsSubmittingWeb(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: distEmail,
          amount: reqVal,
          gateway: 'USDT',
          code: webCode,
          screenshot: webScreenshot,
          type: 'WEBSITE_COMMISSION_PAYMENT',
          gameTitle: 'Platform Fees',
          status: 'PENDING'
        })
      });
      const data = await res.json();
      if (data.success) {
        setWebAmount('');
        setWebCode('');
        setWebScreenshot('');
        setWebMsg('Payment proof submitted! HQ will verify shortly.');
        setWebMsgOk(true);
        mutateWebCommTx();
        mutateStats();
      } else {
        setWebMsg(data.message || 'Failed.');
        setWebMsgOk(false);
      }
    } catch {
      setWebMsg('Server error.');
      setWebMsgOk(false);
    } finally {
      setIsSubmittingWeb(false);
    }
  };

  const copyUsdtAddress = async () => {
    if (!usdtAddress) return;
    try {
      await navigator.clipboard.writeText(usdtAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      alert('Could not copy address — select and copy manually.');
    }
  };

  const handleWebProofFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setWebScreenshot(ev.target?.result || '');
    reader.readAsDataURL(file);
  };

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
          <i className="fa-solid fa-hand-holding-dollar gold-text" /> Commission &amp;{' '}
          <span className="gold-gradient-text">{distType === 'B' ? 'Platform fees' : 'Cashouts'}</span>
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Track earnings, pay HQ website fees (Type B), or request commission withdrawals.
        </p>
      </div>

      <div className="admin-stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
          <div className="stat-icon-wrapper gold-bg">
            <i className="fa-solid fa-coins" />
          </div>
          <div className="stat-info">
            <h3>${(stats.commissionEarned || 0).toFixed(2)}</h3>
            <p>Commission earned ({stats.commissionRate || 0}%)</p>
          </div>
        </div>
        {distType === 'B' && (
          <div className="stat-card" style={{ borderLeft: '4px solid #ff4d6d' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d' }}>
              <i className="fa-solid fa-globe" />
            </div>
            <div className="stat-info">
              <h3>${dueWebsiteCommission.toFixed(2)}</h3>
              <p>Website commission due ({stats.websiteCommissionRate || 0}%)</p>
            </div>
          </div>
        )}
      </div>

      <div className="stat-card" style={{ borderLeft: '4px solid var(--gold-primary)', maxWidth: 640 }}>
        <div className="stat-icon-wrapper gold-bg">
          <i className="fa-solid fa-calendar-days" />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Historical day lookup</span>
          <input type="date" value={lookupDate} onChange={(e) => setLookupDate(e.target.value)} className="admin-input" style={{ marginTop: 8, maxWidth: 220 }} />
          {lookupLoading ? (
            <p style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.6 }}>Loading…</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: 8, fontSize: '0.8rem' }}>
              <span style={{ color: '#2ecc71' }}>In: ${(lookupStats.deposits || 0).toFixed(2)}</span>
              <span style={{ color: '#ef4444' }}>Out: ${(lookupStats.withdrawals || 0).toFixed(2)}</span>
              <span>Comm: ${(lookupStats.commission || 0).toFixed(2)}</span>
              {distType === 'B' && <span style={{ color: '#ff4d6d' }}>Web: ${(lookupStats.websiteCommission || 0).toFixed(2)}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="dist-staff-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.05fr) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {distType === 'B' ? (
          <div className="dist-platform-fee-card">
            <div className="dist-platform-fee-card__header">
              <div>
                <h3 className="dist-platform-fee-card__title">
                  <i className="fa-solid fa-building-columns gold-text" aria-hidden />
                  Pay platform fee to HQ
                </h3>
                <p className="dist-platform-fee-card__subtitle">
                  Send USDT (TRC20) for your website hosting share, then submit TxID and screenshot for HQ approval.
                </p>
              </div>
              <div className="dist-platform-fee-due-pill">
                <span>Outstanding balance</span>
                <strong>${dueWebsiteCommission.toFixed(2)}</strong>
              </div>
            </div>
            <div className="dist-platform-fee-metrics">
              <div className="dist-platform-fee-metric">
                <label>Accrued (HQ share)</label>
                <strong>${earnedWebsiteCommission.toFixed(2)}</strong>
              </div>
              <div className="dist-platform-fee-metric">
                <label>Already paid</label>
                <strong style={{ color: '#4ade80' }}>${totalWebPaid.toFixed(2)}</strong>
              </div>
              <div className="dist-platform-fee-metric">
                <label>Rate</label>
                <strong>{stats.websiteCommissionRate || 0}%</strong>
              </div>
            </div>
            <form onSubmit={handleRequestWebPayment} className="dist-platform-fee-layout">
              <div className="dist-platform-fee-wallet">
                <span className="dist-platform-fee-network">
                  <i className="fa-solid fa-link" aria-hidden /> USDT · TRC20
                </span>
                {usdtAddress ? (
                  <div className="dist-platform-fee-address-box">
                    <label>HQ wallet address</label>
                    <div className="dist-platform-fee-address-row">
                      <code>{usdtAddress}</code>
                      <button type="button" className="dist-platform-fee-copy-btn" onClick={copyUsdtAddress}>
                        {copiedAddress ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    HQ has not set a USDT address yet — contact support before sending funds.
                  </p>
                )}
                {usdtQrCode && (
                  <div className="dist-platform-fee-qr-wrap">
                    <button
                      type="button"
                      className="dist-platform-fee-qr-btn"
                      onClick={() => onInspectProof?.(usdtQrCode)}
                      title="View full QR"
                    >
                      <img src={usdtQrCode} alt="USDT QR code" />
                    </button>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Scan in your wallet app or tap the QR to enlarge.
                    </p>
                  </div>
                )}
                <ol className="dist-platform-fee-steps">
                  <li>Send <strong style={{ color: '#fff' }}>USDT on TRC20 only</strong> — wrong network = lost funds.</li>
                  <li>Match amount to your outstanding balance (partial payments are OK).</li>
                  <li>Paste blockchain TxID and upload payment proof on the right.</li>
                </ol>
              </div>

              <div className="dist-platform-fee-form">
                <div>
                  <label className="admin-field-label" htmlFor="web-fee-amount">
                    Payment amount (USD)
                  </label>
                  <div className="dist-platform-fee-amount-row">
                    <input
                      id="web-fee-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="admin-input"
                      placeholder="0.00"
                      value={webAmount}
                      onChange={(e) => setWebAmount(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="dist-platform-fee-fill-due"
                      onClick={() => setWebAmount(dueWebsiteCommission > 0 ? dueWebsiteCommission.toFixed(2) : '')}
                      disabled={dueWebsiteCommission <= 0}
                    >
                      Pay full due
                    </button>
                  </div>
                </div>
                <div>
                  <label className="admin-field-label" htmlFor="web-fee-txid">
                    Transaction ID / hash
                  </label>
                  <input
                    id="web-fee-txid"
                    type="text"
                    className="admin-input"
                    placeholder="Paste TRC20 TxID from your wallet"
                    value={webCode}
                    onChange={(e) => setWebCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="admin-field-label">Payment screenshot</label>
                  <input
                    type="file"
                    ref={webProofInputRef}
                    accept="image/*"
                    onChange={handleWebProofFile}
                    style={{ display: 'none' }}
                  />
                  {webScreenshot ? (
                    <div className="dist-platform-fee-proof-preview">
                      <img src={webScreenshot} alt="Payment proof preview" />
                      <div>
                        <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.8rem' }}>Proof attached</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ready to submit</div>
                      </div>
                      <div className="proof-actions">
                        <button type="button" onClick={() => webProofInputRef.current?.click()}>
                          Change
                        </button>
                        <button type="button" className="is-danger" onClick={() => setWebScreenshot('')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="dist-platform-fee-dropzone"
                      onClick={() => webProofInputRef.current?.click()}
                    >
                      <i className="fa-solid fa-cloud-arrow-up gold-text" aria-hidden />
                      Upload wallet receipt screenshot
                    </button>
                  )}
                </div>
                {webMsg ? (
                  <p className={`dist-platform-fee-alert ${webMsgOk ? 'is-success' : 'is-error'}`}>{webMsg}</p>
                ) : null}
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmittingWeb || !webScreenshot}
                  style={{ width: '100%', opacity: isSubmittingWeb || !webScreenshot ? 0.65 : 1 }}
                >
                  {isSubmittingWeb ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" aria-hidden /> Submitting…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" aria-hidden /> Submit payment proof
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRequestCommWithdraw} className="dist-cashout-card">
            <h3>
              <i className="fa-solid fa-money-bill-transfer gold-text" /> Commission cashout
            </h3>
            <div className="input-group">
              <label>Amount ($)</label>
              <input type="number" step="0.01" className="admin-input" value={commAmount} onChange={(e) => setCommAmount(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Gateway</label>
              <select value={commGateway} onChange={(e) => setCommGateway(e.target.value)} className="admin-input">
                <option>Cash App</option>
                <option>Chime</option>
                <option>Zelle</option>
                <option>PayPal</option>
              </select>
            </div>
            <div className="input-group">
              <label>Payment tag / note</label>
              <input type="text" className="admin-input" value={commCode} onChange={(e) => setCommCode(e.target.value)} required />
            </div>
            {commMsg && <p className="dist-platform-fee-alert is-success" style={{ marginTop: '0.5rem' }}>{commMsg}</p>}
            <button type="submit" className="submit-btn" disabled={isSubmittingComm} style={{ width: '100%', marginTop: '0.75rem' }}>
              {isSubmittingComm ? 'Submitting…' : 'Request payout'}
            </button>
          </form>
        )}

        <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(distType === 'B' ? webPaymentsList : commTxData?.transactions || []).length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted" style={{ padding: '2rem' }}>
                    No commission transactions yet.
                  </td>
                </tr>
              ) : (
                (distType === 'B' ? webPaymentsList : commTxData.transactions).map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                    <td>{tx.type}</td>
                    <td>${parseFloat(tx.amount || 0).toFixed(2)}</td>
                    <td>
                      <div>{tx.status}</div>
                      {tx.status === 'FAILED' && (tx.rejectionReason || tx.note) ? (
                        <div style={{ fontSize: '0.65rem', color: '#ff6b6b', marginTop: 4, maxWidth: 200 }}>
                          {tx.rejectionReason || tx.note}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}