import React from 'react';

export default function LoadingOverlay({ active }) {
  if (!active) return null;

  return (
    <div
      className="loading-overlay active"
      aria-hidden="false"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 5, 11, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Glowing 3D Celestial Emblem Badge */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          
          {/* Dual Outer Energy Halo Rings */}
          <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--gold-primary)', borderBottomColor: 'var(--cyan-primary)', animation: 'spinClockwise 2s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1.5px dashed var(--gold-primary)', opacity: 0.6, animation: 'spinCounter 6s linear infinite' }} />

          {/* Logo Frame */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#000', border: '2px solid var(--gold-primary)', boxShadow: '0 0 30px rgba(255,200,0,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/winning_heaven_logo.png" alt="Winning Heaven Logo" style={{ width: '90%', height: '90%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,200,0,0.6))' }} />
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          <span className="gold-gradient-text">WINNING</span> <span className="cyan-gradient-text">HEAVEN</span>
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', letterSpacing: '0.05em' }}>
          Securing Celestial Connection...
        </p>
      </div>
    </div>
  );
}
