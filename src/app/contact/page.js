import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';

export const metadata = {
  title: 'Contact Us & 24/7 Player Support | Winning Heaven',
  description:
    'Contact Winning Heaven 24/7 player support. Get instant help with GameVault 777, Juwa, coin loads, $3 freeplay bonus claims, and 24/7 instant cashout verification.',
  keywords: [
    '24/7 sweepstakes casino support',
    'Winning Heaven contact',
    'GameVault 777 support',
    'Juwa casino help desk',
    'instant cashout support',
    'verified@winningheaven.com',
    'promos@winningheaven.com'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/contact'
  },
  openGraph: {
    title: 'Contact Us & 24/7 Player Support | Winning Heaven',
    description: 'Get 24/7 live assistance for GameVault 777, Juwa, coin deposits, $3 freeplay, and instant cashouts via live chat, Facebook, or email.',
    url: 'https://winningheaven.com/contact',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Winning Heaven Support' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: '24/7 Customer Support | Winning Heaven Sweepstakes',
    description: 'Instant help with deposits, cashouts, and game logins.',
    images: ['/winning_heaven_banner.png']
  }
};

const contactFaqs = [
  {
    q: 'How fast does Winning Heaven support respond to inquiries?',
    a: 'Our live lobby chat desk boasts an average response time of under 5 minutes 24/7/365. Email inquiries sent to verified@winningheaven.com or promos@winningheaven.com are responded to within 15 to 30 minutes.'
  },
  {
    q: 'What should I do if I need help claiming my $3 signup freeplay bonus?',
    a: 'Log into your player lobby, open the Freeplay section, choose GameVault 777 or Juwa 777, and click Request. Our 24/7 support agents will instantly generate and credit your game account.'
  },
  {
    q: 'How do I verify my account for 24/7 instant cashout redemptions?',
    a: 'Send your player ID and payment tag (Cash App, Venmo, Zelle, or Crypto wallet) to verified@winningheaven.com or directly to live support in your lobby for immediate audit and approval.'
  },
  {
    q: 'Can I get support directly through Facebook?',
    a: 'Yes! You can message our official Facebook page (https://www.facebook.com/share/1DADyA9y1n/?mibextid=wwXIfr) for promo codes, community giveaways, and player help.'
  }
];

export default function ContactPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Winning Heaven Player Support',
      url: 'https://winningheaven.com/contact',
      description: '24/7 Customer service and player help desk for Winning Heaven online sweepstakes casino.',
      mainEntity: {
        '@type': 'Organization',
        name: 'Winning Heaven',
        url: 'https://winningheaven.com',
        logo: 'https://winningheaven.com/winning_heaven_logo.png',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: 'verified@winningheaven.com',
            contactType: 'customer support',
            areaServed: 'US',
            availableLanguage: 'English'
          },
          {
            '@type': 'ContactPoint',
            email: 'promos@winningheaven.com',
            contactType: 'promotions and bonuses',
            areaServed: 'US',
            availableLanguage: 'English'
          }
        ]
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: contactFaqs.map((faq) => ({
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
          name: 'Contact Us',
          item: 'https://winningheaven.com/contact'
        }
      ]
    }
  ];

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary, #04050b)', color: 'var(--text-light, #fff)', padding: '2rem 1.25rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Navigation Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/about" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              About Us
            </Link>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Games Catalog
            </Link>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
              Claim $3 Freeplay
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            24/7 DEDICATED PLAYER ASSISTANCE
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">CONTACT WINNING HEAVEN</span> — <span className="cyan-gradient-text">24/7 HELP DESK</span>
          </h1>
          <p style={{ maxWidth: '780px', margin: '0 auto', fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            Have questions about your account, $3 signup freeplay, coin deposits, or 24/7 instant cashout redemptions? Our dedicated human support desk is active 24 hours a day, 7 days a week to help you win big!
          </p>
        </section>

        {/* 2x2 Grid of Direct Support Channels */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {/* Card 1: Live Chat */}
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.3))', borderRadius: '24px', padding: '1.75rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <i className="fa-solid fa-headset" style={{ fontSize: '2.2rem', color: '#fcd34d' }} />
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>24/7 Live Lobby Chat</h2>
                <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>⚡ Avg Response: 5 mins</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', margin: '0 0 1.25rem', lineHeight: 1.6, flex: 1 }}>
              Log in to your Winning Heaven account to open an instant 1-on-1 live chat session with our support team for coin loads, bonus claims, and payout checks.
            </p>
            <Link href="/login" className="btn-gold-glow" style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.85rem' }}>
              LOGIN & OPEN LIVE CHAT
            </Link>
          </div>

          {/* Card 2: Account & Verification Email */}
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '24px', padding: '1.75rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <i className="fa-solid fa-shield-check" style={{ fontSize: '2.2rem', color: '#4ade80' }} />
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Account & Verification</h2>
                <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>verified@winningheaven.com</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', margin: '0 0 1.25rem', lineHeight: 1.6, flex: 1 }}>
              Email our verification and compliance department for account recovery, Cash App payment tag updates, identity auditing, or cashout verification.
            </p>
            <a href="mailto:verified@winningheaven.com" className="btn-glass-secondary" style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.85rem', color: '#fff' }}>
              EMAIL VERIFIED DESK
            </a>
          </div>

          {/* Card 3: Promotions & Bonuses */}
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px', padding: '1.75rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <i className="fa-solid fa-gift" style={{ fontSize: '2.2rem', color: '#38bdf8' }} />
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Promotions & Bonuses</h2>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>promos@winningheaven.com</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', margin: '0 0 1.25rem', lineHeight: 1.6, flex: 1 }}>
              Contact our promotions desk for special match bonuses, $3 freeplay signup bonus claims, VIP rewards, and affiliate partner inquiries.
            </p>
            <a href="mailto:promos@winningheaven.com" className="btn-glass-secondary" style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.85rem', color: '#fff' }}>
              EMAIL PROMOTIONS DESK
            </a>
          </div>

          {/* Card 4: Official Facebook Community */}
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid rgba(24,119,242,0.4)', borderRadius: '24px', padding: '1.75rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <i className="fa-brands fa-facebook" style={{ fontSize: '2.2rem', color: '#1877f2' }} />
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: 0 }}>Official Facebook Community</h2>
                <span style={{ fontSize: '0.78rem', color: '#1877f2', fontWeight: 700 }}>Winning Heaven Facebook Page</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', margin: '0 0 1.25rem', lineHeight: 1.6, flex: 1 }}>
              Join our official Facebook community page for exclusive giveaways, daily promo drop codes, winner announcements, and instant Facebook Messenger help.
            </p>
            <a
              href="https://www.facebook.com/share/1DADyA9y1n/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass-secondary"
              style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '0.85rem', color: '#1877f2', borderColor: '#1877f2' }}
            >
              <i className="fa-brands fa-facebook" style={{ marginRight: '8px' }} /> VISIT FACEBOOK PAGE
            </a>
          </div>
        </section>

        {/* Detailed Keyword & SLA Information Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3.5rem', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 1rem', fontFamily: 'var(--font-heading)' }}>
            24/7 Dedicated Support for GameVault 777 & Juwa Players
          </h2>
          <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, margin: '0 0 1.25rem' }}>
            At Winning Heaven, player satisfaction and security are our top priorities. Whether you are playing <strong>GameVault 777 online, Juwa 777, Vegas Sweeps, Orion Stars, or Ultra Panda</strong>, our customer service desk is equipped to handle account creation, coin deposits, promo claims, and instant cashouts 24 hours a day, 7 days a week.
          </p>
          
          <h3 style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>
            Our Service Level Guarantees (SLA)
          </h3>
          <ul style={{ paddingLeft: '1.4rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.8, margin: 0 }}>
            <li><strong>Live Lobby Chat Response:</strong> Under 5 minutes average response time.</li>
            <li><strong>24/7 Cashout Redemption Processing:</strong> Redemptions via Cash App, Venmo, Zelle, or Crypto are processed within 5 to 15 minutes.</li>
            <li><strong>Email Support Verification:</strong> Replies sent to <code>verified@winningheaven.com</code> within 15 to 30 minutes.</li>
            <li><strong>$3 Freeplay Bonus Issue:</strong> Credentials issued instantly upon request in your player lobby.</li>
          </ul>
        </section>

        {/* FAQs Section */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Frequently Asked Contact & Support Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {contactFaqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i !== contactFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Q: {faq.q}</h3>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PlayerFooter />
    </main>
  );
}
