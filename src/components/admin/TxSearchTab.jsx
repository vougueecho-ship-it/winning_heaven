'use client';

import React, { useState, useEffect } from 'react';
import PanelModalBackdrop from '../PanelModalBackdrop';
import usePollingSWR from '../../hooks/usePollingSWR';
import { POLL } from '../../lib/pollingConfig';
import { formatDeviceDateTime } from '../../lib/formatDateTime';

export default function TxSearchTab({ onInspectProof, adminUser }) {
  const [historySearch, setHistorySearch] = useState('');
  const [historyDebouncedSearch, setHistoryDebouncedSearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState(''); // '' (All), 'SUCCESS', 'FAILED', 'HOLD'
  const [historyType, setHistoryType] = useState(''); // '' (All), 'DEPOSIT', 'WITHDRAW', 'BONUS'
  const [historyPage, setHistoryPage] = useState(1);
  const limit = 20;

  // Status Override Modal States (Re-Approve Failed / Mark Approved as Failed)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatusTx, setTargetStatusTx] = useState(null);
  const [targetNewStatus, setTargetNewStatus] = useState(''); // 'SUCCESS' | 'FAILED'
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setHistoryDebouncedSearch(historySearch);
      setHistoryPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [historySearch]);

  const swrKey = `/api/transactions?page=${historyPage}&limit=${limit}&search=${encodeURIComponent(historyDebouncedSearch)}&status=${historyStatus}&type=${historyType}&adminRole=${adminUser?.role || ''}&adminDistributorId=${adminUser?.distributorId || ''}`;

  const { data, error, mutate } = usePollingSWR(swrKey, POLL.LISTS);

  const transactions = data?.transactions || [];
  const totalTransactions = data?.totalTransactions || 0;
  const totalPages = data?.totalPages || 1;

  const handleOpenReApproveModal = (tx) => {
    setTargetStatusTx(tx);
    setTargetNewStatus('SUCCESS');
    setOverrideReason('Re-approved by admin');
    setStatusModalOpen(true);
  };

  const handleOpenRevokeModal = (tx) => {
    setTargetStatusTx(tx);
    setTargetNewStatus('FAILED');
    setOverrideReason('Approved by mistake / Declined by admin');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusOverride = async () => {
    if (!targetStatusTx || !targetNewStatus) return;
    setIsSubmittingStatus(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetStatusTx.id,
          status: targetNewStatus,
          note: overrideReason.trim() || (targetNewStatus === 'SUCCESS' ? 'Re-approved by admin' : 'Declined by Admin'),
          rejectionReason: overrideReason.trim() || (targetNewStatus === 'SUCCESS' ? '' : 'Declined by Admin'),
          processedBy: adminUser?.email || 'admin@winningheaven.com'
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert(targetNewStatus === 'SUCCESS' ? 'Transaction re-approved successfully!' : 'Transaction status changed to FAILED!');
      } else {
        alert(resData.message || 'Failed to update transaction status.');
      }
      setStatusModalOpen(false);
      setTargetStatusTx(null);
      mutate();
    } catch (err) {
      console.error('Status override error:', err);
      alert('Error updating transaction status. Check internet connection.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleHistoryPrevPage = () => {
    if (historyPage > 1) setHistoryPage(historyPage - 1);
  };

  const handleHistoryNextPage = () => {
    if (historyPage < totalPages) setHistoryPage(historyPage + 1);
  };

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out' }}>
      <div className="section-card-header" style={{ marginBottom: '1rem' }}>
        <h3><i className="fa-solid fa-clock-rotate-left gold-text"></i> Transaction Logs Search</h3>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          Review full ledger transaction history, query player emails, usernames, and audit processing staff actions.
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', padding: '1rem', background: '#0b0d16', borderRadius: '8px' }}>
        <div className="input-wrapper search-wrapper" style={{ flex: 1, minWidth: '240px', background: '#07090f', margin: 0 }}>
          <i className="fa-solid fa-magnifying-glass input-icon"></i>
          <input
            type="text"
            placeholder="Search by player email, gateway or username..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', width: 'auto' }}>
          <select
            value={historyStatus}
            onChange={(e) => { setHistoryStatus(e.target.value); setHistoryPage(1); }}
            style={{
              background: '#07090f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '0.725rem',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="PENDING_COINS">VERIFYING COINS</option>
            <option value="FAILED">FAILED</option>
            <option value="HOLD">HOLD</option>
          </select>

          <select
            value={historyType}
            onChange={(e) => { setHistoryType(e.target.value); setHistoryPage(1); }}
            style={{
              background: '#07090f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '0.725rem',
              cursor: 'pointer'
            }}
          >
            <option value="">All Types</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAW">WITHDRAW</option>
            <option value="BONUS">BONUS / ADJUSTMENT</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User Email</th>
              <th>Game Title</th>
              <th>Tx Type</th>
              <th>Amount</th>
              <th>Gateway Details / Notes</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Screenshot</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center text-muted" style={{ padding: '2rem' }}>
                  No matching transaction logs found.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx.id}>
                  <td>{(historyPage - 1) * limit + idx + 1}</td>
                  <td>
                    <div>{tx.userEmail}</div>
                    {tx.gameUsername && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', marginTop: '0.15rem' }}>
                        <i className="fa-solid fa-gamepad" style={{ marginRight: '3px' }}></i> {tx.gameUsername}
                      </div>
                    )}
                  </td>
                  <td><strong>{tx.gameTitle || 'Lobby'}</strong></td>
                  <td>
                    <span className={`admin-badge-preview b-${tx.isFreeplayWithdraw ? 'vip' : (tx.type === 'DEPOSIT' ? 'hot' : tx.type === 'WITHDRAW' ? 'new' : 'ready')}`}>
                      {tx.isFreeplayWithdraw ? 'FREEPLAY' : tx.type}
                    </span>
                  </td>
                  <td><strong>${parseFloat(tx.amount).toFixed(2)}</strong></td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                      {tx.gateway || '—'} {tx.code ? `(${tx.code})` : ''}
                    </span>
                    {tx.noteCode && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--cyan-primary)', fontFamily: 'monospace', fontWeight: 800, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-hashtag" /> Note: <span>{tx.noteCode}</span>
                      </div>
                    )}
                    {(tx.senderTag || tx.senderName) && (
                      <div style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 700, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-user-tag" /> Sender: <span>{tx.senderTag || tx.senderName}</span>
                      </div>
                    )}
                    {tx.note && <p style={{ fontSize: '0.675rem', color: '#ffb703', margin: '0.2rem 0 0 0' }}>{tx.note}</p>}
                    
                    {/* Action Logger details */}
                    {tx.approvedBy && (
                      <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-user-shield text-blue" style={{ fontSize: '0.65rem' }}></i>
                        <span>Approved By:</span>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{tx.approvedBy}</span>
                      </div>
                    )}
                    {tx.allottedBy && (
                      <div style={{ fontSize: '0.65rem', marginTop: '0.15rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-circle-dollar-to-slot text-green" style={{ fontSize: '0.65rem' }}></i>
                        <span>Coins Allotted By:</span>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{tx.allottedBy}</span>
                      </div>
                    )}
                    {tx.payoutSent !== undefined && (
                      <div style={{ fontSize: '0.675rem', marginTop: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
                        <i className="fa-solid fa-circle-check"></i> Paid: ${parseFloat(tx.payoutSent).toFixed(2)}
                        {tx.payoutHold > 0 && <span style={{ color: '#f59e0b' }}> • Hold: ${parseFloat(tx.payoutHold).toFixed(2)}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.7rem' }}>{formatDeviceDateTime(tx.createdAt, tx.date)}</td>
                  <td>
                    <span className={`admin-badge-preview b-${(tx.status === 'PENDING_COINS' || tx.status === 'COINS_LOADING') ? 'new' : (tx.status.toLowerCase() === 'success' ? 'ready' : tx.status.toLowerCase())}`}>
                      {tx.status === 'PENDING_COINS' ? 'VERIFYING COINS' : (tx.status === 'COINS_LOADING' ? 'COINS LOADING' : tx.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                      {tx.screenshot ? (
                        <button
                          onClick={() => onInspectProof(tx.screenshot, tx.id, tx.type === 'WITHDRAW' ? 'screenshot' : null, tx)}
                          className="submit-btn"
                          style={{ background: tx.type === 'WITHDRAW' ? '#eab308' : '#3498db', color: tx.type === 'WITHDRAW' ? '#000' : '#fff', margin: 0, padding: '0.35rem 0.65rem', width: 'auto', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
                        >
                          <i className={`fa-solid ${tx.type === 'WITHDRAW' ? 'fa-gamepad' : 'fa-receipt'}`}></i>{' '}
                          <span style={{ fontSize: '0.65rem' }}>{tx.type === 'WITHDRAW' ? 'Game Balance' : 'View Proof'}</span>
                        </button>
                      ) : null}
                      {tx.type === 'WITHDRAW' && tx.tagQrScreenshot ? (
                        <button
                          onClick={() => onInspectProof(tx.tagQrScreenshot, tx.id, 'tagQrScreenshot', tx)}
                          className="submit-btn"
                          style={{ background: '#a855f7', color: '#fff', margin: 0, padding: '0.35rem 0.65rem', width: 'auto', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
                        >
                          <i className="fa-solid fa-qrcode"></i> <span style={{ fontSize: '0.65rem' }}>Tag QR</span>
                        </button>
                      ) : null}
                      {tx.type === 'WITHDRAW' && tx.payoutProof ? (
                        <button
                          onClick={() => onInspectProof(tx.payoutProof, tx.id, 'payoutProof', tx)}
                          className="submit-btn"
                          style={{ background: '#10b981', color: '#fff', margin: 0, padding: '0.35rem 0.65rem', width: 'auto', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
                        >
                          <i className="fa-solid fa-money-check-dollar"></i> <span style={{ fontSize: '0.65rem' }}>Paid Receipt</span>
                        </button>
                      ) : null}
                      {!tx.screenshot && !(tx.type === 'WITHDRAW' && tx.tagQrScreenshot) && !(tx.type === 'WITHDRAW' && tx.payoutProof) && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {tx.status === 'PENDING' ? (
                      <div className="table-actions" style={{ justifyContent: 'flex-start', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenReApproveModal(tx)}
                          className="action-row-btn btn-edit"
                          style={{ background: '#22c55e', color: '#fff' }}
                          title="Approve Payment"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button
                          onClick={() => handleOpenRevokeModal(tx)}
                          className="action-row-btn btn-delete"
                          style={{ background: '#ef4444', color: '#fff' }}
                          title="Fail Payment"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ) : (tx.status === 'FAILED' || tx.status === 'REJECTED' || tx.status === 'CANCELLED') ? (
                      <button
                        onClick={() => handleOpenReApproveModal(tx)}
                        className="action-row-btn"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                          color: '#fff',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.68rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          border: 'none',
                          fontWeight: 'bold'
                        }}
                        title="Re-Approve Failed Payment"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Approve</span>
                      </button>
                    ) : (tx.status === 'SUCCESS' || tx.status === 'READY' || tx.status === 'COMPLETED' || tx.status === 'COINS_LOADING') ? (
                      <button
                        onClick={() => handleOpenRevokeModal(tx)}
                        className="action-row-btn"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#fff',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.68rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          border: 'none',
                          fontWeight: 'bold'
                        }}
                        title="Revoke & Mark Failed"
                      >
                        <i className="fa-solid fa-ban"></i>
                        <span>Mark Failed</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing page {historyPage} of {totalPages} ({totalTransactions} entries)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleHistoryPrevPage}
              disabled={historyPage === 1}
              className="action-row-btn"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem', opacity: historyPage === 1 ? 0.4 : 1, cursor: historyPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              &larr; Prev
            </button>
            <button
              onClick={handleHistoryNextPage}
              disabled={historyPage === totalPages}
              className="action-row-btn"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem', opacity: historyPage === totalPages ? 0.4 : 1, cursor: historyPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STATUS OVERRIDE CONFIRMATION MODAL */}
      {statusModalOpen && targetStatusTx && (
        <PanelModalBackdrop onClose={() => setStatusModalOpen(false)}>
          <div className="admin-modal" style={{ width: '90%', maxWidth: '460px', background: '#0a0e1a', border: `1px solid ${targetNewStatus === 'SUCCESS' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.85)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: targetNewStatus === 'SUCCESS' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                <i className={`fa-solid ${targetNewStatus === 'SUCCESS' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                {targetNewStatus === 'SUCCESS' ? 'Re-Approve Failed Transaction' : 'Revoke & Mark Payment Failed'}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5' }}>
                {targetNewStatus === 'SUCCESS' ? (
                  <>Are you sure you want to <strong style={{ color: '#22c55e' }}>RE-APPROVE</strong> this previously failed transaction?</>
                ) : (
                  <>Are you sure you want to <strong style={{ color: '#ef4444' }}>REVOKE &amp; MARK FAILED</strong> this approved transaction?</>
                )}
              </p>

              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Player Email: </span>
                  <span style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontWeight: 600 }}>{targetStatusTx.userEmail}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Type &amp; Game: </span>
                  <strong style={{ color: '#fff' }}>{targetStatusTx.type}</strong> — <span>{targetStatusTx.gameTitle}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Amount: </span>
                  <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>${parseFloat(targetStatusTx.amount || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Gateway: </span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{targetStatusTx.gateway || '—'} {targetStatusTx.code ? `(${targetStatusTx.code})` : ''}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Current Status: </span>
                  <span className={`admin-badge-preview b-${targetStatusTx.status.toLowerCase() === 'success' ? 'ready' : targetStatusTx.status.toLowerCase()}`}>
                    {targetStatusTx.status}
                  </span>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '0.25rem' }}>
                <label htmlFor="override-reason-tx" style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', display: 'block' }}>
                  {targetNewStatus === 'SUCCESS' ? 'Approval Note (Optional)' : 'Reason for Rejection / Failure (Required)'}
                </label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-comment-dots input-icon"></i>
                  <input
                    type="text"
                    id="override-reason-tx"
                    placeholder={targetNewStatus === 'SUCCESS' ? 'e.g. Re-approved after verification' : 'e.g. Approved by mistake / Chargeback'}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="action-row-btn"
                  style={{ flex: 1, padding: '0.65rem', background: '#334155', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  Close / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusOverride}
                  disabled={isSubmittingStatus}
                  className="submit-btn"
                  style={{
                    flex: 1.2,
                    padding: '0.65rem',
                    background: targetNewStatus === 'SUCCESS' ? 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isSubmittingStatus ? 'wait' : 'pointer',
                    opacity: isSubmittingStatus ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    margin: 0
                  }}
                >
                  {isSubmittingStatus ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className={`fa-solid ${targetNewStatus === 'SUCCESS' ? 'fa-check' : 'fa-xmark'}`}></i>}
                  <span>{isSubmittingStatus ? 'Updating...' : targetNewStatus === 'SUCCESS' ? 'Confirm Re-Approve' : 'Confirm Fail'}</span>
                </button>
              </div>
            </div>
          </div>
        </PanelModalBackdrop>
      )}
    </section>
  );
}
