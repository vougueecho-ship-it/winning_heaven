'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerSidebar({
  isOpen = false,
  onClose,
  currentUser,
  activeTab = 'main',
  onSelectTab,
  games = [],
  gameAccounts = [],
  accountRequests = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenFreeplay,
  onOpenSupport,
  onOpenAuth,
  onLogout,
  onInstallApp,
  onPlayGame,
  onRequestAccount
}) {
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Player';
  const displayEmail = currentUser?.email || '';

  // Map user accounts by normalized game title
  const accountMap = useMemo(() => {
    const map = {};
    (gameAccounts || []).forEach((acc) => {
      if (acc.gameTitle) {
        map[acc.gameTitle.toLowerCase().trim()] = acc;
      }
    });
    return map;
  }, [gameAccounts]);

  // Active Game Accounts created for this user
  const createdGames = useMemo(() => {
    const list = [];
    (games || []).forEach((game) => {
      const key = (game.title || '').toLowerCase().trim();
      const userAcc = accountMap[key];
      if (userAcc) {
        list.push({ game, account: userAcc });
      }
    });
    return list;
  }, [games, accountMap]);

  const handleNavClick = (tab) => {
    if (onSelectTab) onSelectTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1025) {
      if (onClose) onClose();
    }
  };

  const handleGuardedAction = (action) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      if (typeof window !== 'undefined' && window.innerWidth < 1025) {
        if (onClose) onClose();
      }
      return;
    }
    action();
    if (typeof window !== 'undefined' && window.innerWidth < 1025) {
      if (onClose) onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-backdrop"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside className={`player-sidebar-aside ${isOpen ? 'open' : ''}`}>
        {/* Brand Header: Logo + Title (Static on desktop, with drawer close on mobile) */}
        <div className="sidebar-top-brand-bar">
          <div 
            className="sidebar-brand-box" 
            onClick={() => handleNavClick('main')}
            role="button"
            tabIndex={0}
          >
            <div className="sidebar-logo-circle">
              <img 
                src="/winning_heaven_logo.png" 
                alt="Winning Heaven" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">
                WINNING<span style={{ color: 'var(--gold-primary)' }}>HEAVEN</span>
              </span>
              <span className="sidebar-brand-sub">VIP CASINO SERVICE</span>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-mobile-close-btn" 
            onClick={onClose} 
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>



        {/* Bonus Spotlight Card */}
        <div
          onClick={() => handleGuardedAction(onOpenFreeplay)}
          className="sidebar-bonus-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="bonus-gift-icon">
              <i className="fa-solid fa-gift" />
            </div>
            <div>
              <div style={{ color: 'var(--gold-primary)', fontWeight: 900, fontSize: '0.85rem' }}>
                CLAIM $3.00 FREEPLAY
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                Instant signup bonus • No deposit
              </div>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right" style={{ color: 'var(--gold-primary)', fontSize: '0.75rem' }} />
        </div>

        {/* Primary Action Buttons */}
        <div className="sidebar-primary-actions">
          <button
            type="button"
            onClick={() => handleGuardedAction(() => handleNavClick('deposit'))}
            className={`sidebar-nav-btn ${activeTab === 'deposit' ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-plus-circle" style={{ color: 'var(--gold-primary)' }} />
              <span>Deposit Coins</span>
            </div>
            <span className="badge-fast">⚡ INSTANT</span>
          </button>

          <button
            type="button"
            onClick={() => handleGuardedAction(() => handleNavClick('withdraw'))}
            className={`sidebar-nav-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-wallet" style={{ color: 'var(--cyan-primary)' }} />
              <span>Cashout / Withdraw</span>
            </div>
            <span className="badge-fast" style={{ background: 'rgba(0, 240, 255, 0.15)', borderColor: 'var(--cyan-primary)', color: 'var(--cyan-primary)' }}>5-15 MIN</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('main')}
            className={`sidebar-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-gamepad" />
              <span>Games Lobby</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGuardedAction(() => handleNavClick('history'))}
            className={`sidebar-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Transaction History</span>
            </div>
          </button>

        </div>

        {/* GAME ACCOUNTS SECTION (Active Accounts Only) */}
        {currentUser && (
          <div className="sidebar-games-section">
            <div className="game-section-header">
              <span><i className="fa-solid fa-circle-check" style={{ color: '#00e676', marginRight: '6px' }} /> MY ACTIVE ACCOUNTS</span>
              <span className="count-badge">{createdGames.length}</span>
            </div>

            <div className="sidebar-games-list">
              {createdGames.length === 0 ? (
                <div className="empty-accounts-hint">
                  No active accounts yet.
                </div>
              ) : (
                createdGames.map(({ game, account }) => (
                  <div
                    key={game.id || game.title}
                    onClick={() => handleGuardedAction(() => onPlayGame(game, account))}
                    className="sidebar-game-row created"
                  >
                    <img
                      src={game.imageUrl || game.image || '/winning_heaven_logo.png'}
                      alt={game.title}
                      className="sidebar-game-thumb"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sidebar-game-title">{game.title}</div>
                      <div className="sidebar-game-user">
                        <i className="fa-solid fa-user-tag" /> {account.gameUsername || 'Active'}
                      </div>
                    </div>
                    <button className="btn-play-mini" title="Play Game">
                      <i className="fa-solid fa-play" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions: APK Box + Logout */}
        <div className="sidebar-bottom-actions-wrap">
          {/* App Download / Install Box */}
          <div className="sidebar-app-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="app-icon-circle">
                <i className="fa-brands fa-android" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.82rem' }}>Winning Heaven App</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Install APK on your device</div>
              </div>
            </div>
            <div style={{ marginTop: '0.45rem' }}>
              <button
                type="button"
                onClick={onInstallApp}
                className="btn-gold-glow"
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.74rem', textAlign: 'center', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                title="Install App on Android & iOS"
              >
                <i className="fa-solid fa-mobile-screen-button" /> Install App (Android &amp; iOS)
              </button>
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              className="sidebar-bottom-logout-btn"
              title="Sign Out of Account"
            >
              <i className="fa-solid fa-arrow-right-from-bracket" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>

      <style jsx>{`
        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1001;
        }
        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1001;
        }
        @media (min-width: 1025px) {
          .sidebar-backdrop {
            display: none !important;
          }
        }
        .player-sidebar-aside {
          width: 280px;
          background: rgba(6, 9, 22, 0.98);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-right: 1px solid rgba(255, 200, 0, 0.22);
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
          padding: 1.15rem 1rem 2rem 1rem;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 200, 0, 0.2) transparent;
          z-index: 1002;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-105%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.9);
        }
        .player-sidebar-aside.open {
          transform: translateX(0);
        }
        @media (min-width: 1025px) {
          .player-sidebar-aside {
            height: 100vh;
            transform: translateX(0) !important;
            z-index: 100;
            box-shadow: 4px 0 25px rgba(0, 0, 0, 0.7);
          }
        }
        .sidebar-top-brand-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid rgba(255, 200, 0, 0.2);
          margin-bottom: 0.25rem;
        }
        .sidebar-brand-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          cursor: pointer;
          user-select: none;
        }
        .sidebar-logo-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid var(--gold-primary);
          background: #000;
          overflow: hidden;
          box-shadow: 0 0 14px rgba(255, 200, 0, 0.4);
          flex-shrink: 0;
        }
        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
        }
        .sidebar-brand-title {
          font-family: var(--font-heading);
          font-weight: 900;
          font-size: 1.05rem;
          letter-spacing: 0.03em;
          line-height: 1.1;
          color: #fff;
        }
        .sidebar-brand-sub {
          font-size: 0.62rem;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.12em;
        }
        .sidebar-mobile-close-btn {
          display: block;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.6rem;
          cursor: pointer;
          line-height: 1;
        }
        .sidebar-mobile-close-btn:hover {
          color: #fff;
        }
        @media (min-width: 1025px) {
          .sidebar-mobile-close-btn {
            display: none !important;
          }
        }
        .sidebar-profile-card {
          background: rgba(14, 18, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 0.75rem 0.85rem;
          display: flex;
          align-items: center;
        }
        .avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
          color: #000;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
        .sidebar-bottom-actions-wrap {
          margin-top: auto;
          padding-top: 0.85rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .sidebar-bottom-logout-btn {
          width: 100%;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ef4444;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          font-weight: 800;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-bottom-logout-btn:hover {
          background: rgba(239, 68, 68, 0.22);
          border-color: #ef4444;
          color: #ff6b6b;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.25);
        }
        .sidebar-bonus-card {
          background: linear-gradient(135deg, rgba(255, 200, 0, 0.18) 0%, rgba(0, 230, 118, 0.1) 100%);
          border: 1.5px solid rgba(255, 200, 0, 0.45);
          border-radius: 14px;
          padding: 0.75rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(255, 200, 0, 0.15);
          transition: transform 0.2s ease;
        }
        .sidebar-bonus-card:hover {
          transform: translateY(-2px);
          border-color: var(--gold-primary);
        }
        .bonus-gift-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 200, 0, 0.25);
          color: var(--gold-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .sidebar-primary-actions {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .sidebar-nav-btn {
          width: 100%;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--text-light);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .sidebar-nav-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .sidebar-nav-btn.active {
          background: rgba(255, 200, 0, 0.15);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
        }
        .badge-fast {
          background: rgba(0, 230, 118, 0.15);
          border: 1px solid #00e676;
          color: #00e676;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--cyan-primary);
          box-shadow: 0 0 8px var(--cyan-primary);
        }
        .sidebar-app-box {
          background: rgba(14, 18, 38, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.75rem;
        }
        .app-icon-circle {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
        }
        .sidebar-games-section {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .game-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          padding: 0 0.35rem;
        }
        .count-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 0.65rem;
          padding: 0.1rem 0.4rem;
          border-radius: 6px;
        }
        .sidebar-games-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .empty-accounts-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .sidebar-game-row {
          background: rgba(14, 18, 38, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.45rem 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-game-row:hover {
          background: rgba(255, 200, 0, 0.08);
          border-color: rgba(255, 200, 0, 0.3);
        }
        .sidebar-game-row.created {
          border-left: 3px solid #00e676;
        }
        .sidebar-game-thumb {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .sidebar-game-thumb.grayscale {
          opacity: 0.7;
          filter: grayscale(40%);
        }
        .sidebar-game-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-game-user {
          font-size: 0.68rem;
          color: #00e676;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-game-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .btn-play-mini {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #00e676;
          color: #000;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          cursor: pointer;
          flex-shrink: 0;
        }
        .btn-req-mini {
          background: rgba(255, 200, 0, 0.15);
          border: 1px solid var(--gold-primary);
          color: var(--gold-primary);
          border-radius: 6px;
          padding: 0.2rem 0.5rem;
          font-size: 0.68rem;
          font-weight: 800;
          cursor: pointer;
          flex-shrink: 0;
        }
        .pending-mini-badge {
          font-size: 0.65rem;
          color: var(--gold-primary);
          font-weight: 800;
          background: rgba(255, 200, 0, 0.12);
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
        }
      `}</style>
    </>
  );
}
