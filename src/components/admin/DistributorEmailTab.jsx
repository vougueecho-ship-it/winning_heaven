'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function DistributorEmailTab({ distributorId, distributorName = '' }) {
  const { data, mutate, isLoading } = useSWR(
    distributorId ? `/api/distributors/email-settings?distributorId=${encodeURIComponent(distributorId)}` : null,
    fetcher
  );

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const signupLink =
    data?.signupLink ||
    (typeof window !== 'undefined' && distributorId
      ? `${window.location.origin}/?distributor=${encodeURIComponent(distributorId)}`
      : '');

  useEffect(() => {
    if (!data?.success) return;
    const es = data.emailSettings || {};
    setSmtpHost(es.smtpHost || '');
    setSmtpPort(es.smtpPort || 465);
    setSmtpUser(es.smtpUser || '');
    setSmtpPass(es.hasPassword ? '********' : '');
  }, [data]);

  const copyLink = async () => {
    if (!signupLink) return;
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(signupLink);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!distributorId) return;
    setSaving(true);
    setMsg('');
    try {
      const emailSettings = {
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser.trim(),
        ...(smtpPass && smtpPass !== '********' ? { smtpPass } : {})
      };
      const res = await fetch('/api/distributors/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId, emailSettings })
      });
      const json = await res.json();
      setMsgOk(json.success);
      setMsg(json.message || (json.success ? 'Saved.' : 'Save failed.'));
      if (json.success) mutate();
    } catch {
      setMsgOk(false);
      setMsg('Connection error.');
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (sendTest) => {
    setTesting(true);
    setMsg('');
    try {
      const res = await fetch('/api/distributors/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributorId,
          action: sendTest ? 'send_test' : 'verify',
          testEmail: sendTest ? smtpUser || undefined : undefined
        })
      });
      const json = await res.json();
      setMsgOk(json.success);
      setMsg(json.message || '');
    } catch {
      setMsgOk(false);
      setMsg('Test failed — check connection.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', maxWidth: 640 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
          <i className="fa-solid fa-envelope-circle-check gold-text" /> Player email (SMTP)
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.55 }}>
          OTP, promos, aur alerts aapke players ko <strong>is Gmail / SMTP se</strong> jayengi — HQ sender use nahi hoga.
        </p>
      </div>

      {signupLink ? (
        <div
          style={{
            marginBottom: '1.15rem',
            padding: '0.85rem',
            borderRadius: '12px',
            border: '1px solid rgba(0,240,255,0.25)',
            background: 'rgba(0,240,255,0.06)'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cyan-primary)', marginBottom: '0.35rem' }}>
            AAPKA PLAYER SITE LINK
          </div>
          <SignupLinkRow link={signupLink} onCopy={copyLink} copied={copied} />
        </div>
      ) : null}

      {isLoading ? (
        <p style={{ opacity: 0.7 }}>Loading…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="admin-field-label">SMTP host</label>
              <input
                className="admin-input"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div>
              <label className="admin-field-label">Port</label>
              <input
                type="number"
                className="admin-input"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="admin-field-label">Sender email (SMTP username)</label>
              <input
                className="admin-input"
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="you@gmail.com"
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="admin-field-label">App password</label>
              <input
                type="password"
                className="admin-input"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder={data?.emailSettings?.hasPassword ? 'Leave ******** to keep current' : 'Gmail App Password'}
                autoComplete="new-password"
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                Gmail: 2FA on + App Password. Port 465 (SSL) ya 587 (TLS).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="submit" className="submit-btn" disabled={saving} style={{ minWidth: 140 }}>
              {saving ? 'Saving…' : 'Save SMTP'}
            </button>
            <button type="button" className="action-btn-sm" disabled={testing} onClick={() => runTest(false)}>
              Verify connection
            </button>
            <button type="button" className="action-btn-sm" disabled={testing} onClick={() => runTest(true)}>
              Send test email
            </button>
          </div>

          {msg ? (
            <p style={{ fontSize: '0.8rem', color: msgOk ? '#4ade80' : '#ff6b6b', margin: 0 }}>{msg}</p>
          ) : null}
        </form>
      )}
    </section>
  );
}

function SignupLinkRow({ link, onCopy, copied }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <code style={{ fontSize: '0.75rem', color: '#fff', wordBreak: 'break-all', flex: 1 }}>{link}</code>
      <button type="button" className="btn-gold-glow" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }} onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}