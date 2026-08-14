'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameDetailSheet({
  game,
  userAccount,
  onClose,
  showToast,
  onOpenDepositForGame,
  onOpenWithdrawForGame,
  onRequestFreeplayForGame,
  transactions = [],
  freeplayGate = {}
}) {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [freeplaySubmitting, setFreeplaySubmitting] = useState(false);

  if (!game || !userAccount) return null;

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
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <motion.div
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
      >
        {/* Drag handle bar */}
        <div className="bottom-sheet-drag-handle" />

        {/* Top Game Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              border: '2px solid var(--gold-primary)',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 0 15px rgba(255,200,0,0.3)'
            }}>
              <img src={game.image || game.logoUrl || '/winning_heaven_logo.png'} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
                {game.title} <span className="gold-gradient-text">HUB</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--emerald-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="pulse-live" /> PLATFORM LINKED & ACTIVE
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.3rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        {/* Game Credentials Card */}
        <div style={{
          background: 'rgba(6, 8, 18, 0.85)',
          border: '1px solid var(--card-border)',
          borderRadius: '18px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            YOUR GAME PLATFORM LOGIN CREDENTIALS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>USERNAME</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  readOnly
                  value={userAccount.username || ''}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--cyan-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none',
                    width: '0'
                  }}
                />
                <button onClick={() => copyText(userAccount.username, 'user')} className="btn-gold-glow" style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem' }}>
                  {copiedUser ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PASSWORD</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  readOnly
                  value={userAccount.password || ''}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--gold-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none',
                    width: '0'
                  }}
                />
                <button onClick={() => copyText(userAccount.password, 'pass')} className="btn-gold-glow" style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem' }}>
                  {copiedPass ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
                </button>
              </div>
            </div>
          </div>

          {/* Launch Link Button */}
          <button onClick={handleLaunch} className="btn-gold-glow" style={{ width: '100%', padding: '0.8rem', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-rocket" /> PLAY ON {game.title.toUpperCase()}
          </button>
        </div>

        {/* Game-Specific Action Controls Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {/* Deposit for THIS game */}
          <button
            onClick={() => { onClose(); onOpenDepositForGame(game.title); }}
            className="btn-gold-glow"
            style={{ padding: '0.75rem 0.5rem', fontSize: '0.78rem', flexDirection: 'column', gap: '0.3rem' }}
          >
            <i className="fa-solid fa-coins" style={{ fontSize: '1.1rem' }} />
            <span>LOAD COINS</span>
          </button>

          {/* Withdraw for THIS game */}
          <button
            onClick={() => { onClose(); onOpenWithdrawForGame(game.title); }}
            className="btn-cyan-glow"
            style={{ padding: '0.75rem 0.5rem', fontSize: '0.78rem', flexDirection: 'column', gap: '0.3rem' }}
          >
            <i className="fa-solid fa-wallet" style={{ fontSize: '1.1rem' }} />
            <span>CASHOUT</span>
          </button>

          {/* Claim Freeplay for THIS game */}
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
              padding: '0.75rem 0.5rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              opacity: freeplayGate?.canClaim !== false ? 1 : 0.6,
              boxShadow: freeplayGate?.canClaim !== false ? '0 0 15px rgba(0, 230, 118, 0.35)' : 'none'
            }}
          >
            <i className="fa-solid fa-gift" style={{ fontSize: '1.1rem' }} />
            <span>FREEPLAY</span>
          </button>
        </div>

        {/* Freeplay Status Info */}
        {freeplayGate && (
          <div style={{
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

        {/* Game-Specific Activity / History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            RECENT ACTIVITY FOR {game.title}
          </div>

          {gameTxs.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'rgba(6,8,18,0.5)', borderRadius: '12px' }}>
              No transactions recorded for this game yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {gameTxs.slice(0, 5).map((tx) => (
                <div
                  key={tx.id || tx._id}
                  style={{
                    background: 'rgba(6,8,18,0.8)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                    {tx.type === 'DEPOSIT' ? 'Deposit' : tx.type === 'WITHDRAW' ? 'Cashout' : 'Freeplay'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: tx.type === 'DEPOSIT' ? 'var(--emerald-primary)' : 'var(--cyan-primary)' }}>
                    ${parseFloat(tx.amount || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
