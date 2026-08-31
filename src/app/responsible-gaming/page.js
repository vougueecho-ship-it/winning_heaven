import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';
import PublicNavbar from '../../components/PublicNavbar';

export const metadata = {
  title: 'Responsible Gaming & 18+ Player Safety | Winning Heaven',
  description:
    'Winning Heaven is committed to responsible sweepstakes play. Learn about 18+ age verification, spending controls, self-exclusion options, and player protection.',
  keywords: [
    'Responsible Gaming Sweepstakes',
    'Player Protection',
    '18+ Sweepstakes Casino',
    'Self Exclusion Casino',
    'Winning Heaven safety'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/responsible-gaming'
  },
  openGraph: {
    title: 'Responsible Gaming & 18+ Player Safety | Winning Heaven',
    description: 'Player safety guidelines, 18+ age verification, self-exclusion tools, and responsible gaming resources at Winning Heaven.',
    url: 'https://winningheaven.com/responsible-gaming',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Responsible Gaming' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Responsible Gaming | Winning Heaven',
    description: 'Player safety policies, 18+ age verification, and self-exclusion guidance.',
    images: ['/winning_heaven_banner.png']
  }
};

const rgFaqs = [
  {
    q: 'What is Winning Heaven’s age restriction policy?',
    a: 'Winning Heaven strictly enforces a minimum age requirement of 18 years old (or legal age of majority in your jurisdiction). Account registration by anyone under 18 is strictly prohibited.'
  },
  {
    q: 'How can I request self-exclusion or a temporary account break?',
    a: 'If you wish to take a temporary break or permanently exclude yourself from gaming, contact verified@winningheaven.com or message 24/7 live support in your lobby. Our staff will immediately lock your account upon request.'
  },
  {
    q: 'Are sweepstakes coins meant for financial investment?',
    a: 'No! Sweepstakes gaming is intended strictly for entertainment purposes. Gold coins and promotional sweepstakes coins should never be viewed as a financial investment or income source.'
  }
];

export default function ResponsibleGamingPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Winning Heaven Responsible Gaming Statement',
      url: 'https://winningheaven.com/responsible-gaming',
      description: 'Player protection policies, age restrictions, and responsible gaming resources for Winning Heaven users.'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: rgFaqs.map((faq) => ({
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
          name: 'Responsible Gaming',
          item: 'https://winningheaven.com/responsible-gaming'
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
      <PublicNavbar currentPath="/responsible-gaming" />

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            PLAYER PROTECTION & FAIR PLAY
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.6rem' }}>
            <span className="gold-gradient-text">RESPONSIBLE</span> <span className="cyan-gradient-text">GAMING POLICY</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            At Winning Heaven, we prioritize player safety and responsible entertainment. We want all players to enjoy sweepstakes games in a secure, transparent, and controlled environment.
          </p>
        </section>

        {/* Core Pillars */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', backdropFilter: 'blur(12px)', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1rem' }}>
            Our Responsible Gaming Commitment
          </h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 1.25rem' }}>
            Sweepstakes games should always remain a form of lighthearted entertainment. While our platform offers real cashout redemptions, gaming should never interfere with personal obligations, daily responsibilities, or financial stability.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.4rem' }}>🔞 18+ Age Limit</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
                Strict age verification filters prevent underage individuals from registering or accessing game platforms.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.4rem' }}>🛡️ Self-Exclusion</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
                Players can request temporary cool-off breaks (7 days to 30 days) or permanent account closure at any time.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.4rem' }}>💰 Budget Awareness</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
                Always establish a personal spending limit before purchasing coin packages. Never play with money needed for essential living expenses.
              </p>
            </div>
          </div>
        </section>

        {/* Warning Signs Checklist */}
        <section style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '24px', padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ color: '#f87171', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1rem' }}>
            Recognizing Signs of Problem Gaming
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '0 0 1rem' }}>
            Ask yourself the following questions to assess if gaming may be affecting your life negatively:
          </p>
          <ul style={{ paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            <li>Do you spend more money on coin packages than you originally intended?</li>
            <li>Do you chase losses by immediately purchasing more coins after a losing session?</li>
            <li>Do you play sweepstakes games to escape stress, anxiety, or personal difficulties?</li>
            <li>Has gaming caused arguments with family members or friends regarding time or money?</li>
            <li>Do you neglect work, school, or family commitments to continue playing?</li>
          </ul>
          <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem', color: '#fca5a5', fontWeight: 600 }}>
            If you answered &quot;yes&quot; to any of these questions, we strongly encourage taking an immediate break or requesting self-exclusion via customer support.
          </p>
        </section>

        {/* Responsible Gaming FAQ */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'var(--cyan-glow, #38bdf8)', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.25rem', textAlign: 'center' }}>
            Responsible Gaming FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {rgFaqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i !== rgFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.02rem', color: 'var(--gold-primary, #fcd34d)', fontWeight: 700, margin: '0 0 0.4rem' }}>Q: {faq.q}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PlayerFooter />
    </main>
  );
}
