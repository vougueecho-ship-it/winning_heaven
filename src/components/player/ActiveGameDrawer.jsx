'use client';

import React, { useState } from 'react';
import PanelModalBackdrop from '../PanelModalBackdrop';

export default function ActiveGameDrawer({
  game,
  userAccount,
  onClose,
  showToast,
  onOpenDeposit
}) {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

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
      if (showToast) showToast('Platform launch URL not configured by admin.', 'info');
    }
  };

  return (
    <PanelModalBackdrop isOpen={true} onClose={onClose}>
      <div style={{
        background: 'rgba(10, 14, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--gold-primary)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '480px',
        width: '90vw',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(255,200,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          &times;
        </button>

        {/* Game Title & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: '2px solid var(--gold-primary)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img src={game.image || game.logoUrl || '/winning_heaven_logo.png'} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
              {game.title}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
              GAME ACCOUNT CREDENTIALS
            </div>
          </div>
        </div>

        {/* Username Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAME USERNAME</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              readOnly
              value={userAccount.username || ''}
              style={{
                flex: 1,
                background: 'rgba(6, 8, 18, 0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                color: 'var(--cyan-primary)',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
            />
            <button
              onClick={() => copyText(userAccount.username, 'user')}
              className="btn-gold-glow"
              style={{ padding: '0.75rem 1.2rem', fontSize: '0.82rem' }}
            >
              {copiedUser ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
            </button>
          </div>
        </div>

        {/* Password Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAME PASSWORD</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              readOnly
              value={userAccount.password || ''}
              style={{
                flex: 1,
                background: 'rgba(6, 8, 18, 0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                color: 'var(--gold-primary)',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
            />
            <button
              onClick={() => copyText(userAccount.password, 'pass')}
              className="btn-gold-glow"
              style={{ padding: '0.75rem 1.2rem', fontSize: '0.82rem' }}
            >
              {copiedPass ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
            </button>
          </div>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={handleLaunch} className="btn-gold-glow" style={{ padding: '0.85rem', fontSize: '0.9rem' }}>
            <i className="fa-solid fa-rocket" /> LAUNCH GAME NOW
          </button>

          <button onClick={onOpenDeposit} className="btn-cyan-glow" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-plus-circle" /> DEPOSIT TO LOAD GAME
          </button>
        </div>
      </div>
    </PanelModalBackdrop>
  );
}
