'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function SettingsTab({ onUpdateSettings }) {
  const { data: settingsData, error, mutate } = useSWR('/api/settings', fetcher);

  const [firstBonusInput, setFirstBonusInput] = useState(300);
  const [regularBonusInput, setRegularBonusInput] = useState(20);
  const [referralBonusInput, setReferralBonusInput] = useState(10);
  const [usdtAddressInput, setUsdtAddressInput] = useState('');
  const [usdtQrCodeInput, setUsdtQrCodeInput] = useState('');
  const [affiliatePayoutNetwork, setAffiliatePayoutNetwork] = useState('TRC20');
  const [affiliatePayoutWallet, setAffiliatePayoutWallet] = useState('');
  const [affiliatePayoutQrCode, setAffiliatePayoutQrCode] = useState('');
  const [affiliatePayoutWalletBEP20, setAffiliatePayoutWalletBEP20] = useState('');
  const [affiliatePayoutQrBEP20, setAffiliatePayoutQrBEP20] = useState('');
  const [affiliatePlatformCommissionRate, setAffiliatePlatformCommissionRate] = useState(90);
  const [adPaymentNetwork, setAdPaymentNetwork] = useState('BEP20');
  const [adPaymentWallet, setAdPaymentWallet] = useState('');
  const [adPaymentQrCode, setAdPaymentQrCode] = useState('');
  const [adBudgetLimit, setAdBudgetLimit] = useState(6000);
  const [enforceDeviceLimitInput, setEnforceDeviceLimitInput] = useState(true);

  // Cashout rules & deposit multiplier settings
  const [freeplayMinWithdraw, setFreeplayMinWithdraw] = useState(30);
  const [defaultMinWithdraw, setDefaultMinWithdraw] = useState(25);
  const [withdrawTier1Multiplier, setWithdrawTier1Multiplier] = useState(5);
  const [withdrawTier2Multiplier, setWithdrawTier2Multiplier] = useState(3);
  const [withdrawTier1MinDeposit, setWithdrawTier1MinDeposit] = useState(5);
  const [withdrawTier1MaxDeposit, setWithdrawTier1MaxDeposit] = useState(50);
  const [withdrawTier1Basis, setWithdrawTier1Basis] = useState('coins');
  const [withdrawTier2Basis, setWithdrawTier2Basis] = useState('deposit');
  const [withdrawCalculationBasis, setWithdrawCalculationBasis] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings inputs when SWR loads data
  useEffect(() => {
    if (settingsData?.settings) {
      setFirstBonusInput(settingsData.settings.firstDepositBonus ?? 300);
      setRegularBonusInput(settingsData.settings.regularDepositBonus ?? 20);
      setReferralBonusInput(settingsData.settings.referralBonus ?? 10);
      setUsdtAddressInput(settingsData.settings.usdtAddress || '');
      setUsdtQrCodeInput(settingsData.settings.usdtQrCode || '');
      setAffiliatePayoutNetwork(settingsData.settings.affiliatePayoutNetwork || 'TRC20');
      setAffiliatePayoutWallet(settingsData.settings.affiliatePayoutWallet || '');
      setAffiliatePayoutQrCode(settingsData.settings.affiliatePayoutQrCode || '');
      setAffiliatePayoutWalletBEP20(settingsData.settings.affiliatePayoutWalletBEP20 || '');
      setAffiliatePayoutQrBEP20(settingsData.settings.affiliatePayoutQrBEP20 || '');
      setAffiliatePlatformCommissionRate(settingsData.settings.affiliatePlatformCommissionRate ?? 90);
      setAdPaymentNetwork(settingsData.settings.adPaymentNetwork || 'BEP20');
      setAdPaymentWallet(settingsData.settings.adPaymentWallet || '');
      setAdPaymentQrCode(settingsData.settings.adPaymentQrCode || '');
      setAdBudgetLimit(settingsData.settings.adBudgetLimit ?? 6000);
      setEnforceDeviceLimitInput(settingsData.settings.enforceDeviceLimit !== false);
      setFreeplayMinWithdraw(settingsData.settings.freeplayMinWithdraw !== undefined ? settingsData.settings.freeplayMinWithdraw : 30);
      setDefaultMinWithdraw(settingsData.settings.defaultMinWithdraw !== undefined ? settingsData.settings.defaultMinWithdraw : 25);
      setWithdrawTier1Multiplier(settingsData.settings.withdrawTier1Multiplier !== undefined ? settingsData.settings.withdrawTier1Multiplier : 5);
      setWithdrawTier2Multiplier(settingsData.settings.withdrawTier2Multiplier !== undefined ? settingsData.settings.withdrawTier2Multiplier : 3);
      setWithdrawTier1MinDeposit(settingsData.settings.withdrawTier1MinDeposit !== undefined ? settingsData.settings.withdrawTier1MinDeposit : 5);
      setWithdrawTier1MaxDeposit(settingsData.settings.withdrawTier1MaxDeposit !== undefined ? settingsData.settings.withdrawTier1MaxDeposit : 50);
      setWithdrawTier1Basis(settingsData.settings.withdrawTier1Basis || 'coins');
      setWithdrawTier2Basis(settingsData.settings.withdrawTier2Basis || 'deposit');
      setWithdrawCalculationBasis(settingsData.settings.withdrawCalculationBasis || '');
    }
  }, [settingsData]);

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUsdtQrCodeInput(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAdQrChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAdPaymentQrCode(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSettingsSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstDepositBonus: Number(firstBonusInput),
          regularDepositBonus: Number(regularBonusInput),
          referralBonus: Number(referralBonusInput),
          usdtAddress: usdtAddressInput.trim(),
          usdtQrCode: usdtQrCodeInput,
          affiliatePayoutNetwork,
          affiliatePayoutWallet,
          affiliatePayoutQrCode,
          affiliatePayoutWalletBEP20,
          affiliatePayoutQrBEP20,
          affiliatePlatformCommissionRate: Number(affiliatePlatformCommissionRate),
          adPaymentNetwork,
          adPaymentWallet: adPaymentWallet.trim(),
          adPaymentQrCode,
          adBudgetLimit: Number(adBudgetLimit),
          enforceDeviceLimit: Boolean(enforceDeviceLimitInput),
          freeplayMinWithdraw: Number(freeplayMinWithdraw),
          defaultMinWithdraw: Number(defaultMinWithdraw),
          withdrawTier1Multiplier: Number(withdrawTier1Multiplier),
          withdrawTier2Multiplier: Number(withdrawTier2Multiplier),
          withdrawTier1MinDeposit: Number(withdrawTier1MinDeposit),
          withdrawTier1MaxDeposit: Number(withdrawTier1MaxDeposit),
          withdrawTier1Basis,
          withdrawTier2Basis,
          withdrawCalculationBasis
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        mutate();
        if (onUpdateSettings) {
          await onUpdateSettings(
            firstBonusInput,
            regularBonusInput,
            referralBonusInput,
            usdtAddressInput,
            usdtQrCodeInput,
            affiliatePayoutNetwork,
            affiliatePayoutWallet,
            affiliatePayoutQrCode,
            affiliatePlatformCommissionRate
          );
        }
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(data.message || 'Failed to update settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settingsData && !error) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#ffd700', marginBottom: '1rem', display: 'block' }} />
        <p style={{ fontSize: '0.9rem' }}>Loading system settings configuration...</p>
      </div>
    );
  }

  const numFirst = parseFloat(firstBonusInput) || 0;
  const numRegular = parseFloat(regularBonusInput) || 0;
  const numReferral = parseFloat(referralBonusInput) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in 0.2s ease-out' }}>
      
      {/* 1. TOP VIP HEADER & ACTION BAR */}
      <div style={{
        background: 'rgba(14, 18, 36, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '20px',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className="fa-solid fa-sliders" style={{ color: '#ffd700' }} />
            <span>SYSTEM SETTINGS &amp; <span className="gold-gradient-text">BONUS ENGINE</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Configure promotional multipliers, referral rewards, and platform house settlement addresses
          </div>
        </div>

        <button
          type="button"
          onClick={handleSettingsSubmit}
          disabled={isSaving}
          style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#04050b',
            fontSize: '0.85rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '0.75rem 1.6rem',
            cursor: isSaving ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(255, 170, 0, 0.4)',
            transition: 'all 0.25s ease'
          }}
        >
          {isSaving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" />
              <span>SAVING...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" />
              <span>SAVE CONFIGURATIONS &rarr;</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div style={{
          background: 'rgba(0, 230, 118, 0.12)',
          border: '1.5px solid #00e676',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          color: '#00e676',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          boxShadow: '0 4px 20px rgba(0, 230, 118, 0.25)',
          animation: 'fade-in 0.25s ease'
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '1.1rem' }} />
          <span>System configurations saved and synchronized live successfully!</span>
        </div>
      )}

      <form onSubmit={handleSettingsSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* SECTION 1: PLAYER BONUS & DEPOSIT MULTIPLIERS */}
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-gift" style={{ color: '#00e676' }} />
              <span>Bonus &amp; Deposit Reward Percentages</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Set extra free coins given to players on first payment, repeat reloads, and friend invites.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* 1.1 First Deposit */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(0, 230, 118, 0.25)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00e676', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  First Deposit Signup Bonus
                </span>
                <i className="fa-solid fa-gift" style={{ color: '#00e676' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#00e676', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="300"
                  value={firstBonusInput}
                  onChange={(e) => setFirstBonusInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(0, 230, 118, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                <strong style={{ color: '#00e676' }}>Example:</strong> $100 Deposit &rarr; gets <strong style={{ color: '#00e676' }}>+${(100 * (numFirst / 100)).toFixed(0)} free</strong> ({numFirst}% extra) = <strong style={{ color: '#ffd700' }}>${(100 + 100 * (numFirst / 100)).toFixed(0)} coins</strong>.
              </div>
            </div>

            {/* 1.2 Repeat Deposit */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(0, 240, 255, 0.25)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Regular Repeat Deposit Bonus
                </span>
                <i className="fa-solid fa-rotate" style={{ color: '#00f0ff' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#00f0ff', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="20"
                  value={regularBonusInput}
                  onChange={(e) => setRegularBonusInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(0, 240, 255, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                <strong style={{ color: '#00f0ff' }}>Example:</strong> $100 Deposit &rarr; gets <strong style={{ color: '#00f0ff' }}>+${(100 * (numRegular / 100)).toFixed(0)} free</strong> ({numRegular}% extra) = <strong style={{ color: '#ffd700' }}>${(100 + 100 * (numRegular / 100)).toFixed(0)} coins</strong>.
              </div>
            </div>

            {/* 1.3 Referral Deposit */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(192, 132, 252, 0.25)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Referral Friend Reward Bonus
                </span>
                <i className="fa-solid fa-users-viewfinder" style={{ color: '#c084fc' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#c084fc', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="10"
                  value={referralBonusInput}
                  onChange={(e) => setReferralBonusInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(192, 132, 252, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                background: 'rgba(192, 132, 252, 0.08)',
                border: '1px solid rgba(192, 132, 252, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                <strong style={{ color: '#c084fc' }}>Example:</strong> Friend deposits $100 &rarr; Referrer earns <strong style={{ color: '#00e676' }}>+${(100 * (numReferral / 100)).toFixed(0)}</strong> direct commission wallet credit.
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: CASHOUT RULES & ALLOTTED COINS MULTIPLIERS */}
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 204, 0.22)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-money-bill-transfer" style={{ color: '#00ffcc' }} />
              <span>Cashout Rules &amp; Multipliers Engine</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Configure minimum cashout floor for Freeplay wins, multiplier values, and whether calculations multiply by Allotted Coins or Deposit Amount ($).
            </span>
          </div>

          {/* Master Calculation Basis (All Rules) */}
          <div style={{
            background: 'rgba(6, 8, 18, 0.85)',
            border: '1.5px solid rgba(0, 255, 204, 0.3)',
            borderRadius: '16px',
            padding: '1.15rem 1.35rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-sliders" />
                Master Multiplier Calculation Basis (All Cashout Rules)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                Applies globally or per-tier
              </span>
            </div>
            <select
              value={withdrawCalculationBasis}
              onChange={(e) => setWithdrawCalculationBasis(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 14, 28, 0.95)',
                border: '1.5px solid rgba(0, 255, 204, 0.35)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.92rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">⚙️ Custom Per-Tier Basis (Tier 1: Coins, Tier 2: Deposit Amount)</option>
              <option value="deposit">💵 Multiply by Deposit Amount ($) across ALL Rules</option>
              <option value="coins">🪙 Multiply by Allotted Coins across ALL Rules</option>
            </select>
            <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>
              {withdrawCalculationBasis === 'deposit' ? (
                <span>🔥 <strong style={{ color: '#00e676' }}>All cashout rules</strong> are set to multiply directly by <strong>Deposit Amount ($)</strong>.</span>
              ) : withdrawCalculationBasis === 'coins' ? (
                <span>🪙 <strong style={{ color: '#ffd700' }}>All cashout rules</strong> are set to multiply by <strong>Allotted Coins</strong>.</span>
              ) : (
                <span>✨ <strong style={{ color: '#00ffcc' }}>Per-Tier rules active:</strong> Tier 1 and Tier 2 use their individual basis configurations below.</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Freeplay Min Cashout */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Freeplay Min Cashout ($)
                </span>
                <i className="fa-solid fa-gift" style={{ color: '#c084fc' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-dollar-sign" style={{ position: 'absolute', left: '14px', color: '#c084fc', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="30"
                  value={freeplayMinWithdraw}
                  onChange={(e) => setFreeplayMinWithdraw(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                Freeplay winners cannot submit or cash out less than this amount (Default: <strong style={{ color: '#c084fc' }}>$30.00</strong>).
              </div>
            </div>

            {/* Tier 1 Multiplier ($5 to $50) */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tier 1 Multiplier ({withdrawTier1MinDeposit || 5}$ - {withdrawTier1MaxDeposit || 50}$)
                </span>
                <i className="fa-solid fa-coins" style={{ color: '#ffd700' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-xmark" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="5"
                  value={withdrawTier1Multiplier}
                  onChange={(e) => setWithdrawTier1Multiplier(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(255, 215, 0, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tier 1 Basis Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  Tier 1 Multiplier Basis:
                </span>
                <select
                  value={withdrawTier1Basis}
                  disabled={!!withdrawCalculationBasis}
                  onChange={(e) => setWithdrawTier1Basis(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '0.55rem 0.75rem',
                    color: '#ffd700',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: withdrawCalculationBasis ? 'not-allowed' : 'pointer',
                    opacity: withdrawCalculationBasis ? 0.6 : 1
                  }}
                >
                  <option value="coins">🪙 Allotted Coins (Default)</option>
                  <option value="deposit">💵 Deposit Amount ($)</option>
                </select>
              </div>

              <div style={{
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                Multiplies <strong>{(withdrawCalculationBasis || withdrawTier1Basis) === 'deposit' ? 'deposit amount ($)' : 'allotted coins'}</strong> by <strong style={{ color: '#ffd700' }}>{withdrawTier1Multiplier || 5}x</strong> for deposits from ${withdrawTier1MinDeposit || 5} to ${withdrawTier1MaxDeposit || 50}.
              </div>
            </div>

            {/* Tier 2 Multiplier (> $50) */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tier 2 Multiplier (&gt; {withdrawTier1MaxDeposit || 50}$)
                </span>
                <i className="fa-solid fa-fire" style={{ color: '#ff6b6b' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-xmark" style={{ position: 'absolute', left: '14px', color: '#ff6b6b', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="3"
                  value={withdrawTier2Multiplier}
                  onChange={(e) => setWithdrawTier2Multiplier(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(255, 107, 107, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tier 2 Basis Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  Tier 2 Multiplier Basis:
                </span>
                <select
                  value={withdrawTier2Basis}
                  disabled={!!withdrawCalculationBasis}
                  onChange={(e) => setWithdrawTier2Basis(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '10px',
                    padding: '0.55rem 0.75rem',
                    color: '#ff6b6b',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: withdrawCalculationBasis ? 'not-allowed' : 'pointer',
                    opacity: withdrawCalculationBasis ? 0.6 : 1
                  }}
                >
                  <option value="deposit">💵 Deposit Amount ($) (Default)</option>
                  <option value="coins">🪙 Allotted Coins</option>
                </select>
              </div>

              <div style={{
                background: 'rgba(255, 107, 107, 0.08)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                Multiplies <strong>{(withdrawCalculationBasis || withdrawTier2Basis) === 'deposit' ? 'deposit amount ($)' : 'allotted coins'}</strong> by <strong style={{ color: '#ff6b6b' }}>{withdrawTier2Multiplier || 3}x</strong> for deposits strictly greater than ${withdrawTier1MaxDeposit || 50}.
              </div>
            </div>

            {/* Default Min Cashout (No prior deposit) */}
            <div style={{
              background: 'rgba(6, 8, 18, 0.8)',
              border: '1.5px solid rgba(0, 255, 204, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Default Minimum Cashout ($)
                </span>
                <i className="fa-solid fa-shield-halved" style={{ color: '#00ffcc' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-dollar-sign" style={{ position: 'absolute', left: '14px', color: '#00ffcc', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="25"
                  value={defaultMinWithdraw}
                  onChange={(e) => setDefaultMinWithdraw(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 14, 28, 0.95)',
                    border: '1.5px solid rgba(0, 255, 204, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                background: 'rgba(0, 255, 204, 0.08)',
                border: '1px solid rgba(0, 255, 204, 0.2)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35
              }}>
                Fallback minimum cashout when player has no previous deposit history (Default: <strong style={{ color: '#00ffcc' }}>$25.00</strong>).
              </div>
            </div>

          </div>

          {/* Real-time Formula Demonstration Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.06) 0%, rgba(14, 18, 36, 0.9) 100%)',
            border: '1.5px dashed rgba(0, 255, 204, 0.35)',
            borderRadius: '16px',
            padding: '1.1rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00ffcc', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase' }}>
              <i className="fa-solid fa-calculator" />
              <span>Live Multiplier Calculation Preview (Based on Active Settings)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px' }}>
                <div style={{ color: '#c084fc', fontWeight: 700 }}>Freeplay Client:</div>
                <div>Request minimum: <strong style={{ color: '#fff' }}>${Number(freeplayMinWithdraw || 30).toFixed(2)}</strong></div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px' }}>
                <div style={{ color: '#ffd700', fontWeight: 700 }}>$10 Deposit (12 Coins @ 20% bonus):</div>
                <div>
                  Min Cashout:&nbsp;
                  {(withdrawCalculationBasis || withdrawTier1Basis) === 'deposit' ? (
                    <span>$10 (Deposit) × {withdrawTier1Multiplier || 5} = <strong style={{ color: '#00ff66' }}>${(10 * Number(withdrawTier1Multiplier || 5)).toFixed(2)}</strong></span>
                  ) : (
                    <span>12 (Coins) × {withdrawTier1Multiplier || 5} = <strong style={{ color: '#00ff66' }}>${(12 * Number(withdrawTier1Multiplier || 5)).toFixed(2)}</strong></span>
                  )}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px' }}>
                <div style={{ color: '#ff6b6b', fontWeight: 700 }}>$100 Deposit (120 Coins @ 20% bonus):</div>
                <div>
                  Min Cashout:&nbsp;
                  {(withdrawCalculationBasis || withdrawTier2Basis) === 'deposit' ? (
                    <span>$100 (Deposit) × {withdrawTier2Multiplier || 3} = <strong style={{ color: '#00ff66' }}>${(100 * Number(withdrawTier2Multiplier || 3)).toFixed(2)}</strong></span>
                  ) : (
                    <span>120 (Coins) × {withdrawTier2Multiplier || 3} = <strong style={{ color: '#00ff66' }}>${(120 * Number(withdrawTier2Multiplier || 3)).toFixed(2)}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PLATFORM OWNER WALLET */}
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-building-columns" style={{ color: '#ffd700' }} />
              <span>Platform Owner Settlement Address &amp; QR Code</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Independent Type B distributors send platform commission revenue share to this wallet.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Platform Owner Settlement Address (USDT TRC20 / Zelle)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-wallet" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. TR7NHgoKwqTvF24F7545G... or zelle@winningheaven.com"
                  value={usdtAddressInput}
                  onChange={(e) => setUsdtAddressInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.85)',
                    border: '1.5px solid rgba(255, 215, 0, 0.22)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                This address is provided to Type B partner portals when submitting settlement proof.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                TRC20 QR Code Screenshot
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{
                  background: 'rgba(255,215,0,0.1)',
                  border: '1.5px solid rgba(255,215,0,0.3)',
                  color: '#ffd700',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}>
                  <i className="fa-solid fa-qrcode" />
                  <span>Choose QR Image</span>
                  <input type="file" accept="image/*" onChange={handleQrCodeChange} style={{ display: 'none' }} />
                </label>

                {usdtQrCodeInput && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={usdtQrCodeInput}
                      alt="USDT QR Code"
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid rgba(255,215,0,0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setUsdtQrCodeInput('')}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: AFFILIATE COMMISSION & ADS PAYMENT SETTINGS */}
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#ffd700' }} />
              <span>Affiliate Commissions &amp; Ad Campaign Settings</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Configure marketing campaign budgets, platform revenue retainage, and advertising payment gateway.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Platform Commission Share (%)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={affiliatePlatformCommissionRate}
                  onChange={(e) => setAffiliatePlatformCommissionRate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.85)',
                    border: '1.5px solid rgba(255, 215, 0, 0.22)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Shown to affiliates as platform house share (affiliate share = 100 - this value).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Ads Budget Limit Per Agent ($)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-dollar-sign" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adBudgetLimit}
                  onChange={(e) => setAdBudgetLimit(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.85)',
                    border: '1.5px solid rgba(255, 215, 0, 0.22)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Ads Payment Network
              </label>
              <select
                value={adPaymentNetwork}
                onChange={(e) => setAdPaymentNetwork(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 215, 0, 0.22)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="BEP20" style={{ background: '#0a0d16' }}>BNB Smart Chain (BEP20)</option>
                <option value="TRC20" style={{ background: '#0a0d16' }}>USDT (TRC20)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Ads Payment Wallet Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-wallet" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="Wallet for ad budget deposits"
                  value={adPaymentWallet}
                  onChange={(e) => setAdPaymentWallet(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.85)',
                    border: '1.5px solid rgba(255, 215, 0, 0.22)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Ads Payment QR Code
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{
                  background: 'rgba(255,215,0,0.1)',
                  border: '1.5px solid rgba(255,215,0,0.3)',
                  color: '#ffd700',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fa-solid fa-qrcode" />
                  <span>Choose QR Image</span>
                  <input type="file" accept="image/*" onChange={handleAdQrChange} style={{ display: 'none' }} />
                </label>
                {adPaymentQrCode && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={adPaymentQrCode}
                      alt="Ads QR"
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid rgba(255,215,0,0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setAdPaymentQrCode('')}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 6: SECURITY & DEVICE MULTI-ACCOUNT RESTRICTIONS */}
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#ef4444' }} />
              <span>Anti-Fraud &amp; Device Restriction Policy</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Enforce one account per mobile device / browser to prevent bonus abuse and duplicate registrations.
            </span>
          </div>

          <div style={{
            background: 'rgba(6, 8, 18, 0.8)',
            border: '1.5px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Enforce 1 Account Per Device</span>
                {enforceDeviceLimitInput ? (
                  <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)', fontWeight: 800 }}>
                    ACTIVE
                  </span>
                ) : (
                  <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 800 }}>
                    DISABLED
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', margin: '0.35rem 0 0 0' }}>
                When enabled, if a user attempts to create another account from the same mobile/device, registration will be rejected with: <em>"You already have an account from this device."</em>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEnforceDeviceLimitInput(!enforceDeviceLimitInput)}
              style={{
                background: enforceDeviceLimitInput ? 'linear-gradient(135deg, #00e676 0%, #00b359 100%)' : 'rgba(255,255,255,0.1)',
                border: enforceDeviceLimitInput ? '1.5px solid #00e676' : '1.5px solid rgba(255,255,255,0.2)',
                color: enforceDeviceLimitInput ? '#000' : '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className={enforceDeviceLimitInput ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'} />
              <span>{enforceDeviceLimitInput ? 'Enabled (Restricted)' : 'Disabled (Allow Multi)'}</span>
            </button>
          </div>
        </section>

      </form>
    </div>
  );
}
