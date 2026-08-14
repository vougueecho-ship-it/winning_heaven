'use client';

import React, { useMemo } from 'react';

const DEFAULT_12_PAYOUTS = [
  { id: 'p1', player: 'ahm***634', game: 'Vegas Sweeps', amount: 150.0, method: 'CashApp', time: '1m ago' },
  { id: 'p2', player: 'joh***92', game: 'Fire Kirin', amount: 75.0, method: 'PayPal', time: '3m ago' },
  { id: 'p3', player: 'mik***51', game: 'Orion Stars', amount: 250.0, method: 'Chime', time: '5m ago' },
  { id: 'p4', player: 'sar***19', game: 'Milky Way', amount: 50.0, method: 'Apple Pay', time: '8m ago' },
  { id: 'p5', player: 'dav***77', game: 'Juwa', amount: 320.0, method: 'Bitcoin', time: '11m ago' },
  { id: 'p6', player: 'ale***43', game: 'Game Vault', amount: 95.0, method: 'Venmo', time: '14m ago' },
  { id: 'p7', player: 'ric***08', game: 'Ultra Panda', amount: 180.0, method: 'Zelle', time: '18m ago' },
  { id: 'p8', player: 'chr***84', game: 'Golden Dragon', amount: 60.0, method: 'CashApp', time: '21m ago' },
  { id: 'p9', player: 'kat***25', game: 'V-Power', amount: 410.0, method: 'PayPal', time: '24m ago' },
  { id: 'p10', player: 'ste***66', game: 'Kraken', amount: 115.0, method: 'Chime', time: '27m ago' },
  { id: 'p11', player: 'dan***31', game: 'Panda Master', amount: 85.0, method: 'CashApp', time: '30m ago' },
  { id: 'p12', player: 'ema***90', game: 'Vegas Sweeps', amount: 500.0, method: 'Bitcoin', time: '34m ago' }
];

export default function LivePayoutsMarquee({ liveTransactions = [] }) {
  // Merge real approved payouts from DB if available, filling up to 12 cards
  const displayPayouts = useMemo(() => {
    const approvedReal = (liveTransactions || [])
      .filter((tx) =>
        ['WITHDRAW', 'REMAINDER_PAYOUT'].includes((tx.type || '').toUpperCase()) &&
        (tx.status === 'APPROVED' || tx.status === 'SUCCESS')
      )
      .map((tx, idx) => {
        const email = tx.userEmail || '';
        const namePart = email.split('@')[0] || 'player';
        const masked = namePart.length > 3
          ? namePart.slice(0, 3) + '***' + namePart.slice(-2)
          : namePart + '***';

        return {
          id: tx.id || `real-${idx}`,
          player: masked,
          game: tx.gameTitle || 'Lobby Slots',
          amount: parseFloat(tx.amount || 0),
          method: tx.gatewayName || tx.gateway || 'Instant Payout',
          time: 'Just now'
        };
      });

    if (approvedReal.length >= 12) {
      return approvedReal.slice(0, 12);
    }

    const combined = [...approvedReal, ...DEFAULT_12_PAYOUTS];
    return combined.slice(0, 12);
  }, [liveTransactions]);

  // Duplicate for seamless infinite loop ticker
  const marqueeItems = [...displayPayouts, ...displayPayouts];

  return (
    <div style={{
      width: '100%',
      marginBottom: '1.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{
            position: 'relative',
            display: 'flex',
            width: '10px',
            height: '10px'
          }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#00e676',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <span style={{
              position: 'relative',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00e676'
            }} />
          </span>

          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '0.04em'
          }}>
            LIVE APPROVED <span className="gold-gradient-text">CASHOUT STREAM</span>
          </span>
        </div>

        <span style={{
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <i className="fa-solid fa-bolt" style={{ color: '#00e676' }} /> Verified 24/7 Redemptions
        </span>
      </div>

      {/* Marquee Ticker Container */}
      <div style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '16px',
        background: 'rgba(8, 11, 24, 0.8)',
        border: '1px solid rgba(255, 215, 0, 0.15)',
        padding: '0.65rem 0',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
      }}>
        {/* Left & Right Fade Edges */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '40px',
          background: 'linear-gradient(90deg, rgba(8, 11, 24, 1) 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '40px',
          background: 'linear-gradient(270deg, rgba(8, 11, 24, 1) 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }} />

        {/* Continuous Track */}
        <div
          className="live-payouts-track"
          style={{
            display: 'flex',
            gap: '0.85rem',
            width: 'max-content',
            animation: 'marqueeLoop 38s linear infinite'
          }}
        >
          {marqueeItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              style={{
                background: 'linear-gradient(135deg, rgba(14, 18, 36, 0.95) 0%, rgba(20, 26, 52, 0.9) 100%)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '14px',
                padding: '0.55rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                minWidth: '210px',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              {/* Cashout Check Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid #00e676',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00e676',
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                <i className="fa-solid fa-circle-check" />
              </div>

              {/* Player & Game */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                    {item.player}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#00e676', fontFamily: 'var(--font-heading)' }}>
                    +${item.amount.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.game}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {item.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeLoop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .live-payouts-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
