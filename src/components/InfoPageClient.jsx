'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { getInfoChannels, isInfoPageEnabled } from '../lib/infoPage';
import PublicNavbar from './PublicNavbar';
import PlayerFooter from './player/PlayerFooter';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function InfoPageClient() {
  const { data } = useSWR('/api/settings/frontend', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });
  const settings = data?.settings || {};
  const channels = useMemo(() => getInfoChannels(settings), [settings]);
  const pageEnabled = isInfoPageEnabled(settings);
  const emailChannel = channels.find((c) => c.id === 'email');
  const supportEmail = emailChannel?.handle || 'support@winningheaven.com';
  const supportMailto = emailChannel?.href || `mailto:${supportEmail}`;

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)' }}>
      <PublicNavbar currentPath="/info" />

      <div className="info-page-inner" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>

        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#000', border: '2px solid var(--gold-primary)', boxShadow: '0 0 25px rgba(255,200,0,0.4)', padding: '0.5rem', overflow: 'hidden' }}>
            <Image
              src="/winning_heaven_logo.png"
              alt="Winning Heaven Logo"
              width={80}
              height={80}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              priority
            />
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            <span className="gold-gradient-text">WINNING</span> <span className="cyan-gradient-text">HEAVEN</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {settings.infoTagline || 'CELESTIAL CASINO. INSTANT CASHOUTS.'}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0.5rem 0' }}>
            {settings.infoLead ||
              'Official channels for updates, community, and player support. Reach us anytime — we are here to help you win big.'}
          </p>
        </section>

        {!pageEnabled ? (
          <section className="badge-red" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> This info page is currently turned off by the administrator.
          </section>
        ) : (
          <>
            <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {channels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.href}
                  target={channel.id === 'email' ? undefined : '_blank'}
                  rel={channel.id === 'email' ? undefined : 'noopener noreferrer'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '14px',
                    padding: '1rem 1.25rem',
                    color: '#fff',
                    textDecoration: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <i className={channel.icon} style={{ fontSize: '1.2rem', color: 'var(--gold-primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>{channel.label}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{channel.handle}</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} />
                </a>
              ))}
            </section>

            <section style={{ padding: '1rem', background: 'rgba(255,200,0,0.06)', border: '1px solid var(--card-border)', borderRadius: '14px', fontSize: '0.82rem' }}>
              <i className="fa-solid fa-headset" style={{ color: 'var(--gold-primary)', marginRight: '0.4rem' }} />
              <span>For account help, deposits, or withdrawals, email support at </span>
              <a href={supportMailto} style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>{supportEmail}</a>
            </section>

            <section style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'left' }}>
              <h2 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', textAlign: 'center' }}>
                Player Support FAQ
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>Q: How quickly does support reply?</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Our 24/7 support team replies within 2-5 minutes via live chat and email.</span>
                </div>
                <div>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>Q: What hours are cashouts processed?</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Cashouts are processed 24 hours a day, 7 days a week, 365 days a year.</span>
                </div>
              </div>
            </section>
          </>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
            ENTER LOBBY
          </Link>
        </div>
      </div>

      <PlayerFooter />
    </main>
  );
}
