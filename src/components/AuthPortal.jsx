'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { shouldShowInfoOnAuth } from '../lib/infoPage';
import { trackCompleteRegistration } from '../lib/metaPixel';
import { safeFetchJson, cleanErrorMessage, isNativePlatform } from '../lib/safeFetch';

const DEFAULT_LOGIN_BG = '/heavenly_auth_bg.png';
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

  const googleRes = await safeFetchJson('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      email: String(profile.email).toLowerCase(),
      name: profile.name || 'Google Player',
      referredBy: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_ref_code') || '' : '',
      distributorId: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_distributor_id') || '' : '',
      agentCode: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_agent_code') || '' : '',
      campaign: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_campaign') || '' : ''
    })
  });

  if (!googleRes.ok || !googleRes.data?.success) {
    throw new Error(googleRes.data?.message || 'Google registration/login failed on server.');
  }
  return googleRes.data;
}

export default function AuthPortal({
  onLoginSuccess,
  onRegisterSuccess,
  onGoogleWarning,
  triggerLoading,
  showToast,
  onOpenSupport,
  supportUnread = false,
  frontendSettings = {}
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://winningheaven.com';
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
          const googleData = await loginWithGoogleProfile(tokenResponse.access_token);
          finishGoogleLogin(googleData);
        } catch (err) {
          console.error('Google Login Error:', err);
          showToast(cleanErrorMessage(err, 'Google Sign-In failed.'), 'error');
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
        showToast(cleanErrorMessage(res.data?.message, 'Invalid email or password.'), 'error');
        return;
      }

      showToast(`Welcome back, ${res.data.user?.name || 'Player'}!`, 'success');
      onLoginSuccess(res.data.user);
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Login failed. Please check your credentials.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
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
      const res = await safeFetchJson('/api/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          name: regName.trim(),
          purpose: 'register'
        })
      });

      if (!res.ok || !res.data?.success) {
        showToast(cleanErrorMessage(res.data?.message, 'Failed to send verification code.'), 'error');
        return;
      }

      setRegStep('otp');
      setOtpTimer(60);
      showToast('Verification code sent to your email inbox!', 'success');
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Failed to send verification email.'), 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (otpTimer > 0 || sendingOtp) return;
    setSendingOtp(true);
    try {
      const res = await safeFetchJson('/api/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          name: regName.trim(),
          purpose: 'register'
        })
      });

      if (!res.ok || !res.data?.success) {
        showToast(cleanErrorMessage(res.data?.message, 'Failed to resend verification code.'), 'error');
        return;
      }

      setOtpTimer(60);
      showToast('New verification code sent to your inbox!', 'success');
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Resend failed. Please try again.'), 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Register Account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!regOtp.trim() || regOtp.trim().length !== 6) {
      showToast('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
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
          campaign: typeof window !== 'undefined' ? localStorage.getItem('winning_heaven_campaign') || '' : ''
        })
      });

      if (!res.ok || !res.data?.success) {
        showToast(cleanErrorMessage(res.data?.message, 'Registration failed.'), 'error');
        return;
      }

      trackCompleteRegistration('email');
      showToast(`Welcome to Winning Heaven, ${res.data.user?.name || 'Player'}!`, 'success');
      onRegisterSuccess(res.data.user);
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Registration failed.'), 'error');
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
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'max(2rem, calc(2rem + max(env(safe-area-inset-top, 0px), var(--sat, 0px)))) max(1rem, env(safe-area-inset-right, 0px)) max(2rem, calc(2rem + max(env(safe-area-inset-bottom, 0px), var(--sab, 0px)))) max(1rem, env(safe-area-inset-left, 0px))',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      {/* Background Ambient Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255,200,0,0.14) 0%, rgba(0,240,255,0.06) 50%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Brand Header Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '2rem',
        zIndex: 2
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          border: '3px solid var(--gold-primary)',
          background: '#000',
          boxShadow: '0 0 35px rgba(255,200,0,0.45)',
          overflow: 'hidden',
          marginBottom: '0.85rem'
        }}>
          <img src="/winning_heaven_logo.png" alt="Winning Heaven" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          fontFamily: 'var(--font-heading)',
          color: '#fff',
          letterSpacing: '0.04em',
          margin: 0
        }}>
          WINNING<span className="gold-gradient-text">HEAVEN</span>
        </h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
          PREMIER CASINO & GAMING LOUNGE
        </div>
      </div>

      {/* Main Glass Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(10, 14, 28, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: 'var(--card-glow-shadow)',
        zIndex: 2,
        position: 'relative'
      }}>
        {/* Auth Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(6, 8, 18, 0.8)',
          borderRadius: '14px',
          padding: '0.3rem',
          marginBottom: '1.75rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <button
            onClick={() => setTab('login')}
            style={{
              flex: 1,
              background: tab === 'login' ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'transparent',
              color: tab === 'login' ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            LOGIN
          </button>
          <button
            onClick={() => setTab('register')}
            style={{
              flex: 1,
              background: tab === 'register' ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'transparent',
              color: tab === 'register' ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            REGISTER
          </button>
        </div>

        {/* Tab Forms */}
        <AnimatePresence mode="wait">
          {tab === 'login' && (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  EMAIL OR USERNAME
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email or username"
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.8)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '12px',
                    padding: '0.8rem 1rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>PASSWORD</label>
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
                      background: 'rgba(6, 8, 18, 0.8)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '12px',
                      padding: '0.8rem 2.6rem 0.8rem 1rem',
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
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-right-to-bracket" />} SIGN IN TO CASINO
              </button>

              {/* Google Social Auth */}
              <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>OR SIGN IN WITH</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
              </div>

              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleClick}
                className="btn-glass-secondary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1 }}
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
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>FULL NAME</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter full name"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.8)',
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
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Enter email address"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.8)',
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
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create password (min 6 chars)"
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(6, 8, 18, 0.8)',
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
                    <label style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>REFERRAL CODE (OPTIONAL)</label>
                    <input
                      type="text"
                      value={regRefCode}
                      onChange={(e) => setRegRefCode(e.target.value)}
                      placeholder="Enter referral code"
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.8)',
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
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
                  >
                    {sendingOtp ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} GET EMAIL VERIFICATION CODE &rarr;
                  </button>

                  {/* Google Social Auth */}
                  <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>OR REGISTER WITH</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                  </div>

                  <button
                    type="button"
                    disabled={sendingOtp || googleLoading}
                    onClick={handleGoogleClick}
                    className="btn-glass-secondary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1 }}
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
                        background: 'rgba(6, 8, 18, 0.95)',
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
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.92rem', opacity: (loading || regOtp.length !== 6) ? 0.6 : 1 }}
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
                    background: 'rgba(6, 8, 18, 0.8)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '12px',
                    padding: '0.8rem 1rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-gold-glow" style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}>
                {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} SEND RESET LINK
              </button>

              <button type="button" onClick={() => setTab('login')} className="btn-glass-secondary" style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', justifyContent: 'center' }}>
                BACK TO LOGIN
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Support Quick Contact Footer */}
      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 2 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Need help?</span>
        <button
          onClick={onOpenSupport}
          style={{ background: 'transparent', border: 'none', color: 'var(--cyan-primary)', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
        >
          Contact Customer Support
        </button>
      </div>
    </div>
  );
}
