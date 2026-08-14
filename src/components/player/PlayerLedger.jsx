'use client';

import React, { useState, useMemo } from 'react';
import { formatDeviceDateTime } from '../../lib/formatDateTime';
import RemainderClaimAction from '../RemainderClaimAction';

export default function PlayerLedger({
  transactions = [],
  onOpenReuploadProof,
  claimedRemainderIds = [],
  onClaimRemainder,
  onDepositFromCashout
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'DEPOSIT' | 'WITHDRAW'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'

  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      // Type check
      if (filterType !== 'ALL' && (tx.type || '').toUpperCase() !== filterType) {
        return false;
      }
      // Status check
      if (filterStatus !== 'ALL' && (tx.status || '').toUpperCase() !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [transactions, filterType, filterStatus]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'SUCCESS') return <span className="badge-emerald"><i className="fa-solid fa-circle-check" /> COMPLETED</span>;
    if (s === 'REJECTED' || s === 'FAILED') return <span className="badge-red"><i className="fa-solid fa-circle-xmark" /> REJECTED</span>;
    return <span className="badge-gold"><i className="fa-solid fa-hourglass-half" /> PENDING</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', padding: '1rem 0' }}>
      
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--card-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--card-border)',
        borderRadius: '18px',
        padding: '1.25rem 1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
            TRANSACTION <span className="gold-gradient-text">LEDGER</span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time status tracking for deposits, cashouts & bonuses
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'rgba(6,8,18,0.8)',
              border: '1px solid var(--border-muted)',
              color: '#fff',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="DEPOSIT">Deposits Only</option>
            <option value="WITHDRAW">Cashouts Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(6,8,18,0.8)',
              border: '1px solid var(--border-muted)',
              color: '#fff',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTxs.length === 0 ? (
        <div style={{
          background: 'rgba(10, 14, 28, 0.6)',
          border: '1px solid var(--card-border)',
          borderRadius: '18px',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <i className="fa-solid fa-receipt" style={{ fontSize: '2.5rem', color: 'rgba(255,200,0,0.3)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.5rem 0' }}>No Transactions Recorded</h3>
          <p style={{ fontSize: '0.85rem' }}>Your deposit and cashout history will show here in real time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTxs.map((tx) => {
            const isDeposit = (tx.type || '').toUpperCase() === 'DEPOSIT';
            const isPending = (tx.status || '').toUpperCase() === 'PENDING';
            const needsProof = isDeposit && isPending && !tx.screenshot;
            const hasHold = parseFloat(tx.payoutHold || 0) > 0 && tx.remainderPaid !== true;

            return (
              <div
                key={tx.id || tx._id}
                style={{
                  background: 'rgba(12, 16, 32, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Type Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isDeposit ? 'rgba(0, 230, 118, 0.12)' : 'rgba(0, 240, 255, 0.12)',
                    border: `1px solid ${isDeposit ? 'var(--emerald-primary)' : 'var(--cyan-primary)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDeposit ? 'var(--emerald-primary)' : 'var(--cyan-primary)',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    <i className={isDeposit ? 'fa-solid fa-arrow-down-left' : 'fa-solid fa-arrow-up-right'} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                      {tx.isDepositFromCashout ? 'CASHOUT DEP' : isDeposit ? 'DEPOSIT' : 'CASHOUT'} - {tx.gameTitle || tx.gatewayName || 'MAIN WALLET'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDeviceDateTime(tx.timestamp || tx.createdAt)}
                    </div>
                    {/* Partial Payout Breakdown */}
                    {parseFloat(tx.payoutHold || 0) > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#ffc800', marginTop: '0.2rem', fontWeight: 700 }}>
                        Paid: ${parseFloat(tx.payoutSent || tx.amount || 0).toFixed(2)} • Hold: ${parseFloat(tx.payoutHold).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount & Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-heading)',
                      color: isDeposit ? 'var(--emerald-primary)' : 'var(--cyan-primary)'
                    }}>
                      {isDeposit ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                    </div>
                    {tx.noteCode && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Code: {tx.noteCode}
                      </div>
                    )}
                  </div>

                  <div>{getStatusBadge(tx.status)}</div>

                  {/* Remainder Claim Action Button */}
                  {onClaimRemainder && (
                    <RemainderClaimAction
                      tx={tx}
                      claimedIds={claimedRemainderIds}
                      onClaim={onClaimRemainder}
                    />
                  )}

                  {/* Deposit Hold to Game Action Button */}
                  {hasHold && onDepositFromCashout && (
                    <button
                      type="button"
                      onClick={() => onDepositFromCashout(tx)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                        border: '1px solid #eab308',
                        color: '#ffc800',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.35rem 0.7rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <i className="fa-solid fa-gamepad" /> DEPOSIT TO GAME
                    </button>
                  )}

                  {/* Re-upload proof trigger if missing screenshot */}
                  {needsProof && onOpenReuploadProof && (
                    <button
                      onClick={() => onOpenReuploadProof(tx)}
                      className="btn-gold-glow"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      <i className="fa-solid fa-upload" /> PROOF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
