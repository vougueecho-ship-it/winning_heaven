import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';
import PublicNavbar from '../../components/PublicNavbar';
import { getDb } from '../../lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Top Sweepstakes Games - GameVault 777, Juwa, Vegas Sweeps & Orion Stars',
  description:
    'Play top online sweepstakes casino games on Winning Heaven. Play GameVault 777 online, Juwa 777, Vegas Sweeps, Orion Stars, and Ultra Panda with $3 signup freeplay bonus & instant 24/7 cashouts.',
  keywords: [
    'GameVault 777 online',
    'play GameVault online',
    'GameVault sweepstakes',
    'GameVault cashout',
    'Juwa casino online',
    'Juwa 777 online',
    'Vegas Sweeps online',
    'Orion Stars online',
    'sweepstakes casino games',
    'online sweepstakes casino',
    '$3 freeplay bonus'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/games'
  },
  openGraph: {
    title: 'Top Sweepstakes Games - GameVault 777, Juwa, Vegas Sweeps & Orion Stars',
    description: 'Explore high-paying sweepstakes games on Winning Heaven. GameVault 777, Juwa, Vegas Sweeps, Orion Stars with instant 24/7 cashout redemptions.',
    url: 'https://winningheaven.com/games',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Sweepstakes Casino Games' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Sweepstakes Games - GameVault 777 & Juwa',
    description: 'Play GameVault 777, Juwa, Vegas Sweeps & Orion Stars online with instant cashouts.',
    images: ['/winning_heaven_banner.png']
  }
};

const defaultKnowledge = {
  gamevault: {
    tagline: 'Premier Slot Machines & Fish Shooter Arcade',
    category: 'Slots & Fish',
    highlights: ['High RTP Reels', 'Community Jackpots', 'Instant Load'],
    description: 'GameVault 777 offers state-of-the-art HD slot reels, bonus spin wheels, and exciting fish arcade shooters. Famed across North America for high RTP payout percentages and massive jackpot wins.',
    image: '/game_gamevault.png'
  },
  juwa: {
    tagline: 'Multiplayer Fish Hunting & Classic Slots',
    category: 'Arcade & Slots',
    highlights: ['Low Volatility', 'Multiplayer Boss Battle', 'Daily Rewards'],
    description: 'Juwa 777 is renowned for smooth multiplayer fish shooting arcade action and traditional 3-reel and 5-reel video slots with high bonus frequency.',
    image: '/game_juwa.png'
  },
  vegassweeps: {
    tagline: 'Authentic Las Vegas Sweepstakes Experience',
    category: 'Vegas Slots',
    highlights: ['Vegas Graphics', 'Progressive Jackpots', 'Free Spin Bonuses'],
    description: 'Bring the thrill of the Las Vegas strip directly to your phone. Vegas Sweeps features massive progressive jackpot pools, expanding wild multipliers, and free spin rounds.',
    image: '/game_vegassweeps.png'
  },
  ultrapanda: {
    tagline: 'Asian-Themed Slots & Wild Multipliers',
    category: 'Video Slots',
    highlights: ['Wild Multipliers', 'Free Spin Rounds', 'High RTP'],
    description: 'Experience colorful graphics, expanding wild multipliers, and instant free spin features on Ultra Panda online sweepstakes casino.',
    image: '/casino_vip_hero.jpg'
  },
  firekirin: {
    tagline: 'Legendary Dragon Boss Fish Battles',
    category: 'Fish Shooter',
    highlights: ['Dragon Bosses', 'Multi-weapon Powerups', 'Huge Coins'],
    description: 'Defeat mythical sea creatures and Fire Kirin dragon bosses to trigger massive coin payout multipliers and instant cashout opportunities.',
    image: '/heavenly_lobby_bg.png'
  },
  bluedragon: {
    tagline: 'Celestial Dragon Reels & Electric Jackpots',
    category: 'Video Slots',
    highlights: ['Electric Wilds', 'Free Spins Bonus', 'High Payouts'],
    description: 'Enter the realm of the Blue Dragon with electrifying progressive jackpot reels, expanding scatter bonuses, and fast-paced gameplay.',
    image: '/winning_heaven_banner.png'
  },
  orionstars: {
    tagline: 'Laser Cannon Fish Battles & Video Slots',
    category: 'Fish & Slots',
    highlights: ['Laser Cannons', 'Skill Shooting', 'Bonus Wheels'],
    description: 'Orion Stars rewards player skill and precision with laser cannon fish hunting, dragon boss battles, and high-energy bonus spin features.',
    image: '/winning_heaven_banner.png'
  },
  milkyway: {
    tagline: 'Cosmic Galaxy Spins & Big Jackpots',
    category: 'Cosmic Slots',
    highlights: ['Galaxy Reels', 'Mega Multipliers', 'Instant Rewards'],
    description: 'Explore the cosmic frontier of sweepstakes slots with Milky Way. Features interstellar bonus rounds, sticky wilds, and giant community payouts.',
    image: '/winning_heaven_banner.png'
  },
  vblink: {
    tagline: 'Fast-Paced Vegas Sweeps & Fish Arcade',
    category: 'Slots & Arcade',
    highlights: ['Rapid Spins', 'Multi-level Jackpots', 'High RTP'],
    description: 'VBlink delivers an electrifying arcade experience packed with interactive fish shooter battles, 5-reel bonus slots, and rapid cashout redemptions.',
    image: '/winning_heaven_banner.png'
  },
  pandamaster: {
    tagline: 'Imperial Martial Arts Spins & Gold Treasures',
    category: 'Asian Slots',
    highlights: ['Golden Multipliers', 'Treasure Chests', 'Free Bonus Rounds'],
    description: 'Master the reels with Panda Master. Unlock golden jackpot chests, high-multiplier scatter rounds, and dynamic sweepstakes bonus spins.',
    image: '/casino_vip_hero.jpg'
  },
  cashmachine: {
    tagline: 'Classic High Roller Cash Reels',
    category: 'Classic Reels',
    highlights: ['Rapid Cash Wins', 'Wild Multipliers', 'Instant Load'],
    description: 'Experience genuine mechanical reel action with modern jackpot features. Spin the Cash Machine for instant coin prizes and top payout ratios.',
    image: '/casino_vip_hero.jpg'
  },
  megaspin: {
    tagline: 'Mega Wheel Multipliers & Deluxe Jackpots',
    category: 'Deluxe Slots',
    highlights: ['Bonus Wheel', 'Mega Multipliers', '24/7 Redemptions'],
    description: 'Spin big on Mega Spin Deluxe. Trigger spinning fortune wheels, stacked wilds, and lightning-fast sweepstakes cash rewards.',
    image: '/winning_heaven_banner.png'
  }
};

function normalizeKey(str = '') {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveGameCard(game) {
  const norm = normalizeKey(game.title);
  
  let match = null;
  for (const [k, v] of Object.entries(defaultKnowledge)) {
    if (norm.includes(k) || k.includes(norm)) {
      match = v;
      break;
    }
  }

  let img = String(game.image || '').trim();
  if (img.startsWith('data:image')) {
    img = `/api/games/image?id=${encodeURIComponent(game.id)}&v=${img.length}`;
  } else if (img.startsWith('game_')) {
    img = `/${img}`;
  } else if (img.startsWith('placeholder_') || !img) {
    img = match?.image || '/winning_heaven_banner.png';
  }

  const category = game.category || match?.category || (game.badge && game.badge !== 'none' ? `${game.badge.toUpperCase()} Game` : 'Slots & Fish');
  const tagline = match?.tagline || `${game.title} - North America's Top Sweepstakes Platform`;
  const description = match?.description || `Play ${game.title} online on Winning Heaven. Enjoy high RTP payout reels, interactive bonus features, and instant 24/7 real cashout redemptions.`;
  const highlights = match?.highlights || ['High RTP Reels', 'Community Jackpots', 'Instant Load'];

  return {
    id: game.id,
    title: game.title,
    tagline,
    category,
    image: img,
    description,
    highlights,
    link: game.link || '/login'
  };
}

const gameFaqs = [
  {
    q: 'Which sweepstakes game has the highest payout on Winning Heaven?',
    a: 'GameVault 777 online, Juwa 777 casino, and Vegas Sweeps are top player favorites due to their high Return to Player (RTP) percentages, frequent community jackpot payouts, and free spin bonus rounds.'
  },
  {
    q: 'Can I play these sweepstakes games on my mobile phone?',
    a: 'Yes! You can play all active sweepstakes games directly inside your mobile web browser, install our Android APK app, or add our iOS Safari PWA to your iPhone home screen.'
  },
  {
    q: 'How do I claim $3 Freeplay for my preferred game?',
    a: 'Simply create a free Winning Heaven account. In your lobby, navigate to the Freeplay tab, select your preferred platform, and submit an account request. Support will instantly issue your credentials with $3 free bonus credits.'
  },
  {
    q: 'How fast are cashout redemptions for game winnings?',
    a: 'Winnings are redeemed 24/7. Cash App, Venmo, Zelle, PayPal, and Crypto cashouts are sent directly to your payment tag within 5 to 15 minutes.'
  }
];

export default async function GamesPage() {
  let activeGames = [];

  try {
    const db = await getDb();
    const rawGames = await db.collection('games').find({ active: { $ne: false } }).toArray();
    activeGames = rawGames.map((g) => resolveGameCard(g));
  } catch (err) {
    console.error('Failed to load active games for /games page:', err);
    // Fallback default active list if DB connection is unavailable
    const fallbackList = [
      { id: '2', title: 'GameVault 777 Online', image: '/game_gamevault.png' },
      { id: '3', title: 'Vegas Sweeps 777', image: '/game_vegassweeps.png' },
      { id: '1786623859349', title: 'Vblink', image: '/winning_heaven_banner.png' },
      { id: '1786624472146', title: 'Milkyway', image: '/winning_heaven_banner.png' },
      { id: '6', title: 'Fire Kirin', image: '/heavenly_lobby_bg.png' },
      { id: '1787480039919', title: 'Panda Master', image: '/casino_vip_hero.jpg' }
    ];
    activeGames = fallbackList.map((g) => resolveGameCard(g));
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Winning Heaven Online Sweepstakes Games Catalog',
      description: 'Top online sweepstakes casino games available on Winning Heaven including GameVault 777, Juwa, Vegas Sweeps, and Orion Stars.',
      itemListElement: activeGames.map((game, index) => ({
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
          name: 'Games Catalog',
          item: 'https://winningheaven.com/games'
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
      <PublicNavbar currentPath="/games" />

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            OFFICIAL SWEEPSTAKES GAMES CATALOG ({activeGames.length} ACTIVE GAMES)
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">PLAY TOP SWEEPSTAKES GAMES</span> <span className="cyan-gradient-text">ONLINE</span>
          </h1>
          <p style={{ maxWidth: '780px', margin: '0 auto', fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            Access North America&apos;s highest-paying online sweepstakes platforms directly from one secure account. <strong>Play GameVault 777, Vegas Sweeps, VBlink, Milky Way, and more</strong> with instant 24/7 cashouts and a guaranteed $3 freeplay signup bonus!
          </p>
        </section>

        {/* Games Grid - Each game has its separate card with its own image */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          {activeGames.map((game) => (
            <div
              key={game.id || game.title}
              style={{
                background: 'var(--card-bg, rgba(15,23,42,0.65))',
                border: '1px solid var(--card-border, rgba(252,211,77,0.2))',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              <div style={{ height: '190px', width: '100%', position: 'relative', overflow: 'hidden', background: '#0a0d18' }}>
                <img
                  src={game.image}
                  alt={game.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.85)', border: '1px solid var(--gold-primary, #fcd34d)', color: 'var(--gold-primary, #fcd34d)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(6px)' }}>
                  {game.category}
                </span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, margin: '0 0 0.25rem' }}>{game.title}</h2>
                <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, margin: '0 0 0.75rem' }}>{game.tagline}</p>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, flex: 1, margin: '0 0 1rem' }}>
                  {game.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {game.highlights.map((h, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ddd', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>

                <Link href="/login" className="btn-gold-glow" style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.75rem', fontWeight: 800 }}>
                  PLAY {String(game.title).toUpperCase()} NOW
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Sweepstakes Games & Cashout FAQ
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
            background: 'linear-gradient(135deg, rgba(252,211,77,0.15), rgba(6,182,212,0.15))',
            border: '1px solid var(--gold-primary, #fcd34d)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backdropFilter: 'blur(12px)'
          }}
        >
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 0.6rem' }}>
            Claim Your $3 Signup Freeplay Bonus Today
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            No deposit required! Create your Winning Heaven account in 60 seconds, request your freeplay game credentials for your favorite game, and cash out real-money winnings via Cash App, Venmo, or Zelle.
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
      </div>

      <PlayerFooter />
    </main>
  );
}
