import Link from 'next/link';

export const metadata = {
  title: 'Account Deletion Request | Winning Heaven',
  description:
    'Request deletion of your Winning Heaven account and associated personal data.',
  alternates: {
    canonical: 'https://winningheaven.com/account-deletion'
  }
};

const SUPPORT_EMAIL = 'verified@winningheaven.com';

const paraStyle = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  margin: '0 0 0.75rem'
};

const listStyle = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  margin: '0 0 0.75rem',
  paddingLeft: '1.2rem'
};

export default function AccountDeletionPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Winning Heaven Account Deletion Request',
    url: 'https://winningheaven.com/account-deletion',
    description: 'Instructions on how to request account and data deletion.'
  };

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="info-page-inner" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to login
          </Link>
        </header>

        <section style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            <span className="gold-gradient-text">ACCOUNT</span> <span className="cyan-gradient-text">DELETION</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 700 }}>WINNING HEAVEN</p>
        </section>

        <article
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            backdropFilter: 'var(--glass-blur)'
          }}
        >
          <p style={paraStyle}>
            You can request deletion of your Winning Heaven account and associated personal data at
            any time. This page explains how to submit that request for the website and the mobile
            app.
          </p>

          <h2
            style={{
              color: 'var(--gold-primary)',
              fontSize: '1.05rem',
              fontWeight: 700,
              margin: '1.25rem 0 0.5rem'
            }}
          >
            How to request deletion
          </h2>
          <ol style={listStyle}>
            <li>
              Email us from the same email address registered on your account:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`} style={{ color: 'var(--gold-primary)' }}>
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              Use subject line: <strong style={{ color: '#fff' }}>Account deletion request</strong>
            </li>
            <li>
              Include your registered name and confirm that you want the account permanently deleted.
            </li>
          </ol>

          <p style={{ ...paraStyle, marginBottom: 0 }}>
            Privacy policy:{' '}
            <Link href="/privacy" style={{ color: 'var(--gold-primary)' }}>
              https://winningheaven.com/privacy
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
