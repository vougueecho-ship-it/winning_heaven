import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';
import PublicNavbar from '../../components/PublicNavbar';

export const metadata = {
  title: 'How to Play & Instant Sweepstakes Cashout Guide | Winning Heaven',
  description:
    'Learn how online sweepstakes gaming works at Winning Heaven. How to claim $3 freeplay, load coins via Cash App/Venmo/Zelle, and redeem instant 24/7 cashouts.',
  keywords: [
    'instant sweepstakes casino cashout',
    '24/7 casino cashout',
    'fast sweepstakes redeem',
    'Cash App casino cashout',
    'how to play sweepstakes casino',
    'GameVault cashout guide',
    'Juwa 777 instant payout',
    'sweepstakes coins redemption'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/how-to-play'
  },
  openGraph: {
    title: 'How to Play & Instant Sweepstakes Cashout Guide | Winning Heaven',
    description: 'Complete guide to playing GameVault 777 & Juwa, loading coins, and cashing out real winnings 24/7 via Cash App.',
    url: 'https://winningheaven.com/how-to-play',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'How to Play Sweepstakes Games' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Play & Instant Sweepstakes Cashout Guide',
    description: 'Step-by-step guide to starting, playing, and cashing out instant winnings 24/7.',
    images: ['/winning_heaven_banner.png']
  }
};

const faqs = [
  {
    q: 'How does instant sweepstakes casino cashout work on Winning Heaven?',
    a: 'Winning Heaven operates as a central portal for top sweepstakes platforms like GameVault 777, Juwa, and Vegas Sweeps. Players register a free account, request game logins, load coins using fast payment gateways (Cash App, Zelle, Venmo, Crypto), and request instant 24/7 cashout redemptions whenever they win.'
  },
  {
    q: 'How do I claim the $3 Freeplay signup bonus?',
    a: 'Simply register a new account on Winning Heaven. Once logged in, go to the Freeplay section in your lobby, choose your preferred game platform (e.g. GameVault 777 or Juwa), and submit a request. Our 24/7 support team will generate your login credentials with $3 free bonus credits!'
  },
  {
    q: 'What payment methods are supported for 24/7 instant cashouts?',
    a: 'We support instant transactions via Cash App, Venmo, Zelle, PayPal, Apple Pay, and Cryptocurrency (Bitcoin/USDT). Cashout requests are processed 24/7 by our finance team within 5 to 15 minutes.'
  },
  {
    q: 'Is Winning Heaven legal to play in North America?',
    a: 'Yes! Winning Heaven operates under legal promotional sweepstakes structures ("No Purchase Necessary" model). Sweepstakes gaming is legal for adults aged 18+ across eligible US states and regions.'
  },
  {
    q: 'Can I play GameVault 777 and Juwa on my mobile phone?',
    a: 'Yes! You can play directly in your mobile browser, install our Android APK file (winning-heaven.apk), or add our iOS Progressive Web App (PWA) to your iPhone home screen for a 1-tap full-screen experience.'
  }
];

export default function HowToPlayPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
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
      '@type': 'HowTo',
      name: 'How to Play Sweepstakes Games & Cash Out Instantly',
      description: 'Step-by-step guide to starting, playing, and cashing out winnings on Winning Heaven.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Free Registration',
          text: 'Sign up in under 60 seconds with email or 1-click Google account login.'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Claim $3 Freeplay',
          text: 'Request freeplay for GameVault 777 or Juwa directly inside your player lobby.'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Deposit & Play',
          text: 'Load coins using Cash App, Zelle, or Venmo to unlock high-jackpot games.'
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Instant 24/7 Cashout',
          text: 'Submit cashout redeem requests anytime — our finance team pays out 24/7.'
        }
      ]
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
          name: 'How to Play',
          item: 'https://winningheaven.com/how-to-play'
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
      <PublicNavbar currentPath="/how-to-play" />

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            PLAYER ONBOARDING & PAYOUT GUIDE
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">HOW TO PLAY &</span> <span className="cyan-gradient-text">INSTANT CASHOUT GUIDE</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to know about creating an account, claiming your $3 signup freeplay, loading coins via Cash App, and cashing out instant winnings 24/7 on Winning Heaven.
          </p>
        </section>

        {/* Step-by-Step Box */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            4 Simple Steps to Winning & Cashing Out Real Money
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary, #fcd34d)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>1</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Free Registration</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Sign up in under 60 seconds with email or 1-click Google account login.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary, #fcd34d)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>2</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Claim $3 Freeplay</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Request freeplay for GameVault 777 or Juwa 777 directly inside your player lobby.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary, #fcd34d)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>3</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Deposit & Play</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Load coins using Cash App, Zelle, or Venmo to unlock high-jackpot games.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary, #fcd34d)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>4</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Instant 24/7 Cashout</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Submit cashout redeem requests anytime — our finance team pays out 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Frequently Asked Questions (FAQ)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx !== faqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
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

        {/* CTA Section */}
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
          <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.1rem' }}>
            REGISTER NOW & CLAIM $3 FREEPLAY
          </Link>
        </div>
      </div>

      <PlayerFooter />
    </main>
  );
}
