import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';

export const metadata = {
  title: 'Privacy Policy & Data Protection | Winning Heaven',
  description:
    'Read Winning Heaven’s official Privacy Policy. Learn how we collect, protect, and handle your data, push tokens, payment security, and privacy rights.',
  keywords: [
    'Winning Heaven Privacy Policy',
    'Data Protection Policy',
    'Sweepstakes Player Privacy',
    'Meta Pixel Disclosures',
    'Account Data Security'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/privacy'
  },
  openGraph: {
    title: 'Privacy Policy & Data Protection | Winning Heaven',
    description: 'Comprehensive Privacy Policy detailing user data rights, security practices, and privacy commitments for Winning Heaven players.',
    url: 'https://winningheaven.com/privacy',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Winning Heaven Privacy Policy' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy & Data Protection | Winning Heaven',
    description: 'User data protection policies and privacy rights.',
    images: ['/winning_heaven_banner.png']
  }
};

const UPDATED = 'August 25, 2026';
const SUPPORT_EMAIL = 'verified@winningheaven.com';

const privacyFaqs = [
  {
    q: 'How does Winning Heaven protect my payment and account data?',
    a: 'All data transmitted to and from Winning Heaven is encrypted using 256-Bit SSL/TLS technology. We store password hashes and transaction logs in secure databases with access controls.'
  },
  {
    q: 'Is my personal information sold to third parties?',
    a: 'No. We strictly DO NOT sell, rent, or trade player personal information to third-party advertisers or data brokers.'
  },
  {
    q: 'How can I request permanent deletion of my account data?',
    a: 'You can submit an account deletion request through our Account Deletion page (/account-deletion) or by emailing verified@winningheaven.com.'
  },
  {
    q: 'Why does the mobile app ask for push notification permissions?',
    a: 'Push notifications are used exclusively to alert you when your coin deposit is credited, your instant cashout is completed, or special promo bonuses become active.'
  }
];

export default function PrivacyPolicyPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Winning Heaven Privacy Policy',
      url: 'https://winningheaven.com/privacy',
      description: 'Privacy Policy and Data Protection rules for Winning Heaven players.'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: privacyFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a
        }
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://winningheaven.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Privacy Policy',
          item: 'https://winningheaven.com/privacy'
        }
      ]
    }
  ];

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary, #04050b)', color: 'var(--text-light, #fff)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Navigation Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/terms" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Terms & Conditions
            </Link>
            <Link href="/account-deletion" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Delete Account
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            PLAYER DATA PROTECTION
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.6rem' }}>
            <span className="gold-gradient-text">PRIVACY</span> <span className="cyan-gradient-text">POLICY</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            Last updated: {UPDATED} | Effective Immediately
          </p>
        </section>

        {/* Document Box */}
        <article
          style={{
            background: 'var(--card-bg, rgba(15,23,42,0.65))',
            border: '1px solid var(--card-border, rgba(252,211,77,0.2))',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(12px)',
            lineHeight: 1.8,
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '3rem'
          }}
        >
          <p style={{ margin: '0 0 1.5rem' }}>
            This Privacy Policy explains how Winning Heaven (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and safeguards your information when you visit our website (<code>winningheaven.com</code>), mobile player lobby, or mobile apps. We treat your privacy with highest priority and enforce industry-standard security protocols.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              1. Age Restriction & Eligibility
            </h2>
            <p style={{ margin: 0 }}>
              The Service is intended strictly for adults aged <strong>18 years or older</strong>. We do not knowingly collect personal information from individuals under 18. If we identify that account data belongs to a minor, it is immediately deleted.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              2. Information We Collect
            </h2>
            <ul style={{ paddingLeft: '1.4rem', margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Account Credentials:</strong> Full name, email address, password hashes, or Google OAuth account profile data.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Financial & Transaction Data:</strong> Transaction ledger entries, coin purchase records, cashout redemption receipts, payment tag identifiers (Cash App, Venmo, Zelle, PayPal), and uploaded proof screenshots.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Device & Notification Identifiers:</strong> Web Push notification tokens, browser user-agent strings, and IP address logs for security auditing.
              </li>
              <li>
                <strong>Analytics & Pixel Tracking:</strong> Meta Pixel parameters to measure advertising conversion efficacy and campaign performance.
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              3. How We Use Your Data
            </h2>
            <p style={{ margin: '0 0 0.6rem' }}>We utilize collected data strictly for operational, legal, and security purposes:</p>
            <ul style={{ paddingLeft: '1.4rem', margin: 0 }}>
              <li>Processing coin loads, $3 freeplay signup bonuses, and 24/7 instant cashout redemptions.</li>
              <li>Sending transaction confirmation updates and optional push alerts regarding bonus promotions.</li>
              <li>Preventing bonus exploitation, multi-account abuse, and fraudulent activity.</li>
              <li>Ensuring legal compliance with sweepstakes gaming regulations.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              4. Data Sharing & Security
            </h2>
            <p style={{ margin: '0 0 0.6rem' }}>
              We do <strong>NOT</strong> sell, rent, or trade player personal information to third-party advertisers. Information is disclosed only to essential service providers (e.g., cloud hosting, push servers, payment processing gateways) under strict confidentiality agreements.
            </p>
            <p style={{ margin: 0 }}>
              All data transmitted to and from Winning Heaven is encrypted using <strong>256-Bit SSL/TLS technology</strong>.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              5. Your Rights & Account Deletion
            </h2>
            <p style={{ margin: 0 }}>
              You have the right to request access to, correction of, or permanent deletion of your account data at any time. You can submit a deletion request through our dedicated{' '}
              <Link href="/account-deletion" style={{ color: '#fcd34d', fontWeight: 700 }}>
                Account Deletion Page
              </Link>{' '}
              or by emailing{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fcd34d', fontWeight: 700 }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              6. Contact Support
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions regarding this Privacy Policy, contact our privacy team at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fcd34d', fontWeight: 700 }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </article>

        {/* Dedicated Privacy FAQ Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Privacy & Data Protection FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {privacyFaqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx !== privacyFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>
                  Q: {faq.q}
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PlayerFooter />
    </main>
  );
}
