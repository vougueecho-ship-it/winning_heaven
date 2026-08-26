import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';

export const metadata = {
  title: 'About Us - #1 Online Sweepstakes Casino Platform | Winning Heaven',
  description:
    'Winning Heaven is North America’s top online sweepstakes casino platform. Play GameVault 777 online, Juwa 777, Vegas Sweeps, and Orion Stars with $3 freeplay bonus & instant 24/7 Cash App cashouts.',
  keywords: [
    'About Winning Heaven',
    'online sweepstakes casino platform',
    'GameVault 777 online portal',
    'play GameVault online',
    'Juwa casino online',
    'Vegas Sweeps online',
    'instant sweepstakes casino cashout',
    '$3 freeplay signup bonus',
    'legit sweepstakes casino app'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/about'
  },
  openGraph: {
    title: 'About Us - #1 Online Sweepstakes Casino Platform | Winning Heaven',
    description: 'Learn why Winning Heaven is the premier 24/7 online sweepstakes casino hub for GameVault 777, Juwa, Vegas Sweeps, and instant cashouts.',
    url: 'https://winningheaven.com/about',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Winning Heaven About Us' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Premier Sweepstakes Casino Hub | Winning Heaven',
    description: 'North America’s leading 24/7 online sweepstakes platform with instant cashouts & $3 bonus.',
    images: ['/winning_heaven_banner.png']
  }
};

const aboutFaqs = [
  {
    q: 'What makes Winning Heaven the best online sweepstakes casino platform?',
    a: 'Winning Heaven is a single centralized sweepstakes portal aggregating top platforms including GameVault 777 online, Juwa 777, Vegas Sweeps, Orion Stars, Ultra Panda, and Fire Kirin. Players enjoy 24/7 instant cashouts via Cash App, Venmo, Zelle, or Crypto, alongside a guaranteed $3 freeplay signup bonus.'
  },
  {
    q: 'Is playing online sweepstakes casino games legal at Winning Heaven?',
    a: 'Yes! Winning Heaven operates strictly under legal promotional sweepstakes laws ("No Purchase Necessary" model). Sweepstakes gaming is 100% legal for eligible adults aged 18+ across most US states and North American jurisdictions.'
  },
  {
    q: 'How do I claim my $3 freeplay bonus for GameVault 777 or Juwa?',
    a: 'Simply register a free account on Winning Heaven. In your player lobby, open the Freeplay section, choose GameVault 777 or Juwa 777, and submit an account request. Our 24/7 support team will instantly issue your freeplay login with bonus coins.'
  },
  {
    q: 'How fast are 24/7 instant cashouts processed?',
    a: 'Our dedicated finance desk works 24 hours a day, 7 days a week. Instant sweepstakes casino cashouts via Cash App, Venmo, Zelle, PayPal, or Crypto are processed within 5 to 15 minutes.'
  }
];

export default function AboutPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Winning Heaven Sweepstakes Casino',
      url: 'https://winningheaven.com/about',
      description: 'Overview of Winning Heaven online sweepstakes casino platform, featuring GameVault 777, Juwa, Vegas Sweeps, and 24/7 instant cashouts.',
      publisher: {
        '@type': 'Organization',
        name: 'Winning Heaven',
        url: 'https://winningheaven.com',
        logo: 'https://winningheaven.com/winning_heaven_logo.png'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: aboutFaqs.map((faq) => ({
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
          name: 'About Us',
          item: 'https://winningheaven.com/about'
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

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Navigation Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Games Catalog
            </Link>
            <Link href="/contact" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Support
            </Link>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
              Claim $3 Freeplay
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            NORTH AMERICA&apos;S PREMIER SWEEPSTAKES HUB
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.5rem 0 1rem' }}>
            <span className="gold-gradient-text">ONLINE SWEEPSTAKES CASINO</span> — <span className="cyan-gradient-text">WINNING HEAVEN</span>
          </h1>
          <p style={{ maxWidth: '820px', margin: '0 auto', fontSize: '1.05rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7 }}>
            Welcome to <strong>Winning Heaven</strong>, North America&apos;s premier <strong>online sweepstakes casino platform</strong>. We provide instant 24/7 access to high-paying slots, fish shooting games, and jackpots on <strong>GameVault 777 online, Juwa 777, Vegas Sweeps, Orion Stars, and Ultra Panda</strong> — all backed by $3 signup freeplay bonuses and lightning-fast 24/7 instant cashouts.
          </p>
        </section>

        {/* Mission & Brand Story */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 1rem', fontFamily: 'var(--font-heading)' }}>
            Why Winning Heaven is the #1 Choice to Play Sweepstakes Online
          </h2>
          <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, margin: '0 0 1.25rem' }}>
            Navigating multiple sweepstakes casino websites can be frustrating. Winning Heaven solves this by offering a single, unified player portal where you can <strong>play GameVault online, Juwa casino, Vegas Sweeps, and Orion Stars</strong> from one centralized account. Load coins, claim bonus reloads, track transaction ledgers, and redeem instant real-money winnings without switching platforms.
          </p>
          <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, margin: 0 }}>
            Operating strictly under compliant <strong>sweepstakes rules (&quot;No Purchase Necessary&quot;)</strong>, Winning Heaven ensures complete legal compliance, transparent payout terms, 256-Bit SSL data protection, and 24/7 live human customer support for every player.
          </p>
        </section>

        {/* Core Pillars */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ textAlign: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Key Features of Our <span className="gold-gradient-text">Sweepstakes Platform</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: '18px', padding: '1.5rem' }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: '2rem', color: '#fcd34d', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: '0 0 0.5rem' }}>Instant 24/7 Sweepstakes Cashouts</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                Redeem your winnings 24 hours a day, 7 days a week. Instant payouts sent directly to Cash App, Venmo, Zelle, PayPal, or Crypto wallets within 5 to 15 minutes.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '18px', padding: '1.5rem' }}>
              <i className="fa-solid fa-gift" style={{ fontSize: '2rem', color: '#38bdf8', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: '0 0 0.5rem' }}>$3 Freeplay Signup Bonus</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                Get an instant $3 freeplay bonus on registration with zero deposit required. Test GameVault 777 or Juwa 777 risk-free today!
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '18px', padding: '1.5rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: '#4ade80', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: '0 0 0.5rem' }}>Legit Sweepstakes Compliance</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                100% legal promotional sweepstakes structure for adult players aged 18+. Certified games, clear rules, and encrypted transaction protection.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(192,132,252,0.25)', borderRadius: '18px', padding: '1.5rem' }}>
              <i className="fa-solid fa-headset" style={{ fontSize: '2rem', color: '#c084fc', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: '0 0 0.5rem' }}>24/7 Dedicated Player Support</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                Our live support desk works around the clock to assist with game logins, coin deposits, bonus claims, and instant cashout auditing.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Platforms Grid */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem', textAlign: 'center' }}>
            Top Online Sweepstakes Games Available
          </h2>
          <p style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2rem', color: 'rgba(255,255,255,0.82)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Play high-paying slot reels, fish arcade shooters, laser cannons, and progressive community jackpots on leading platforms:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>GameVault 777 Online</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Slots & Fish Shooter</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Juwa 777 Casino</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Arcade & Reels</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Vegas Sweeps</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Vegas Style Jackpots</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Orion Stars</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Laser Fish Battle</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Ultra Panda</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Asian Slot Multipliers</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Fire Kirin</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Dragon Boss Battles</div>
            </div>
          </div>
        </section>

        {/* Dedicated FAQ Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Frequently Asked Questions About Winning Heaven
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {aboutFaqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx !== aboutFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
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
        <section style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(252,211,77,0.15), rgba(6,182,212,0.15))', border: '1px solid var(--gold-primary, #fcd34d)', borderRadius: '24px', padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 0.75rem' }}>
            Play Sweepstakes Online & Cash Out Instantly!
          </h2>
          <p style={{ maxWidth: '620px', margin: '0 auto 1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Join thousands of active players on Winning Heaven today. Register in 60 seconds, claim your $3 signup freeplay bonus, and experience fast 24/7 cashouts.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', padding: '0.85rem 2rem' }}>
              Register & Claim $3 Bonus
            </Link>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none', padding: '0.85rem 2rem' }}>
              Browse Games Catalog
            </Link>
          </div>
        </section>
      </div>

      <PlayerFooter />
    </main>
  );
}
