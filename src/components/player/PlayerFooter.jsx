'use client';

import React from 'react';
import Link from 'next/link';

export default function PlayerFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        borderTop: '1px solid rgba(252, 211, 77, 0.15)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--text-light, #e2e8f0)',
        padding: '3rem 1.5rem 2rem',
        marginTop: '4rem',
        fontSize: '0.9rem'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem'
          }}
        >
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img
                src="/winning_heaven_logo.png"
                alt="Winning Heaven Logo"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 50%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                WINNING HEAVEN
              </span>
            </div>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              North America&apos;s premier 24/7 online sweepstakes casino platform. Access top games like GameVault 777, Juwa, Vegas Sweeps, Orion Stars, and Ultra Panda with instant cashouts and $3 freeplay signup bonus.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
              <span
                style={{
                  background: 'rgba(252, 211, 77, 0.1)',
                  border: '1px solid rgba(252, 211, 77, 0.3)',
                  color: '#fcd34d',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                ⚡ 24/7 Fast Payouts
              </span>
              <span
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                🎁 $3 Freeplay Bonus
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                color: '#fcd34d',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: '0 0 1rem'
              }}
            >
              Games & App
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <Link href="/games" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-gamepad" style={{ width: '20px', color: '#38bdf8' }} /> Top Sweepstakes Games
                </Link>
              </li>
              <li>
                <Link href="/download-app" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-brands fa-android" style={{ width: '20px', color: '#4ade80' }} /> Download Android APK
                </Link>
              </li>
              <li>
                <Link href="/how-to-play" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-circle-info" style={{ width: '20px', color: '#fcd34d' }} /> How to Play & Cashout Guide
                </Link>
              </li>
              <li>
                <Link href="/blog" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-newspaper" style={{ width: '20px', color: '#c084fc' }} /> Casino Blog & Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                color: '#fcd34d',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: '0 0 1rem'
              }}
            >
              Company & Help
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <Link href="/about" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-building" style={{ width: '20px', color: '#fcd34d' }} /> About Winning Heaven
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-headset" style={{ width: '20px', color: '#38bdf8' }} /> Contact 24/7 Player Support
                </Link>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/1DADyA9y1n/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}
                >
                  <i className="fa-brands fa-facebook" style={{ width: '20px', color: '#1877f2' }} /> Official Facebook Page
                </a>
              </li>
              <li>
                <a href="mailto:verified@winningheaven.com" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-shield-check" style={{ width: '20px', color: '#4ade80' }} /> verified@winningheaven.com
                </a>
              </li>
              <li>
                <a href="mailto:promos@winningheaven.com" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-gift" style={{ width: '20px', color: '#fcd34d' }} /> promos@winningheaven.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                color: '#fcd34d',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: '0 0 1rem'
              }}
            >
              Legal & Safety
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <Link href="/terms" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-file-contract" style={{ width: '20px', color: '#fcd34d' }} /> Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-shield-halved" style={{ width: '20px', color: '#38bdf8' }} /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/responsible-gaming" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-hand-holding-heart" style={{ width: '20px', color: '#4ade80' }} /> Responsible Gaming
                </Link>
              </li>
              <li>
                <Link href="/account-deletion" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-user-xmark" style={{ width: '20px', color: '#94a3b8' }} /> Account Deletion Request
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance Badges Bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justify: 'space-between',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '4px 10px',
                borderRadius: '8px'
              }}
            >
              18+ ONLY
            </span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
              NO PURCHASE NECESSARY — SWEEPSTAKES RULES APPLY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
            <span><i className="fa-solid fa-lock" style={{ color: '#4ade80', marginRight: '6px' }} /> 256-Bit SSL Encrypted</span>
            <span><i className="fa-solid fa-bolt" style={{ color: '#fcd34d', marginRight: '6px' }} /> Instant Cash App / Venmo / Zelle</span>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.78rem', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            Winning Heaven operates under applicable sweepstakes regulations. Void where prohibited by law. Sweepstakes coins have no cash value until redeemed in accordance with platform terms.
          </p>
          <p style={{ margin: 0 }}>
            © {currentYear} Winning Heaven. All rights reserved. GameVault 777, Juwa, Vegas Sweeps, Orion Stars, and Ultra Panda are property of their respective creators and hosted via authorized API services.
          </p>
        </div>
      </div>
    </footer>
  );
}
