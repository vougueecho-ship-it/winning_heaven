'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(6,8,18,0.85)',
  color: '#fff',
  fontSize: '0.88rem'
};

export default function DistributorPlayerSettingsTab({ distributorId, distributorName = '' }) {
  const { data, mutate, isLoading } = useSWR(
    distributorId ? `/api/distributors/player-settings?distributorId=${encodeURIComponent(distributorId)}` : null,
    fetcher
  );

  const [signupFreeplay, setSignupFreeplay] = useState(3);
  const [firstDepositBonus, setFirstDepositBonus] = useState(300);
  const [freeplayMaxCashout, setFreeplayMaxCashout] = useState(30);
  const [freeplayUnlockDeposit, setFreeplayUnlockDeposit] = useState(10);
  const [freeplayMinWithdraw, setFreeplayMinWithdraw] = useState(30);
  const [minimumDepositLimit, setMinimumDepositLimit] = useState(5);
  const [minimumWithdrawalLimit, setMinimumWithdrawalLimit] = useState(5);
  const [lobbyHeroPromo, setLobbyHeroPromo] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const o = data?.overrides || {};
  const preview = data?.mergedPreview || {};
    setSignupFreeplay(o.signupFreeplay ?? preview.signupFreeplay ?? 3);
    setFirstDepositBonus(o.firstDepositBonus ?? preview.firstDepositBonus ?? 300);
    setFreeplayMaxCashout(o.freeplayMaxCashout ?? preview.freeplayMaxCashout ?? 30);
    setFreeplayUnlockDeposit(o.freeplayUnlockDeposit ?? preview.freeplayUnlockDeposit ?? 10);
    setFreeplayMinWithdraw(o.freeplayMinWithdraw ?? preview.freeplayMinWithdraw ?? 30);
    setMinimumDepositLimit(o.minimumDepositLimit ?? preview.minimumDepositLimit ?? 5);
    setMinimumWithdrawalLimit(o.minimumWithdrawalLimit ?? preview.minimumWithdrawalLimit ?? 5);
    setLobbyHeroPromo(o.lobbyHeroPromo ?? preview.lobbyHeroPromo ?? '');
  }, [data]);

  const signupLink = data?.signupLink || (typeof window !== 'undefined' && distributorId
    ? `${window.location.origin}/?distributor=${encodeURIComponent(distributorId)}`
    : '');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!distributorId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/distributors/player-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributorId,
          playerSettings: {
            signupFreeplay: Number(signupFreeplay),
            firstDepositBonus: Number(firstDepositBonus),
            freeplayMaxCashout: Number(freeplayMaxCashout),
            freeplayUnlockDeposit: Number(freeplayUnlockDeposit),
            freeplayMinWithdraw: Number(freeplayMinWithdraw),
            minimumDepositLimit: Number(minimumDepositLimit),
            minimumWithdrawalLimit: Number(minimumWithdrawalLimit),
            lobbyHeroPromo: lobbyHeroPromo.trim()
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        await mutate();
        alert('Saved — your players will see these rules in the lobby (not HQ players).');
      } else {
        alert(json.message || 'Save failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="admin-section-card" style={{ padding: '1.25rem', maxWidth: '720px' }}>
      <h2 style={{ color: 'var(--gold-primary)', margin: '0 0 0.35rem', fontFamily: 'var(--font-heading)' }}>
        Player Rules &amp; Bonuses
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
        These settings apply only to players under <strong style={{ color: '#fff' }}>{distributorName || 'your office'}</strong>.
        Main HQ players still use Super Admin Frontend CMS — they do not see your numbers here.
      </p>

      {signupLink && (
        <div style={{ marginBottom: '1.15rem', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.25)', background: 'rgba(0,240,255,0.06)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cyan-primary)', marginBottom: '0.35rem' }}>PLAYER SIGNUP LINK</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <code style={{ fontSize: '0.75rem', color: '#fff', wordBreak: 'break-all', flex: 1 }}>{signupLink}</code>
            <button type="button" className="btn-gold-glow" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }} onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Share this link so new signups are tied to your office and live chat routes to you.
          </p>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Signup freeplay ($)
              <input type="number" step="0.01" style={inputStyle} value={signupFreeplay} onChange={(e) => setSignupFreeplay(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              First deposit bonus %
              <input type="number" style={inputStyle} value={firstDepositBonus} onChange={(e) => setFirstDepositBonus(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Freeplay max cashout ($)
              <input type="number" step="0.01" style={inputStyle} value={freeplayMaxCashout} onChange={(e) => setFreeplayMaxCashout(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Freeplay unlock deposit ($)
              <input type="number" step="0.01" style={inputStyle} value={freeplayUnlockDeposit} onChange={(e) => setFreeplayUnlockDeposit(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Freeplay min withdraw ($)
              <input type="number" step="0.01" style={inputStyle} value={freeplayMinWithdraw} onChange={(e) => setFreeplayMinWithdraw(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Min deposit ($)
              <input type="number" step="0.01" style={inputStyle} value={minimumDepositLimit} onChange={(e) => setMinimumDepositLimit(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Min withdrawal ($)
              <input type="number" step="0.01" style={inputStyle} value={minimumWithdrawalLimit} onChange={(e) => setMinimumWithdrawalLimit(e.target.value)} />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lobby promo headline (your players only)
            <input type="text" style={inputStyle} value={lobbyHeroPromo} onChange={(e) => setLobbyHeroPromo(e.target.value)} placeholder="e.g. GET 200% BONUS ON FIRST DEPOSIT" />
          </label>
          <button type="submit" className="btn-gold-glow" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.65rem 1.2rem' }}>
            {saving ? 'Saving…' : 'Save player rules'}
          </button>
        </form>
      )}
    </div>
  );
}