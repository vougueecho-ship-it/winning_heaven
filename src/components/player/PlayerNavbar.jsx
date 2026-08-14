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
          {/* APK Download Button */}
          <a
            href="/downloads/winning-heaven.apk"
            download
            title="Download Android App APK"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              color: '#ffe566',
              borderRadius: '8px',
              padding: '0.42rem 0.65rem',
              fontSize: '0.74rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-brands fa-android" style={{ color: '#22c55e', fontSize: '0.85rem' }} />
            <span className="nav-btn-text">APP</span>
          </a>

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
                fontSize: '0.85rem',
                boxShadow: '0 0 12px rgba(255,200,0,0.25)',
                flexShrink: 0
              }}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: '240px',
                    background: 'rgba(10, 14, 28, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--gold-primary)',
                    borderRadius: '16px',
                    padding: '0.85rem',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    zIndex: 1001
                  }}
                >
                  <div style={{ padding: '0.35rem 0.45rem 0.65rem 0.45rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>{displayName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayEmail}
                    </div>
                  </div>

                  {canClaimRemainder && onClaimRemainder && (
                    <button
                      onClick={() => { setUserDropdownOpen(false); onClaimRemainder(); }}
                      style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                        color: '#000',
                        fontWeight: 900,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        marginBottom: '0.2rem'
                      }}
                    >
                      <i className="fa-solid fa-gift" /> CLAIM REMAINDER
                    </button>
                  )}

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

                  <a
                    href="/downloads/winning-heaven.apk"
                    download
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      textAlign: 'left',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none'
                    }}
                  >
                    <i className="fa-brands fa-android" style={{ color: '#22c55e' }} /> Download Android APK
                  </a>

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
