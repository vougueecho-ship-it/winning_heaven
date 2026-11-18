'use client';

import React, { useMemo, useState } from 'react';
import PanelModalBackdrop from '../PanelModalBackdrop';
import {
  buildDistributorPortalUrl,
  buildDistributorWhatsAppMessage,
  buildPlayerSignupUrl
} from '../../lib/distributorOnboardingMessage';

export default function DistributorOnboardKitModal({ kit, onClose }) {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedPlayer, setCopiedPlayer] = useState(false);

  const portalUrl = useMemo(() => buildDistributorPortalUrl(), []);
  const playerUrl = useMemo(() => buildPlayerSignupUrl(kit?.id), [kit?.id]);

  const whatsappMessage = useMemo(
    () =>
      buildDistributorWhatsAppMessage({
        name: kit?.name || 'Partner',
        email: kit?.email || '',
        password: kit?.password || '',
        distributorId: kit?.id || '',
        type: kit?.type || 'A',
        portalUrl,
        playerUrl
      }),
    [kit, portalUrl, playerUrl]
  );

  if (!kit) return null;

  const copyText = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'wa') {
        setCopiedWhatsApp(true);
        setTimeout(() => setCopiedWhatsApp(false), 2500);
      } else if (which === 'portal') {
        setCopiedPortal(true);
        setTimeout(() => setCopiedPortal(false), 2000);
      } else if (which === 'player') {
        setCopiedPlayer(true);
        setTimeout(() => setCopiedPlayer(false), 2000);
      }
    } catch {
      alert('Copy failed — select text manually.');
    }
  };

  return (
    <PanelModalBackdrop onClick={onClose}>
      <div
        className="dist-onboard-kit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dist-onboard-kit-title"
      >
        <div className="dist-onboard-kit-modal__header">
          <div>
            <h3 id="dist-onboard-kit-title">
              <i className="fa-brands fa-whatsapp" aria-hidden />
              Partner welcome kit
            </h3>
            <p>Send this to <strong>{kit.name}</strong> — portal login, player link, and credentials in one message.</p>
          </div>
          <button type="button" className="dist-onboard-kit-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="dist-onboard-kit-modal__grid">
          <style>{`
            .dist-onboard-kit-modal {
              max-width: 680px;
              width: 92%;
              background: linear-gradient(155deg, rgba(16, 20, 40, 0.98) 0%, rgba(8, 10, 22, 0.99) 100%);
              border: 1px solid rgba(255, 215, 0, 0.3);
              border-radius: 20px;
              padding: 1.5rem 1.6rem;
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
              max-height: 90vh;
              overflow-y: auto;
            }
            .dist-onboard-kit-modal__header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 1rem;
              margin-bottom: 1.25rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .dist-onboard-kit-modal__header h3 {
              margin: 0;
              font-size: 1.15rem;
              font-weight: 900;
              color: #fff;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .dist-onboard-kit-modal__header h3 i { color: #25d366; }
            .dist-onboard-kit-modal__header p {
              margin: 0.4rem 0 0;
              font-size: 0.78rem;
              color: var(--text-muted);
              line-height: 1.45;
            }
            .dist-onboard-kit-modal__close {
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.12);
              color: #fff;
              width: 36px;
              height: 36px;
              border-radius: 10px;
              font-size: 1.25rem;
              cursor: pointer;
              flex-shrink: 0;
            }
            .dist-onboard-kit-modal__grid {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }
            .dist-onboard-kit-link-row {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              align-items: stretch;
            }
            .dist-onboard-kit-link-row input {
              flex: 1;
              min-width: 180px;
              font-size: 0.72rem;
              padding: 0.65rem 0.85rem;
              border-radius: 10px;
              border: 1px solid rgba(255, 215, 0, 0.22);
              background: rgba(0, 0, 0, 0.35);
              color: #fff;
              font-family: ui-monospace, monospace;
            }
            .dist-onboard-kit-mini-btn {
              padding: 0.55rem 0.85rem;
              border-radius: 10px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              background: rgba(255, 255, 255, 0.06);
              color: #fff;
              font-size: 0.68rem;
              font-weight: 800;
              cursor: pointer;
              white-space: nowrap;
            }
            .dist-onboard-kit-mini-btn.is-wa {
              background: rgba(37, 211, 102, 0.15);
              border-color: rgba(37, 211, 102, 0.45);
              color: #4ade80;
            }
            .dist-onboard-kit-preview {
              background: rgba(0, 0, 0, 0.4);
              border: 1px solid rgba(37, 211, 102, 0.25);
              border-radius: 14px;
              padding: 1rem 1.1rem;
              font-size: 0.74rem;
              line-height: 1.55;
              color: #e2e8f0;
              white-space: pre-wrap;
              max-height: 280px;
              overflow-y: auto;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .dist-onboard-kit-creds {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 0.65rem;
            }
            .dist-onboard-kit-cred {
              padding: 0.65rem 0.85rem;
              border-radius: 10px;
              background: rgba(255, 215, 0, 0.06);
              border: 1px solid rgba(255, 215, 0, 0.2);
            }
            .dist-onboard-kit-cred label {
              display: block;
              font-size: 0.62rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--text-muted);
              font-weight: 800;
              margin-bottom: 0.25rem;
            }
            .dist-onboard-kit-cred strong {
              font-size: 0.8rem;
              color: #fff;
              word-break: break-all;
            }
            .dist-onboard-kit-primary {
              width: 100%;
              padding: 0.85rem 1.2rem;
              border: none;
              border-radius: 12px;
              background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
              color: #fff;
              font-weight: 900;
              font-size: 0.85rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
            }
          `}</style>

          <KitField label="Distributor portal URL">
            <div className="dist-onboard-kit-link-row">
              <input readOnly value={portalUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="dist-onboard-kit-mini-btn" onClick={() => copyText(portalUrl, 'portal')}>
                {copiedPortal ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </KitField>

          <KitField label="Player signup URL (share with customers)">
            <div className="dist-onboard-kit-link-row">
              <input readOnly value={playerUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="dist-onboard-kit-mini-btn" onClick={() => copyText(playerUrl, 'player')}>
                {copiedPlayer ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </KitField>

          {kit.password ? (
            <div className="dist-onboard-kit-creds">
              <div className="dist-onboard-kit-cred">
                <label>Login email</label>
                <strong>{kit.email}</strong>
              </div>
              <div className="dist-onboard-kit-cred">
                <label>Password (included in WhatsApp)</label>
                <strong>{kit.password}</strong>
              </div>
              <div className="dist-onboard-kit-cred">
                <label>Partner ID</label>
                <strong>{kit.id}</strong>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Password is not shown for existing partners — use the message below and share credentials separately, or reset password in Edit.
            </p>
          )}

          <KitField label="WhatsApp message preview">
            <div className="dist-onboard-kit-preview">{whatsappMessage}</div>
          </KitField>

          <button type="button" className="dist-onboard-kit-primary" onClick={() => copyText(whatsappMessage, 'wa')}>
            <i className={`fa-brands ${copiedWhatsApp ? 'fa-check' : 'fa-whatsapp'}`} />
            {copiedWhatsApp ? 'Message copied — paste in WhatsApp' : 'Copy full WhatsApp message'}
          </button>

          <button type="button" className="submit-btn" onClick={onClose} style={{ width: '100%', marginTop: '0.25rem' }}>
            Done
          </button>
        </div>
      </div>
    </PanelModalBackdrop>
  );
}

function KitField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.65rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: '0.4rem'
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}