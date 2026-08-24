import Link from 'next/link';

export const metadata = {
  title: 'Top Sweepstakes Games - GameVault 777, Juwa, Vegas Sweeps & Orion Stars',
  description: 'Explore high-paying online sweepstakes casino games on Winning Heaven. Play GameVault 777, Juwa, Vegas Sweeps, Orion Stars, and Ultra Panda with instant 24/7 cashouts and $3 freeplay signup bonus.',
  alternates: {
    canonical: 'https://winningheaven.com/games'
  }
};

const gamesCatalog = [
  {
    title: 'GameVault 777',
    tagline: 'Premier Slot Machines & Fish Games',
    image: '/game_gamevault.png',
    category: 'Slots & Fish',
    highlights: ['High RTP Reels', 'Community Jackpots', 'Instant Load'],
    description: 'GameVault 777 offers state-of-the-art HD slots, bonus spin wheels, and exciting fish arcade shooters. Known across North America for frequent payouts.'
  },
  {
    title: 'Juwa 777',
    tagline: 'Multiplayer Fish Hunting & Classic Slots',
    image: '/game_juwa.png',
    category: 'Arcade & Slots',
    highlights: ['Low Volatility', 'Multiplayer Boss Battle', 'Daily Rewards'],
    description: 'Juwa 777 is famed for its smooth multiplayer fish shooting action and traditional 3-reel and 5-reel video slots.'
  },
  {
    title: 'Vegas Sweeps',
    tagline: 'Authentic Las Vegas Sweepstakes Experience',
    image: '/game_vegassweeps.png',
    category: 'Vegas Slots',
    highlights: ['Vegas Graphics', 'Progressive Jackpots', 'Free Spin Bonuses'],
    description: 'Bring the excitement of Las Vegas strip directly to your phone. Vegas Sweeps features massive progressive jackpot pools and multipliers.'
  },
  {
    title: 'Orion Stars',
    tagline: 'Laser Cannon Fish Battles & Video Slots',
    image: '/winning_heaven_banner.png',
    category: 'Fish & Slots',
    highlights: ['Laser Cannons', 'Skill Shooting', 'Bonus Wheels'],
    description: 'Orion Stars rewards player precision with laser cannon fish hunting and high-energy spin features.'
  },
  {
    title: 'Ultra Panda',
    tagline: 'Asian-Themed Slots & Wild Multipliers',
    image: '/casino_vip_hero.jpg',
    category: 'Video Slots',
    highlights: ['Wild Multipliers', 'Free Spin Rounds', 'High RTP'],
    description: 'Experience colorful graphics, expanding wild multipliers, and instant free spin features on Ultra Panda.'
  },
  {
    title: 'Fire Kirin',
    tagline: 'Legendary Dragon Boss Battles',
    image: '/heavenly_lobby_bg.png',
    category: 'Fish Shooter',
    highlights: ['Dragon Bosses', 'Multi-weapon Powerups', 'Huge Coins'],
    description: 'Defeat mythical sea creatures and dragons in Fire Kirin to trigger massive coin payout multipliers.'
  }
];

const gameFaqs = [
  {
    q: 'Which sweepstakes game has the highest payout on Winning Heaven?',
    a: 'GameVault 777 and Juwa 777 are top player favorites due to their high Return to Player (RTP) percentages, bonus spin rounds, and frequent community jackpot payouts.'
  },
  {
    q: 'Can I play GameVault 777 on my phone?',
    a: 'Yes! You can play GameVault directly inside your mobile web browser, install our Android APK app, or add our iOS Safari PWA to your iPhone home screen.'
  },
  {
    q: 'How do I claim $3 Freeplay for GameVault or Juwa?',
    a: 'Simply create a free Winning Heaven player account. In your lobby, navigate to the Freeplay tab, select your preferred game, and submit a request to receive instant login credentials with $3 free bonus credits.'
  }
];

export default function GamesPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Winning Heaven Sweepstakes Games Catalog',
      description: 'Top online sweepstakes casino games available on Winning Heaven',
      itemListElement: gamesCatalog.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: game.title,
        description: game.description
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: gameFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a
        }
      }))
    }
  ];

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Navigation */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/how-to-play" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              How To Play
            </Link>
            <Link href="/blog" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Blog Articles
            </Link>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
              Get $3 Freeplay
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            OFFICIAL GAMES CATALOG
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">TOP SWEEPSTAKES</span> <span className="cyan-gradient-text">CASINO GAMES</span>
          </h1>
          <p style={{ maxWidth: '720px', margin: '0 auto', fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            Access the industry&apos;s highest-paying sweepstakes platforms directly from one secure account. Play GameVault, Juwa 777, Vegas Sweeps, and Orion Stars with 24/7 instant cashouts!
          </p>
        </section>

        {/* Games Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {gamesCatalog.map((game, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ height: '180px', width: '100%', position: 'relative', overflow: 'hidden', background: '#0a0d18' }}>
                <img
                  src={game.image}
                  alt={game.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {game.category}
                </span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', fontWeight: 800, margin: '0 0 0.25rem' }}>{game.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--cyan-glow)', fontWeight: 700, margin: '0 0 0.75rem' }}>{game.tagline}</p>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, flex: 1, margin: '0 0 1rem' }}>
                  {game.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {game.highlights.map((h, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ddd', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>

                <Link href="/login" className="btn-gold-glow" style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.7rem' }}>
                  PLAY {game.title.toUpperCase()} NOW
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <section style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.25rem', textAlign: 'center' }}>
            Sweepstakes Games FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {gameFaqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i !== gameFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Q: {faq.q}</h3>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO CTA Banner */}
        <section
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(0,229,255,0.1))',
            border: '1px solid var(--gold-primary)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backdropFilter: 'var(--glass-blur)'
          }}
        >
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 0.6rem' }}>
            Get Started with $3 Signup Freeplay Bonus
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            No deposit required! Create your Winning Heaven account in 1 minute, request your freeplay game account, and cash out instant winnings via Cash App, Venmo, or Zelle.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', padding: '0.85rem 1.8rem' }}>
              Claim $3 Bonus & Register
            </Link>
            <Link href="/download-app" className="btn-glass-secondary" style={{ textDecoration: 'none', padding: '0.85rem 1.8rem' }}>
              Download Android APK
            </Link>
          </div>
        </section>

        <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} Winning Heaven. 18+ Only. Sweepstakes rules apply.</p>
        </footer>
      </div>
    </main>
  );
}
