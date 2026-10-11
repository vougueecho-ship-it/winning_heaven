'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import PlayerSupportModal from './PlayerSupportModal';

export default function FloatingChatButton({ onOpenSupport, currentUser = null }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(currentUser);
  const [unread, setUnread] = useState(false);

  const [isClientAdmin, setIsClientAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname || '';
      return p.includes('/admin') || p.includes('/boss') || p.includes('/finance') || p.includes('/operations') || p.includes('/support-staff') || p.includes('/coins-staff') || p.includes('/distributor') || p.includes('/affiliate') || p.includes('/blog-admin');
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname || '';
      if (p.includes('/admin') || p.includes('/boss') || p.includes('/finance') || p.includes('/operations') || p.includes('/support-staff') || p.includes('/coins-staff') || p.includes('/distributor') || p.includes('/affiliate') || p.includes('/blog-admin')) {
        setIsClientAdmin(true);
      }
    }
  }, [pathname]);

  // Strictly hide floating player chat button on all Admin & Staff panel views
  const isAdminOrStaffRoute = Boolean(
    isClientAdmin ||
    (pathname && (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/boss') ||
      pathname.startsWith('/finance') ||
      pathname.startsWith('/operations') ||
      pathname.startsWith('/support-staff') ||
      pathname.startsWith('/coins-staff') ||
      pathname.startsWith('/distributor') ||
      pathname.startsWith('/affiliate') ||
      pathname.startsWith('/blog-admin')
    ))
  );

  useEffect(() => {
    if (currentUser) {
      setSessionUser(currentUser);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('winning_heaven_session');
        if (raw) setSessionUser(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [currentUser]);

  const handleClick = () => {
    if (onOpenSupport) {
      onOpenSupport();
    } else {
      setModalOpen(true);
    }
  };

  if (isAdminOrStaffRoute) {
    return null;
  }

  return (
    <>
      <div
        className="floating-chat-button-root"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <button
          onClick={handleClick}
          aria-label="Open 24/7 Live Chat Support"
          style={{
            background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 40%, #06b6d4 100%)',
            color: '#04050b',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '50px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(252, 211, 77, 0.45), 0 0 20px rgba(6, 182, 212, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            fontWeight: 800,
            fontSize: '0.92rem',
            letterSpacing: '0.03em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(252, 211, 77, 0.65), 0 0 30px rgba(6, 182, 212, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(252, 211, 77, 0.45), 0 0 20px rgba(6, 182, 212, 0.35)';
          }}
        >
          {/* Pulsing Dot */}
          <span
            style={{
              position: 'relative',
              display: 'inline-flex',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00e676',
              boxShadow: '0 0 8px #00e676'
            }}
          />

          <i className="fa-solid fa-headset" style={{ fontSize: '1.25rem', color: '#04050b' }} />
          <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>24/7 LIVE CHAT</span>

          {unread && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900
              }}
            >
              !
            </span>
          )}
        </button>
      </div>

      {/* Embedded Modal for Standalone Pages */}
      {!onOpenSupport && (
        <PlayerSupportModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentUser={sessionUser}
          onMessagesSeen={() => setUnread(false)}
        />
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .floating-chat-button-root {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
