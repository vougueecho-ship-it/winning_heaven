'use client';

import React, { useState } from 'react';

export default function AppInstallModal({
  isOpen,
  onClose,
  androidAppUrl = '/downloads/winning-heaven.apk',
  showToast
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      if (showToast) showToast('Link copied! Open in Safari and tap Add to Home Screen.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (showToast) showToast('Open Safari and tap Share -> Add to Home Screen.', 'info');
    }
  };

  const handleIosShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Winning Heaven',
          text: 'Play Winning Heaven on your iPhone',
          url: window.location.origin
        });
        if (showToast) showToast('Tap "Add to Home Screen" in the share menu!', 'success');
        return;
      } catch (err) {
        if (String(err?.name || '').includes('Abort')) return;
      }
    }
    handleCopyLink();
  };

  const handleDownloadAndroid = () => {
    if (showToast) showToast('Downloading Android APK...', 'success');
    // Start direct download
    const a = document.createElement('a');
    a.href = androidAppUrl;
    a.download = 'winning-heaven.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="install-modal-backdrop" onClick={onClose}>
      <div
        className="install-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-modal-close"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <div className="install-header">
          <div className="app-badge-icon">
            <i className="fa-solid fa-mobile-screen-button" />
          </div>
          <div>
            <h2 className="install-title">INSTALL WINNING HEAVEN</h2>
            <p className="install-subtitle">Fast 1-tap setup &bull; Choose your phone below</p>
          </div>
        </div>

        {/* 2 Platform Options - Strictly Side by Side / Stacked Zero Scroll */}
        <div className="platforms-container">
          {/* 1. ANDROID CARD */}
          <div className="platform-card android-card">
            <div className="card-top-row">
              <div className="platform-icon android-glow">
                <i className="fa-brands fa-android" />
              </div>
              <div className="card-meta">
                <span className="platform-pill android-pill">ANDROID APK</span>
                <h3 className="platform-name">Android Device</h3>
              </div>
            </div>

            <p className="platform-desc">
              Direct APK for Samsung, Xiaomi, Motorola, Pixel & all Androids.
            </p>

            <button
              type="button"
              onClick={handleDownloadAndroid}
              className="btn-action-platform btn-android"
            >
              <i className="fa-solid fa-download" /> Download APK
            </button>
          </div>

          {/* 2. IPHONE / IOS CARD */}
          <div className="platform-card ios-card">
            <div className="card-top-row">
              <div className="platform-icon apple-glow">
                <i className="fa-brands fa-apple" />
              </div>
              <div className="card-meta">
                <span className="platform-pill apple-pill">IPHONE / IPAD</span>
                <h3 className="platform-name">Apple iOS</h3>
              </div>
            </div>

            <div className="ios-steps-row">
              <div className="ios-step-badge">
                <span className="step-num">1</span>
                <span>Share <i className="fa-solid fa-arrow-up-from-bracket" /></span>
              </div>
              <i className="fa-solid fa-arrow-right step-arrow" />
              <div className="ios-step-badge">
                <span className="step-num">2</span>
                <span>Add to Home <i className="fa-solid fa-plus-square" /></span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleIosShare}
              className="btn-action-platform btn-ios"
            >
              <i className="fa-solid fa-arrow-up-from-bracket" />
              {copied ? 'Link Copied!' : 'Add to Home Screen'}
            </button>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="install-footer">
          <i className="fa-solid fa-shield-halved" style={{ color: '#00e676' }} />
          <span>100% Free &amp; Secure &bull; Instant 24/7 Access</span>
        </div>
      </div>

      <style jsx>{`
        .install-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(2, 4, 10, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .install-modal-sheet {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(180deg, #0e122b 0%, #060918 100%);
          border: 1.5px solid rgba(255, 200, 0, 0.35);
          border-radius: 20px;
          padding: 1.15rem 1.15rem 0.95rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 200, 0, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          box-sizing: border-box;
          animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleUp {
          from { transform: scale(0.95) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .btn-modal-close {
          position: absolute;
          top: 0.65rem;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          font-size: 1.35rem;
          line-height: 1;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .btn-modal-close:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.6);
          color: #ef4444;
        }
        .install-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-right: 2rem;
        }
        .app-badge-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255, 200, 0, 0.2), rgba(255, 140, 0, 0.1));
          border: 1.5px solid var(--gold-primary, #ffd700);
          color: var(--gold-primary, #ffd700);
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(255, 200, 0, 0.25);
        }
        .install-title {
          font-family: var(--font-heading, sans-serif);
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.04em;
          margin: 0;
          line-height: 1.2;
        }
        .install-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted, #94a3b8);
          margin: 0.15rem 0 0;
        }
        .platforms-container {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .platform-card {
          background: rgba(14, 18, 42, 0.7);
          border-radius: 14px;
          padding: 0.75rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .android-card {
          border: 1.5px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.08);
        }
        .ios-card {
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.06);
        }
        .card-top-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .platform-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .android-glow {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }
        .apple-glow {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .card-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .platform-pill {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .android-pill {
          color: #22c55e;
        }
        .apple-pill {
          color: #e2e8f0;
        }
        .platform-name {
          font-family: var(--font-heading, sans-serif);
          font-size: 0.88rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          line-height: 1.15;
        }
        .platform-desc {
          font-size: 0.72rem;
          color: var(--text-muted, #94a3b8);
          margin: 0;
          line-height: 1.25;
        }
        .ios-steps-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          padding: 0.35rem 0.55rem;
        }
        .ios-step-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: #fff;
          font-weight: 600;
        }
        .step-num {
          background: var(--gold-primary, #ffd700);
          color: #000;
          font-weight: 900;
          font-size: 0.62rem;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .step-arrow {
          font-size: 0.65rem;
          color: var(--text-muted, #64748b);
        }
        .btn-action-platform {
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 0.55rem 0.75rem;
          font-family: var(--font-heading, sans-serif);
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
          box-sizing: border-box;
          transition: all 0.18s ease;
        }
        .btn-android {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #000;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.35);
        }
        .btn-android:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .btn-ios {
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
          color: #0b0f19;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.25);
        }
        .btn-ios:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .install-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          font-size: 0.68rem;
          color: var(--text-muted, #94a3b8);
          padding-top: 0.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
