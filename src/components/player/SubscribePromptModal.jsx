'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPromoPush, getWebPushPromptState } from '../../lib/pushClient';

export default function SubscribePromptModal({ currentUser, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    try {
      // Don't show if already subscribed
      const isSubscribed = localStorage.getItem('wh_push_subscribed') === 'true' || currentUser.isSubscribed === true;
      if (isSubscribed) return;

      // Check if dismissed within last 7 days
      const dismissedTs = localStorage.getItem('wh_push_dismissed_ts');
      const now = Date.now();
      if (dismissedTs && now - Number(dismissedTs) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }

      // Check push state
      const state = getWebPushPromptState ? getWebPushPromptState() : { canEnable: true };
      if (state && state.permission === 'granted') {
        // Auto-subscribe silently
        subscribeToPromoPush(currentUser.email).catch(() => {});
        return;
      }

      // Display prompt after a smooth delay on lobby load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    } catch {
      // Storage unavailable
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await subscribeToPromoPush(currentUser.email);
      try {
        localStorage.setItem('wh_push_subscribed', 'true');
      } catch {}
      if (showToast) showToast('Notifications enabled! You will receive lock-screen bonus drops.', 'success');
      setIsOpen(false);
    } catch (err) {
      console.warn('Push notification enable error:', err);
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
            padding: '2rem 1.75rem',
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
              cursor: 'pointer',
              lineHeight: 1
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
              ENABLE <span className="gold-gradient-text">NOTIFICATIONS</span>
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.5
            }}>
              Turn on notifications to receive instant bonus drops, freeplay announcements, reload match codes, and cashout updates directly on your device.
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
              <span>Instant Freeplay drops &amp; reload promo codes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#fff' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676' }} />
              <span>Live Cashout &amp; Deposit approval updates</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#fff' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#00e676' }} />
              <span>VIP 300% weekend deposit matches</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="button"
              disabled={loading}
              onClick={handleEnableNotifications}
              className="btn-gold-glow"
              style={{
                width: '100%',
                padding: '0.88rem',
                fontSize: '0.92rem',
                justifyContent: 'center',
                fontWeight: 900,
                borderRadius: '12px'
              }}
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin" /> Enabling...</span>
              ) : (
                <span><i className="fa-solid fa-bell" style={{ marginRight: '6px' }} /> ENABLE NOTIFICATIONS</span>
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
                padding: '0.35rem'
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
