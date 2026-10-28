'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HalloweenEventSection({
  currentUser,
  onOpenDeposit,
  onOpenAuth,
  showToast,
  frontendSettings = {}
}) {
  // If Super Admin disabled Halloween, do not render
  if (frontendSettings?.halloweenActive === false) {
    return null;
  }

  // Dynamic percentages set by Admin
  const bonus1 = frontendSettings?.halloweenBonus1 !== undefined ? Number(frontendSettings.halloweenBonus1) : 150;
  const bonus2 = frontendSettings?.halloweenBonus2 !== undefined ? Number(frontendSettings.halloweenBonus2) : 100;
  const bonus3 = frontendSettings?.halloweenBonus3 !== undefined ? Number(frontendSettings.halloweenBonus3) : 200;

  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 28, seconds: 45 });
  const [selectedPumpkin, setSelectedPumpkin] = useState(null);
  const [claimedBonus, setClaimedBonus] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const today = new Date().toDateString();
      return localStorage.getItem('halloween_daily_treat_date') === today;
    } catch {
      return false;
    }
  });

  // Check if player has an active claimed Halloween bonus
  useEffect(() => {
    if (!currentUser?.email) return;

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem('active_halloween_bonus');
      if (cached) {
        setClaimedBonus(JSON.parse(cached));
      }
    } catch {}

    // Fetch from backend
    fetch(`/api/halloween/claim?email=${encodeURIComponent(currentUser.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.claimedBonus) {
          setClaimedBonus(data.claimedBonus);
          try {
            localStorage.setItem('active_halloween_bonus', JSON.stringify(data.claimedBonus));
          } catch {}
        }
      })
      .catch((err) => console.error('Error checking claimed Halloween bonus:', err));
  }, [currentUser?.email]);

  useEffect(() => {
    // Target: 4 days countdown
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    targetDate.setHours(23, 59, 59);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mysteryPumpkins = [
    {
      id: 1,
      name: frontendSettings?.halloweenBonus1Name || 'Jackpot Pumpkin',
      icon: '🎃',
      bonusPercent: bonus1,
      tag: 'MOST POPULAR',
      description: `Unlock +${bonus1}% Extra Coins automatically added to your game on deposits.`
    },
    {
      id: 2,
      name: frontendSettings?.halloweenBonus2Name || 'Phantom Fortune',
      icon: '👻',
      bonusPercent: bonus2,
      tag: 'DOUBLE COINS',
      description: `Unlock +${bonus2}% Instant Double Match added directly to your game balance.`
    },
    {
      id: 3,
      name: frontendSettings?.halloweenBonus3Name || 'Vampire Vault',
      icon: '🦇',
      bonusPercent: bonus3,
      tag: 'HIGH ROLLER',
      description: `Unlock +${bonus3}% VIP Super Match for maximum payouts and coins.`
    }
  ];

  const handlePumpkinClick = (p) => {
    setSelectedPumpkin(p);
  };

  const handleClaimBonus = async (p) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch('/api/halloween/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          pumpkinId: p.id,
          name: p.name,
          bonusPercent: p.bonusPercent
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not claim bonus.');
      }

      setClaimedBonus(data.claimedBonus);
      try {
        localStorage.setItem('active_halloween_bonus', JSON.stringify(data.claimedBonus));
      } catch {}

      if (showToast) {
        showToast(`🎉 ${p.name} Claimed! +${p.bonusPercent}% Extra Coins will automatically be added when you deposit!`, 'success');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error claiming bonus', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimDailyTreat = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const today = new Date().toDateString();
    try {
      localStorage.setItem('halloween_daily_treat_date', today);
    } catch {}
    setDailyClaimed(true);
    if (showToast) {
      showToast('🍬 Happy Halloween! Your daily treat perk is active — enjoy boosted luck on all games!', 'success');
    }
  };

  const activeP = selectedPumpkin || (claimedBonus ? mysteryPumpkins.find(m => m.id === claimedBonus.id) : null);
  const isCurrentActiveClaimed = claimedBonus && activeP && claimedBonus.id === activeP.id;

  return (
    <section className="halloween-event-card">
      {/* Background Graphic Overlay */}
      <div 
        className="halloween-bg-cover"
        style={{ backgroundImage: `url('/halloween_casino_banner.jpg')` }}
      />
      <div className="halloween-overlay-gradient" />

      {/* Floating Animated Eerie Accents */}
      <div className="halloween-bats-layer">
        <span className="floating-bat bat-1">🦇</span>
        <span className="floating-bat bat-2">🦇</span>
        <span className="floating-bat bat-3">🦇</span>
        <span className="floating-bat bat-4">🎃</span>
      </div>

      <div className="halloween-content-wrapper">
        {/* Top Badges & Countdown */}
        <div className="halloween-top-row">
          <div className="halloween-live-badge">
            <span className="pulse-pumpkin">🎃</span>
            <span>HALLOWEEN SPOOKTACULAR 2026</span>
            <span className="live-dot" />
          </div>

          <div className="halloween-timer-box">
            <span className="timer-label"><i className="fa-regular fa-clock" /> EVENT ENDS IN:</span>
            <div className="timer-digits">
              <span className="digit-unit"><strong>{String(timeLeft.days).padStart(2, '0')}</strong>d</span> :
              <span className="digit-unit"><strong>{String(timeLeft.hours).padStart(2, '0')}</strong>h</span> :
              <span className="digit-unit"><strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>m</span> :
              <span className="digit-unit"><strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>s</span>
            </div>
          </div>
        </div>

        {/* Headline & Pitch */}
        <div className="halloween-hero-text">
          <h2 className="halloween-title">
            TRICK OR TREAT <span className="halloween-gold-glow">BONANZA</span>
          </h2>
          <p className="halloween-subtitle">
            Tap a pumpkin below to claim your Halloween deposit multiplier. No promo code needed! 
            Whenever you deposit, your bonus coins will automatically be added.
          </p>
        </div>

        {/* Active Claimed Status Notification Banner */}
        {claimedBonus && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1.5px solid #22c55e',
            borderRadius: '12px',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>✓</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#4ade80' }}>
                  ACTIVE BONUS ON YOUR ACCOUNT: +{claimedBonus.bonusPercent}% EXTRA COINS
                </div>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                  {claimedBonus.name} is active! Whenever you make a deposit, you automatically receive +{claimedBonus.bonusPercent}% coins.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDeposit}
              style={{
                background: '#22c55e',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Deposit with +{claimedBonus.bonusPercent}%</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        )}

        {/* Interactive 3-Pumpkin Mystery Selector */}
        <div className="halloween-mystery-section">
          <div className="mystery-section-title">
            <span>✨ Tap a Jack-o&apos;Lantern to Select Your Bonus Multiplier ✨</span>
          </div>

          <div className="halloween-pumpkins-grid">
            {mysteryPumpkins.map((p) => {
              const isSelected = activeP?.id === p.id;
              const isClaimedThis = claimedBonus?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`halloween-pumpkin-box ${isSelected ? 'active-pumpkin' : ''}`}
                  onClick={() => handlePumpkinClick(p)}
                  role="button"
                  tabIndex={0}
                  style={{
                    borderColor: isClaimedThis ? '#22c55e' : (isSelected ? '#ff7518' : undefined)
                  }}
                >
                  <div className="pumpkin-tag" style={{ background: isClaimedThis ? '#22c55e' : undefined, color: isClaimedThis ? '#000' : undefined }}>
                    {isClaimedThis ? '✓ ACTIVE' : p.tag}
                  </div>
                  <div className="pumpkin-icon-frame">
                    <span className="pumpkin-emoji">{p.icon}</span>
                  </div>
                  <h4 className="pumpkin-name">{p.name}</h4>
                  <div className="pumpkin-reward-hint" style={{ color: isClaimedThis ? '#4ade80' : 'var(--gold-primary)' }}>
                    +{p.bonusPercent}% Extra Coins
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Pumpkin Action Card */}
        <AnimatePresence>
          {activeP && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="halloween-revealed-panel"
              style={{
                borderColor: isCurrentActiveClaimed ? '#22c55e' : '#ff7518'
              }}
            >
              <div className="revealed-left">
                <div className="revealed-icon">{activeP.icon}</div>
                <div>
                  <div className="revealed-badge" style={{
                    background: isCurrentActiveClaimed ? 'linear-gradient(90deg, #22c55e, #10b981)' : undefined
                  }}>
                    {isCurrentActiveClaimed ? '✓ CLAIMED & ACTIVE' : `+${activeP.bonusPercent}% EXTRA COINS MATCH`}
                  </div>
                  <h3 className="revealed-title">{activeP.name}</h3>
                  <p className="revealed-desc">{activeP.description}</p>
                </div>
              </div>

              <div className="revealed-actions">
                {isCurrentActiveClaimed ? (
                  <button
                    type="button"
                    className="halloween-claim-btn"
                    onClick={onOpenDeposit}
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#000' }}
                  >
                    <i className="fa-solid fa-coins" />
                    <span>Deposit Now (+{activeP.bonusPercent}% Coins)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="halloween-claim-btn"
                    onClick={() => handleClaimBonus(activeP)}
                    disabled={claiming}
                  >
                    <i className={claiming ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-wand-magic-sparkles"} />
                    <span>{claiming ? 'Claiming...' : `Claim +${activeP.bonusPercent}% Bonus (1-Click)`}</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Treat Action Bar */}
        <div className="halloween-bottom-bar">
          <div className="daily-treat-info">
            <span className="treat-icon">🍬</span>
            <span>Daily Spooky Treat: Free daily player perk available today!</span>
          </div>
          <button
            type="button"
            className={`daily-treat-btn ${dailyClaimed ? 'claimed' : ''}`}
            onClick={handleClaimDailyTreat}
            disabled={dailyClaimed}
          >
            <i className={dailyClaimed ? "fa-solid fa-circle-check" : "fa-solid fa-gift"} />
            <span>{dailyClaimed ? 'Today\'s Treat Claimed' : 'Grab Today\'s Treat'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
