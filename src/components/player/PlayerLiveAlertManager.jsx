'use client';

import React, { useState, useEffect, useRef } from 'react';
import { playNotificationSound, initAudioUnlock } from '../../lib/notificationSound';

export default function PlayerLiveAlertManager() {
  const [session, setSession] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const knownIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);

  // Sync session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readSession = () => {
      try {
        const raw = localStorage.getItem('winning_heaven_session');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.email) {
          setSession(parsed);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      }
    };

    readSession();
    initAudioUnlock();

    window.addEventListener('storage', readSession);
    window.addEventListener('winning_heaven_session_change', readSession);
    return () => {
      window.removeEventListener('storage', readSession);
      window.removeEventListener('winning_heaven_session_change', readSession);
    };
  }, []);

  // Poll for player alerts when logged in
  useEffect(() => {
    if (!session?.email) return;

    let isMounted = true;
    const email = session.email.toLowerCase().trim();

    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/user-notifications?email=${encodeURIComponent(email)}&limit=25`, {
          cache: 'no-store'
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data?.success || !Array.isArray(data.notifications)) return;

        const notifications = data.notifications;
        setAllNotifications(notifications);
        setUnreadCount(Number(data.unreadCount || 0));

        // On very first mount, populate knownIds so we don't spam old notifications as new toasts
        if (!initialFetchDoneRef.current) {
          notifications.forEach((n) => {
            if (n.id) knownIdsRef.current.add(String(n.id));
          });
          initialFetchDoneRef.current = true;
          return;
        }

        // Find new alerts that haven't been shown as a toast
        const newUnshown = notifications.filter((n) => {
          const id = String(n.id);
          return id && !n.shownToast && !knownIdsRef.current.has(id);
        });

        if (newUnshown.length > 0) {
          // Play notification chime
          try {
            playNotificationSound('/api/settings/audio');
          } catch (_) {}

          // Add to active toast queue & mark known
          newUnshown.forEach((alert) => {
            const id = String(alert.id);
            knownIdsRef.current.add(id);

            // Acknowledge shownToast on backend
            fetch('/api/user-notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, userEmail: email, markToastShown: true })
            }).catch(() => {});

            // Push to active toast state
            setActiveAlerts((prev) => [
              alert,
              ...prev.filter((item) => String(item.id) !== id)
            ].slice(0, 3)); // keep maximum 3 toasts visible

            // Auto dismiss after 8.5 seconds
            setTimeout(() => {
              if (isMounted) {
                setActiveAlerts((prev) => prev.filter((item) => String(item.id) !== id));
              }
            }, 8500);
          });
        }
      } catch (err) {
        /* ignore polling network glitches */
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session]);

  const dismissAlert = (id) => {
    setActiveAlerts((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const copyCreds = (creds, id) => {
    if (!creds) return;
    const text = `Game: ${creds.gameTitle || ''}\nUsername: ${creds.username}\nPassword: ${creds.password}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    }
  };

  const markAllRead = async () => {
    if (!session?.email) return;
    try {
      await fetch('/api/user-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: session.email, markAllRead: true })
      });
      setUnreadCount(0);
      setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true, shownToast: true })));
    } catch (_) {}
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* 1. Realtime Sliding Toast Banners (Top Right) */}
      {activeAlerts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '430px',
            width: 'calc(100vw - 40px)',
            pointerEvents: 'none'
          }}
        >
          {activeAlerts.map((alert) => {
            const isReject = /reject|decline|fail/i.test(alert.type || '');
            const isReady = /account|cred|ready/i.test(alert.type || '');
            const isCoins = /coin|deposit/i.test(alert.type || '');

            const borderColor = isReject
              ? '#ef4444'
              : isReady
                ? '#38bdf8'
                : isCoins
                  ? '#10b981'
                  : '#fbbf24';

            const glowColor = isReject
              ? 'rgba(239, 68, 68, 0.45)'
              : isReady
                ? 'rgba(56, 189, 248, 0.45)'
                : isCoins
                  ? 'rgba(16, 185, 129, 0.45)'
                  : 'rgba(251, 191, 36, 0.45)';

            const iconClass = isReject
              ? 'fa-solid fa-circle-xmark'
              : isReady
                ? 'fa-solid fa-gamepad'
                : isCoins
                  ? 'fa-solid fa-coins'
                  : 'fa-solid fa-bell';

            return (
              <div
                key={alert.id}
                style={{
                  pointerEvents: 'auto',
                  background: 'linear-gradient(135deg, rgba(14, 18, 36, 0.98) 0%, rgba(6, 9, 25, 0.99) 100%)',
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: '16px',
                  padding: '16px 18px',
                  boxShadow: `0 14px 40px rgba(0,0,0,0.85), 0 0 25px ${glowColor}`,
                  backdropFilter: 'blur(16px)',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'whSlideInAlert 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: glowColor,
                        color: borderColor,
                        fontSize: '0.95rem'
                      }}
                    >
                      <i className={iconClass} />
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', color: borderColor, textTransform: 'uppercase' }}>
                      {alert.badgeText || 'WINNING HEAVEN ALERT'}
                    </span>
                  </div>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    aria-label="Dismiss alert"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                {/* Title */}
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {alert.title}
                </div>

                {/* Message */}
                <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: alert.credentials ? '10px' : '6px' }}>
                  {alert.message}
                </div>

                {/* Credentials Quick Box */}
                {alert.credentials && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.55)',
                      border: '1px dashed rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.82rem'
                    }}
                  >
                    {alert.credentials.username && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Username: </span>
                        <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{alert.credentials.username}</strong>
                      </div>
                    )}
                    {alert.credentials.password && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Password: </span>
                        <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{alert.credentials.password}</strong>
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <button
                        onClick={() => copyCreds(alert.credentials, alert.id)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.2)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-copy" style={{ marginRight: '4px' }} />
                        {copiedId === alert.id ? 'Copied!' : 'Copy Credentials'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  {alert.url && (
                    <a
                      href={alert.url}
                      onClick={() => dismissAlert(alert.id)}
                      style={{
                        background: `linear-gradient(135deg, ${borderColor} 0%, rgba(251, 191, 36, 0.8) 100%)`,
                        color: '#04050b',
                        fontSize: '0.76rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Open</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }} />
                    </a>
                  )}
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    background: borderColor,
                    width: '100%',
                    animation: 'whAlertTimer 8.5s linear forwards'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Floating VIP Bell Button (Bottom-Left) */}
      {session && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 99990
          }}
        >
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label="View VIP Notifications"
            style={{
              position: 'relative',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #182042 0%, #080b1a 100%)',
              border: '2px solid rgba(251, 191, 36, 0.5)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 15px rgba(251, 191, 36, 0.3)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.borderColor = '#fbbf24';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
            }}
          >
            <i className="fa-solid fa-bell" style={{ fontSize: '1.25rem' }} />

            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  boxShadow: '0 0 8px #ef4444'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Sliding VIP Notification Center Drawer */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999998,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-start'
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              background: 'linear-gradient(180deg, #0e1224 0%, #060919 100%)',
              borderRight: '1.5px solid rgba(251, 191, 36, 0.3)',
              boxShadow: '10px 0 50px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'whDrawerSlideIn 0.3s ease-out'
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #182042 0%, #080b1a 100%)',
                borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  <i className="fa-solid fa-bell" />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
                    VIP NOTIFICATIONS
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Approvals, Credentials & Balance Updates
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      color: '#fbbf24',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '6px'
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px'
              }}
            >
              {allNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <i className="fa-solid fa-bell-slash" style={{ fontSize: '2.5rem', marginBottom: '14px', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8' }}>No Notifications Yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                    When an admin approves your deposit, cashout, or game credentials, alerts will appear here.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allNotifications.map((noti) => {
                    const isReject = /reject|decline|fail/i.test(noti.type || '');
                    const isReady = /account|cred|ready/i.test(noti.type || '');
                    const isCoins = /coin|deposit/i.test(noti.type || '');

                    const cardBorder = isReject
                      ? 'rgba(239, 68, 68, 0.35)'
                      : isReady
                        ? 'rgba(56, 189, 248, 0.35)'
                        : isCoins
                          ? 'rgba(16, 185, 129, 0.35)'
                          : 'rgba(251, 191, 36, 0.35)';

                    return (
                      <div
                        key={noti.id}
                        style={{
                          background: noti.read ? 'rgba(8, 11, 24, 0.6)' : 'rgba(14, 18, 38, 0.95)',
                          border: `1.5px solid ${cardBorder}`,
                          borderRadius: '12px',
                          padding: '14px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: noti.badgeColor || '#fbbf24',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {noti.badgeText || noti.title}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {formatTimestamp(noti.createdAt)}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                          {noti.title}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: noti.credentials ? '8px' : '4px' }}>
                          {noti.message}
                        </div>

                        {/* Credentials Card */}
                        {noti.credentials && (
                          <div
                            style={{
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px dashed rgba(56, 189, 248, 0.4)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              margin: '8px 0',
                              fontSize: '0.8rem'
                            }}
                          >
                            {noti.credentials.username && (
                              <div>
                                <span style={{ color: '#94a3b8' }}>Username: </span>
                                <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{noti.credentials.username}</strong>
                              </div>
                            )}
                            {noti.credentials.password && (
                              <div>
                                <span style={{ color: '#94a3b8' }}>Password: </span>
                                <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{noti.credentials.password}</strong>
                              </div>
                            )}
                            <div style={{ marginTop: '6px' }}>
                              <button
                                onClick={() => copyCreds(noti.credentials, noti.id)}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.2)',
                                  border: '1px solid #38bdf8',
                                  color: '#38bdf8',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fa-solid fa-copy" style={{ marginRight: '4px' }} />
                                {copiedId === noti.id ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        )}

                        {noti.url && (
                          <div style={{ marginTop: '8px', textAlign: 'right' }}>
                            <a
                              href={noti.url}
                              onClick={() => setDrawerOpen(false)}
                              style={{
                                color: '#fbbf24',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textDecoration: 'none'
                              }}
                            >
                              Open Link &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes whSlideInAlert {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes whAlertTimer {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        @keyframes whDrawerSlideIn {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
