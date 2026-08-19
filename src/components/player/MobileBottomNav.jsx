'use client';

import React from 'react';

export default function MobileBottomNav({
  activeTab = 'main',
  onSelectTab,
  onOpenSupport,
  supportUnread = false
}) {
  return (
    <>
      <nav className="mobile-bottom-dock-bar">
        {/* Lobby Tab */}
        <button
          onClick={() => onSelectTab('main')}
          className={`dock-btn ${activeTab === 'main' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-gamepad" />
          <span>Lobby</span>
        </button>

        {/* Ledger Tab */}
        <button
          onClick={() => onSelectTab('history')}
          className={`dock-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-clock-rotate-left" />
          <span>Ledger</span>
        </button>

        {/* Referrals Tab */}
        <button
          onClick={() => onSelectTab('referrals')}
          className={`dock-btn ${activeTab === 'referrals' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-users-line" />
          <span>Referrals</span>
        </button>

        {/* Support Chat Trigger */}
        <button
          onClick={onOpenSupport}
          className="dock-btn dock-support-btn"
        >
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-headset" />
            {supportUnread && (
              <span className="dock-unread-dot" />
            )}
          </div>
          <span>Support</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`dock-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-circle-user" />
          <span>Profile</span>
        </button>
      </nav>

      <style jsx>{`
        .mobile-bottom-dock-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: rgba(4, 5, 11, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 200, 0, 0.2);
          padding: 0.45rem max(0.5rem, env(safe-area-inset-right, 0px)) calc(0.45rem + max(env(safe-area-inset-bottom, 0px), var(--sab, 0px))) max(0.5rem, env(safe-area-inset-left, 0px));
          display: flex;
          align-items: center;
          justify-content: space-around;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.9);
        }
        @media (min-width: 769px) {
          .mobile-bottom-dock-bar {
            display: none !important;
          }
        }
        .dock-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          transition: all 0.2s ease;
          border-radius: 8px;
        }
        .dock-btn i {
          font-size: 1.15rem;
        }
        .dock-btn.active {
          color: var(--gold-primary);
          text-shadow: 0 0 10px rgba(255, 200, 0, 0.5);
        }
        .dock-support-btn {
          color: var(--cyan-primary);
        }
        .dock-unread-dot {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red-primary);
          box-shadow: 0 0 8px var(--red-primary);
        }
      `}</style>
    </>
  );
}
