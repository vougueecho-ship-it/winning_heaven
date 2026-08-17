'use client';

import React, { useState, useEffect } from 'react';
import usePollingSWR from '../../hooks/usePollingSWR';
import { POLL } from '../../lib/pollingConfig';
import { formatDeviceDateTime } from '../../lib/formatDateTime';

export default function CoinsAllotmentTab({
  onUpdateCoinsNotification,
  completedActionIds = {},
  processingIds = {},
  wrapAction,
  adminUser
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'HOLD' | 'COMPLETED' | 'CANCELLED'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Hold Note Modal State
  const [holdModal, setHoldModal] = useState({
    isOpen: false,
    noti: null,
    noteText: ''
  });

  // Quick preset templates for hold notes
  const holdPresets = [
    'Please select another game, this game is temporarily under maintenance.',
    'Invalid game account username. Please provide correct login details.',
    'Game server currently loading/slow. Please hold.',
    'Player low balance or transaction issue.'
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Determine status param for API
  let apiStatusParam = 'ALL';
  if (statusTab === 'PENDING') {
    apiStatusParam = 'PENDING,CLAIM_REQUESTED';
  } else if (statusTab === 'HOLD') {
    apiStatusParam = 'HOLD';
  } else if (statusTab === 'COMPLETED') {
    apiStatusParam = 'COMPLETED';
  } else if (statusTab === 'CANCELLED') {
    apiStatusParam = 'CANCELLED,FAILED';
  }

  const { data, error, mutate, isValidating } = usePollingSWR(
    `/api/coins-notifications?status=${apiStatusParam}&page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&adminRole=${adminUser?.role || ''}&adminDistributorId=${adminUser?.distributorId || ''}&adminEmail=${encodeURIComponent(adminUser?.email || '')}&slim=1`,
    POLL.LIVE,
    { refreshWhenHidden: true, keepPreviousData: true, dedupingInterval: 200 }
  );

  const rawNotifications = data?.coinsNotifications || [];
  const totalNotifications = data?.totalNotifications || 0;
  const totalPages = Math.max(1, data?.totalPages || 1);
  const statusCounts = data?.statusCounts || { all: totalNotifications, pending: 0, hold: 0, completed: 0, cancelled: 0 };

  // Filter out tasks that were marked DONE optimistically while still on PENDING tab
  const notifications = rawNotifications.filter((n) => {
    const isCompletedOptimistic = completedActionIds[n.id] || completedActionIds[String(n.id)];
    if (isCompletedOptimistic && statusTab === 'PENDING') {
      return false;
    }
    return true;
  });

  const handleUpdate = async (id, status, read, holdNote) => {
    if (onUpdateCoinsNotification) {
      await onUpdateCoinsNotification(id, status, read, holdNote);
    }
    mutate();
  };

  const openHoldDialog = (noti) => {
    setHoldModal({
      isOpen: true,
      noti,
      noteText: noti.holdNote || ''
    });
  };

  const submitHoldNote = async () => {
    if (!holdModal.noti) return;
    const notiId = holdModal.noti.id;
    const note = holdModal.noteText.trim();
    setHoldModal({ isOpen: false, noti: null, noteText: '' });
    await handleUpdate(notiId, 'HOLD', undefined, note);
  };

  const resumeFromHold = async (noti) => {
    await handleUpdate(noti.id, 'PENDING', undefined, '');
  };

  const isLoading = !data && !error;

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', position: 'relative' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 18, 36, 0.95) 0%, rgba(7, 10, 22, 0.95) 100%)',
        border: '1.5px solid rgba(255, 215, 0, 0.25)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Title & Live Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.05) 100%)',
              border: '1px solid var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              color: 'var(--gold-primary)',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)'
            }}>
              <i className="fa-solid fa-coins" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Game Coin Allotment Tasks
                {statusCounts.pending > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                    animation: 'pulse 1.8s infinite'
                  }}>
                    {statusCounts.pending} NEW
                  </span>
                )}
                {statusCounts.hold > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                  }}>
                    {statusCounts.hold} ON HOLD
                  </span>
                )}
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Active queue stays pinned on top · Quick hold with notes · Full search & pagination
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => mutate()}
              className="action-row-btn"
              title="Refresh queue"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className={`fa-solid fa-arrows-rotate ${isValidating ? 'fa-spin' : ''}`} style={{ color: 'var(--gold-primary)' }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {[
            { key: 'ALL', label: 'ALL TASKS', count: statusCounts.all, icon: 'fa-list-check', color: '#fff' },
            { key: 'PENDING', label: 'PENDING / CLAIM', count: statusCounts.pending, icon: 'fa-clock', color: '#00f0ff', highlight: statusCounts.pending > 0 },
            { key: 'HOLD', label: 'ON HOLD', count: statusCounts.hold, icon: 'fa-pause', color: '#f59e0b', highlight: statusCounts.hold > 0 },
            { key: 'COMPLETED', label: 'COMPLETED', count: statusCounts.completed, icon: 'fa-circle-check', color: '#10b981' },
            { key: 'CANCELLED', label: 'CANCELLED', count: statusCounts.cancelled, icon: 'fa-ban', color: '#ef4444' }
          ].map((tab) => {
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.1) 100%)'
                    : 'transparent',
                  border: active ? '1.5px solid var(--gold-primary)' : '1px solid transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  borderRadius: '9px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.74rem',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.18s ease'
                }}
              >
                <i className={`fa-solid ${tab.icon}`} style={{ color: active ? 'var(--gold-primary)' : tab.color }} />
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                  background: active ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: active ? '#ffd700' : (tab.highlight ? tab.color : 'rgba(255, 255, 255, 0.6)'),
                  border: tab.highlight && !active ? `1px solid ${tab.color}` : 'none'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Per Page Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-wrapper search-wrapper" style={{ flex: 1, minWidth: '240px', background: '#070914', margin: 0 }}>
            <i className="fa-solid fa-magnifying-glass input-icon" style={{ color: 'var(--gold-primary)' }} />
            <input
              type="text"
              placeholder="Search by player email, game username, title, or hold notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: '#fff', fontSize: '0.8rem' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                &times;
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Per Page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                background: '#070914',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: '#fff',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive" style={{ borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', background: '#080a14' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Player Account</th>
              <th>Target Game</th>
              <th>Deposit Cash</th>
              <th>Bonus</th>
              <th>Allotment Target</th>
              <th>Timestamp</th>
              <th>Read</th>
              <th>Status</th>
              <th style={{ minWidth: '190px' }}>Actions / Hold Management</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="text-center text-muted" style={{ padding: '3rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--gold-primary)', fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                  <span>Loading coin allotment tasks...</span>
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center text-muted" style={{ padding: '3rem' }}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem', display: 'block' }}></i>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No coin allotment tasks found matching criteria.</p>
                </td>
              </tr>
            ) : (
              notifications.map((noti, idx) => {
                const isHold = noti.status === 'HOLD';
                const isPending = noti.status === 'PENDING' || noti.status === 'CLAIM_REQUESTED';
                const isCompleted = noti.status === 'COMPLETED';
                const isProcessing = Boolean(processingIds[noti.id]);

                return (
                  <tr
                    key={noti.id}
                    style={{
                      background: isHold ? 'rgba(245, 158, 11, 0.04)' : undefined,
                      borderLeft: isHold ? '3px solid #f59e0b' : (isPending ? '3px solid #00f0ff' : undefined),
                      opacity: isCompleted ? 0.7 : 1,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <td>{(page - 1) * limit + idx + 1}</td>
                    
                    {/* Player Info */}
                    <td>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.82rem' }}>
                        {noti.userEmail}
                      </div>
                      {noti.gameUsername ? (
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'var(--gold-primary)',
                          marginTop: '0.2rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(255, 215, 0, 0.08)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 215, 0, 0.2)'
                        }}>
                          <i className="fa-solid fa-gamepad" />
                          <span>{noti.gameUsername}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          No game username set
                        </div>
                      )}
                    </td>

                    {/* Target Game */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                        <span className={`admin-badge-preview ${noti.totalCoins < 0 ? 'b-new' : 'b-hot'}`}>
                          {noti.gameTitle}
                        </span>
                        {noti.isDepositFromCashout && (
                          <div style={{ fontSize: '0.62rem', color: '#ffe16c', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            🎁 DEPOSIT FROM CASHOUT
                          </div>
                        )}
                        {noti.isFreeplayWithdraw && (
                          <div style={{ fontSize: '0.62rem', color: '#ff4d6d', background: 'rgba(255, 77, 109, 0.1)', border: '1px solid rgba(255, 77, 109, 0.25)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            ⚠️ FREEPLAY WIN: MAX $30
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cash Amount */}
                    <td>
                      {noti.bonusApplied === -1 ? (
                        <span style={{ color: '#ff4d6d', fontWeight: 700 }}>${parseFloat(noti.depositAmount || 0).toFixed(2)}</span>
                      ) : noti.bonusApplied === -2 ? (
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>Referral</span>
                      ) : (
                        <strong style={{ color: '#fff' }}>${parseFloat(noti.depositAmount || 0).toFixed(2)}</strong>
                      )}
                    </td>

                    {/* Bonus Applied */}
                    <td>
                      {noti.bonusApplied === -1 ? (
                        <span style={{ color: '#ff4d6d', fontWeight: 'bold', fontSize: '0.72rem' }}>DEDUCTION</span>
                      ) : noti.bonusApplied === -2 ? (
                        <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '0.72rem' }}>100% REF</span>
                      ) : noti.bonusApplied === -3 || noti.isFreeplay || (noti.bonusApplied === 100 && parseFloat(noti.depositAmount || 0) === 0) ? (
                        <span style={{ color: '#00ff66', fontWeight: 'bold', fontSize: '0.72rem' }}>FREEPLAY</span>
                      ) : (
                        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.72rem' }}>{noti.bonusApplied}% Bonus</span>
                      )}
                    </td>

                    {/* Coins Target */}
                    <td>
                      {noti.totalCoins < 0 ? (
                        <strong style={{ color: '#ff4d6d', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                          <i className="fa-solid fa-coins" style={{ marginRight: '4px' }} />
                          -{Math.floor(Math.abs(Number(noti.totalCoins) || 0))}
                        </strong>
                      ) : (
                        <strong style={{ color: '#00ff66', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                          <i className="fa-solid fa-coins" style={{ color: '#00ff66', marginRight: '4px' }} />
                          +{Math.floor(Number(noti.totalCoins) || 0)}
                        </strong>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                      {formatDeviceDateTime(noti.timestamp, noti.createdAt, noti.date)}
                    </td>

                    {/* Read Indicator */}
                    <td>
                      <button
                        disabled={isProcessing}
                        onClick={wrapAction ? wrapAction(noti.id, () => handleUpdate(noti.id, undefined, !noti.read)) : () => handleUpdate(noti.id, undefined, !noti.read)}
                        className="action-row-btn"
                        style={{
                          background: noti.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.15)',
                          border: noti.read ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ffd700',
                          color: noti.read ? '#a0aec0' : '#ffd700',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          padding: '0.25rem 0.55rem',
                          width: 'auto',
                          borderRadius: '6px'
                        }}
                      >
                        {isProcessing ? <i className="fa-solid fa-spinner fa-spin" /> : (noti.read ? 'READ' : 'UNREAD')}
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`admin-badge-preview b-${noti.status === 'PENDING' ? 'none' : noti.status === 'HOLD' ? 'new' : noti.status === 'CLAIM_REQUESTED' ? 'hot' : (noti.status === 'COMPLETED' ? 'ready' : 'closed')}`}>
                        {noti.status === 'HOLD' ? 'ON HOLD' : noti.status === 'CLAIM_REQUESTED' ? 'CLAIM REQUESTED' : noti.status}
                      </span>
                    </td>

                    {/* Actions & Hold Notes */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                        
                        {/* Hold Note preview if on hold */}
                        {isHold && (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '8px',
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.68rem',
                            color: '#ffd074',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}>
                            <span style={{ fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', fontSize: '0.62rem' }}>
                              <i className="fa-solid fa-pause" style={{ marginRight: '4px' }} /> Hold Instruction:
                            </span>
                            <span style={{ wordBreak: 'break-word', fontStyle: 'italic' }}>
                              "{noti.holdNote || 'Task is currently on hold.'}"
                            </span>
                          </div>
                        )}

                        {/* Action Buttons for Active Queue */}
                        {(isPending || isHold) && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {/* DONE / LOADED Button */}
                            <button
                              disabled={isProcessing}
                              onClick={wrapAction ? wrapAction(noti.id, () => handleUpdate(noti.id, 'COMPLETED', true)) : () => handleUpdate(noti.id, 'COMPLETED', true)}
                              className="submit-btn"
                              style={{
                                background: 'linear-gradient(135deg, #00ff66 0%, #00a844 100%)',
                                color: '#000',
                                margin: 0,
                                padding: '0.35rem 0.6rem',
                                width: 'auto',
                                display: 'inline-flex',
                                gap: '0.3rem',
                                alignItems: 'center',
                                fontWeight: 900,
                                fontSize: '0.68rem',
                                borderRadius: '6px'
                              }}
                            >
                              {isProcessing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-circle-check" />}
                              <span>DONE (LOADED)</span>
                            </button>

                            {/* HOLD / EDIT NOTE Button */}
                            <button
                              type="button"
                              onClick={() => openHoldDialog(noti)}
                              className="submit-btn"
                              style={{
                                background: isHold ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: isHold ? '#fff' : '#000',
                                margin: 0,
                                padding: '0.35rem 0.55rem',
                                width: 'auto',
                                display: 'inline-flex',
                                gap: '0.25rem',
                                alignItems: 'center',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                borderRadius: '6px'
                              }}
                            >
                              <i className={`fa-solid ${isHold ? 'fa-pen-to-square' : 'fa-pause'}`} />
                              <span>{isHold ? 'EDIT NOTE' : 'HOLD'}</span>
                            </button>

                            {/* UNHOLD / RESUME Button (if already on hold) */}
                            {isHold && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={wrapAction ? wrapAction(noti.id, () => resumeFromHold(noti)) : () => resumeFromHold(noti)}
                                className="submit-btn"
                                style={{
                                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                  color: '#000',
                                  margin: 0,
                                  padding: '0.35rem 0.55rem',
                                  width: 'auto',
                                  display: 'inline-flex',
                                  gap: '0.25rem',
                                  alignItems: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  borderRadius: '6px'
                                }}
                                title="Resume task back to Pending queue"
                              >
                                <i className="fa-solid fa-play" />
                                <span>RESUME</span>
                              </button>
                            )}

                            {/* CANCEL Button */}
                            <button
                              disabled={isProcessing}
                              onClick={wrapAction ? wrapAction(noti.id, async () => {
                                if (window.confirm('Are you sure you want to cancel this coins allotment request?')) {
                                  await handleUpdate(noti.id, 'CANCELLED', true, 'Cancelled by Administrator');
                                }
                              }) : async () => {
                                if (window.confirm('Are you sure you want to cancel this coins allotment request?')) {
                                  await handleUpdate(noti.id, 'CANCELLED', true, 'Cancelled by Administrator');
                                }
                              }}
                              className="submit-btn"
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                color: '#fff',
                                margin: 0,
                                padding: '0.35rem 0.5rem',
                                width: 'auto',
                                display: 'inline-flex',
                                gap: '0.25rem',
                                alignItems: 'center',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                borderRadius: '6px'
                              }}
                              title="Cancel coins allotment directly"
                            >
                              <i className="fa-solid fa-xmark" />
                              <span>CANCEL</span>
                            </button>
                          </div>
                        )}

                        {/* Completed / Cancelled label */}
                        {isCompleted && (
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-circle-check" /> Coins Fulfilled
                          </div>
                        )}

                        {noti.status === 'CANCELLED' && (
                          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>
                            {noti.holdNote || 'Cancelled'}
                          </div>
                        )}

                        {noti.distributorType === 'B' && (
                          <span style={{ fontSize: '0.62rem', color: '#3b82f6', display: 'block' }}>
                            Managed by {noti.distributorName || 'Distributor'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Always Rendered */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.25rem',
        padding: '0.75rem 1rem',
        background: 'rgba(6, 8, 18, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Showing</span>
          <strong style={{ color: '#fff' }}>
            {totalNotifications > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalNotifications)}
          </strong>
          <span>of</span>
          <strong style={{ color: 'var(--gold-primary)' }}>{totalNotifications}</strong>
          <span>tasks</span>
          {statusTab !== 'ALL' && <span style={{ color: 'var(--cyan-primary)' }}>({statusTab})</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="action-row-btn"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.72rem', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            &laquo; First
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="action-row-btn"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.72rem', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            &larr; Prev
          </button>

          {/* Page Indicator Pill */}
          <div style={{
            padding: '0.35rem 0.75rem',
            background: 'rgba(255, 215, 0, 0.12)',
            border: '1px solid var(--gold-primary)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--gold-primary)'
          }}>
            Page {page} of {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="action-row-btn"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.72rem', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next &rarr;
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="action-row-btn"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.72rem', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Last &raquo;
          </button>
        </div>
      </div>

      {/* Hold Note Modal / Drawer */}
      {holdModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setHoldModal({ isOpen: false, noti: null, noteText: '' })}>
          <div style={{
            background: '#0d1020',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-pause" /> Place Allotment Task ON HOLD
              </h3>
              <button
                type="button"
                onClick={() => setHoldModal({ isOpen: false, noti: null, noteText: '' })}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {holdModal.noti && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div><strong>Player:</strong> {holdModal.noti.userEmail}</div>
                <div><strong>Game:</strong> {holdModal.noti.gameTitle} ({holdModal.noti.gameUsername || 'No username'}) • Coins: {holdModal.noti.totalCoins}</div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Quick Preset Templates:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {holdPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setHoldModal(prev => ({ ...prev, noteText: preset }))}
                    style={{
                      textAlign: 'left',
                      background: holdModal.noteText === preset ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: holdModal.noteText === preset ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                      color: holdModal.noteText === preset ? '#ffd074' : '#ccc',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Hold Instruction / Note:
              </label>
              <textarea
                value={holdModal.noteText}
                onChange={(e) => setHoldModal(prev => ({ ...prev, noteText: e.target.value }))}
                placeholder="Type specific hold reason or instruction for staff/player..."
                rows={3}
                style={{
                  width: '100%',
                  background: '#060814',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.78rem',
                  padding: '0.6rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setHoldModal({ isOpen: false, noti: null, noteText: '' })}
                className="action-row-btn"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitHoldNote}
                className="submit-btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#000',
                  fontWeight: 900,
                  padding: '0.45rem 1.1rem',
                  margin: 0,
                  width: 'auto',
                  fontSize: '0.75rem'
                }}
              >
                <i className="fa-solid fa-check" /> Save & Put on Hold
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
