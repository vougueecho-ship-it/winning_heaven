'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());
const DEFAULT_LOGIN_BG = '/heavenly_auth_bg.png';
const DEFAULT_LOGO = '/winning_heaven_logo.png';

export default function FrontendSettingsTab({ adminUser }) {
  const { data, error, mutate } = useSWR('/api/settings/frontend', fetcher);
  const [activeSubtab, setActiveSubtab] = useState('banners'); // 'banners', 'rules', 'apps', 'branding', 'info'

  // 1) Site Assets & Audio
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [loginBgUrl, setLoginBgUrl] = useState(DEFAULT_LOGIN_BG);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState('https://raw.githubusercontent.com/AUTOMATIC1111/stable-diffusion-webui/master/notification.mp3');

  // 2) Mobile App Download
  const [getAppEnabled, setGetAppEnabled] = useState(false);
  const [androidAppUrl, setAndroidAppUrl] = useState('/downloads/winning-heaven.apk');
  const [iosAppUrl, setIosAppUrl] = useState('');

  // 3) Player Rewards & Deposit/Cashout Limits
  const [firstDepositBonus, setFirstDepositBonus] = useState(300);
  const [signupFreeplay, setSignupFreeplay] = useState(3);
  const [minimumDepositLimit, setMinimumDepositLimit] = useState(5);
  const [minimumWithdrawalLimit, setMinimumWithdrawalLimit] = useState(5);
  const [freeplayMaxCashout, setFreeplayMaxCashout] = useState(50);
  const [freeplayUnlockDeposit, setFreeplayUnlockDeposit] = useState(25);
  const [cashoutTiers, setCashoutTiers] = useState([
    { depositRange: '$5 - $50', multiplier: '3x Deposit', minCashoutExample: 'Min $15.00 – $150.00', note: 'Fast 5-Minute Payout' },
    { depositRange: '$51 - $100', multiplier: '3x Deposit', minCashoutExample: 'Min $153.00 – $300.00', note: 'Standard Instant Payout' },
    { depositRange: '$101 - $250', multiplier: '2x Deposit', minCashoutExample: 'Min $202.00 – $500.00', note: 'VIP Express Payout' },
    { depositRange: '$250+', multiplier: '2x Deposit', minCashoutExample: 'Min $500.00+', note: 'Unlimited High Roller' }
  ]);
  const [customCashoutRules, setCustomCashoutRules] = useState([
    {
      title: '3x Minimum Deposit Multiplier',
      description: 'Deposits between $5.00 and $50.00 require a minimum 3x multiplier to cash out (e.g. $5 deposit requires minimum $15 cashout, $50 deposit requires minimum $150 cashout).'
    },
    {
      title: 'Zero Maximum Caps on Real Deposits',
      description: 'There are strictly NO maximum cashout limits on deposits. You can withdraw 100% of your winnings once your minimum session multiplier is achieved.'
    },
    {
      title: 'Freeplay Cashout Limit & Hold Balance',
      description: 'Freeplay ($3 Signup) allows a maximum cashout of $50.00. Excess balance remains on hold and is unlocked upon a $25.00 deposit.'
    }
  ]);
  const [withdrawRequireGameScreenshot, setWithdrawRequireGameScreenshot] = useState(false);
  const [withdrawRequireTagQrScreenshot, setWithdrawRequireTagQrScreenshot] = useState(true);

  // 4) Lobby Announcements & Cashout Notices
  const [withdrawNotice, setWithdrawNotice] = useState('Fastest Withdrawals inside 5 Minutes!');
  const [cashoutNotice, setCashoutNotice] = useState('Standard cashout processing hours: 24/7 Instant Processing');
  const [announcements, setAnnouncements] = useState([
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
  ]);

  // 5) Info Page & Support Channels (/info)
  const [infoPageEnabled, setInfoPageEnabled] = useState(true);
  const [infoShowOnAuth, setInfoShowOnAuth] = useState(true);
  const [infoShowOnLobby, setInfoShowOnLobby] = useState(true);
  const [infoTagline, setInfoTagline] = useState('PLAY SMARTER. CASHOUT FASTER.');
  const [infoLead, setInfoLead] = useState("Official channels for updates, community, and player support. Reach us anytime — we're here to help you win big.");
  const [infoSupportNote, setInfoSupportNote] = useState('For account help, deposits, or withdrawals, email support and our team will get back to you.');

  // Social Channels
  const [infoInstagramEnabled, setInfoInstagramEnabled] = useState(true);
  const [infoInstagramLabel, setInfoInstagramLabel] = useState('Instagram');
  const [infoInstagramHandle, setInfoInstagramHandle] = useState('@winningheaven_casino');
  const [infoInstagramUrl, setInfoInstagramUrl] = useState('https://www.instagram.com/winningheaven_casino');

  const [infoTelegramEnabled, setInfoTelegramEnabled] = useState(true);
  const [infoTelegramLabel, setInfoTelegramLabel] = useState('Telegram');
  const [infoTelegramHandle, setInfoTelegramHandle] = useState('t.me/winningheaven_casino');
  const [infoTelegramUrl, setInfoTelegramUrl] = useState('https://t.me/winningheaven_casino');

  const [infoFacebookEnabled, setInfoFacebookEnabled] = useState(true);
  const [infoFacebookLabel, setInfoFacebookLabel] = useState('Facebook');
  const [infoFacebookHandle, setInfoFacebookHandle] = useState('Winning Heaven');
  const [infoFacebookUrl, setInfoFacebookUrl] = useState('https://www.facebook.com/winningheaven');

  const [infoWhatsappEnabled, setInfoWhatsappEnabled] = useState(true);
  const [infoWhatsappLabel, setInfoWhatsappLabel] = useState('WhatsApp');
  const [infoWhatsappHandle, setInfoWhatsappHandle] = useState('+1 929 630 8553');
  const [infoWhatsappUrl, setInfoWhatsappUrl] = useState('https://wa.me/19296308553');

  const [infoEmailEnabled, setInfoEmailEnabled] = useState(true);
  const [infoEmailLabel, setInfoEmailLabel] = useState('Email Support');
  const [infoEmailHandle, setInfoEmailHandle] = useState('support@winningheaven.com');
  const [infoEmailUrl, setInfoEmailUrl] = useState('mailto:support@winningheaven.com');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load state when SWR returns data
  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setLogoUrl(s.logoUrl || DEFAULT_LOGO);
      setLoginBgUrl(s.loginBgUrl || DEFAULT_LOGIN_BG);
      setNotificationSoundUrl(s.notificationSoundUrl || 'https://raw.githubusercontent.com/AUTOMATIC1111/stable-diffusion-webui/master/notification.mp3');

      setGetAppEnabled(s.getAppEnabled === true);
      setAndroidAppUrl(s.androidAppUrl || '/downloads/winning-heaven.apk');
      setIosAppUrl(s.iosAppUrl || '');

      setFirstDepositBonus(s.firstDepositBonus !== undefined ? s.firstDepositBonus : 300);
      setSignupFreeplay(s.signupFreeplay !== undefined ? s.signupFreeplay : 3);
      setMinimumDepositLimit(s.minimumDepositLimit !== undefined ? s.minimumDepositLimit : 5);
      setMinimumWithdrawalLimit(s.minimumWithdrawalLimit !== undefined ? s.minimumWithdrawalLimit : 5);
      setFreeplayMaxCashout(s.freeplayMaxCashout !== undefined ? s.freeplayMaxCashout : 50);
      setFreeplayUnlockDeposit(s.freeplayUnlockDeposit !== undefined ? s.freeplayUnlockDeposit : 25);
      if (Array.isArray(s.cashoutTiers) && s.cashoutTiers.length > 0) {
        setCashoutTiers(s.cashoutTiers);
      }
      if (Array.isArray(s.customCashoutRules) && s.customCashoutRules.length > 0) {
        setCustomCashoutRules(s.customCashoutRules);
      }
      setWithdrawRequireGameScreenshot(s.withdrawRequireGameScreenshot === true);
      setWithdrawRequireTagQrScreenshot(s.withdrawRequireTagQrScreenshot !== false);

      setWithdrawNotice(s.withdrawNotice || 'Fastest Withdrawals inside 5 Minutes!');
      setCashoutNotice(s.cashoutNotice || 'Standard cashout processing hours: 24/7 Instant Processing');
      if (Array.isArray(s.announcements) && s.announcements.length > 0) {
        setAnnouncements(s.announcements);
      }

      setInfoPageEnabled(s.infoPageEnabled !== false);
      setInfoShowOnAuth(s.infoShowOnAuth !== false);
      setInfoShowOnLobby(s.infoShowOnLobby !== false);
      setInfoTagline(s.infoTagline || 'PLAY SMARTER. CASHOUT FASTER.');
      setInfoLead(s.infoLead || "Official channels for updates, community, and player support. Reach us anytime — we're here to help you win big.");
      setInfoSupportNote(s.infoSupportNote || 'For account help, deposits, or withdrawals, email support and our team will get back to you.');

      setInfoInstagramEnabled(s.infoInstagramEnabled !== false);
      setInfoInstagramLabel(s.infoInstagramLabel || 'Instagram');
      setInfoInstagramHandle(s.infoInstagramHandle || '@winningheaven_casino');
      setInfoInstagramUrl(s.infoInstagramUrl || 'https://www.instagram.com/winningheaven_casino');

      setInfoTelegramEnabled(s.infoTelegramEnabled !== false);
      setInfoTelegramLabel(s.infoTelegramLabel || 'Telegram');
      setInfoTelegramHandle(s.infoTelegramHandle || 't.me/winningheaven_casino');
      setInfoTelegramUrl(s.infoTelegramUrl || 'https://t.me/winningheaven_casino');

      setInfoFacebookEnabled(s.infoFacebookEnabled !== false);
      setInfoFacebookLabel(s.infoFacebookLabel || 'Facebook');
      setInfoFacebookHandle(s.infoFacebookHandle || 'Winning Heaven');
      setInfoFacebookUrl(s.infoFacebookUrl || 'https://www.facebook.com/winningheaven');

      setInfoWhatsappEnabled(s.infoWhatsappEnabled !== false);
      setInfoWhatsappLabel(s.infoWhatsappLabel || 'WhatsApp');
      setInfoWhatsappHandle(s.infoWhatsappHandle || '+1 929 630 8553');
      setInfoWhatsappUrl(s.infoWhatsappUrl || 'https://wa.me/19296308553');

      setInfoEmailEnabled(s.infoEmailEnabled !== false);
      setInfoEmailLabel(s.infoEmailLabel || 'Email Support');
      setInfoEmailHandle(s.infoEmailHandle || 'support@winningheaven.com');
      setInfoEmailUrl(s.infoEmailUrl || 'mailto:support@winningheaven.com');
    }
  }, [data]);

  // Image Upload Handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLoginBgUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Audio file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      let result = reader.result;
      if (typeof result === 'string') {
        result = result.replace(/^data:video\/[^;]+;/, 'data:audio/mpeg;');
      }
      setNotificationSoundUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Hero Announcement Banner List Handlers
  const addAnnouncement = () => {
    setAnnouncements([
      ...announcements,
      {
        title: 'NEW PROMO BANNER',
        subtitle: 'Add banner details here for player lobby carousel',
        cta: 'CLAIM NOW',
        action: 'deposit',
        badge: 'SPECIAL PROMO',
        bg: 'linear-gradient(135deg, rgba(20,16,40,0.95) 0%, rgba(10,12,24,0.95) 100%)'
      }
    ]);
  };

  const deleteAnnouncement = (idx) => {
    setAnnouncements(announcements.filter((_, i) => i !== idx));
  };

  const updateAnnouncement = (idx, field, val) => {
    const updated = [...announcements];
    updated[idx] = { ...updated[idx], [field]: val };
    setAnnouncements(updated);
  };

  // Cashout Tier Handlers
  const addCashoutTier = () => {
    setCashoutTiers([
      ...cashoutTiers,
      { depositRange: '$50 - $100', multiplier: '3x Deposit', minCashoutExample: 'Min $150.00', note: 'Instant Payout' }
    ]);
  };

  const deleteCashoutTier = (idx) => {
    setCashoutTiers(cashoutTiers.filter((_, i) => i !== idx));
  };

  const updateCashoutTier = (idx, field, val) => {
    const updated = [...cashoutTiers];
    updated[idx] = { ...updated[idx], [field]: val };
    setCashoutTiers(updated);
  };

  // Custom Rule Bullet Handlers
  const addCustomRule = () => {
    setCustomCashoutRules([
      ...customCashoutRules,
      { title: 'New Platform Rule', description: 'Rule description here' }
    ]);
  };

  const deleteCustomRule = (idx) => {
    setCustomCashoutRules(customCashoutRules.filter((_, i) => i !== idx));
  };

  const updateCustomRule = (idx, field, val) => {
    const updated = [...customCashoutRules];
    updated[idx] = { ...updated[idx], [field]: val };
    setCustomCashoutRules(updated);
  };

  // Submit Handler
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        logoUrl,
        loginBgUrl,
        notificationSoundUrl,
        getAppEnabled,
        androidAppUrl,
        iosAppUrl,
        firstDepositBonus: Number(firstDepositBonus),
        signupFreeplay: Number(signupFreeplay),
        minimumDepositLimit: Number(minimumDepositLimit),
        minimumWithdrawalLimit: Number(minimumWithdrawalLimit),
        freeplayMaxCashout: Number(freeplayMaxCashout),
        freeplayUnlockDeposit: Number(freeplayUnlockDeposit),
        cashoutTiers,
        customCashoutRules,
        withdrawRequireGameScreenshot,
        withdrawRequireTagQrScreenshot,
        withdrawNotice,
        cashoutNotice,
        announcements,
        infoPageEnabled,
        infoShowOnAuth,
        infoShowOnLobby,
        infoTagline,
        infoLead,
        infoSupportNote,
        infoInstagramEnabled,
        infoInstagramLabel,
        infoInstagramHandle,
        infoInstagramUrl,
        infoTelegramEnabled,
        infoTelegramLabel,
        infoTelegramHandle,
        infoTelegramUrl,
        infoFacebookEnabled,
        infoFacebookLabel,
        infoFacebookHandle,
        infoFacebookUrl,
        infoWhatsappEnabled,
        infoWhatsappLabel,
        infoWhatsappHandle,
        infoWhatsappUrl,
        infoEmailEnabled,
        infoEmailLabel,
        infoEmailHandle,
        infoEmailUrl
      };

      const response = await fetch('/api/settings/frontend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData?.success) {
        setSaveSuccess(true);
        mutate();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(resData?.message || 'Failed to update player lobby settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating player lobby frontend settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = !data && !error;

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
            <i className="fa-solid fa-gamepad" style={{ color: '#ffd700' }} />
            <span>PLAYER LOBBY &amp; <span className="gold-gradient-text">FRONTEND CMS</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Manage promotional hero carousels, transaction rules, brand assets, and official contact channels
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
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
              <span>SAVING CMS...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" />
              <span>SAVE FRONTEND CMS &rarr;</span>
            </>
          )}
        </button>
      </div>

      {/* 2. SUBTAB NAVIGATION SWITCHER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(6, 8, 18, 0.85)',
        padding: '0.4rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 215, 0, 0.15)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { key: 'banners', label: 'Hero Banners & Promos', icon: 'fa-rectangle-ad' },
          { key: 'rules', label: 'Game Rules & Limits', icon: 'fa-scale-balanced' },
          { key: 'apps', label: 'Mobile App Links', icon: 'fa-mobile-screen-button' },
          { key: 'branding', label: 'Branding & Audio', icon: 'fa-photo-film' },
          { key: 'info', label: 'Info Page & Socials', icon: 'fa-circle-info' },
        ].map((tab) => {
          const isActive = activeSubtab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubtab(tab.key)}
              style={{
                flex: '1 1 auto',
                minWidth: 'max-content',
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                border: isActive ? '1.5px solid rgba(255, 215, 0, 0.5)' : '1px solid transparent',
                background: isActive ? 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,145,0,0.08) 100%)' : 'transparent',
                color: isActive ? '#ffd700' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: isActive ? 900 : 600,
                fontSize: '0.82rem',
                fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 15px rgba(255,200,0,0.2)' : 'none'
              }}
            >
              <i className={`fa-solid ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
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
          <span>Player Lobby CMS settings saved and synchronized live!</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#ffd700', marginBottom: '1rem', display: 'block' }} />
          <p style={{ fontSize: '0.9rem' }}>Loading frontend CMS configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: HERO PROMO BANNERS */}
          {activeSubtab === 'banners' && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-rectangle-ad" style={{ color: '#ffd700' }} />
                    <span>Lobby Hero Promotional Carousel</span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Rotating hero cards showcased at the top of the player games lobby.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addAnnouncement}
                  style={{
                    background: 'rgba(255, 215, 0, 0.12)',
                    border: '1.5px solid rgba(255, 215, 0, 0.35)',
                    color: '#ffd700',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa-solid fa-plus" />
                  <span>Add New Banner</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.map((promo, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: 'rgba(255, 215, 0, 0.15)',
                          color: '#ffd700',
                          border: '1px solid rgba(255, 215, 0, 0.35)',
                          borderRadius: '8px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.72rem',
                          fontWeight: 900
                        }}>
                          Slide #{idx + 1}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>
                          {promo.title || 'Untitled Banner'}
                        </span>
                      </div>

                      {announcements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteAnnouncement(idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <i className="fa-solid fa-trash-can" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                          Badge Text
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <i className="fa-solid fa-tag" style={{ position: 'absolute', left: '12px', color: '#ffd700', fontSize: '0.85rem' }} />
                          <input
                            type="text"
                            value={promo.badge || ''}
                            onChange={(e) => updateAnnouncement(idx, 'badge', e.target.value)}
                            placeholder="e.g. PROMO ACTIVE"
                            style={{
                              width: '100%',
                              background: 'rgba(10, 14, 28, 0.95)',
                              border: '1.5px solid rgba(255, 215, 0, 0.22)',
                              borderRadius: '12px',
                              padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                              color: '#fff',
                              fontSize: '0.88rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                          Main Heading Title
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <i className="fa-solid fa-heading" style={{ position: 'absolute', left: '12px', color: '#ffd700', fontSize: '0.85rem' }} />
                          <input
                            type="text"
                            value={promo.title || ''}
                            onChange={(e) => updateAnnouncement(idx, 'title', e.target.value)}
                            placeholder="e.g. WELCOME TO WINNING HEAVEN"
                            style={{
                              width: '100%',
                              background: 'rgba(10, 14, 28, 0.95)',
                              border: '1.5px solid rgba(255, 215, 0, 0.22)',
                              borderRadius: '12px',
                              padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                              color: '#fff',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                          CTA Button Label
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <i className="fa-solid fa-hand-pointer" style={{ position: 'absolute', left: '12px', color: '#ffd700', fontSize: '0.85rem' }} />
                          <input
                            type="text"
                            value={promo.cta || ''}
                            onChange={(e) => updateAnnouncement(idx, 'cta', e.target.value)}
                            placeholder="e.g. DEPOSIT NOW"
                            style={{
                              width: '100%',
                              background: 'rgba(10, 14, 28, 0.95)',
                              border: '1.5px solid rgba(255, 215, 0, 0.22)',
                              borderRadius: '12px',
                              padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                              color: '#fff',
                              fontSize: '0.88rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                        Subtitle Description
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-align-left" style={{ position: 'absolute', left: '12px', color: '#ffd700', fontSize: '0.85rem' }} />
                        <input
                          type="text"
                          value={promo.subtitle || ''}
                          onChange={(e) => updateAnnouncement(idx, 'subtitle', e.target.value)}
                          placeholder="Banner description text..."
                          style={{
                            width: '100%',
                            background: 'rgba(10, 14, 28, 0.95)',
                            border: '1.5px solid rgba(255, 215, 0, 0.22)',
                            borderRadius: '12px',
                            padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                            color: '#fff',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 2: GAME RULES & LIMITS */}
          {activeSubtab === 'rules' && (
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
                  <i className="fa-solid fa-scale-balanced" style={{ color: '#ffd700' }} />
                  <span>Player Rewards &amp; Transaction Limits</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Set signup freeplay credits, minimum deposit/cashout amounts, and withdrawal proof policies.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    First Deposit Match Bonus (%)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#00e676', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={firstDepositBonus}
                      onChange={(e) => setFirstDepositBonus(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(0, 230, 118, 0.3)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Signup Freeplay Bonus ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-dollar-sign" style={{ position: 'absolute', left: '14px', color: '#00f0ff', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={signupFreeplay}
                      onChange={(e) => setSignupFreeplay(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Minimum Allowed Deposit ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-arrow-down" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={minimumDepositLimit}
                      onChange={(e) => setMinimumDepositLimit(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(255, 215, 0, 0.22)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Minimum Allowed Withdrawal ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-arrow-up" style={{ position: 'absolute', left: '14px', color: '#ff7700', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={minimumWithdrawalLimit}
                      onChange={(e) => setMinimumWithdrawalLimit(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(255, 215, 0, 0.22)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Security Rules */}
              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={withdrawRequireGameScreenshot}
                    onChange={(e) => setWithdrawRequireGameScreenshot(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#ffd700', cursor: 'pointer' }}
                  />
                  <span>Require Game In-App Screenshot on Withdrawal</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={withdrawRequireTagQrScreenshot}
                    onChange={(e) => setWithdrawRequireTagQrScreenshot(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#ffd700', cursor: 'pointer' }}
                  />
                  <span>Require Payment Tag / QR Screenshot on Withdrawal</span>
                </label>
              </div>

              {/* Notices */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Withdrawal Speed Notice Banner
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-bolt" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                    <input
                      type="text"
                      value={withdrawNotice}
                      onChange={(e) => setWithdrawNotice(e.target.value)}
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
                    Cashout Hours &amp; Processing Notice
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-clock" style={{ position: 'absolute', left: '14px', color: '#a855f7', fontSize: '0.88rem' }} />
                    <input
                      type="text"
                      value={cashoutNotice}
                      onChange={(e) => setCashoutNotice(e.target.value)}
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
              </div>

              {/* Freeplay Cashout & Deposit Unlock Settings */}
              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Max Cashout Allowed from Freeplay ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-gift" style={{ position: 'absolute', left: '14px', color: '#00f0ff', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={freeplayMaxCashout}
                      onChange={(e) => setFreeplayMaxCashout(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 14, 28, 0.9)',
                        border: '1.5px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Maximum win withdrawal amount on $3 Freeplay (Default: $50.00)
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#ffc800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Deposit Required to Unlock Hold Balance ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-lock-open" style={{ position: 'absolute', left: '14px', color: '#ffc800', fontSize: '0.88rem' }} />
                    <input
                      type="number"
                      value={freeplayUnlockDeposit}
                      onChange={(e) => setFreeplayUnlockDeposit(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 14, 28, 0.9)',
                        border: '1.5px solid rgba(255, 200, 0, 0.3)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Deposit amount required to unlock excess Freeplay Hold (Default: $25.00)
                  </span>
                </div>
              </div>

              {/* Deposit vs. Cashout Tiers Manager */}
              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1.5px solid rgba(255, 215, 0, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-scale-balanced" style={{ color: '#ffd700' }} />
                      <span>Deposit vs. Cashout Tiers Table (Displayed in Lobby Rules)</span>
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Define how much players can withdraw based on their deposit tier.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addCashoutTier}
                    style={{
                      background: 'rgba(255, 215, 0, 0.12)',
                      border: '1px solid rgba(255, 215, 0, 0.4)',
                      color: '#ffd700',
                      borderRadius: '8px',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <i className="fa-solid fa-plus" /> Add Cashout Tier
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cashoutTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(12, 16, 32, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 40px',
                        gap: '0.65rem',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Deposit Range
                        </label>
                        <input
                          type="text"
                          value={tier.depositRange || ''}
                          onChange={(e) => updateCashoutTier(idx, 'depositRange', e.target.value)}
                          placeholder="$5 - $50"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Min Multiplier
                        </label>
                        <input
                          type="text"
                          value={tier.multiplier || ''}
                          onChange={(e) => updateCashoutTier(idx, 'multiplier', e.target.value)}
                          placeholder="3x Deposit"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: 'var(--gold-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Min Cashout Example
                        </label>
                        <input
                          type="text"
                          value={tier.minCashoutExample || ''}
                          onChange={(e) => updateCashoutTier(idx, 'minCashoutExample', e.target.value)}
                          placeholder="Min $15.00 – $150.00"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: '#00e676',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Speed Note / Tag
                        </label>
                        <input
                          type="text"
                          value={tier.note || ''}
                          onChange={(e) => updateCashoutTier(idx, 'note', e.target.value)}
                          placeholder="Instant Payout"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => deleteCashoutTier(idx)}
                          disabled={cashoutTiers.length <= 1}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Cashout Rules (Bullet Points) */}
              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1.5px solid rgba(255, 215, 0, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-list-check" style={{ color: '#ffd700' }} />
                      <span>Custom Platform Terms &amp; Fair Play Rules</span>
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Additional bullet points displayed in the Player Lobby Rules Accordion.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addCustomRule}
                    style={{
                      background: 'rgba(255, 215, 0, 0.12)',
                      border: '1px solid rgba(255, 215, 0, 0.4)',
                      color: '#ffd700',
                      borderRadius: '8px',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <i className="fa-solid fa-plus" /> Add Rule Bullet
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customCashoutRules.map((rule, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(12, 16, 32, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={rule.title || ''}
                          onChange={(e) => updateCustomRule(idx, 'title', e.target.value)}
                          placeholder="Rule Title (e.g. Freeplay Limit)"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: 'var(--gold-primary)',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            outline: 'none'
                          }}
                        />
                        <textarea
                          rows={2}
                          value={rule.description || ''}
                          onChange={(e) => updateCustomRule(idx, 'description', e.target.value)}
                          placeholder="Detailed explanation of the rule..."
                          style={{
                            width: '100%',
                            background: 'rgba(6, 8, 18, 0.8)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteCustomRule(idx)}
                        disabled={customCashoutRules.length <= 1}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          marginTop: '4px'
                        }}
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: MOBILE APPS & DOWNLOADS */}
          {activeSubtab === 'apps' && (
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
                  <i className="fa-solid fa-mobile-screen-button" style={{ color: '#ffd700' }} />
                  <span>Mobile Application Links &amp; PWA Configuration</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Configure direct Android APK downloads, iOS TestFlight links, and top navigation &quot;Get App&quot; prompts.
                </span>
              </div>

              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <input
                  type="checkbox"
                  id="get-app-toggle"
                  checked={getAppEnabled}
                  onChange={(e) => setGetAppEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#ffd700', cursor: 'pointer' }}
                />
                <label htmlFor="get-app-toggle" style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  Show &quot;Get App&quot; download button in Player Lobby top navigation bar
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Android APK Download URL
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-brands fa-android" style={{ position: 'absolute', left: '14px', color: '#00e676', fontSize: '0.88rem' }} />
                    <input
                      type="text"
                      value={androidAppUrl}
                      onChange={(e) => setAndroidAppUrl(e.target.value)}
                      placeholder="/downloads/winning-heaven.apk"
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(0, 230, 118, 0.25)',
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
                    iOS Install / TestFlight URL
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-brands fa-apple" style={{ position: 'absolute', left: '14px', color: '#00f0ff', fontSize: '0.88rem' }} />
                    <input
                      type="text"
                      value={iosAppUrl}
                      onChange={(e) => setIosAppUrl(e.target.value)}
                      placeholder="https://testflight.apple.com/join/XXXXXXXX"
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(0, 240, 255, 0.25)',
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
              </div>
            </section>
          )}

          {/* TAB 4: BRANDING LOGOS & SOUND */}
          {activeSubtab === 'branding' && (
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
                  <i className="fa-solid fa-photo-film" style={{ color: '#ffd700' }} />
                  <span>Site Branding Assets &amp; Audio Effects</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Upload high-resolution logos, customized auth portal background artwork, and chime sounds.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                
                {/* Logo Card */}
                <div style={{
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 215, 0, 0.22)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Header Brand Logo
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img
                      src={logoUrl || DEFAULT_LOGO}
                      onError={(e) => { e.currentTarget.src = DEFAULT_LOGO; }}
                      alt="Logo Preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        background: '#04050b',
                        borderRadius: '12px',
                        padding: '6px',
                        border: '1.5px solid rgba(255,215,0,0.3)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                      }}
                    />
                    <label style={{
                      background: 'rgba(255,215,0,0.12)',
                      border: '1.5px solid rgba(255,215,0,0.35)',
                      color: '#ffd700',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <i className="fa-solid fa-upload" />
                      <span>Upload Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Login Background */}
                <div style={{
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 215, 0, 0.22)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Auth Screen Background
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img
                      src={loginBgUrl || DEFAULT_LOGIN_BG}
                      onError={(e) => { e.currentTarget.src = DEFAULT_LOGIN_BG; }}
                      alt="BG Preview"
                      style={{
                        width: '90px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(255,215,0,0.3)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                      }}
                    />
                    <label style={{
                      background: 'rgba(255,215,0,0.12)',
                      border: '1.5px solid rgba(255,215,0,0.35)',
                      color: '#ffd700',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <i className="fa-solid fa-upload" />
                      <span>Change Artwork</span>
                      <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Audio Sound File */}
                <div style={{
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 215, 0, 0.22)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notification Sound (.mp3)
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{
                      background: 'rgba(255,215,0,0.12)',
                      border: '1.5px solid rgba(255,215,0,0.35)',
                      color: '#ffd700',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <i className="fa-solid fa-music" />
                      <span>Upload MP3</span>
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
                    </label>

                    {notificationSoundUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const snd = new Audio(notificationSoundUrl);
                            snd.play();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={{
                          background: 'rgba(0, 230, 118, 0.15)',
                          border: '1.5px solid rgba(0, 230, 118, 0.35)',
                          color: '#00e676',
                          padding: '0.65rem 1rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <i className="fa-solid fa-volume-high" />
                        <span>Play Chime</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* TAB 5: INFO PAGE & SOCIALS */}
          {activeSubtab === 'info' && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: '#ffd700' }} />
                    <span>Official Info Page &amp; Social Support Channels (/info)</span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Player directory for official WhatsApp, Telegram, Instagram, and Customer Support channels.
                  </span>
                </div>

                <a
                  href="/info"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(255, 215, 0, 0.12)',
                    border: '1.5px solid rgba(255, 215, 0, 0.35)',
                    color: '#ffd700',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>Preview /info Page</span>
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                </a>
              </div>

              {/* Toggles */}
              <div style={{
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={infoPageEnabled} onChange={(e) => setInfoPageEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ffd700' }} />
                  <span>Enable Info Page System</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={infoShowOnAuth} onChange={(e) => setInfoShowOnAuth(e.target.checked)} disabled={!infoPageEnabled} style={{ width: '18px', height: '18px', accentColor: '#ffd700' }} />
                  <span>Show Info on Login Screen</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={infoShowOnLobby} onChange={(e) => setInfoShowOnLobby(e.target.checked)} disabled={!infoPageEnabled} style={{ width: '18px', height: '18px', accentColor: '#ffd700' }} />
                  <span>Show Info in Lobby Navbar</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Info Tagline Headline
                  </label>
                  <input
                    type="text"
                    value={infoTagline}
                    onChange={(e) => setInfoTagline(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Intro Lead Description
                  </label>
                  <input
                    type="text"
                    value={infoLead}
                    onChange={(e) => setInfoLead(e.target.value)}
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
                  />
                </div>
              </div>

              {/* Social Channels Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {[
                  { title: 'Instagram', enabled: infoInstagramEnabled, setEnabled: setInfoInstagramEnabled, handle: infoInstagramHandle, setHandle: setInfoInstagramHandle, url: infoInstagramUrl, setUrl: setInfoInstagramUrl, icon: 'fa-brands fa-instagram', color: '#e1306c' },
                  { title: 'Telegram', enabled: infoTelegramEnabled, setEnabled: setInfoTelegramEnabled, handle: infoTelegramHandle, setHandle: setInfoTelegramHandle, url: infoTelegramUrl, setUrl: setInfoTelegramUrl, icon: 'fa-brands fa-telegram', color: '#0088cc' },
                  { title: 'Facebook', enabled: infoFacebookEnabled, setEnabled: setInfoFacebookEnabled, handle: infoFacebookHandle, setHandle: setInfoFacebookHandle, url: infoFacebookUrl, setUrl: setInfoFacebookUrl, icon: 'fa-brands fa-facebook', color: '#1877f2' },
                  { title: 'WhatsApp', enabled: infoWhatsappEnabled, setEnabled: setInfoWhatsappEnabled, handle: infoWhatsappHandle, setHandle: setInfoWhatsappHandle, url: infoWhatsappUrl, setUrl: setInfoWhatsappUrl, icon: 'fa-brands fa-whatsapp', color: '#25d366' },
                  { title: 'Email Support', enabled: infoEmailEnabled, setEnabled: setInfoEmailEnabled, handle: infoEmailHandle, setHandle: setInfoEmailHandle, url: infoEmailUrl, setUrl: setInfoEmailUrl, icon: 'fa-solid fa-envelope', color: '#f59e0b' }
                ].map((channel) => (
                  <div
                    key={channel.title}
                    style={{
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: `1.5px solid ${channel.enabled ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className={channel.icon} style={{ color: channel.color, fontSize: '1.1rem' }} />
                        <span>{channel.title}</span>
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: channel.enabled ? '#00e676' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={channel.enabled}
                          onChange={(e) => channel.setEnabled(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#ffd700' }}
                        />
                        <span>{channel.enabled ? 'ACTIVE' : 'OFF'}</span>
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Handle / Label Display Text
                      </label>
                      <input
                        type="text"
                        value={channel.handle}
                        onChange={(e) => channel.setHandle(e.target.value)}
                        placeholder="e.g. @winningheaven_casino"
                        style={{
                          width: '100%',
                          background: 'rgba(10, 14, 28, 0.95)',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Redirect URL Link
                      </label>
                      <input
                        type="text"
                        value={channel.url}
                        onChange={(e) => channel.setUrl(e.target.value)}
                        placeholder="https://..."
                        style={{
                          width: '100%',
                          background: 'rgba(10, 14, 28, 0.95)',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                          color: '#00f0ff',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </form>
      )}

    </div>
  );
}
