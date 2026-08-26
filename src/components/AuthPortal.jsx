'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { shouldShowInfoOnAuth } from '../lib/infoPage';
import { trackCompleteRegistration } from '../lib/metaPixel';
import { safeFetchJson, cleanErrorMessage, isNativePlatform } from '../lib/safeFetch';
import { getDeviceFingerprint } from '../lib/deviceId';
import PlayerFooter from './player/PlayerFooter';

const DEFAULT_LOGIN_BG = '/casino_vip_hero.jpg';
const DEFAULT_GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1007065363081-r4bv8hn10586g1v6n2as7j9eh10rtgnc.apps.googleusercontent.com';

async function loginWithGoogleProfile(accessToken) {
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const profile = await profileRes.json().catch(() => ({}));
  if (!profile.email) {
    throw new Error('Failed to fetch email profile from Google.');
  }

  const deviceId = await getDeviceFingerprint().catch(() => '');

  const googleRes = await safeFetchJson('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      email: String(profile.email).toLowerCase(),
      name: profile.name || 'Google Player',
      referredBy: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_ref_code') || '' : '',
      distributorId: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_distributor_id') || '' : '',
      agentCode: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_agent_code') || '' : '',
      campaign: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_campaign') || '' : '',
      deviceId
    })
  });

  if (!googleRes.ok || !googleRes.data?.success) {
    throw new Error(googleRes.data?.message || 'Google registration/login failed on server.');
  }
  return googleRes.data;
}

function getDepositBonusSubtitle(percent) {
  const num = Number(percent);
  if (num === 300) return 'Triple your coins on your 1st reload';
  if (num === 200) return 'Get +200% bonus coins on 1st reload';
  if (num === 100) return 'Double your coins on your 1st reload';
  if (num > 0) return `Get +${num}% bonus coins on 1st reload`;
  return 'Instant bonus on your 1st reload';
}

export default function AuthPortal({
  onLoginSuccess,
  onRegisterSuccess,
  onGoogleWarning,
  triggerLoading,
  showToast,
  onOpenSupport,
  supportUnread = false,
  frontendSettings: initialSettings = {}
}) {
  // Dynamically fetch live CMS frontend settings from admin panel
  const { data: settingsData } = useSWR('/api/settings/frontend', (url) => fetch(url).then(r => r.json()), {
    fallbackData: initialSettings?.firstDepositBonus ? { success: true, settings: initialSettings } : undefined,
    revalidateOnFocus: false
  });

  const settings = settingsData?.settings || initialSettings || {};
  const loginBg = (settings.loginBgUrl && settings.loginBgUrl.trim() !== '' && !settings.loginBgUrl.includes('/brand/')) 
    ? settings.loginBgUrl 
    : DEFAULT_LOGIN_BG;
  const freeplayAmount = settings.signupFreeplay !== undefined 
    ? settings.signupFreeplay 
    : (settings.lobbyFreeplayValue ? String(settings.lobbyFreeplayValue).replace(/[^0-9.]/g, '') : '3');
  const depositBonusPercent = settings.firstDepositBonus !== undefined ? Number(settings.firstDepositBonus) : 200;
  const minDeposit = settings.minimumDepositLimit !== undefined ? settings.minimumDepositLimit : 5;
  const minWithdraw = settings.minimumWithdrawalLimit !== undefined ? settings.minimumWithdrawalLimit : 5;
  const landingWelcome = settings.landingWelcome || 'PLAY CELESTIAL VEGAS SWEEPS';
  const landingGrab = settings.landingGrab || 'Instant deposit bonuses, certified RNG games & lightning cashouts.';

  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Fields (No Phone Required)
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRefCode, setRegRefCode] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  const googlePollRef = useRef(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (googlePollRef.current) {
        clearInterval(googlePollRef.current);
        googlePollRef.current = null;
      }
    };
  }, []);

  // Check URL query parameters for referral code or google ticket pre-fill
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref') || params.get('referral');
      if (refParam) {
        setRegRefCode(refParam);
        localStorage.setItem('winning_heaven_ref_code', refParam);
        setTab('register');
      } else {
        const cached = localStorage.getItem('winning_heaven_ref_code');
        if (cached) setRegRefCode(cached);
      }

      // Check if arriving from Google OAuth callback deep-link
      const googleTicket = params.get('google_ticket');
      if (googleTicket) {
        window.history.replaceState({}, '', '/login');
        triggerLoading(1200, async () => {
          try {
            const ticketRes = await safeFetchJson(`/api/auth/google/ticket?ticket=${encodeURIComponent(googleTicket)}`);
            if (ticketRes.ok && ticketRes.data?.user) {
              finishGoogleLogin(ticketRes.data);
            }
          } catch (err) {
            console.error('Ticket redeem failed:', err);
          }
        });
      }
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (regStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, otpTimer]);

  const finishGoogleLogin = (googleData) => {
    setGoogleLoading(false);
    if (googleData.isNewUser) {
      trackCompleteRegistration('google');
      showToast(`Google account registered! Welcome, ${googleData.user?.name || 'Player'}.`, 'success');
    } else {
      showToast(`Welcome back, ${googleData.user?.name || 'Player'}!`, 'success');
    }
    onLoginSuccess(googleData.user);
  };

  /**
   * System browser / Native OAuth flow for Capacitor APK and In-App WebViews.
   */
  const startGoogleBrowserFlow = async () => {
    try {
      setGoogleLoading(true);
      showToast('Opening secure Google sign-in…', 'info', 4000);

      const res = await safeFetchJson('/api/auth/google/ticket', {
        method: 'POST',
        body: JSON.stringify({ mode: 'session' })
      });

      if (!res.ok || !res.data?.sid) {
        throw new Error(res.data?.message || 'Could not start Google session.');
      }

      const sid = res.data.sid;
      const rawOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://winningheaven.com';
      // Use live production domain for native apps and webviews
      const origin = (!rawOrigin || rawOrigin.includes('capacitor://') || (rawOrigin.includes('localhost') && !rawOrigin.includes(':3000')))
        ? 'https://winningheaven.com'
        : rawOrigin;
      const redirectUri = `${origin}/auth/google/callback`;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        DEFAULT_GOOGLE_CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=email%20profile&state=${encodeURIComponent(sid)}&prompt=select_account`;

      // Open in external browser or Capacitor Browser plugin
      let opened = false;
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: oauthUrl, presentationStyle: 'popover' });
        opened = true;
      } catch {
        opened = false;
      }

      if (!opened && typeof window !== 'undefined') {
        const win = window.open(oauthUrl, '_blank');
        if (!win) {
          window.location.href = oauthUrl;
        }
      }

      // Start ticket status polling
      if (googlePollRef.current) clearInterval(googlePollRef.current);
      googlePollRef.current = setInterval(async () => {
        try {
          const checkRes = await safeFetchJson(`/api/auth/google/ticket?sid=${encodeURIComponent(sid)}`);
          if (checkRes.ok && checkRes.data?.status === 'ready' && checkRes.data?.user) {
            clearInterval(googlePollRef.current);
            googlePollRef.current = null;
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            } catch {}
            finishGoogleLogin(checkRes.data);
          }
        } catch {
          /* ignore polling hiccups */
        }
      }, 1500);

      // Auto cancel polling after 3 minutes
      setTimeout(() => {
        if (googlePollRef.current) {
          clearInterval(googlePollRef.current);
          googlePollRef.current = null;
          setGoogleLoading(false);
        }
      }, 180000);
    } catch (err) {
      console.error('Google flow error:', err);
      showToast(cleanErrorMessage(err, 'Failed to start Google sign-in.'), 'error');
      setGoogleLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      triggerLoading(1500, async () => {
        try {
          setAuthError('');
          const googleData = await loginWithGoogleProfile(tokenResponse.access_token);
          finishGoogleLogin(googleData);
        } catch (err) {
          console.error('Google Login Error:', err);
          const errMsg = cleanErrorMessage(err, 'Google Sign-In failed.');
          setAuthError(errMsg);
          showToast(errMsg, 'error');
        }
      });
    },
    onError: (error) => {
      console.error('Google Login Popup Error:', error);
      // Seamlessly fall back to browser redirect flow
      startGoogleBrowserFlow();
    }
  });

  const handleGoogleClick = () => {
    setAuthError('');
    if (isNativePlatform()) {
      startGoogleBrowserFlow();
    } else {
      try {
        loginWithGoogle();
      } catch (err) {
        startGoogleBrowserFlow();
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!loginIdentifier.trim() || !loginPassword) {
      showToast('Please enter your email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginIdentifier.toLowerCase().trim(), password: loginPassword })
      });

      if (!res.ok || !res.data?.success) {
        const errMsg = cleanErrorMessage(res.data?.message, 'Invalid email or password.');
        setAuthError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      showToast(`Welcome back, ${res.data.user?.name || 'Player'}!`, 'success');
      onLoginSuccess(res.data.user);
    } catch (err) {
      const errMsg = cleanErrorMessage(err, 'Login failed. Please check your credentials.');
      setAuthError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSendingOtp(true);
    try {
      const deviceId = await getDeviceFingerprint().catch(() => '');
      const res = await safeFetchJson('/api/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          name: regName.trim(),
          purpose: 'register',
          deviceId
        })
      });

      if (!res.ok || !res.data?.success) {
        const errMsg = cleanErrorMessage(res.data?.message, 'Failed to send verification code.');
        setAuthError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      setRegStep('otp');
      setOtpTimer(60);
      showToast('Verification code sent to your email inbox!', 'success');
    } catch (err) {
      const errMsg = cleanErrorMessage(err, 'Failed to send verification email.');
      setAuthError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (otpTimer > 0 || sendingOtp) return;
    setSendingOtp(true);
    setAuthError('');
    try {
      const deviceId = await getDeviceFingerprint().catch(() => '');
      const res = await safeFetchJson('/api/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          name: regName.trim(),
          purpose: 'register',
          deviceId
        })
      });

      if (!res.ok || !res.data?.success) {
        const errMsg = cleanErrorMessage(res.data?.message, 'Failed to resend verification code.');
        setAuthError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      setOtpTimer(60);
      showToast('New verification code sent to your inbox!', 'success');
    } catch (err) {
      const errMsg = cleanErrorMessage(err, 'Resend failed. Please try again.');
      setAuthError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Register Account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regOtp.trim() || regOtp.trim().length !== 6) {
      showToast('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getDeviceFingerprint().catch(() => '');
      const res = await safeFetchJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.toLowerCase().trim(),
          password: regPassword,
          otp: regOtp.trim(),
          referredBy: regRefCode.trim(),
          distributorId: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_distributor_id') || '' : '',
          agentCode: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_agent_code') || '' : '',
          campaign: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_campaign') || '' : '',
          deviceId
        })
      });

      if (!res.ok || !res.data?.success) {
        const errMsg = cleanErrorMessage(res.data?.message, 'Registration failed.');
        setAuthError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      trackCompleteRegistration('email');
      showToast(`Welcome to Winning Heaven, ${res.data.user?.name || 'Player'}!`, 'success');
      onRegisterSuccess(res.data.user);
    } catch (err) {
      const errMsg = cleanErrorMessage(err, 'Registration failed.');
      setAuthError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your account email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await safeFetchJson('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() })
      });

      if (res.ok && res.data?.success !== false) {
        showToast('Password reset instructions sent to your email!', 'success');
        setTab('login');
      } else {
        showToast(cleanErrorMessage(res.data?.message, 'Password reset request failed.'), 'error');
      }
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Password reset request failed.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '2.5rem 1.25rem 0',
      backgroundImage: `linear-gradient(135deg, rgba(4, 6, 14, 0.45) 0%, rgba(4, 6, 14, 0.75) 100%), radial-gradient(circle at center, rgba(255, 200, 0, 0.1) 0%, rgba(4, 6, 14, 0.6) 80%), url("${loginBg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      <style>{`
        .auth-portal-grid {
          width: 100%;
          max-width: 1240px;
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2.5rem;
          z-index: 2;
          position: relative;
        }
        .auth-portal-desktop-left {
          flex: 1 1 440px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: #fff;
          padding: 1rem 0;
        }
        .auth-portal-card {
          flex: 1 1 420px;
          max-width: 460px;
          width: 100%;
          background: rgba(8, 11, 24, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1.5px solid rgba(255, 215, 0, 0.35);
          border-radius: 28px;
          padding: 2rem 1.85rem;
          box-shadow: 0 30px 80px rgba(0,0,0,0.95), 0 0 45px rgba(255,200,0,0.18);
          position: relative;
          margin: 0 auto;
        }
        .auth-portal-mobile-top {
          display: none;
        }
        .auth-portal-mobile-bottom {
          display: none;
        }

        @media (max-width: 960px) {
          .auth-portal-grid {
            flex-direction: column;
            gap: 1.25rem;
            min-height: auto;
            padding: 0.5rem 0 1.5rem 0;
            max-width: 480px;
            margin: 0 auto;
          }
          .auth-portal-desktop-left {
            display: none !important;
          }
          .auth-portal-mobile-top {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.85rem;
            width: 100%;
          }
          .auth-portal-card {
            padding: 1.6rem 1.2rem;
            border-radius: 22px;
            max-width: 100%;
            margin: 0;
          }
          .auth-portal-mobile-bottom {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            width: 100%;
            gap: 1rem;
            margin-top: 0.5rem;
          }
        }
      `}</style>

      {/* Ambient Lighting Orbs */}
      <div style={{
        position: 'fixed',
        top: '-15%',
        left: '20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,200,0,0.15) 0%, rgba(0,240,255,0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Content Wrapper */}
      <div className="auth-portal-grid">

        {/* MOBILE TOP SECTION: Appears at top on mobile */}
        <div className="auth-portal-mobile-top">
          {/* Top VIP Lounge Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(6, 9, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '999px',
            padding: '0.35rem 0.95rem',
            boxShadow: '0 0 20px rgba(255,200,0,0.35)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
              HIGH LIMIT VIP CASINO
            </span>
          </div>

          <h1 style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            lineHeight: 1.2,
            margin: '0.1rem 0 0.3rem 0',
            color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,0.95)'
          }}>
            PLAY CELESTIAL <span className="gold-gradient-text">VEGAS SWEEPS</span>
          </h1>

          {/* Compact Perks Badges Row on Mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.45rem',
            width: '100%'
          }}>
            <div style={{
              background: 'rgba(6, 9, 22, 0.85)',
              border: '1px solid rgba(0, 230, 118, 0.45)',
              borderRadius: '12px',
              padding: '0.55rem 0.4rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.15rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}>
              <i className="fa-solid fa-gift" style={{ color: '#00e676', fontSize: '0.95rem' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>${freeplayAmount} Freeplay</div>
              <div style={{ fontSize: '0.62rem', color: '#00e676', fontWeight: 700 }}>No Deposit</div>
            </div>

            <div style={{
              background: 'rgba(6, 9, 22, 0.85)',
              border: '1px solid rgba(255, 200, 0, 0.45)',
              borderRadius: '12px',
              padding: '0.55rem 0.4rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.15rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}>
              <i className="fa-solid fa-coins" style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--gold-primary)', lineHeight: 1.1 }}>+{depositBonusPercent}% Match</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>1st Reload</div>
            </div>

            <div style={{
              background: 'rgba(6, 9, 22, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.45)',
              borderRadius: '12px',
              padding: '0.55rem 0.4rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.15rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}>
              <i className="fa-solid fa-bolt" style={{ color: '#38bdf8', fontSize: '0.95rem' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1.1 }}>5-Min Cashout</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>Min ${minWithdraw}</div>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Floating VIP Casino Perks & Live Jackpot Showcase (Desktop Only) */}
        <div className="auth-portal-desktop-left">
          {/* Top VIP Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(6, 9, 22, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '999px',
            padding: '0.4rem 1.1rem',
            width: 'fit-content',
            boxShadow: '0 0 25px rgba(255,200,0,0.35)'
          }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 10px #00e676' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
              HIGH LIMIT VIP CASINO LOUNGE
            </span>
          </div>

          {/* Main Hero Headline */}
          <div>
            <h1 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              fontWeight: 900,
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.15,
              margin: '0 0 0.75rem 0',
              textShadow: '0 4px 20px rgba(0,0,0,0.95)'
            }}>
              PLAY CELESTIAL <br />
              <span className="gold-gradient-text">VEGAS SWEEPS</span> &amp; SLOTS
            </h1>
            <p style={{
              fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
              color: '#e2e8f0',
              margin: 0,
              maxWidth: '480px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.9)'
            }}>
              {landingGrab}
            </p>
          </div>

          {/* Floating Perks Banners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '440px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(6, 9, 22, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 230, 118, 0.4)',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(0, 230, 118, 0.15)',
                color: '#00e676',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                <i className="fa-solid fa-gift" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>${freeplayAmount} Freeplay Bonus</div>
                <div style={{ fontSize: '0.74rem', color: '#00e676', fontWeight: 700 }}>Claim on signup • No deposit required</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(6, 9, 22, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 200, 0, 0.4)',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 200, 0, 0.15)',
                color: 'var(--gold-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                <i className="fa-solid fa-coins" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--gold-primary)' }}>+{depositBonusPercent}% First Deposit Match</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{getDepositBonusSubtitle(depositBonusPercent)}</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(6, 9, 22, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--cyan-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                <i className="fa-solid fa-bolt" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38bdf8' }}>5-Minute Lightning Cashouts</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Min ${minWithdraw} payout direct to CashApp &amp; Crypto</div>
              </div>
            </div>
          </div>

          {/* Live Progressive Mega Jackpot Banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(255, 200, 0, 0.18) 0%, rgba(255, 153, 0, 0.08) 100%)',
            border: '1.5px solid rgba(255, 200, 0, 0.45)',
            borderRadius: '18px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '440px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 25px rgba(255,200,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                color: '#00e676',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 0 20px rgba(255,200,0,0.6)'
              }}>
                <i className="fa-solid fa-trophy" style={{ color: '#000' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.08em' }}>
                  PROGRESSIVE MEGA JACKPOT
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  $184,950.40
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(0, 230, 118, 0.2)',
              border: '1px solid rgba(0, 230, 118, 0.5)',
              color: '#00e676',
              fontSize: '0.75rem',
              fontWeight: 900,
              padding: '0.35rem 0.75rem',
              borderRadius: '20px'
            }}>
              🔥 HOT
            </div>
          </div>
        </div>

        {/* AUTH CONSOLE CARD (Immediately in view below top perks on mobile, Right column on desktop) */}
        <div className="auth-portal-card">
          {/* Brand Header Logo */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              border: '2.5px solid var(--gold-primary)',
              background: '#000',
              boxShadow: '0 0 35px rgba(255,200,0,0.5)',
              overflow: 'hidden',
              marginBottom: '0.65rem'
            }}>
              <img src="/winning_heaven_logo.png" alt="Winning Heaven" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-heading)',
              color: '#fff',
              letterSpacing: '0.04em',
              margin: 0
            }}>
              WINNING<span className="gold-gradient-text">HEAVEN</span>
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '0.2rem' }}>
              PREMIER CASINO &amp; GAMING LOUNGE
            </div>
          </div>

          {/* Auth Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(4, 6, 14, 0.9)',
            borderRadius: '14px',
            padding: '0.3rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => { setTab('login'); setAuthError(''); }}
              style={{
                flex: 1,
                background: tab === 'login' ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'transparent',
                color: tab === 'login' ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setTab('register'); setAuthError(''); }}
              style={{
                flex: 1,
                background: tab === 'register' ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'transparent',
                color: tab === 'register' ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              REGISTER
            </button>
          </div>

          {/* Prominent Error Banner matching Screenshot style */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid rgba(239, 68, 68, 0.55)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.2)'
                }}
              >
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.1rem', marginTop: '0.15rem', color: '#ef4444' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Please fix the errors below:
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', marginTop: '0.15rem', lineHeight: 1.3 }}>
                    {authError}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError('')}
                  style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '0 0.25rem', fontSize: '0.9rem' }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Forms */}
          <AnimatePresence mode="wait">
            {tab === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    EMAIL OR USERNAME
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter email or username"
                    style={{
                      width: '100%',
                      background: 'rgba(4, 6, 14, 0.85)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>PASSWORD</label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{
                        width: '100%',
                        background: 'rgba(4, 6, 14, 0.85)',
                        border: '1px solid var(--border-muted)',
                        borderRadius: '12px',
                        padding: '0.75rem 2.6rem 0.75rem 1rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold-glow"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 900 }}
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-right-to-bracket" />} SIGN IN TO CASINO
                </button>

                {/* Google Social Auth */}
                <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>OR SIGN IN WITH</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                </div>

                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={handleGoogleClick}
                  className="btn-glass-secondary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1, fontWeight: 700 }}
                >
                  {googleLoading ? (
                    <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--gold-primary)' }} />
                  ) : (
                    <i className="fa-brands fa-google" style={{ color: '#ea4335' }} />
                  )}
                  <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>
              </motion.form>
            )}

            {tab === 'register' && (
              <AnimatePresence mode="wait">
                {regStep === 'details' ? (
                  <motion.form
                    key="register-details-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleRequestOtp}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
                  >
                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>FULL NAME</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Enter full name"
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(4, 6, 14, 0.85)',
                          border: '1px solid var(--border-muted)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          color: '#fff',
                          fontSize: '0.88rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>EMAIL ADDRESS</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Enter email address"
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(4, 6, 14, 0.85)',
                          border: '1px solid var(--border-muted)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          color: '#fff',
                          fontSize: '0.88rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>PASSWORD</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Create password (min 6 chars)"
                          required
                          style={{
                            width: '100%',
                            background: 'rgba(4, 6, 14, 0.85)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: '12px',
                            padding: '0.75rem 2.5rem 0.75rem 1rem',
                            color: '#fff',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--gold-primary)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>REFERRAL CODE (OPTIONAL)</label>
                      <input
                        type="text"
                        value={regRefCode}
                        onChange={(e) => setRegRefCode(e.target.value)}
                        placeholder="Enter referral code"
                        style={{
                          width: '100%',
                          background: 'rgba(4, 6, 14, 0.85)',
                          border: '1px solid var(--gold-primary)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          color: 'var(--gold-primary)',
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingOtp}
                      className="btn-gold-glow"
                      style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 900 }}
                    >
                      {sendingOtp ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} GET EMAIL VERIFICATION CODE &rarr;
                    </button>

                    {/* Google Social Auth */}
                    <div style={{ margin: '0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>OR REGISTER WITH</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                    </div>

                    <button
                      type="button"
                      disabled={sendingOtp || googleLoading}
                      onClick={handleGoogleClick}
                      className="btn-glass-secondary"
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1, fontWeight: 700 }}
                    >
                      {googleLoading ? (
                        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--gold-primary)' }} />
                      ) : (
                        <i className="fa-brands fa-google" style={{ color: '#ea4335' }} />
                      )}
                      <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register-otp-form"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    onSubmit={handleVerifyAndRegister}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                  >
                    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'rgba(255, 200, 0, 0.1)',
                        border: '1.5px solid var(--gold-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto',
                        boxShadow: '0 0 20px rgba(255, 200, 0, 0.25)'
                      }}>
                        <i className="fa-solid fa-envelope-open-text" style={{ fontSize: '1.4rem', color: 'var(--gold-primary)' }} />
                      </div>
                      <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.35rem 0', fontFamily: 'var(--font-heading)' }}>
                        Verify Email Address
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        We sent a 6-digit security code to:
                      </p>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(255, 200, 0, 0.12)',
                        border: '1px solid rgba(255, 200, 0, 0.3)',
                        color: 'var(--gold-primary)',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        marginTop: '0.4rem'
                      }}>
                        {regEmail}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>
                        ENTER 6-DIGIT VERIFICATION CODE
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="------"
                        autoFocus
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(4, 6, 14, 0.95)',
                          border: '2px solid var(--gold-primary)',
                          borderRadius: '14px',
                          padding: '0.85rem 1rem',
                          color: 'var(--gold-primary)',
                          fontSize: '1.6rem',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          letterSpacing: '10px',
                          textAlign: 'center',
                          outline: 'none',
                          boxShadow: '0 0 25px rgba(255, 200, 0, 0.18)'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || regOtp.length !== 6}
                      className="btn-gold-glow"
                      style={{ width: '100%', padding: '0.85rem', fontSize: '0.92rem', opacity: (loading || regOtp.length !== 6) ? 0.6 : 1, fontWeight: 900 }}
                    >
                      {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-circle-check" />} VERIFY &amp; ENTER CASINO &rarr;
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setRegStep('details')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <i className="fa-solid fa-arrow-left" /> Edit Details
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpTimer > 0 || sendingOtp}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: otpTimer > 0 ? 'var(--text-muted)' : 'var(--gold-primary)',
                          cursor: otpTimer > 0 ? 'default' : 'pointer',
                          fontWeight: 700
                        }}
                      >
                        {sendingOtp ? 'Sending...' : otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend OTP Code'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            )}

            {tab === 'forgot' && (
              <motion.form
                key="forgot-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleForgotSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: '#fff', margin: '0 0 0.4rem 0', fontFamily: 'var(--font-heading)' }}>Reset Password</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter your registered email address to receive password reset instructions.</p>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter registered email"
                    style={{
                      width: '100%',
                      background: 'rgba(4, 6, 14, 0.85)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-gold-glow" style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 900 }}>
                  {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} SEND RESET LINK
                </button>

                <button type="button" onClick={() => setTab('login')} className="btn-glass-secondary" style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', justifyContent: 'center' }}>
                  BACK TO LOGIN
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Support Quick Contact Footer */}
          <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Need help?</span>
              <button
                onClick={onOpenSupport}
                style={{ background: 'transparent', border: 'none', color: 'var(--cyan-primary)', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Contact Customer Support
              </button>
            </div>

            <a
              href="/downloads/winning-heaven.apk"
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(255, 215, 0, 0.15) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '20px',
                padding: '0.45rem 1rem',
                color: '#4ade80',
                fontSize: '0.78rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-brands fa-android" style={{ color: '#22c55e', fontSize: '0.95rem' }} />
              <span>Download Official Android APK</span>
            </a>
          </div>
        </div>

        {/* MOBILE BOTTOM SECTION: Appears below auth card on mobile */}
        <div className="auth-portal-mobile-bottom">
          <div style={{
            background: 'linear-gradient(90deg, rgba(255, 200, 0, 0.18) 0%, rgba(255, 153, 0, 0.08) 100%)',
            border: '1.5px solid rgba(255, 200, 0, 0.45)',
            borderRadius: '18px',
            padding: '0.75rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 25px rgba(255,200,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                boxShadow: '0 0 15px rgba(255,200,0,0.6)'
              }}>
                <i className="fa-solid fa-trophy" style={{ color: '#000' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.08em' }}>
                  PROGRESSIVE MEGA JACKPOT
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  $184,950.40
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(0, 230, 118, 0.2)',
              border: '1px solid rgba(0, 230, 118, 0.5)',
              color: '#00e676',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '0.3rem 0.65rem',
              borderRadius: '20px'
            }}>
              🔥 HOT
            </div>
          </div>
        </div>
      </div>

      {/* Player Footer Links at Bottom */}
      <div style={{ marginTop: '3rem', width: '100%' }}>
        <PlayerFooter />
      </div>
    </div>
  );
}
