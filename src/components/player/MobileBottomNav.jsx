'use client';

import React from 'react';

export default function MobileBottomNav({
  activeTab = 'main',
  onSelectTab,
  onOpenSupport,
  supportUnread = false
}) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'rgba(4, 5, 11, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 200, 0, 0.2)',
      padding: '0.5rem max(1rem, env(safe-area-inset-right, 0px)) calc(0.5rem + max(env(safe-area-inset-bottom, 0px), var(--sab, 0px))) max(1rem, env(safe-area-inset-left, 0px))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.9)'
    }}>
      {/* Lobby Tab */}
      <button
        onClick={() => onSelectTab('main')}
        style={{
          background: 'transparent',
          border: 'none',
          color: activeTab === 'main' ? 'var(--gold-primary)' : 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <i className="fa-solid fa-gamepad" style={{ fontSize: '1.2rem' }} />
        <span>Lobby</span>
      </button>

      {/* Ledger Tab */}
      <button
        onClick={() => onSelectTab('history')}
        style={{
          background: 'transparent',
          border: 'none',
          color: activeTab === 'history' ? 'var(--gold-primary)' : 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '1.2rem' }} />
        <span>Ledger</span>
      </button>

      {/* Referrals Tab */}
      <button
        onClick={() => onSelectTab('referrals')}
        style={{
          background: 'transparent',
          border: 'none',
          color: activeTab === 'referrals' ? 'var(--gold-primary)' : 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <i className="fa-solid fa-users-line" style={{ fontSize: '1.2rem' }} />
        <span>Referrals</span>
      </button>

      {/* Support Chat Trigger */}
      <button
        onClick={onOpenSupport}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--cyan-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <i className="fa-solid fa-headset" style={{ fontSize: '1.2rem' }} />
        <span>Support</span>
        {supportUnread && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '12px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--red-primary)',
            boxShadow: '0 0 8px var(--red-primary)'
          }} />
        )}
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => onSelectTab('profile')}
        style={{
          background: 'transparent',
          border: 'none',
          color: activeTab === 'profile' ? 'var(--gold-primary)' : 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <i className="fa-solid fa-circle-user" style={{ fontSize: '1.2rem' }} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
