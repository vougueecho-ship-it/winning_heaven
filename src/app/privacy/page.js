import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Winning Heaven',
  description:
    'How Winning Heaven collects, uses, and protects your information across our website and mobile app.'
};

const UPDATED = 'August 10, 2026';
const SUPPORT_EMAIL = 'support@winningheaven.com';

const sectionStyle = { marginTop: '1.75rem' };
const headingStyle = {
  color: 'var(--gold-primary)',
  fontSize: '1.05rem',
  fontWeight: 700,
  margin: '0 0 0.5rem',
  letterSpacing: '0.02em'
};
const paraStyle = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  margin: '0 0 0.6rem'
};
const listStyle = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  margin: '0 0 0.6rem',
  paddingLeft: '1.2rem'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      <div className="info-page-inner" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to login
          </Link>
        </header>

        <section style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            <span className="gold-gradient-text">PRIVACY</span> <span className="cyan-gradient-text">POLICY</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 700 }}>WINNING HEAVEN</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Last updated: {UPDATED}
          </p>
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
            This Privacy Policy explains how Winning Heaven (&quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) collects, uses, and protects your information when you use our website
            (<a href="https://winningheaven.com" style={{ color: 'var(--gold-primary)' }}>winningheaven.com</a>)
            and our mobile application (together, the &quot;Service&quot;). By using the Service you
            agree to the practices described below.
          </p>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>1. Who can use the Service</h2>
            <p style={paraStyle}>
              The Service is intended only for adults aged 18 years or older. It is not directed to
              children, and we do not knowingly collect information from anyone under 18. If we learn
              that we have collected such data, we will delete it.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>2. Information we collect</h2>
            <ul style={listStyle}>
              <li>
                <strong>Account details:</strong> name and email address you provide, or that we
                receive from Google Sign-In when you choose to log in with Google.
              </li>
              <li>
                <strong>Activity data:</strong> game account requests, coin balances, deposit and
                withdrawal transaction records, referral information, and support messages you send
                us.
              </li>
              <li>
                <strong>Device &amp; notification data:</strong> a push-notification token and basic
                device/user-agent information so we can send you alerts you have enabled.
              </li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>3. Contact us</h2>
            <p style={paraStyle}>
              If you have any questions about this Privacy Policy or your data, contact us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--gold-primary)' }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </article>

        <footer style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
            ENTER LOBBY
          </Link>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>© {new Date().getFullYear()} Winning Heaven</p>
        </footer>
      </div>
    </main>
  );
}
