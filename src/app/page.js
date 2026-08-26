'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import usePollingSWR from '../hooks/usePollingSWR';
import { POLL } from '../lib/pollingConfig';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ParticlesBackground from '../components/ParticlesBackground';
import AuthPortal from '../components/AuthPortal';
import UserLobby from '../components/UserLobby';
import LoadingOverlay from '../components/LoadingOverlay';
import PlayerSupportModal from '../components/player/PlayerSupportModal';
import PlayerFooter from '../components/player/PlayerFooter';
import { GoogleWarningModal } from '../components/Modals';
import useSessionGuard from '../hooks/useSessionGuard';
import { compressDataUrl } from '../lib/imageCompress';
import { trackCompleteRegistration, trackDepositPurchase } from '../lib/metaPixel';
import { safeFetchJson, cleanErrorMessage } from '../lib/safeFetch';
import { initAudioUnlock, playNotificationSound } from '../lib/notificationSound';
import { initPushAudioListener } from '../lib/pushClient';

const fetcher = async (...args) => {
  try {
    const res = await fetch(...args);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

/** Deposit proof attach — small payload + retries so ledger never sticks on "Proof uploading…" */
async function uploadDepositProof(txId, screenshot, userEmail) {
  let shot = screenshot;
  try {
    if (typeof shot === 'string' && shot.length > 140_000) {
      shot = await compressDataUrl(shot, { maxSize: 900, quality: 0.52, maxChars: 140_000 });
    }
  } catch {
    /* keep original; retries below may shrink further */
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/transactions/proof', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, screenshot: shot, userEmail })
      });
      if (res.ok) return true;

      // Body rejected / server choke — shrink harder and retry
      if (res.status === 413 || res.status >= 500 || res.status === 400) {
        try {
          shot = await compressDataUrl(shot, {
            maxSize: Math.max(480, 820 - attempt * 120),
            quality: Math.max(0.38, 0.5 - attempt * 0.06),
            maxChars: 100_000
          });
        } catch {
          /* continue with current shot */
        }
        continue;
      }
      return false;
    } catch (err) {
      console.error('Deposit proof upload attempt failed:', err);
      try {
        shot = await compressDataUrl(shot, {
          maxSize: 640,
          quality: 0.42,
          maxChars: 90_000
        });
      } catch {
        /* ignore */
      }
    }
  }
  return false;
}

function resolveSupportEmail(session) {
  if (session?.email) return String(session.email).toLowerCase().trim();
  if (typeof window === 'undefined') return '';
  try {
    return String(localStorage.getItem('winning_heaven_guest_email') || '').toLowerCase().trim();
  } catch {
    return '';
  }
}

function supportSeenKey(email) {
  return `winning_heaven_support_seen_${String(email || '').toLowerCase().trim()}`;
}

function markSupportMessagesSeen(email, messages) {
  const clean = String(email || '').toLowerCase().trim();
  if (!clean || typeof window === 'undefined') return;
  const adminMsgs = (messages || []).filter((m) => m?.senderType === 'admin');
  const latest = adminMsgs.length ? adminMsgs[adminMsgs.length - 1] : null;
  const stamp = latest?.timestamp || new Date().toISOString();
  try {
    localStorage.setItem(supportSeenKey(clean), stamp);
  } catch {
    /* ignore */
  }
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('loading');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Player / any deleted account: force logout while lobby is open.
  useSessionGuard(view === 'lobby' ? session?.email : null, {
    redirectTo: '/login',
    intervalMs: 3000
  });

  // Overlay states
  const [loadingActive, setLoadingActive] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  // Modals Open states
  const [supportOpen, setSupportOpen] = useState(false);
  const [googleWarnOpen, setGoogleWarnOpen] = useState(false);
  const [supportUnread, setSupportUnread] = useState(false);
  const supportAlertRef = useRef('');

  // Last-saved catalogs cached in localStorage so a refresh shows games
  // instantly instead of waiting on /api/games (often cold + was ~1MB+).
  const [cachedFrontendSettings] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = localStorage.getItem('frontendSettingsCache');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });
  const [cachedGames] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = localStorage.getItem('gamesCatalogCache');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });

  // Fetch static data (games and gateways catalog) with SWR (cached, no automatic polling)
  const { data: gamesData } = useSWR('/api/games', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData: cachedGames ? { success: true, games: cachedGames } : undefined,
  });
  // Fetch gateways: Type B players must resolve via distributorId (or email fallback)
  const gatewaysQuery = session?.distributorId
    ? `/api/gateways?distributorId=${encodeURIComponent(session.distributorId)}`
    : session?.email
      ? `/api/gateways?email=${encodeURIComponent(session.email)}`
      : '/api/gateways';
  const { data: gatewaysData } = useSWR(gatewaysQuery, fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 });
  const { data: frontendSettingsData } = useSWR('/api/settings/frontend', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData: cachedFrontendSettings ? { success: true, settings: cachedFrontendSettings } : undefined
  });

  const games = (gamesData?.games || []).filter((g) => g.active !== false);
  const gateways = gatewaysData?.gateways || [];
  const frontendSettings = frontendSettingsData?.settings || {};

  // Persist the latest settings so the next page load can render them immediately.
  useEffect(() => {
    if (frontendSettingsData?.settings) {
      try {
        localStorage.setItem('frontendSettingsCache', JSON.stringify(frontendSettingsData.settings));
      } catch {
        /* ignore quota / privacy-mode errors */
      }
    }
  }, [frontendSettingsData]);

  useEffect(() => {
    if (gamesData?.games?.length) {
      try {
        localStorage.setItem('gamesCatalogCache', JSON.stringify(gamesData.games));
      } catch {
        /* ignore quota / privacy-mode errors */
      }
    }
  }, [gamesData]);

  const [cachedCredentials] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = localStorage.getItem('userGameCredentialsCache');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });

  // Fetch user-specific queues (only when player is logged in) with SWR polling every 5s
  const emailQuery = session?.email ? encodeURIComponent(session.email) : null;
  
  const { data: requestsData } = usePollingSWR(
    emailQuery ? `/api/account-requests?email=${emailQuery}` : null,
    POLL.PLAYER
  );

  const { data: credentialsData } = usePollingSWR(
    emailQuery ? `/api/game-accounts?email=${emailQuery}` : null,
    POLL.PLAYER,
    { fallbackData: cachedCredentials ? { success: true, gameAccounts: cachedCredentials } : undefined }
  );

  const { data: transactionsData } = usePollingSWR(
    emailQuery ? `/api/transactions?email=${emailQuery}&limit=40` : null,
    POLL.PLAYER
  );

  const { data: notificationsData } = usePollingSWR(
    emailQuery ? `/api/coins-notifications?email=${emailQuery}` : null,
    POLL.PLAYER
  );

  const accountRequests = requestsData?.accountRequests || [];
  const gameAccounts = credentialsData?.gameAccounts || cachedCredentials || [];
  const transactions = transactionsData?.transactions || [];
  const coinsNotifications = notificationsData?.coinsNotifications || [];

  const soundUrl = frontendSettings?.notificationSoundUrl || '/api/settings/audio';
  const soundUrlRef = useRef(soundUrl);
  useEffect(() => {
    soundUrlRef.current = frontendSettings?.notificationSoundUrl || '/api/settings/audio';
  }, [frontendSettings]);

  const knownNotificationIdsRef = useRef(null);
  useEffect(() => {
    const list = notificationsData?.coinsNotifications;
    if (!Array.isArray(list)) return;

    if (knownNotificationIdsRef.current === null) {
      knownNotificationIdsRef.current = new Set(list.map((n) => String(n._id || n.id)));
      return;
    }

    const newItems = list.filter((n) => {
      const id = String(n._id || n.id);
      return id && !knownNotificationIdsRef.current.has(id);
    });

    if (newItems.length > 0) {
      newItems.forEach((n) => {
        const id = String(n._id || n.id);
        if (id) knownNotificationIdsRef.current.add(id);
      });

      const latest = newItems[0];
      const title = latest.gameTitle || 'Winning Heaven';
      const typeLabel =
        latest.type === 'bonus'
          ? '🎁 Bonus Credited'
          : latest.type === 'redeem'
            ? '💰 Cashout Approved'
            : '⚡ Coins Allotted';
      const amountStr = latest.coins ? `$${latest.coins}` : '';
      const textMsg = `${typeLabel}: ${amountStr} ${title}`.trim();

      showToast(textMsg, 'success');
      try {
        playNotificationSound(soundUrlRef.current);
      } catch (_) {}
    }
  }, [notificationsData]);

  // Persist credentials in localStorage when fetched
  useEffect(() => {
    if (credentialsData?.gameAccounts?.length) {
      try {
        localStorage.setItem('userGameCredentialsCache', JSON.stringify(credentialsData.gameAccounts));
      } catch {
        /* ignore */
      }
    }
  }, [credentialsData]);

  // Initialize session
  useEffect(() => {
    setMounted(true);
    initAudioUnlock();
    initPushAudioListener('/api/settings/audio');

    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('winning_heaven_ref_code', ref);
      }
      const dist = params.get('distributor') || params.get('dist');
      if (dist) {
        localStorage.setItem('winning_heaven_distributor_id', dist);
      }
      const agentParam = params.get('agent');
      if (agentParam) {
        localStorage.setItem('winning_heaven_agent_code', agentParam);
      }
      const campaignParam = params.get('campaign') || params.get('campaignId');
      if (campaignParam) {
        localStorage.setItem('winning_heaven_campaign', campaignParam);
      }
    }

    const rawSess = localStorage.getItem('winning_heaven_session');
    const savedSession = JSON.parse(rawSess || 'null');
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';

    if (savedSession) {
      if (savedSession.role === 'admin') {
        window.location.href = '/admin';
        return;
      } else {
        setSession(savedSession);
        setView('lobby');
        if (path === '/' || path === '/login' || path === '/register' || path === '/forgot') {
          window.history.replaceState({}, '', '/lobby');
        }
      }
    } else {
      setView('auth');
      if (path.startsWith('/lobby') || path === '/') {
        window.history.replaceState({}, '', '/login');
      }
    }
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('PWA Service Worker registered.'))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Multi-tab Session Synchronization Listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'winning_heaven_session') {
        const currentSess = localStorage.getItem('winning_heaven_session');
        const path = typeof window !== 'undefined' ? window.location.pathname : '/';
        if (currentSess === 'null' || !currentSess) {
          setSession(null);
          setView('auth');
          if (path.startsWith('/lobby')) {
            window.history.replaceState({}, '', '/login');
          }
        } else {
          const parsed = JSON.parse(currentSess);
          setSession(parsed);
          setView('lobby');
          if (path === '/' || path === '/login' || path === '/register' || path === '/forgot') {
            window.history.replaceState({}, '', '/lobby');
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Shared loader trigger
  const triggerLoading = (durationMs = 1500, callback) => {
    setLoadingActive(true);
    setTimeout(() => {
      setLoadingActive(false);
      if (callback) callback();
    }, durationMs);
  };

  // Toast notifier — clear prior timer so a late API toast cannot wipe an early one
  const toastTimerRef = useRef(null);
  const showToast = (message, type = 'info', duration = 5000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    const cleanMsg = cleanErrorMessage(message, 'Action failed.');
    setToast({ message: cleanMsg, type });
    if (duration > 0) {
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, duration);
    }
  };

  // Player support: badge + toast when admin replies (does not change chat/API logic).
  useEffect(() => {
    if (!mounted) return undefined;
    if (supportOpen) {
      setSupportUnread(false);
      return undefined;
    }

    let cancelled = false;
    const check = async () => {
      const email = resolveSupportEmail(session);
      if (!email) {
        if (!cancelled) setSupportUnread(false);
        return;
      }
      try {
        const res = await fetch(`/api/support?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (cancelled || !data?.success) return;
        const adminMsgs = (data.messages || []).filter((m) => m?.senderType === 'admin');
        if (adminMsgs.length === 0) {
          setSupportUnread(false);
          return;
        }
        const latest = adminMsgs[adminMsgs.length - 1];
        const latestTs = String(latest?.timestamp || '');
        let seen = '';
        try {
          seen = localStorage.getItem(supportSeenKey(email)) || '';
        } catch {
          seen = '';
        }
        const unread = !seen || (latestTs && new Date(latestTs).getTime() > new Date(seen).getTime());
        setSupportUnread(Boolean(unread));
        if (unread && latestTs && supportAlertRef.current !== latestTs) {
          supportAlertRef.current = latestTs;
          showToast('New message from Support — tap SUPPORT to read.', 'info');
          try {
            playNotificationSound(soundUrlRef.current);
          } catch (_) {}
        }
      } catch {
        /* ignore network blips */
      }
    };

    check();
    const timer = window.setInterval(check, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mounted, session, supportOpen]);

  const openSupport = () => {
    setSupportUnread(false);
    setSupportOpen(true);
  };

  const handleLoginSuccess = (user) => {
    if (user.role === 'admin') {
      showToast('Admin credentials verified. Redirecting to Secure Workspace...', 'success');
      localStorage.setItem('winning_heaven_admin_session', 'active');
      localStorage.setItem('winning_heaven_session', JSON.stringify(user));
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
      return;
    }

    setSession(user);
    localStorage.setItem('winning_heaven_session', JSON.stringify(user));
    setView('lobby');
  };

  const handleRegisterSuccess = (newUser) => {
    trackCompleteRegistration('email');
    setSession(newUser);
    localStorage.setItem('winning_heaven_session', JSON.stringify(newUser));
    setView('lobby');
    showToast('Welcome to Winning Heaven! Registration verified successfully.', 'success');
  };

  const handleLogout = () => {
    triggerLoading(1000, () => {
      setSession(null);
      localStorage.setItem('winning_heaven_session', 'null');
      try {
        localStorage.removeItem('userGameCredentialsCache');
      } catch {
        /* ignore */
      }
      setView('auth');
      showToast('Logged out successfully.', 'info');
    });
  };

  // Player Account Creation Requests
  const requestAccountInFlight = React.useRef(new Set());
  const handleRequestAccount = async (gameTitle) => {
    if (!session?.email || !gameTitle) return;
    const lockKey = `${session.email.toLowerCase().trim()}||${String(gameTitle).toLowerCase().trim()}`;
    if (requestAccountInFlight.current.has(lockKey)) return;
    requestAccountInFlight.current.add(lockKey);

    const cacheKey = emailQuery ? `/api/account-requests?email=${emailQuery}` : null;
    try {
      // Client-side guard: already pending for this game
      const existing = (accountRequests || []).find(
        (r) =>
          r.gameTitle &&
          String(r.gameTitle).toLowerCase() === String(gameTitle).toLowerCase() &&
          r.status === 'PENDING'
      );
      if (existing) {
        showToast(`Request already pending for ${gameTitle}.`, 'info');
        return;
      }

      const response = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, userEmail: session.email })
      });
      const data = await response.json();
      if (data.success) {
        showToast(
          data.alreadyExists
            ? `Request already pending for ${gameTitle}.`
            : `Account creation request submitted for ${gameTitle}!`,
          data.alreadyExists ? 'info' : 'success'
        );

        // Optimistic pending row so lobby shows APPROVAL PENDING immediately
        const optimistic = data.request || {
          id: `temp-${Date.now()}`,
          gameTitle,
          userEmail: session.email.toLowerCase().trim(),
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        if (cacheKey) {
          mutate(
            cacheKey,
            (current) => ({
              success: true,
              accountRequests: [optimistic, ...(current?.accountRequests || []).filter(
                (r) => !(String(r.gameTitle).toLowerCase() === String(gameTitle).toLowerCase() &&
                  String(r.userEmail).toLowerCase() === String(session.email).toLowerCase())
              )]
            }),
            false
          );
          mutate(cacheKey);
        }
      } else {
        showToast(data.message || 'Failed to submit account request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to submit account request.', 'error');
    } finally {
      requestAccountInFlight.current.delete(lockKey);
    }
  };

  // Player Transactions Requests
  const handleSubmitTransaction = async (newTx) => {
    const isDeposit = newTx.type === 'DEPOSIT';
    const isWithdraw = newTx.type === 'WITHDRAW';
    const isFreeplay =
      newTx.type === 'BONUS' &&
      (newTx.code === 'SIGNUP-FREE3' || newTx.code === 'FREEPLAY' || /promo freeplay/i.test(String(newTx.note || '')));

    // Paint toast before API — freeplay/deposit/withdraw must not wait on Mongo
    if (isDeposit) {
      showToast(`Deposit request of $${parseFloat(newTx.amount).toFixed(2)} submitted with payment proof.`, 'success');
    } else if (isWithdraw) {
      showToast(`Withdrawal request of $${parseFloat(newTx.amount).toFixed(2)} submitted.`, 'success');
    } else if (isFreeplay || newTx.type === 'BONUS') {
      const gameBit = newTx.gameTitle ? ` for ${newTx.gameTitle}` : '';
      showToast(
        `Freeplay request of $${parseFloat(newTx.amount).toFixed(2)} submitted${gameBit}! Awaiting approval.`,
        'success'
      );
    }
    await new Promise((r) => setTimeout(r, 0));

    try {
      const screenshot = isDeposit ? newTx.screenshot : undefined;
      // Deposit: create the ledger row WITHOUT base64 first (instant), then attach proof.
      const createBody = isDeposit
        ? { ...newTx, screenshot: undefined, proofPending: Boolean(screenshot), userEmail: session.email }
        : { ...newTx, userEmail: session.email };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody)
      });
      const data = await response.json();
      if (data.success) {
        // Already toasted optimistically for deposit / withdraw / freeplay
        if (!isDeposit && !isWithdraw && !isFreeplay && newTx.type !== 'BONUS') {
          showToast(data.message || 'Request submitted.', 'success');
        }
        if (isDeposit) {
          trackDepositPurchase({
            value: newTx.amount,
            currency: 'USD',
            transactionId: data.transaction?.id || data.transaction?._id
          });
        }
        const url = emailQuery ? `/api/transactions?email=${emailQuery}&limit=40` : null;
        mutate(url);
        mutate(emailQuery ? `/api/coins-notifications?email=${emailQuery}` : null);

        // Background proof upload — admin already sees the PENDING row from create.
        if (isDeposit && screenshot && data.transaction?.id) {
          void uploadDepositProof(data.transaction.id, screenshot, session.email).then((ok) => {
            if (!ok) {
              showToast('Payment submitted, but proof upload failed. Please contact support with your amount/time.', 'error');
            }
            mutate(url);
          });
        }
      } else {
        showToast(data.message || 'Transaction submission failed.', 'error');
      }
    } catch (err) {
      console.error('Submit transaction error:', err);
      showToast('Connection error submitting transaction.', 'error');
    }
  };

  const handleUpdateCoinsNotification = async (id, status, read, holdNote) => {
    try {
      const response = await fetch('/api/coins-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, read, holdNote })
      });
      const data = await response.json();
      if (data.success) {
        // Mutate notifications cache key
        mutate(emailQuery ? `/api/coins-notifications?email=${emailQuery}` : null);
      }
    } catch (err) {
      console.error('Update coins notification error:', err);
    }
  };

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('Thank you for installing Winning Heaven app!', 'success');
          setDeferredPrompt(null);
        }
      });
    } else {
      showToast('To Install App: Click browser settings menu (or Share button on Safari) and select "Add to Home Screen" or "Install App".', 'info');
    }
  };

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '1007065363081-r4bv8hn10586g1v6n2as7j9eh10rtgnc.apps.googleusercontent.com';

  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', color: '#fff' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--gold-primary)' }}></i>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Initializing Winning Heaven...</span>
      </div>
    );
  }

  const homeSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Winning Heaven Sweepstakes Casino',
      image: 'https://winningheaven.com/winning_heaven_banner.png',
      description: 'Play GameVault 777, Juwa, Vegas Sweeps & Orion Stars with instant 24/7 cashouts and $3 freeplay signup bonus.',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Winning Heaven'
        }
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Winning Heaven a legal sweepstakes casino platform?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Winning Heaven operates as a promotional online sweepstakes casino platform under legal No Purchase Necessary sweepstakes regulations across North America.'
          }
        },
        {
          '@type': 'Question',
          name: 'How do I claim my $3 signup freeplay bonus?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create a free Winning Heaven account. Once logged in, open the Freeplay section in your lobby, choose GameVault or Juwa, and request your freeplay game account credentials.'
          }
        },
        {
          '@type': 'Question',
          name: 'How fast are cashout redemptions on Winning Heaven?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our finance desk operates 24/7. Cashouts requested via Cash App, Venmo, Zelle, PayPal, or Crypto are processed within 5 to 15 minutes.'
          }
        }
      ]
    }
  ];

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchemas) }}
      />
      <ParticlesBackground />
      <div className="aurora-bg" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      {toast && (
        <div className={`notification-banner ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`} style={{
              color: toast.type === 'error' ? 'var(--red-primary, #ff0055)' : toast.type === 'success' ? 'var(--emerald-primary, #00e676)' : 'var(--gold-primary, #ffd700)',
              fontSize: '1.1rem',
              flexShrink: 0
            }} />
            <span>{toast.message}</span>
          </div>
          <button className="close-notification" onClick={() => setToast(null)} aria-label="Close notification">&times;</button>
        </div>
      )}

      {/* Screen Views Wrapper */}
      {view === 'loading' ? (
        <LoadingOverlay active={true} />
      ) : view === 'auth' ? (
        <AuthPortal
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
          onGoogleWarning={() => setGoogleWarnOpen(true)}
          triggerLoading={triggerLoading}
          showToast={showToast}
          onOpenSupport={openSupport}
          supportUnread={supportUnread}
          frontendSettings={frontendSettings}
        />
      ) : (
        <UserLobby
          games={games}
          accountRequests={accountRequests}
          gameAccounts={gameAccounts}
          transactions={transactions}
          gateways={gateways}
          coinsNotifications={coinsNotifications}
          onUpdateCoinsNotification={handleUpdateCoinsNotification}
          onInstallApp={handleInstallApp}
          currentUser={session}
          currentUserEmail={session?.email}
          onLogout={handleLogout}
          showToast={showToast}
          onOpenSupport={openSupport}
          supportUnread={supportUnread}
          onRequestAccount={handleRequestAccount}
          onSubmitTransaction={handleSubmitTransaction}
          frontendSettings={frontendSettings}
          onUpdateUser={(updated) => {
            setSession(updated);
            localStorage.setItem('winning_heaven_session', JSON.stringify(updated));
          }}
          onRefresh={async () => {
            const email = session?.email ? encodeURIComponent(session.email) : null;
            await Promise.all([
              mutate((key) => typeof key === 'string' && key.includes('/api/games')),
              mutate((key) => typeof key === 'string' && key.includes('/api/gateways')),
              mutate((key) => typeof key === 'string' && key.includes('/api/settings')),
              email
                ? mutate(`/api/account-requests?email=${email}`)
                : Promise.resolve(),
              email
                ? mutate(`/api/game-accounts?email=${email}`)
                : Promise.resolve(),
              email
                ? mutate(`/api/transactions?email=${email}&limit=40`)
                : Promise.resolve(),
              email
                ? mutate(`/api/coins-notifications?email=${email}`)
                : Promise.resolve(),
              mutate((key) => typeof key === 'string' && key.includes('/api/promotions'))
            ]);
          }}
        />
      )}

      {/* Modals */}
      <PlayerSupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        currentUser={session}
        onMessagesSeen={(messages) => {
          const email = resolveSupportEmail(session);
          markSupportMessagesSeen(email, messages);
          setSupportUnread(false);
        }}
      />

      <GoogleWarningModal isOpen={googleWarnOpen} onClose={() => setGoogleWarnOpen(false)} />

      <LoadingOverlay active={loadingActive} />
    </GoogleOAuthProvider>
  );
}

