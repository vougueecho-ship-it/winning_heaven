'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ReferralCenter({
  currentUserEmail,
  referralCode = '',
  referralsList = [],
  onClose,
  onOpenSupport,
  showToast
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referrals, setReferrals] = useState(referralsList || []);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  useEffect(() => {
    if (!currentUserEmail && !referralCode) return;
    setLoadingReferrals(true);
    const emailQ = encodeURIComponent(currentUserEmail || '');
    const codeQ = encodeURIComponent(referralCode || '');
    fetch(`/api/users?referredBy=${emailQ}&referralCode=${codeQ}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.referrals)) {
          setReferrals(data.referrals);
        }
      })
      .catch((err) => console.error('Failed to fetch referrals:', err))
      .finally(() => setLoadingReferrals(false));
  }, [currentUserEmail, referralCode]);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${encodeURIComponent(referralCode)}`
    : `https://winningheaven.com?ref=${encodeURIComponent(referralCode)}`;

  const promoText = `Join Winning Heaven Casino with my referral link and claim your VIP deposit bonuses! Register here: ${referralLink}`;

  const copyText = (text, label, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    if (showToast) showToast(`${label} copied to clipboard!`, 'success');
  };

  const shareWhatsApp = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(promoText)}`, '_blank');
  const shareSMS = () => window.open(`sms:?&body=${encodeURIComponent(promoText)}`, '_blank');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1rem 0 3rem 0' }}>
      
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        background: 'var(--card-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '2px solid var(--gold-primary)',
            background: '#000',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 0 15px rgba(255,200,0,0.35)'
          }}>
            <img src="/winning_heaven_logo.png" alt="Winning Heaven Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: 900, color: '#fff', letterSpacing: '0.04em', margin: 0, fontFamily: 'var(--font-heading)' }}>
              VIP AFFILIATE <span className="gold-gradient-text">LOUNGE</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Invite friends &amp; earn continuous deposit commission bonuses
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn-glass-secondary" style={{ padding: '0.5rem 0.95rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-arrow-left" /> LOBBY
          </button>
          <button onClick={onOpenSupport} className="btn-gold-glow" style={{ padding: '0.5rem 0.95rem', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-headset" /> SUPPORT
          </button>
        </div>
      </div>

      {/* Hero Banner Showcase */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(20,16,40,0.96) 0%, rgba(10,12,24,0.96) 100%)',
        border: '1px solid var(--gold-primary)',
        borderRadius: '24px',
        padding: 'clamp(1.25rem, 3.5vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
        overflow: 'hidden',
        boxShadow: 'var(--card-glow-shadow)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,200,0,0.22) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="badge-emerald" style={{ marginBottom: '0.75rem', display: 'inline-flex', fontSize: '0.72rem' }}>
          <i className="fa-solid fa-bolt" style={{ marginRight: '0.4rem' }} /> REFERRAL PROGRAM ACTIVE
        </div>

        <h1 style={{
          fontSize: 'clamp(1.4rem, 3.8vw, 2.4rem)',
          fontWeight: 900,
          fontFamily: 'var(--font-heading)',
          color: '#fff',
          margin: '0 0 0.65rem 0',
          lineHeight: 1.15
        }}>
          SHARE THE CASINO EXPERIENCE.<br />
          <span className="gold-gradient-text">EARN UNLIMITED REWARDS.</span>
        </h1>

        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          maxWidth: '620px',
          margin: '0 0 1.25rem 0'
        }}>
          Invite your gaming network to Winning Heaven. Earn instant bonus credits on every deposit made by your referred players.
        </p>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button onClick={() => copyText(referralLink, 'Referral link', 'link')} className="btn-gold-glow" style={{ padding: '0.65rem 1.1rem', fontSize: '0.8rem' }}>
            {copiedLink ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-copy" />}
            {copiedLink ? 'LINK COPIED' : 'COPY REFERRAL LINK'}
          </button>
          <button onClick={shareWhatsApp} className="btn-cyan-glow" style={{ padding: '0.65rem 1.1rem', fontSize: '0.8rem' }}>
            <i className="fa-brands fa-whatsapp" /> WHATSAPP
          </button>
          <button onClick={shareSMS} className="btn-glass-secondary" style={{ padding: '0.65rem 1.1rem', fontSize: '0.8rem' }}>
            <i className="fa-solid fa-comment-sms" /> SMS
          </button>
        </div>
      </div>

      {/* Referral Link & Code Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        
        {/* Referral Link Box */}
        <div style={{
          background: 'var(--card-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '1.25rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            YOUR PERSONAL REFERRAL LINK
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <input
              readOnly
              value={referralLink}
              style={{
                flex: 1,
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.65rem 0.8rem',
                fontSize: '0.82rem',
                color: 'var(--cyan-primary)',
                fontFamily: 'monospace',
                outline: 'none',
                minWidth: 0
              }}
            />
            <button onClick={() => copyText(referralLink, 'Referral link', 'link')} className="btn-gold-glow" style={{ padding: '0.65rem 0.95rem', fontSize: '0.78rem' }}>
              COPY
            </button>
          </div>
        </div>

        {/* Referral Code Box */}
        <div style={{
          background: 'var(--card-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '1.25rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            YOUR REFERRAL CODE
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <input
              readOnly
              value={referralCode || 'WH-VIP-PLAYER'}
              style={{
                flex: 1,
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.65rem 0.8rem',
                fontSize: '0.88rem',
                color: 'var(--gold-primary)',
                fontFamily: 'monospace',
                fontWeight: 800,
                outline: 'none',
                minWidth: 0
              }}
            />
            <button onClick={() => copyText(referralCode, 'Referral code', 'code')} className="btn-gold-glow" style={{ padding: '0.65rem 0.95rem', fontSize: '0.78rem' }}>
              COPY
            </button>
          </div>
        </div>
      </div>

      {/* Referred Players Tracking */}
      <div style={{
        background: 'var(--card-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-users text-gold" />
          <span>REFERRED PLAYERS ({referrals.length})</span>
        </h3>

        {loadingReferrals ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'block' }} />
            <span>Loading your referred players...</span>
          </div>
        ) : referrals.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-user-plus" style={{ fontSize: '2rem', color: 'rgba(255,200,0,0.3)', marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.88rem' }}>No referred players yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {referrals.map((ref, idx) => (
              <div
                key={ref.id || ref.email || idx}
                style={{
                  background: 'rgba(6, 8, 18, 0.75)',
                  border: '1px solid rgba(255, 215, 0, 0.18)',
                  borderRadius: '14px',
                  padding: '0.9rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #a855f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user-check" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>
                      {ref.name || ref.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ref.email}
                      {ref.createdAt && ` • Joined ${new Date(ref.createdAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                <span className="badge-emerald" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}>
                  <span className="pulse-live" /> ACTIVE PLAYER
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
