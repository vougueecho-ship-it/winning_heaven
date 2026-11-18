'use client';

import React, { useState, useEffect } from 'react';
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
  const [isSubmittingWeb, setIsSubmittingWeb] = useState(false);

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
        setWebMsg('Payment proof submitted!');
        mutateWebCommTx();
      } else {
        setWebMsg(data.message || 'Failed.');
      }
    } catch {
      setWebMsg('Server error.');
    } finally {
      setIsSubmittingWeb(false);
    }
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

      <div className="dist-staff-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '1.5rem' }}>
        {distType === 'B' ? (
          <form onSubmit={handleRequestWebPayment} style={{ background: 'rgba(14,18,36,0.85)', border: '1px solid rgba(255,215,0,0.18)', borderRadius: 20, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
              <i className="fa-solid fa-building-columns gold-text" /> Pay website commission
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Due: <strong style={{ color: '#ff4d6d' }}>${dueWebsiteCommission.toFixed(2)}</strong>
            </p>
            {usdtAddress && (
              <p style={{ fontSize: '0.72rem', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                USDT TRC20: <span className="gold-text">{usdtAddress}</span>
              </p>
            )}
            {usdtQrCode && (
              <button type="button" onClick={() => onInspectProof?.(usdtQrCode)} style={{ marginBottom: '1rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={usdtQrCode} alt="USDT QR" style={{ width: 120, height: 120, borderRadius: 8 }} />
              </button>
            )}
            <div className="input-group">
              <label>Amount ($)</label>
              <input type="number" step="0.01" value={webAmount} onChange={(e) => setWebAmount(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>TxID / Hash</label>
              <input type="text" value={webCode} onChange={(e) => setWebCode(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Payment screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setWebScreenshot(ev.target?.result || '');
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            {webMsg && <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{webMsg}</p>}
            <button type="submit" className="submit-btn" disabled={isSubmittingWeb} style={{ width: '100%', marginTop: '0.75rem' }}>
              {isSubmittingWeb ? 'Submitting…' : 'Submit payment proof'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestCommWithdraw} style={{ background: 'rgba(14,18,36,0.85)', border: '1px solid rgba(255,215,0,0.18)', borderRadius: 20, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
              <i className="fa-solid fa-money-bill-transfer gold-text" /> Commission cashout
            </h3>
            <div className="input-group">
              <label>Amount ($)</label>
              <input type="number" step="0.01" value={commAmount} onChange={(e) => setCommAmount(e.target.value)} required />
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
              <input type="text" value={commCode} onChange={(e) => setCommCode(e.target.value)} required />
            </div>
            {commMsg && <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{commMsg}</p>}
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
                    <td>{tx.status}</td>
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