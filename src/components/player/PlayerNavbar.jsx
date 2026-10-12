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
  onClaimRemainder,
  onToggleSidebar,
  onOpenAuth
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
        width: '100%',
        margin: '0',
        padding: '0 0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Hamburger Sidebar Trigger Button (Mobile only) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="navbar-hamburger-btn"
              title="Toggle Menu & Accounts"
              aria-label="Toggle navigation menu"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 200, 0, 0.35)',
                color: 'var(--gold-primary)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-bars" />
            </button>
          )}

          {/* Mobile-Only Brand Logo (On desktop, logo is in the 100vh static sidebar) */}
          <div 
            onClick={() => onSelectTab('main')}
            className="navbar-mobile-logo"
            style={{
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
              <span className="navbar-brand-name" style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
                letterSpacing: '0.03em',
                lineHeight: 1.1,
                color: '#fff',
                whiteSpace: 'nowrap'
              }}>
                WINNING<span className="gold-gradient-text">HEAVEN</span>
              </span>
              <div className="navbar-brand-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <span className="pulse-live" />
                <span>CASINO</span>
              </div>
            </div>
          </div>

          {/* Desktop Left: Sweepstakes Games / VIP Lobby Pill */}
          <div className="navbar-desktop-pill">
            <span className="pill-pulse-dot" />
            <i className="fa-solid fa-gamepad" style={{ color: 'var(--gold-primary)', fontSize: '0.85rem' }} />
            <span>SWEEPSTAKES LOBBY</span>
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
            onClick={() => onSelectTab('deposit')}
            style={{
              background: activeTab === 'deposit' ? 'rgba(255,200,0,0.15)' : 'transparent',
              border: activeTab === 'deposit' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'deposit' ? 'var(--gold-primary)' : 'var(--text-muted)',
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
            <i className="fa-solid fa-plus-circle" /> DEPOSIT
          </button>

          <button
            onClick={() => onSelectTab('withdraw')}
            style={{
              background: activeTab === 'withdraw' ? 'rgba(0,240,255,0.15)' : 'transparent',
              border: activeTab === 'withdraw' ? '1px solid var(--cyan-primary)' : '1px solid transparent',
              color: activeTab === 'withdraw' ? 'var(--cyan-primary)' : 'var(--text-muted)',
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
            <i className="fa-solid fa-wallet" /> CASHOUT
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
        </nav>

        {/* Right Quick Action Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {/* APK Download Button (Desktop only to prevent mobile header crowding) */}
          <a
            href="/downloads/winning-heaven.apk"
            download
            className="navbar-desktop-app-btn"
            title="Download Android App APK"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              color: '#ffe566',
              borderRadius: '10px',
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
            <span>APP</span>
          </a>

          {!currentUser ? (
            /* Guest Actions: Log In & Sign Up */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="btn-glass-secondary"
                style={{
                  padding: '0.42rem 0.75rem',
                  fontSize: '0.74rem',
                  borderRadius: '10px',
                  fontWeight: 800
                }}
              >
                LOG IN
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('register')}
                className="btn-gold-glow"
                style={{
                  padding: '0.42rem 0.85rem',
                  fontSize: '0.74rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  whiteSpace: 'nowrap'
                }}
              >
                SIGN UP
              </button>
            </div>
          ) : (
            /* Logged-in Actions: Deposit, Cashout & Avatar */
            <>
              {/* Deposit Button */}
              <button
                onClick={onOpenDeposit}
                className="btn-gold-glow navbar-action-btn"
                style={{
                  padding: '0.42rem 0.65rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fa-solid fa-plus-circle" /> <span className="nav-btn-text">DEPOSIT</span>
              </button>

              {/* Cashout Button */}
              <button
                onClick={onOpenWithdraw}
                className="btn-cyan-glow navbar-action-btn"
                style={{
                  padding: '0.42rem 0.65rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fa-solid fa-wallet" /> <span className="nav-btn-text">CASHOUT</span>
              </button>

              {/* User Profile Avatar */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,200,0,0.2) 0%, rgba(0,240,255,0.2) 100%)',
                    border: '1.5px solid var(--gold-primary)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.82rem',
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
                    width: 'min(240px, calc(100vw - 24px))',
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
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar-mobile-logo {
          display: flex !important;
        }
        .navbar-hamburger-btn {
          display: flex !important;
        }
        .navbar-desktop-pill {
          display: none !important;
        }
        .desktop-only-nav {
          display: none !important;
        }
        @media (min-width: 1025px) {
          .navbar-mobile-logo {
            display: none !important;
          }
          .navbar-hamburger-btn {
            display: none !important;
          }
          .navbar-desktop-pill {
            display: inline-flex !important;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 200, 0, 0.25);
            padding: 0.42rem 0.85rem;
            border-radius: 9999px;
            color: #fff;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.05em;
          }
          .pill-pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #00e676;
            box-shadow: 0 0 8px #00e676;
          }
          .desktop-only-nav {
            display: flex !important;
          }
        }
        @media (max-width: 1024px) {
          .navbar-desktop-app-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-brand-name {
            font-size: 0.95rem !important;
          }
          .navbar-brand-sub {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .nav-btn-text {
            display: none !important;
          }
          .navbar-action-btn {
            padding: 0.42rem 0.5rem !important;
          }
        }
      `}</style>
    </header>
  );
}
