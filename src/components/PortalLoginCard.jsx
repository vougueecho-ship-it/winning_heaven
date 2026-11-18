'use client';

import React from 'react';

/**
 * Shared secure portal login shell — same layout as HQ admin login (responsive card, gold accents).
 */
export default function PortalLoginCard({
  portalTitle = 'DISTRIBUTOR OPERATIONS PORTAL',
  portalBadge = 'DISTRIBUTOR ACCESS GATEWAY',
  portalIcon = 'fa-handshake',
  loginError = '',
  onClearError,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  isSubmitting,
  submitLabel = 'SECURE LOGIN ACCESS',
  onSubmit,
  emailLabel = 'Email Address',
  emailPlaceholder = 'name@distributor.com'
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        position: 'relative',
        zIndex: 10,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(20, 26, 50, 0.9) 0%, rgba(4, 5, 11, 0.98) 70%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          background: 'rgba(10, 14, 30, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(255, 215, 0, 0.35)',
          borderRadius: '26px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 45px rgba(255, 200, 0, 0.18)',
          padding: '2.5rem 2.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)',
            boxShadow: '0 0 15px #ffd700'
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              margin: '0 auto 1.1rem auto',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(10, 14, 30, 0.8) 100%)',
              border: '1.5px solid var(--gold-primary, #ffd700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(255, 215, 0, 0.35)'
            }}
          >
            <i className={`fa-solid ${portalIcon}`} style={{ fontSize: '2rem', color: '#ffd700' }} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '20px',
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              color: '#00e676',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0.65rem'
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00e676',
                boxShadow: '0 0 8px #00e676',
                display: 'inline-block'
              }}
            />
            {portalBadge}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
              fontSize: '1.65rem',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 0.4rem 0',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            <span style={{ color: '#fff' }}>WINNING</span>{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ff9100 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              HEAVEN
            </span>
          </h1>

          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{portalTitle}</div>
        </div>

        {loginError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#ff6b6b',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-circle-exclamation" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.45rem'
              }}
            >
              {emailLabel}
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px'
              }}
            >
              <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: 14, color: '#ffd700', pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder={emailPlaceholder}
                value={email}
                onChange={(e) => {
                  onEmailChange(e.target.value);
                  onClearError?.();
                }}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.85rem 1rem 0.85rem 2.6rem',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.45rem'
              }}
            >
              Security Access Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px'
              }}
            >
              <i className="fa-solid fa-lock" style={{ position: 'absolute', left: 14, color: '#ffd700', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  onPasswordChange(e.target.value);
                  onClearError?.();
                }}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.85rem 2.6rem',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.95rem',
              background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
              border: 'none',
              borderRadius: '14px',
              color: '#04050b',
              fontSize: '0.95rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 8px 25px rgba(255, 170, 0, 0.4)'
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket" />
                <span>{submitLabel} &rarr;</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 600
          }}
        >
          <span>
            <i className="fa-solid fa-lock" style={{ color: '#ffd700', marginRight: 4 }} /> 256-Bit SSL
          </span>
          <span>
            <i className="fa-solid fa-shield-check" style={{ color: '#00e676', marginRight: 4 }} /> Scoped Data Access
          </span>
        </div>
      </div>
    </div>
  );
}