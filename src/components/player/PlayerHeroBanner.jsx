'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerHeroBanner({ frontendSettings = {}, onOpenDeposit, onOpenReferrals }) {
  const announcements = frontendSettings.announcements || [
    {
      title: 'WELCOME TO WINNING HEAVEN',
      subtitle: 'Experience 100% Instant Deposit Bonuses & VIP Rewards Daily!',
      cta: 'DEPOSIT NOW',
      action: 'deposit',
      badge: 'PROMO ACTIVE',
      bg: 'linear-gradient(135deg, rgba(20,16,40,0.95) 0%, rgba(10,12,24,0.95) 100%)'
    },
    {
      title: 'VIP REFERRAL REWARDS',
      subtitle: 'Invite your gaming crew and earn instant cash bonuses on all friend deposits!',
      cta: 'START EARNING',
      action: 'referrals',
      badge: 'UNLIMITED CASH',
      bg: 'linear-gradient(135deg, rgba(14,24,36,0.95) 0%, rgba(6,12,20,0.95) 100%)'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const current = announcements[currentIndex] || announcements[0];

  return (
    <div style={{
      position: 'relative',
      borderRadius: '22px',
      overflow: 'hidden',
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--card-glow-shadow)',
      margin: '0.85rem 0 1.25rem 0'
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          style={{
            background: current.bg,
            padding: 'clamp(1.25rem, 4vw, 2.25rem) clamp(1rem, 3.5vw, 2rem)',
            position: 'relative',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backdropFilter: 'var(--glass-blur)'
          }}
        >
          {/* Ambient Glow Orbs */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-30px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(255,200,0,0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Badge */}
          <div style={{ marginBottom: '0.6rem' }}>
            <span className="badge-gold" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
              <i className="fa-solid fa-bolt" style={{ marginRight: '0.3rem' }} />
              {current.badge || 'SPECIAL OFFER'}
            </span>
          </div>

          {/* Headline & Text */}
          <h1 style={{
            fontSize: 'clamp(1.25rem, 4vw, 2.2rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            margin: '0 0 0.4rem 0',
            lineHeight: 1.15
          }}>
            {current.title}
          </h1>

          <p style={{
            fontSize: 'clamp(0.78rem, 2.2vw, 0.9rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            maxWidth: '650px',
            margin: '0 0 1rem 0'
          }}>
            {current.subtitle}
          </p>

          {/* Action Trigger */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {current.action === 'referrals' ? (
              <button onClick={onOpenReferrals} className="btn-cyan-glow" style={{ padding: '0.65rem 1.25rem', fontSize: '0.82rem' }}>
                <i className="fa-solid fa-users-viewfinder" /> {current.cta || 'REFER FRIENDS'}
              </button>
            ) : (
              <button onClick={onOpenDeposit} className="btn-gold-glow" style={{ padding: '0.65rem 1.25rem', fontSize: '0.82rem' }}>
                <i className="fa-solid fa-coins" /> {current.cta || 'CLAIM BONUS NOW'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      {announcements.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '16px',
          display: 'flex',
          gap: '5px',
          zIndex: 10
        }}>
          {announcements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '20px' : '7px',
                height: '7px',
                borderRadius: '999px',
                background: idx === currentIndex ? 'var(--gold-primary)' : 'rgba(255,255,255,0.25)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
