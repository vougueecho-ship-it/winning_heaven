'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDeviceDateTime } from '../../lib/formatDateTime';

export default function GameHubPage({
  game,
  userAccount,
  hasPendingAccountRequest = false,
  onRequestAccount,
  onBack,
  showToast,
  onOpenDepositForGame,
  onOpenWithdrawForGame,
  onRequestFreeplayForGame,
  onOpenSupport,
  transactions = [],
  freeplayGate = {}
}) {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [localPending, setLocalPending] = useState(false);
  const [freeplaySubmitting, setFreeplaySubmitting] = useState(false);

  if (!game) return null;

  const isPending = Boolean(hasPendingAccountRequest || localPending) && !userAccount;
  const isLinked = Boolean(userAccount && userAccount.username);

  const copyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 1500);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 1500);
    }
    if (showToast) showToast(`Copied ${type === 'user' ? 'Username' : 'Password'} to clipboard!`, 'success');
  };

  const handleLaunch = () => {
    let launchUrl = userAccount?.loginUrl || game.link || game.loginUrl || game.url || game.downloadUrl;
    if (launchUrl && typeof launchUrl === 'string' && launchUrl.trim()) {
      launchUrl = launchUrl.trim();
      const targetUrl = /^https?:\/\//i.test(launchUrl) ? launchUrl : `https://${launchUrl}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      if (showToast) showToast('Platform launch link not configured by admin.', 'info');
    }
  };

  const handleRequestClick = async () => {
    if (isSubmittingRequest) return;
    setIsSubmittingRequest(true);
    try {
      if (onRequestAccount) {
        await onRequestAccount(game.title);
      }
      setLocalPending(true);
      if (showToast) showToast(`Account request for ${game.title} submitted to 24/7 admin team!`, 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to submit account request.', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleFreeplayClick = async () => {
    if (freeplaySubmitting) return;
    setFreeplaySubmitting(true);
    try {
      if (onRequestFreeplayForGame) {
        await onRequestFreeplayForGame(game.title);
      }
    } finally {
      setFreeplaySubmitting(false);
    }
  };

  // Filter transactions specific to this game
  const gameTxs = transactions.filter(
    (t) => String(t.gameTitle || '').toLowerCase().trim() === String(game.title || '').toLowerCase().trim()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1rem 0 3rem 0' }}
    >
      {/* Top Header Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(14, 18, 36, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '20px',
        padding: '1.25rem 1.75rem',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            className="btn-glass-secondary"
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.85rem', fontWeight: 800 }}
          >
            <i className="fa-solid fa-arrow-left" /> ALL GAMES
          </button>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{game.title.toUpperCase()}</span>
              <span className="gold-gradient-text">HUB</span>
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dedicated Platform Gaming Station &amp; Coin Operations
            </div>
          </div>
        </div>

        {isLinked ? (
          <span className="badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
            <span className="pulse-live" /> PLATFORM LINKED
          </span>
        ) : isPending ? (
          <span className="badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-spinner fa-spin" /> ACCOUNT PENDING
          </span>
        ) : (
          <span className="badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-sparkles" /> READY TO JOIN
          </span>
        )}
      </div>

      {/* Hero Showcase Card */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(20,16,40,0.96) 0%, rgba(10,12,24,0.96) 100%)',
        border: isLinked ? '1.5px solid rgba(255,215,0,0.4)' : isPending ? '1.5px solid rgba(255,170,0,0.35)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        overflow: 'hidden',
        boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 30px rgba(255,200,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '320px',
          height: '320px',
          background: isLinked 
            ? 'radial-gradient(circle, rgba(255,200,0,0.22) 0%, transparent 70%)'
            : isPending
              ? 'radial-gradient(circle, rgba(255,140,0,0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,210,255,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Artwork Image */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '22px',
          border: '2px solid rgba(255,215,0,0.4)',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(255,200,0,0.35)',
          flexShrink: 0,
          background: '#04050b'
        }}>
          <img src={game.image || game.logoUrl || '/winning_heaven_logo.png'} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Info & Launch Button */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div className="badge-gold" style={{ marginBottom: '0.6rem', display: 'inline-flex' }}>
            {game.category || 'SLOTS & FISH'}
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.15
          }}>
            {game.title}
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', maxWidth: '650px', lineHeight: 1.5 }}>
            {isLinked
              ? `Your personal ${game.title} gaming account is active. Launch the platform to play or manage your coins below.`
              : isPending
                ? `Account creation for ${game.title} is currently in progress with our 24/7 staff. Your credentials will appear here instantly once created.`
                : `Experience premium fish games, jackpot slots, and rapid cashouts on ${game.title}. Request your player account below to start winning!`}
          </p>

          {isLinked ? (
            <button onClick={handleLaunch} className="btn-gold-glow" style={{ padding: '0.85rem 1.8rem', fontSize: '0.95rem' }}>
              <i className="fa-solid fa-rocket" /> PLAY ON {game.title.toUpperCase()} PLATFORM
            </button>
          ) : isPending ? (
            <button
              onClick={() => onOpenDepositForGame(game.title)}
              className="btn-gold-glow"
              style={{ padding: '0.85rem 1.8rem', fontSize: '0.95rem' }}
            >
              <i className="fa-solid fa-coins" /> PRE-LOAD COINS WHILE WAITING &rarr;
            </button>
          ) : (
            <button
              onClick={handleRequestClick}
              disabled={isSubmittingRequest}
              className="btn-cyan-glow"
              style={{ padding: '0.85rem 1.8rem', fontSize: '0.95rem' }}
            >
              {isSubmittingRequest ? (
                <span><i className="fa-solid fa-spinner fa-spin" /> REQUESTING ACCOUNT...</span>
              ) : (
                <span><i className="fa-solid fa-user-plus" /> REQUEST {game.title.toUpperCase()} ACCOUNT &rarr;</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          STATE 1: ACCOUNT LINKED & ACTIVE (CREDENTIALS + ACTION CONTROLS)
          ========================================================================= */}
      {isLinked && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Game Login Credentials Card */}
            <div style={{
              background: 'rgba(14, 18, 36, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '20px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-key" />
                <span>PLATFORM LOGIN CREDENTIALS</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAME USERNAME</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    readOnly
                    value={userAccount.username || ''}
                    style={{
                      flex: 1,
                      background: 'rgba(6,8,18,0.9)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.95rem',
                      color: 'var(--cyan-primary)',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <button onClick={() => copyText(userAccount.username, 'user')} className="btn-gold-glow" style={{ padding: '0.75rem 1.1rem', fontSize: '0.82rem' }}>
                    {copiedUser ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAME PASSWORD</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    readOnly
                    value={userAccount.password || ''}
                    style={{
                      flex: 1,
                      background: 'rgba(6,8,18,0.9)',
                      border: '1.5px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.95rem',
                      color: 'var(--gold-primary)',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <button onClick={() => copyText(userAccount.password, 'pass')} className="btn-gold-glow" style={{ padding: '0.75rem 1.1rem', fontSize: '0.82rem' }}>
                    {copiedPass ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Triggers Box */}
            <div style={{
              background: 'rgba(14, 18, 36, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '20px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--cyan-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-coins" />
                  <span>GAME COIN ACTIONS</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Load coins, redeem cashouts, or request bonus freeplays specifically for {game.title}.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <button
                  onClick={() => onOpenDepositForGame(game.title)}
                  className="btn-gold-glow"
                  style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', flexDirection: 'column', gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-coins" style={{ fontSize: '1.2rem' }} />
                  <span>LOAD COINS</span>
                </button>

                <button
                  onClick={() => onOpenWithdrawForGame(game.title)}
                  className="btn-cyan-glow"
                  style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', flexDirection: 'column', gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-wallet" style={{ fontSize: '1.2rem' }} />
                  <span>CASHOUT</span>
                </button>

                <button
                  onClick={handleFreeplayClick}
                  disabled={freeplaySubmitting}
                  style={{
                    background: freeplayGate?.canClaim !== false
                      ? 'linear-gradient(135deg, #00e676 0%, #00a152 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: freeplayGate?.canClaim !== false ? '#000' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem 0.5rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    opacity: freeplayGate?.canClaim !== false ? 1 : 0.6,
                    boxShadow: freeplayGate?.canClaim !== false ? '0 0 20px rgba(0,230,118,0.35)' : 'none'
                  }}
                >
                  <i className="fa-solid fa-gift" style={{ fontSize: '1.2rem' }} />
                  <span>FREEPLAY</span>
                </button>
              </div>

              {/* Freeplay Gate Status Badge */}
              {freeplayGate && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: freeplayGate.canClaim ? '#00e676' : 'var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  background: 'rgba(6, 8, 18, 0.6)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <i className={freeplayGate.canClaim ? 'fa-solid fa-circle-check' : freeplayGate.phase === 'pending' ? 'fa-solid fa-clock' : 'fa-solid fa-lock'} />
                  <span>{freeplayGate.message || 'Freeplay Status'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Game-Specific Activity & Transactions Table */}
          <div style={{
            background: 'rgba(14, 18, 36, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '20px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
              {game.title.toUpperCase()} TRANSACTION HISTORY ({gameTxs.length})
            </h3>

            {gameTxs.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '2.2rem', color: 'rgba(255,200,0,0.3)', marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No transaction history for {game.title} yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {gameTxs.map((tx) => {
                  const txType = (tx.type || '').toUpperCase();
                  const isDeposit = txType === 'DEPOSIT';
                  const isWithdraw = ['WITHDRAW', 'REMAINDER_PAYOUT', 'COMMISSION_WITHDRAW'].includes(txType);
                  const isFreeplay = !isDeposit && !isWithdraw;

                  const iconBg = isDeposit
                    ? 'rgba(0,230,118,0.15)'
                    : isWithdraw
                      ? 'rgba(0,240,255,0.15)'
                      : 'rgba(255,200,0,0.15)';
                  const iconBorder = isDeposit
                    ? 'var(--emerald-primary)'
                    : isWithdraw
                      ? 'var(--cyan-primary)'
                      : 'var(--gold-primary)';
                  const iconColor = isDeposit
                    ? 'var(--emerald-primary)'
                    : isWithdraw
                      ? 'var(--cyan-primary)'
                      : 'var(--gold-primary)';

                  return (
                    <div
                      key={tx.id || tx._id}
                      style={{
                        background: 'rgba(6,8,18,0.7)',
                        border: '1px solid var(--border-muted)',
                        borderRadius: '14px',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: iconBg,
                          border: `1px solid ${iconBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: iconColor,
                          fontSize: '0.95rem'
                        }}>
                          <i className={isDeposit ? 'fa-solid fa-arrow-down-left' : isWithdraw ? 'fa-solid fa-arrow-up-right' : 'fa-solid fa-gift'} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                            {isDeposit ? 'DEPOSIT' : isWithdraw ? 'CASHOUT' : 'FREEPLAY BONUS'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDeviceDateTime(tx.timestamp || tx.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: 900,
                          fontFamily: 'var(--font-heading)',
                          color: isDeposit ? 'var(--emerald-primary)' : isWithdraw ? 'var(--cyan-primary)' : 'var(--gold-primary)'
                        }}>
                          {isDeposit ? '+' : isWithdraw ? '-' : ''}${parseFloat(tx.amount || 0).toFixed(2)}
                        </div>
                        <span className={tx.status === 'APPROVED' || tx.status === 'SUCCESS' ? 'badge-emerald' : tx.status === 'REJECTED' || tx.status === 'FAILED' ? 'badge-red' : 'badge-gold'}>
                          {tx.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          STATE 2: ACCOUNT REQUEST PENDING (COSMIC ANIMATED RADAR BOX)
          ========================================================================= */}
      {isPending && (
        <div style={{
          background: 'rgba(14, 18, 36, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255, 170, 0, 0.35)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.5rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255, 170, 0, 0.15)'
        }}>
          {/* Animated Glowing Radar Pulse */}
          <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: '#ffd700',
                borderRightColor: '#ff8800',
                boxShadow: '0 0 30px rgba(255, 180, 0, 0.4)'
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 200, 0, 0.25) 0%, transparent 70%)'
              }}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1a162b 0%, #080a14 100%)',
              border: '1.5px solid #ffaa00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffd700',
              fontSize: '1.75rem',
              zIndex: 2,
              boxShadow: '0 0 20px rgba(255, 170, 0, 0.5)'
            }}>
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
          </div>

          <div>
            <span className="badge-gold" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', marginBottom: '0.65rem', display: 'inline-flex' }}>
              <span className="pulse-live" /> STATUS: ACCOUNT CREATION IN PROGRESS
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', margin: '0 0 0.5rem 0' }}>
              Your {game.title} Player Account is Being Set Up
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.55 }}>
              Our 24/7 VIP Admin team has received your request and is currently provisioning your secure game credentials on the {game.title} server. This typically takes <strong>1 to 3 minutes</strong>.
            </p>
          </div>

          {/* 3-Step Live Progress Indicator */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            width: '100%',
            maxWidth: '780px',
            marginTop: '0.5rem'
          }}>
            <div style={{ background: 'rgba(6, 8, 18, 0.8)', border: '1.5px solid #00e676', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676', fontSize: '1.3rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>1. Request Received</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verified &amp; Queued</div>
              </div>
            </div>

            <div style={{ background: 'rgba(6, 8, 18, 0.8)', border: '1.5px solid #ffaa00', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 0 20px rgba(255,170,0,0.2)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ color: '#ffaa00', fontSize: '1.3rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffc800' }}>2. Provisioning</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Creating on server</div>
              </div>
            </div>

            <div style={{ background: 'rgba(6, 8, 18, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
              <i className="fa-solid fa-gamepad" style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>3. Ready to Play</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Credentials appear here</div>
              </div>
            </div>
          </div>

          {/* Action Shortcuts */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button
              onClick={() => onOpenDepositForGame(game.title)}
              className="btn-gold-glow"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem' }}
            >
              <i className="fa-solid fa-coins" /> Pre-Load Coins Now
            </button>

            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="btn-glass-secondary"
                style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem', color: '#00f0ff', borderColor: 'rgba(0,240,255,0.3)' }}
              >
                <i className="fa-solid fa-headset" /> 24/7 Live Support
              </button>
            )}

            <button
              onClick={onBack}
              className="btn-glass-secondary"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem' }}
            >
              <i className="fa-solid fa-arrow-left" /> Explore Other Games
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 3: FRESH STATE (NO ACCOUNT REQUESTED YET)
          ========================================================================= */}
      {!isLinked && !isPending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Request CTA Box */}
          <div style={{
            background: 'rgba(14, 18, 36, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 35px rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.2) 0%, rgba(255,200,0,0.2) 100%)',
              border: '1.5px solid #00f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f0ff',
              fontSize: '1.8rem',
              boxShadow: '0 0 25px rgba(0,240,255,0.35)'
            }}>
              <i className="fa-solid fa-gamepad" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', margin: '0 0 0.4rem 0' }}>
                Join the Action on {game.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.55 }}>
                Click below to request your personal player login credentials. Our 24/7 operators will create your account immediately.
              </p>
            </div>

            <button
              onClick={handleRequestClick}
              disabled={isSubmittingRequest}
              className="btn-cyan-glow"
              style={{ padding: '0.95rem 2.5rem', fontSize: '0.95rem', fontWeight: 900 }}
            >
              {isSubmittingRequest ? (
                <span><i className="fa-solid fa-spinner fa-spin" /> SUBMITTING REQUEST...</span>
              ) : (
                <span><i className="fa-solid fa-user-plus" /> REQUEST {game.title.toUpperCase()} CREDENTIALS &rarr;</span>
              )}
            </button>
          </div>

          {/* 3 VIP Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{
              background: 'rgba(14, 18, 36, 0.85)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <i className="fa-solid fa-bolt" style={{ color: '#ffd700', fontSize: '1.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>Instant Account Setup</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Live operations staff generate your username and password in under 3 minutes.
              </p>
            </div>

            <div style={{
              background: 'rgba(14, 18, 36, 0.85)',
              border: '1px solid rgba(0, 230, 118, 0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <i className="fa-solid fa-percent" style={{ color: '#00e676', fontSize: '1.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>Deposit Bonuses &amp; Freeplay</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Enjoy automatic bonus multipliers and daily spin credits on every deposit.
              </p>
            </div>

            <div style={{
              background: 'rgba(14, 18, 36, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#00f0ff', fontSize: '1.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>Fast &amp; Secure Cashouts</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Redeem your winnings 24/7 directly to Chime, CashApp, Venmo, Zelle, or Crypto.
              </p>
            </div>
          </div>

        </div>
      )}

    </motion.div>
  );
}
