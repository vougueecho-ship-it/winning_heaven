import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';
import PublicNavbar from '../../components/PublicNavbar';

export const metadata = {
  title: 'Terms & Conditions - Official Sweepstakes Rules | Winning Heaven',
  description:
    'Read the official Terms and Conditions, Sweepstakes Rules, No Purchase Necessary policy, eligibility rules (18+), and redemption policies for Winning Heaven.',
  keywords: [
    'Winning Heaven Terms and Conditions',
    'Sweepstakes Casino Rules',
    'No Purchase Necessary Policy',
    'Sweepstakes Eligibility 18+',
    'Cashout Redemption Terms'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/terms'
  },
  openGraph: {
    title: 'Terms & Conditions - Official Sweepstakes Rules | Winning Heaven',
    description: 'Official Terms & Conditions, No Purchase Necessary sweepstakes rules, and cashout redemption guidelines for Winning Heaven.',
    url: 'https://winningheaven.com/terms',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Winning Heaven Terms' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions | Winning Heaven',
    description: 'Official Sweepstakes Rules, No Purchase Necessary policy, and 18+ eligibility.',
    images: ['/winning_heaven_banner.png']
  }
};

const UPDATED_DATE = 'August 25, 2026';

const termsFaqs = [
  {
    q: 'Do I have to pay money to play sweepstakes games?',
    a: 'No! Winning Heaven operates under a strict "No Purchase Necessary" promotional sweepstakes model. Players can claim $3 signup freeplay, daily login coins, or send a free mail-in entry request (AMOE).'
  },
  {
    q: 'What is the age requirement to play on Winning Heaven?',
    a: 'Players must be at least 18 years of age (or legal age of majority in your jurisdiction). Account registration by individuals under 18 is strictly prohibited.'
  },
  {
    q: 'What is the difference between Gold Coins and Sweepstakes Coins?',
    a: 'Gold Coins are for non-redeemable fun play. Sweepstakes Coins are promotional credits earned during gameplay that can be redeemed for cashout payouts once minimum threshold requirements are met.'
  },
  {
    q: 'Can a player create multiple accounts?',
    a: 'No. Players are strictly limited to one (1) account per person. Creating duplicate accounts to exploit freeplay bonuses results in immediate permanent account termination.'
  }
];

export default function TermsPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Winning Heaven Terms and Conditions',
      url: 'https://winningheaven.com/terms',
      description: 'Official Terms of Service, Sweepstakes Rules, and Redemption Conditions for Winning Heaven players.'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: termsFaqs.map((faq) => ({
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
          name: 'Terms & Conditions',
          item: 'https://winningheaven.com/terms'
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
      <PublicNavbar currentPath="/terms" />

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            LEGAL & COMPLIANCE
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.6rem' }}>
            <span className="gold-gradient-text">TERMS &</span> <span className="cyan-gradient-text">CONDITIONS</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            Last Updated: {UPDATED_DATE} | Effective Immediately
          </p>
        </section>

        {/* Notice Alert Banner */}
        <div style={{ background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
          <p style={{ margin: 0, color: '#fcd34d', fontSize: '0.92rem', lineHeight: 1.6, fontWeight: 600 }}>
            ⚠️ IMPORTANT NOTICE: PLEASE READ THESE TERMS CAREFULLY. WINNING HEAVEN OPERATES AS A SWEEPSTAKES PLATFORM UNDER A &quot;NO PURCHASE NECESSARY&quot; MODEL. BY CREATING AN ACCOUNT OR USING OUR SERVICES, YOU AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS LISTED BELOW.
          </p>
        </div>

        {/* Document Content Box */}
        <article style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', backdropFilter: 'blur(12px)', lineHeight: 1.8, fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', marginBottom: '3rem' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              1. Acceptance of Terms & Eligibility
            </h2>
            <p style={{ margin: '0 0 0.75rem' }}>
              By accessing or using the website (<code>winningheaven.com</code>), mobile applications, or player lobby, you confirm that you are at least <strong>18 years of age</strong> (or the legal age of majority in your jurisdiction) and possess the full legal authority to enter into this agreement.
            </p>
            <p style={{ margin: 0 }}>
              Access to Winning Heaven is void where prohibited by state, provincial, or local laws. It is your sole responsibility to ensure that your participation in online sweepstakes gaming complies with all applicable local statutes.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              2. Sweepstakes Model & &quot;No Purchase Necessary&quot; Policy
            </h2>
            <p style={{ margin: '0 0 0.75rem' }}>
              Winning Heaven is a promotional sweepstakes gaming platform. <strong>NO PURCHASE IS EVER NECESSARY</strong> to obtain free sweepstakes coins or enter game promotions:
            </p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.75rem' }}>
              <li><strong>Freeplay Signup Bonus:</strong> New registered users receive $3 in freeplay coins upon initial registration.</li>
              <li><strong>Daily Login Rewards:</strong> Registered players can claim daily promotional coins through the player lobby.</li>
              <li><strong>Alternative Method of Entry (AMOE):</strong> Players may request free sweepstakes coins by sending a written mail-in request to our operational address as specified in our sweepstakes rules.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              3. Account Registration & User Security
            </h2>
            <p style={{ margin: '0 0 0.75rem' }}>
              You agree to provide accurate, current, and complete information during registration. Each player is strictly limited to <strong>one (1) account</strong> across the Winning Heaven network.
            </p>
            <p style={{ margin: 0 }}>
              Creating multiple accounts, using false identities, or attempting to exploit freeplay signup bonuses across duplicate accounts will result in immediate permanent account termination and forfeiture of all accumulated balances.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              4. Coin Types & Payout Redemptions
            </h2>
            <p style={{ margin: '0 0 0.75rem' }}>
              The platform utilizes virtual currencies to facilitate gameplay:
            </p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.75rem' }}>
              <li><strong>Gold / Play Coins:</strong> Used exclusively for entertainment and non-redeemable fun play.</li>
              <li><strong>Sweepstakes Coins / Redeemable Winnings:</strong> Earned through promotional gameplay and eligible for cashout redemptions once minimum thresholds and wagering requirements are satisfied.</li>
            </ul>
            <p style={{ margin: 0 }}>
              Cashout redemptions are processed 24/7 via authorized payment services (Cash App, Venmo, Zelle, PayPal, Crypto). Winning Heaven reserves the right to verify player identity (KYC) prior to executing cashout redemptions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              5. Prohibited Conduct & Fraud Prevention
            </h2>
            <p style={{ margin: '0 0 0.75rem' }}>
              Players are strictly prohibited from engaging in automated bot play, exploits, software manipulation, chargeback fraud, or abusive behavior towards support staff.
            </p>
            <p style={{ margin: 0 }}>
              Winning Heaven utilizes automated risk mitigation and fraud detection algorithms. Any suspicious transaction or irregular gameplay will trigger account audit and suspension pending review.
            </p>
          </section>

          <section style={{ marginBottom: 0 }}>
            <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
              6. Contact & Disputes
            </h2>
            <p style={{ margin: 0 }}>
              For questions regarding these Terms or to resolve billing disputes, contact our compliance department at{' '}
              <a href="mailto:verified@winningheaven.com" style={{ color: '#fcd34d', fontWeight: 700 }}>
                verified@winningheaven.com
              </a>
              .
            </p>
          </section>
        </article>

        {/* Dedicated Terms FAQ Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Terms & Sweepstakes FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {termsFaqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx !== termsFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
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
