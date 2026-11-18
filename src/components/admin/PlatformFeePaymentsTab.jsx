'use client';

import React, { useState } from 'react';
import usePollingSWR from '../../hooks/usePollingSWR';
import { POLL } from '../../lib/pollingConfig';
import { mutate as globalMutate } from 'swr';
import { formatDeviceDateTime } from '../../lib/formatDateTime';
import PanelModalBackdrop from '../PanelModalBackdrop';

export default function PlatformFeePaymentsTab({
  adminUser,
  onInspectProof,
  onApproveTransaction,
  completedActionIds = {},
  processingIds,
  wrapAction,
  showToast,
  onOpenSettings
}) {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [rejectModalTx, setRejectModalTx] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const swrKey = `/api/transactions?type=WEBSITE_COMMISSION_PAYMENT&status=${statusFilter}&limit=50&adminRole=${encodeURIComponent(adminUser?.role || 'admin')}`;

  const { data, error, mutate } = usePollingSWR(swrKey, POLL.QUEUES);
  const { data: settingsData } = usePollingSWR('/api/settings', POLL.LISTS, { refreshInterval: 120000 });

  const usdtAddress = settingsData?.settings?.usdtAddress || '';
  const usdtQrCode = settingsData?.settings?.usdtQrCode || '';
  const transactions = (data?.transactions || []).filter((tx) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (tx.userEmail || '').toLowerCase().includes(q) ||
      (tx.code || '').toLowerCase().includes(q) ||
      String(tx.id || '').includes(q)
    );
  });

  const submitRejectWithNote = async () => {
    if (!rejectModalTx?.id) return;
    const note = rejectNote.trim() || 'Payment not verified';
    const txId = rejectModalTx.id;
    setRejectSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: txId,
          status: 'FAILED',
          note,
          rejectionReason: note,
          processedBy: adminUser?.email || 'admin'
        })
      });
      const resData = await res.json();
      if (resData.success) {
        showToast?.('Payment proof rejected.', 'error');
        setRejectModalTx(null);
        setRejectNote('');
        mutate();
        globalMutate('/api/admin/stats');
        globalMutate((key) => typeof key === 'string' && key.includes('WEBSITE_COMMISSION_PAYMENT'));
      } else {
        showToast?.(resData.message || 'Rejection failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast?.('Connection error while rejecting.', 'error');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleApprove = (txId) => {
    const run = wrapAction ? wrapAction(txId, onApproveTransaction) : onApproveTransaction;
    Promise.resolve(run(txId)).then(() => {
      mutate();
      globalMutate((key) => typeof key === 'string' && key.includes('WEBSITE_COMMISSION_PAYMENT'));
    });
  };

  return (
  <>
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
          <i className="fa-brands fa-bitcoin gold-text" aria-hidden /> Distributor platform fee payments
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: 720 }}>
          Type B distributors pay your Binance / USDT (TRC20) wallet share here. Review TxID + screenshot, then approve or reject with a note.
          Wallet address is configured under <strong style={{ color: '#ffd700' }}>Settings → Platform Owner Settlement Address</strong>.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          padding: '1rem 1.1rem',
          borderRadius: 14,
          border: '1px solid rgba(255, 215, 0, 0.2)',
          background: 'rgba(14, 18, 36, 0.65)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HQ USDT / Binance address (TRC20)</span>
          {usdtAddress ? (
            <code style={{ display: 'block', marginTop: 6, fontSize: '0.78rem', wordBreak: 'break-all', color: '#fff' }}>{usdtAddress}</code>
          ) : (
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#ff6b6b' }}>Not set — distributors cannot pay until you add it.</p>
          )}
          {onOpenSettings && (
            <button
              type="button"
              className="submit-btn"
              style={{ marginTop: 10, fontSize: '0.75rem', padding: '0.45rem 0.9rem' }}
              onClick={onOpenSettings}
            >
              Open Settings
            </button>
          )}
        </div>
        {usdtQrCode ? (
          <div className="dist-platform-fee-qr-wrap">
            <button
              type="button"
              className="dist-platform-fee-qr-btn"
              onClick={() => onInspectProof?.(usdtQrCode)}
              title="View QR"
              style={{ maxWidth: 120 }}
            >
              <img src={usdtQrCode} alt="USDT QR" />
            </button>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Same QR distributors see in Commission &amp; Fees.</p>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div className="input-wrapper search-wrapper" style={{ flex: '1 1 240px', background: '#0b0d16' }}>
          <i className="fa-solid fa-magnifying-glass input-icon" />
          <input
            type="text"
            placeholder="Search distributor email, TxID, or transaction id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="PENDING">Pending review</option>
          <option value="SUCCESS">Approved</option>
          <option value="FAILED">Rejected</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Distributor</th>
              <th>Amount</th>
              <th>TxID / Hash</th>
              <th>Proof</th>
              <th>Status</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && (
              <tr>
                <td colSpan="8" className="text-center text-muted" style={{ padding: '2rem' }}>
                  Loading payment requests…
                </td>
              </tr>
            )}
            {data && transactions.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center text-muted" style={{ padding: '2rem' }}>
                  No {statusFilter.toLowerCase()} platform fee payments.
                </td>
              </tr>
            )}
            {transactions.map((tx) => {
              const done = completedActionIds[tx.id];
              const busy = processingIds?.[tx.id];
              const isPending = tx.status === 'PENDING';
              const failNote = tx.rejectionReason || tx.note || tx.adminNote || '';
              return (
                <tr key={tx.id} style={done ? { opacity: 0.45 } : undefined}>
                  <td>{formatDeviceDateTime(tx.date || tx.createdAt)}</td>
                  <td style={{ fontSize: '0.78rem' }}>{tx.userEmail}</td>
                  <td style={{ fontWeight: 800, color: '#4ade80' }}>${parseFloat(tx.amount || 0).toFixed(2)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', maxWidth: 160, wordBreak: 'break-all' }}>{tx.code || '—'}</td>
                  <td>
                    {(tx.screenshot || tx.hasScreenshot) && onInspectProof ? (
                      <button
                        type="button"
                        className="action-btn-sm"
                        onClick={() => onInspectProof(tx.screenshot, tx.id, 'screenshot', tx)}
                      >
                        <i className="fa-solid fa-image" /> View
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{tx.status}</td>
                  <td style={{ fontSize: '0.72rem', maxWidth: 140 }}>{failNote || '—'}</td>
                  <td>
                    {isPending && !done ? (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="action-btn-sm is-success"
                          disabled={busy}
                          onClick={() => handleApprove(tx.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="action-btn-sm is-danger"
                          disabled={busy}
                          onClick={() => {
                            setRejectModalTx(tx);
                            setRejectNote('');
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>

    {rejectModalTx && (
      <PanelModalBackdrop onClose={() => !rejectSubmitting && setRejectModalTx(null)}>
        <div
          className="admin-section-card"
          style={{ maxWidth: 440, width: '100%', padding: '1.5rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0 }}>Reject payment proof</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {rejectModalTx.userEmail} · ${parseFloat(rejectModalTx.amount || 0).toFixed(2)}
          </p>
          <label className="admin-field-label" htmlFor="reject-platform-fee-note">
            Rejection note (distributor will see this)
          </label>
          <textarea
            id="reject-platform-fee-note"
            className="admin-input"
            rows={4}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. Wrong network (ERC20). Please resend USDT on TRC20 and submit again."
            style={{ width: '100%', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="action-btn-sm"
              disabled={rejectSubmitting}
              onClick={() => setRejectModalTx(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="action-btn-sm is-danger"
              disabled={rejectSubmitting}
              onClick={submitRejectWithNote}
            >
              {rejectSubmitting ? 'Rejecting…' : 'Reject with note'}
            </button>
          </div>
        </div>
      </PanelModalBackdrop>
    )}
  </>
  );
}