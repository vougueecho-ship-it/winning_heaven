'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerNavbar({
  currentUser,
  onRefresh,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSupport,
  supportUnread = false,
  onOpenProfile,
  onLogout,
  onSelectTab,
  activeTab = 'main',
  canClaimRemainder = false,
  onClaimRemainder
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    if (onLogout) onLogout();
  };

  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Player';
  const displayEmail = currentUser?.email || 'player@winningheaven.com';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(4, 5, 11, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 200, 0, 0.18)',
      paddingTop: 'max(0.6rem, calc(0.6rem + max(env(safe-area-inset-top, 0px), var(--sat, 0px))))',
      paddingBottom: '0.6rem',
      paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
      paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('main')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: '2px solid var(--gold-primary)',
            background: '#000',
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(255, 200, 0, 0.4)',
            flexShrink: 0
          }}>
            <img 
              src="/winning_heaven_logo.png" 
              alt="Winning Heaven" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
              letterSpacing: '0.03em',
              lineHeight: 1.1,
              color: '#fff',
              whiteSpace: 'nowrap'
            }}>
              WINNING<span className="gold-gradient-text">HEAVEN</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span className="pulse-live" />
              <span>CASINO</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Desktop only, hidden on mobile) */}
        <nav className="desktop-only-nav" style={{ alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => onSelectTab('main')}
            style={{
              background: activeTab === 'main' ? 'rgba(255,200,0,0.15)' : 'transparent',
              border: activeTab === 'main' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'main' ? 'var(--gold-primary)' : 'var(--text-muted)',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-gamepad" /> LOBBY
          </button>

          <button
            onClick={() => onSelectTab('history')}
            style={{
              background: activeTab === 'history' ? 'rgba(255,200,0,0.15)' : 'transparent',
              border: activeTab === 'history' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'history' ? 'var(--gold-primary)' : 'var(--text-muted)',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" /> LEDGER
          </button>

          <button
            onClick={() => onSelectTab('referrals')}
            style={{
              background: activeTab === 'referrals' ? 'rgba(255,200,0,0.15)' : 'transparent',
              border: activeTab === 'referrals' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'referrals' ? 'var(--gold-primary)' : 'var(--text-muted)',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-users" /> REFERRALS
          </button>
        </nav>

        {/* Right Quick Action Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {/* Deposit Button */}
          <button onClick={onOpenDeposit} className="btn-gold-glow" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-plus-circle" /> <span className="nav-btn-text">DEPOSIT</span>
          </button>

          {/* Cashout Button */}
          <button onClick={onOpenWithdraw} className="btn-cyan-glow" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-wallet" /> <span className="nav-btn-text">CASHOUT</span>
          </button>

          {/* Support Headset Button */}
          <button
            onClick={onOpenSupport}
            title="Support Chat"
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-headset" style={{ fontSize: '0.95rem', color: 'var(--cyan-primary)' }} />
            {supportUnread && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--red-primary)',
                boxShadow: '0 0 8px var(--red-primary)'
              }} />
            )}
          </button>

          {/* User Profile Avatar */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                background: 'linear-gradient(135deg, rgba(255,200,0,0.2) 0%, rgba(0,240,255,0.2) 100%)',
                border: '1.5px solid var(--gold-primary)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                boxShadow: '0 0 12px rgba(255,200,0,0.25)',
                flexShrink: 0
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '230px',
                    background: 'rgba(10, 14, 28, 0.96)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '16px',
                    padding: '0.85rem',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.9), 0 0 25px rgba(255,200,0,0.15)',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-muted)' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayEmail}
                    </div>
                  </div>

                  <button
                    onClick={() => { setUserDropdownOpen(false); onOpenProfile(); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-light)',
                      textAlign: 'left',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.82rem'
                    }}
                  >
                    <i className="fa-solid fa-user-gear" style={{ color: 'var(--gold-primary)' }} /> Profile Settings
                  </button>

                  <button
                    onClick={() => { setUserDropdownOpen(false); onSelectTab('history'); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-light)',
                      textAlign: 'left',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.82rem'
                    }}
                  >
                    <i className="fa-solid fa-receipt" style={{ color: 'var(--cyan-primary)' }} /> Transaction Ledger
                  </button>

                  <button
                    onClick={handleLogoutClick}
                    style={{
                      background: 'rgba(255, 0, 85, 0.12)',
                      border: '1px solid var(--red-primary)',
                      color: 'var(--red-primary)',
                      textAlign: 'center',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket" /> LOGOUT
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
