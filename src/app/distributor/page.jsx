'use client';

import React, { useState, useEffect } from 'react';
import useSessionGuard from '../../hooks/useSessionGuard';
import DistributorAdminShell from './DistributorAdminShell';
import ParticlesBackground from '../../components/ParticlesBackground';
import PortalLoginCard from '../../components/PortalLoginCard';

export default function DistributorPortal() {
  const [mounted, setMounted] = useState(false);
  const [distSession, setDistSession] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useSessionGuard(distSession?.email, {
    redirectTo: '/distributor',
    intervalMs: 2000
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('winning_heaven_distributor_session');
    if (saved) {
      try {
        setDistSession(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/distributors/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('winning_heaven_distributor_session', JSON.stringify(data.distributor));
        setDistSession(data.distributor);
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path === '/distributor' || path === '/distributor/') {
            window.history.replaceState({}, '', '/distributor/dashboard');
          }
        }
      } else {
        setLoginError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Connection failure.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('winning_heaven_distributor_session');
    setDistSession(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/distributor');
    }
  };

  if (!mounted) return null;

  if (!distSession) {
    return (
      <>
      <ParticlesBackground />
        <div className="ambient-glow glow-1" aria-hidden="true" />
        <div className="ambient-glow glow-2" aria-hidden="true" />
        <PortalLoginCard
          portalTitle="Live operations workspace — your players only"
          portalBadge="DISTRIBUTOR ACCESS GATEWAY"
          portalIcon="fa-handshake"
          loginError={loginError}
          onClearError={() => setLoginError('')}
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((p) => !p)}
          isSubmitting={isLoggingIn}
          onSubmit={handleLoginSubmit}
        />
      </>
    );
  }

  return <DistributorAdminShell distSession={distSession} onLogout={handleLogout} />;
}