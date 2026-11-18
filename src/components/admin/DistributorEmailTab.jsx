'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

const emptyForm = {
  fromName: '',
  brandName: '',
  tagline: '',
  siteUrl: '',
  smtpHost: '',
  smtpPort: 465,
  smtpUser: '',
  smtpPass: '',
  replyTo: ''
};

export default function DistributorEmailTab({ distributorId, distributorName = '' }) {
  const { data, mutate, isLoading } = useSWR(
    distributorId ? `/api/distributors/email-settings?distributorId=${encodeURIComponent(distributorId)}` : null,
    fetcher
  );
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!data?.success) return;
    const es = data.emailSettings || {};
    setForm({
      fromName: es.fromName || distributorName || '',
      brandName: es.brandName || es.fromName || distributorName || '',
      tagline: es.tagline || '',
      siteUrl: es.siteUrl || '',
      smtpHost: es.smtpHost || '',
      smtpPort: es.smtpPort || 465,
      smtpUser: es.smtpUser || '',
      smtpPass: es.hasPassword ? '********' : '',
      replyTo: es.replyTo || es.smtpUser || ''
    });
  }, [data, distributorName]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!distributorId) return;
    setSaving(true);
    setMsg('');
    try {
      const payload = { ...form };
      if (payload.smtpPass === '********') delete payload.smtpPass;
      const res = await fetch('/api/distributors/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId, emailSettings: payload })
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
          testEmail: sendTest ? form.smtpUser || undefined : undefined
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
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', maxWidth: 820 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
          <i className="fa-solid fa-envelope-circle-check gold-text" /> Player email &amp; SMTP
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.55 }}>
          Aapke players ko jitni bhi emails jati hain (OTP, promos, alerts) <strong>sirf is SMTP se</strong> jayengi — Winning Heaven HQ sender use nahi hota.
          Neeche apna business email setup karein aur save karein.
        </p>
      </div>

      {isLoading ? (
        <p style={{ opacity: 0.7 }}>Loading settings…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="admin-field-label">Sender display name</label>
              <input className="admin-input" value={form.fromName} onChange={(e) => update('fromName', e.target.value)} placeholder="e.g. Lucky Slots VIP" />
            </div>
            <div>
              <label className="admin-field-label">Brand name in email header</label>
              <input className="admin-input" value={form.brandName} onChange={(e) => update('brandName', e.target.value)} placeholder="Same as sender or your portal name" />
            </div>
            <div>
              <label className="admin-field-label">Player site URL (optional)</label>
              <input className="admin-input" value={form.siteUrl} onChange={(e) => update('siteUrl', e.target.value)} placeholder="https://your-domain.com" />
            </div>
            <div>
              <label className="admin-field-label">Footer tagline (optional)</label>
              <input className="admin-input" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="24/7 support · Fast payouts" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.75rem' }}>
              <i className="fa-solid fa-server gold-text" /> SMTP credentials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-field-label">SMTP host</label>
                <input className="admin-input" value={form.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} placeholder="smtp.hostinger.com" required />
              </div>
              <div>
                <label className="admin-field-label">Port</label>
                <input type="number" className="admin-input" value={form.smtpPort} onChange={(e) => update('smtpPort', Number(e.target.value))} />
              </div>
              <div>
                <label className="admin-field-label">SMTP username / email</label>
                <input className="admin-input" value={form.smtpUser} onChange={(e) => update('smtpUser', e.target.value)} placeholder="you@yourdomain.com" required />
              </div>
              <div>
                <label className="admin-field-label">App password</label>
                <input
                  type="password"
                  className="admin-input"
                  value={form.smtpPass}
                  onChange={(e) => update('smtpPass', e.target.value)}
                  placeholder={data?.emailSettings?.hasPassword ? 'Leave ******** to keep current' : 'Gmail App Password'}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="admin-field-label">Reply-to (optional)</label>
                <input className="admin-input" value={form.replyTo} onChange={(e) => update('replyTo', e.target.value)} placeholder="Defaults to SMTP user" />
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
              Gmail: use an App Password (2FA on). Port 465 SSL or 587 TLS.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="submit" className="submit-btn" disabled={saving} style={{ minWidth: 140 }}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <button type="button" className="action-btn-sm" disabled={testing} onClick={() => runTest(false)}>
              Verify SMTP
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