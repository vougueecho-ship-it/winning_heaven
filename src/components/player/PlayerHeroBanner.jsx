'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerHeroBanner({ frontendSettings = {}, onOpenDeposit, onOpenReferrals, onOpenFreeplay }) {
  const announcements = frontendSettings.announcements || [
    {
      title: '🎁 $3 FREEPLAY BONUS TASK',
      subtitle: 'Move our verification email from Spam to Inbox, upload proof, and get $3 instant credits! Deposit just $10 to qualify for ongoing freeplay.',
      cta: 'CLAIM $3 FREEPLAY',
      action: 'freeplay',
      badge: 'TASK REWARD',
      bg: 'linear-gradient(135deg, rgba(28,18,50,0.95) 0%, rgba(10,14,32,0.95) 100%)'
    },
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
    <div className="hero-banner-outer">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="hero-banner-content"
          style={{ background: current.bg }}
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

          {/* Badge */}
          <div className="hero-banner-badge">
            <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
              <i className="fa-solid fa-bolt" style={{ marginRight: '0.3rem' }} />
              {current.badge || 'SPECIAL OFFER'}
            </span>
          </div>

          {/* Headline & Text */}
          <h1 className="hero-banner-title">
            {current.title}
          </h1>

          <p className="hero-banner-desc">
            {current.subtitle}
          </p>

          {/* Action Trigger */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {current.action === 'referrals' ? (
              <button onClick={onOpenReferrals} className="btn-cyan-glow hero-banner-btn">
                <i className="fa-solid fa-users-viewfinder" /> {current.cta || 'REFER FRIENDS'}
              </button>
            ) : current.action === 'freeplay' ? (
              <button onClick={onOpenFreeplay} className="btn-gold-glow hero-banner-btn" style={{ background: 'linear-gradient(135deg, #00e676 0%, #00a152 100%)', color: '#000' }}>
                <i className="fa-solid fa-gift" /> {current.cta || 'CLAIM $3 FREEPLAY'}
              </button>
            ) : (
              <button onClick={onOpenDeposit} className="btn-gold-glow hero-banner-btn">
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
          bottom: '8px',
          right: '12px',
          display: 'flex',
          gap: '4px',
          zIndex: 10
        }}>
          {announcements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '16px' : '6px',
                height: '6px',
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

      <style jsx>{`
        .hero-banner-outer {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--card-border);
          box-shadow: var(--card-glow-shadow);
          margin: 0.75rem 0 1.15rem 0;
        }
        .hero-banner-content {
          padding: clamp(1.15rem, 3.5vw, 2rem) clamp(1rem, 3vw, 1.85rem);
          position: relative;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          backdrop-filter: var(--glass-blur);
        }
        .hero-banner-badge {
          margin-bottom: 0.5rem;
        }
        .hero-banner-title {
          font-size: clamp(1.15rem, 3.5vw, 2rem);
          font-weight: 900;
          font-family: var(--font-heading);
          color: #fff;
          margin: 0 0 0.35rem 0;
          line-height: 1.15;
        }
        .hero-banner-desc {
          font-size: clamp(0.75rem, 2vw, 0.88rem);
          color: var(--text-muted);
          line-height: 1.4;
          max-width: 650px;
          margin: 0 0 0.85rem 0;
        }
        .hero-banner-btn {
          padding: 0.6rem 1.15rem;
          font-size: 0.8rem;
        }
        @media (max-width: 768px) {
          .hero-banner-outer {
            border-radius: 14px;
            margin: 0.35rem 0 0.6rem 0;
          }
          .hero-banner-content {
            padding: 0.65rem 0.85rem;
            min-height: auto;
          }
          .hero-banner-badge {
            margin-bottom: 0.2rem;
          }
          .hero-banner-title {
            font-size: 1.05rem;
            margin: 0 0 0.2rem 0;
          }
          .hero-banner-desc {
            font-size: 0.72rem;
            line-height: 1.25;
            margin: 0 0 0.45rem 0;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .hero-banner-btn {
            padding: 0.38rem 0.85rem;
            font-size: 0.72rem;
          }
        }
      `}</style>
    </div>
  );
}
