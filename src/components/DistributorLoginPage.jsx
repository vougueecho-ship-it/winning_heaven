'use client';

import React from 'react';

/**
 * Full-screen distributor partner login — distinct from HQ staff login.
 */
export default function DistributorLoginPage({
  loginError,
  onClearError,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  isSubmitting,
  onSubmit
}) {
  return (
    <div className="distributor-login-shell">
      <aside className="distributor-login-shell__brand" aria-hidden="false">
        <img src="/winning_heaven_logo.png" alt="" className="distributor-login-shell__logo" />
        <p className="distributor-login-shell__eyebrow">Partner network</p>
        <h1 className="distributor-login-shell__title">
          Winning <span className="gold-gradient-text">Heaven</span>
        </h1>
        <p className="distributor-login-shell__lead">
          Real-time operations for your players only — deposits, withdrawals, game accounts, promotions, and support in one secure workspace.
        </p>
        <ul className="distributor-login-shell__features">
          <li>
            <i className="fa-solid fa-bolt" aria-hidden />
            Live badges &amp; SSE updates
          </li>
          <li>
            <i className="fa-solid fa-users" aria-hidden />
            Scoped player &amp; commission data
          </li>
          <li>
            <i className="fa-solid fa-link" aria-hidden />
            Personal signup link for your network
          </li>
          <li>
            <i className="fa-solid fa-mobile-screen" aria-hidden />
            Distributor APK available inside portal
          </li>
        </ul>
        <div className="distributor-login-shell__trust">
          <span>
            <i className="fa-solid fa-lock" /> SSL encrypted
          </span>
          <span>
            <i className="fa-solid fa-shield-halved" /> HQ-audited access
          </span>
        </div>
      </aside>

      <main className="distributor-login-shell__panel">
        <div className="distributor-login-card">
          <div className="distributor-login-card__badge">
            <span className="distributor-login-card__pulse" />
            Distributor gateway
          </div>
          <h2 className="distributor-login-card__heading">Sign in to your panel</h2>
          <p className="distributor-login-card__sub">Use the email and password issued by Winning Heaven HQ.</p>

          {loginError ? (
            <div className="distributor-login-card__error" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden />
              {loginError}
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate className="distributor-login-card__form">
            <label className="distributor-login-card__label" htmlFor="dist-login-email">
              Partner email
            </label>
            <div className="distributor-login-card__field">
              <i className="fa-solid fa-envelope" aria-hidden />
              <input
                id="dist-login-email"
                type="email"
                autoComplete="username"
                placeholder="partner@email.com"
                value={email}
                onChange={(e) => {
                  onEmailChange(e.target.value);
                  onClearError?.();
                }}
                required
              />
            </div>

            <label className="distributor-login-card__label" htmlFor="dist-login-pass">
              Password
            </label>
            <div className="distributor-login-card__field">
              <i className="fa-solid fa-key" aria-hidden />
              <input
                id="dist-login-pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  onPasswordChange(e.target.value);
                  onClearError?.();
                }}
                required
              />
              <button type="button" className="distributor-login-card__eye" onClick={onTogglePassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            <button type="submit" className="distributor-login-card__submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket" aria-hidden />
                  Enter distributor portal
                </>
              )}
            </button>
          </form>

          <p className="distributor-login-card__footer">
            Need access? Contact <strong>Winning Heaven HQ</strong> to onboard as a distributor partner.
          </p>
        </div>
      </main>
    </div>
  );
}