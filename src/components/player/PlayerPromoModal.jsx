'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PlayerPromoModal({ currentUser, onOpenDeposit, showToast }) {
  const { data } = useSWR(
    currentUser?.email ? `/api/promotions?email=${encodeURIComponent(currentUser.email)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const [activePromo, setActivePromo] = useState(null);

  useEffect(() => {
    if (!data?.promotions || data.promotions.length === 0) {
      setActivePromo(null);
      return;
    }

    // Find first active promotion not yet dismissed this session
    const unviewed = data.promotions.find((p) => {
      const pId = p.id || p._id;
      try {
        return sessionStorage.getItem(`wh_promo_seen_${pId}`) !== 'true';
      } catch {
        return true;
      }
    });

    if (unviewed) {
      const timer = setTimeout(() => {
        setActivePromo(unviewed);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!activePromo) return null;

  const handleDismiss = () => {
    const pId = activePromo.id || activePromo._id;
    try {
      sessionStorage.setItem(`wh_promo_seen_${pId}`, 'true');
    } catch {}
    setActivePromo(null);
  };

  const handleClaim = () => {
    handleDismiss();
    if (onOpenDeposit) {
      onOpenDeposit();
    }
    if (showToast) {
      showToast(`Promo "${activePromo.title}" selected! Complete deposit to apply bonus.`, 'success');
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 5, 11, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 99998
      }}>
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 20, 42, 0.98) 0%, rgba(8, 10, 22, 0.98) 100%)',
            border: '2px solid var(--gold-primary)',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '90vw',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(255,200,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '0.85rem',
              right: '0.85rem',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}
          >
            &times;
          </button>

          {/* Promo Graphic Header / Cover Image */}
          {activePromo.image ? (
            <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
              <img
                src={activePromo.image}
                alt={activePromo.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 40%, rgba(16, 20, 42, 1) 100%)'
              }} />
            </div>
          ) : (
            <div style={{
              width: '100%',
              padding: '2rem 1rem 1rem 1rem',
              background: 'linear-gradient(135deg, rgba(255,200,0,0.15) 0%, rgba(0,240,255,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,200,0,0.2)',
                border: '2px solid var(--gold-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                color: 'var(--gold-primary)'
              }}>
                <i className="fa-solid fa-gift" />
              </div>
            </div>
          )}

          {/* Content Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <span style={{
              alignSelf: 'center',
              background: 'rgba(255, 200, 0, 0.15)',
              border: '1px solid var(--gold-primary)',
              color: 'var(--gold-primary)',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              SPECIAL PROMOTION
            </span>

            <div>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'var(--font-heading)',
                margin: '0 0 0.5rem 0'
              }}>
                {activePromo.title}
              </h2>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.5
              }}>
                {activePromo.message}
              </p>
            </div>

            {/* Bonus Highlights */}
            {(activePromo.bonusPercent > 0 || activePromo.freeplayAmount > 0) && (
              <div style={{
                background: 'rgba(6, 8, 18, 0.8)',
                border: '1px dashed var(--gold-primary)',
                borderRadius: '14px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                {activePromo.bonusPercent > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DEPOSIT MATCH</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'var(--font-heading)' }}>
                      +{activePromo.bonusPercent}%
                    </div>
                  </div>
                )}
                {activePromo.freeplayAmount > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FREEPLAY BONUS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00e676', fontFamily: 'var(--font-heading)' }}>
                      ${activePromo.freeplayAmount}.00
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleClaim}
                className="btn-gold-glow"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-coins" style={{ marginRight: '6px' }} /> CLAIM & LOAD COINS &rarr;
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.35rem'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
