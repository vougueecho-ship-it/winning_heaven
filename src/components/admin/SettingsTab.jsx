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
          adBudgetLimit: Number(adBudgetLimit)
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

        {/* SECTION 2: PLATFORM OWNER WALLET */}
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

      </form>
    </div>
  );
}
