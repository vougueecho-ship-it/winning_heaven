'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPromoPush } from '../../lib/pushClient';

export default function SubscribePromptModal({ currentUser, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    // Check if user already subscribed or recently dismissed
    try {
      const isSubscribed = localStorage.getItem('wh_push_subscribed') === 'true' || currentUser.isSubscribed === true;
      if (isSubscribed) return;

      const dismissedTs = localStorage.getItem('wh_push_dismissed_ts');
      const now = Date.now();
      // Show once per 7 days if dismissed, or immediately on first login
      if (dismissedTs && now - Number(dismissedTs) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }

      // Small delay on initial login so page finishes loading smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1800);

      return () => clearTimeout(timer);
    } catch {
      // Storage unavailable
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribeToPromoPush(currentUser.email);
      try {
        localStorage.setItem('wh_push_subscribed', 'true');
      } catch {}
      if (showToast) showToast('Push notifications enabled! You will receive lock-screen bonus drops.', 'success');
      setIsOpen(false);
    } catch (err) {
      console.warn('Push subscription notice:', err);
      if (showToast) showToast('Notification permission was not enabled. You can enable anytime in browser settings.', 'info');
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('wh_push_dismissed_ts', String(Date.now()));
    } catch {}
    setIsOpen(false);
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
        zIndex: 99999
      }}>
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'linear-gradient(135deg, rgba(14, 18, 38, 0.98) 0%, rgba(8, 10, 22, 0.98) 100%)',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '440px',
            width: '90vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(255,200,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>

          {/* Glowing Bell Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 200, 0, 0.2) 0%, rgba(255, 153, 0, 0.1) 100%)',
            border: '2px solid var(--gold-primary)',
            boxShadow: '0 0 25px rgba(255, 200, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            color: 'var(--gold-primary)'
          }}>
            <i className="fa-solid fa-bell" />
          </div>

          {/* Title & Description */}
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              margin: '0 0 0.5rem 0',
              letterSpacing: '0.03em'
            }}>
              GET INSTANT <span className="gold-gradient-text">BONUS & CASHOUT</span> ALERTS
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.5
            }}>
              Enable lock-screen notifications to receive instant freeplay drops, 300% deposit match bonus codes, and real-time cashout approval receipts directly to your device!
            </p>
          </div>

          {/* Features Bullets */}
          <div style={{
            width: '100%',
            background: 'rgba(6, 8, 18, 0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#fff' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676' }} />
              <span>Instant Signup & Freeplay bonus drops</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#fff' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676' }} />
              <span>Real-time Cashout & Deposit approval alerts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#fff' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676' }} />
              <span>VIP weekend match promos & reload codes</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubscribe}
              className="btn-gold-glow"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.92rem',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin" /> Enabling Notifications...</span>
              ) : (
                <span><i className="fa-solid fa-bell" style={{ marginRight: '6px' }} /> ENABLE INSTANT NOTIFICATIONS</span>
              )}
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
                padding: '0.4rem'
              }}
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
