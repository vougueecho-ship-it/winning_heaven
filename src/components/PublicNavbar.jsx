'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNavbar({ currentPath = '' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() || currentPath;

  const navLinks = [
    { label: 'Games', href: '/games', icon: 'fa-solid fa-gamepad' },
    { label: 'Blog', href: '/blog', icon: 'fa-solid fa-newspaper' },
    { label: 'How to Play', href: '/how-to-play', icon: 'fa-solid fa-circle-question' },
    { label: 'Download App', href: '/download-app', icon: 'fa-solid fa-mobile-screen-button' },
    { label: 'About', href: '/about', icon: 'fa-solid fa-shield-halved' },
    { label: 'Contact', href: '/contact', icon: 'fa-solid fa-headset' }
  ];

  const legalLinks = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Responsible Gaming', href: '/responsible-gaming' },
    { label: 'Delete Account', href: '/account-deletion' }
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(4, 5, 11, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          paddingTop: 'max(0.6rem, calc(0.6rem + env(safe-area-inset-top, 0px)))',
          paddingBottom: '0.6rem',
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          {/* Logo & Brand */}
          <Link
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '2px solid var(--gold-primary)',
                background: '#000',
                overflow: 'hidden',
                boxShadow: '0 0 15px rgba(255, 200, 0, 0.4)',
                flexShrink: 0
              }}
            >
              <img
                src="/winning_heaven_logo.png"
                alt="Winning Heaven"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.2rem)',
                  letterSpacing: '0.03em',
                  lineHeight: 1.1,
                  color: '#fff',
                  whiteSpace: 'nowrap'
                }}
              >
                WINNING<span className="gold-gradient-text">HEAVEN</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span className="pulse-live" />
                <span>CASINO HUB</span>
              </div>
            </div>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="public-nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--gold-primary)' : 'rgba(255,255,255,0.75)',
                  background: isActive(item.href) ? 'rgba(255,215,0,0.12)' : 'transparent',
                  border: isActive(item.href) ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className={item.icon} style={{ fontSize: '0.8rem', color: isActive(item.href) ? 'var(--gold-primary)' : 'var(--cyan-glow)' }} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Right Action CTA Buttons */}
          <div className="public-nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <Link
              href="/login"
              className="btn-glass-secondary"
              style={{
                textDecoration: 'none',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fa-solid fa-right-to-bracket" />
              <span>Login</span>
            </Link>
            <Link
              href="/register"
              className="btn-gold-glow"
              style={{
                textDecoration: 'none',
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fa-solid fa-gift" />
              <span>Get $3 Freeplay</span>
            </Link>
          </div>

          {/* Mobile Right Controls: Quick Freeplay + Hamburger */}
          <div className="public-nav-mobile-controls" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              href="/register"
              className="btn-gold-glow"
              style={{
                textDecoration: 'none',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <i className="fa-solid fa-gift" />
              <span>$3 Freeplay</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              style={{
                background: mobileMenuOpen ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                color: mobileMenuOpen ? '#000' : '#fff',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown / Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              maxWidth: '1240px',
              margin: '0.6rem auto 0',
              background: '#0a0d1d',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Primary Navigation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    color: isActive(item.href) ? 'var(--gold-primary)' : '#fff',
                    background: isActive(item.href) ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                    border: isActive(item.href) ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className={item.icon} style={{ color: isActive(item.href) ? 'var(--gold-primary)' : 'var(--cyan-glow)', width: '16px' }} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-glass-secondary"
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-right-to-bracket" />
                <span>Player Login</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-gold-glow"
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-gift" />
                <span>Claim $3</span>
              </Link>
            </div>

            {/* Footer Legal Links */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '0.6rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.6rem',
                justifyContent: 'center'
              }}
            >
              {legalLinks.map((leg) => (
                <Link
                  key={leg.href}
                  href={leg.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: isActive(leg.href) ? 'var(--gold-primary)' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.72rem',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  {leg.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Embedded CSS Media Queries for Public Navbar Responsiveness */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .public-nav-desktop-links {
            display: none !important;
          }
          .public-nav-desktop-actions {
            display: none !important;
          }
          .public-nav-mobile-controls {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
