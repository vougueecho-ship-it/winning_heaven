import Link from 'next/link';

export const metadata = {
  title: 'How to Play & Instant Cashouts Guide | Winning Heaven',
  description: 'Learn how online sweepstakes gaming works on Winning Heaven. How to claim $3 freeplay, load coins via Cash App/Venmo/Zelle, and cash out instant real money winnings.'
};

const faqs = [
  {
    q: 'How does sweepstakes gaming work on Winning Heaven?',
    a: 'Winning Heaven operates as a centralized portal for top sweepstakes platforms like GameVault, Juwa 777, and Vegas Sweeps. Players register a free account, request game logins, load coins using fast payment gateways (Cash App, Zelle, Venmo, Crypto), and request instant 24/7 cashouts when they win.'
  },
  {
    q: 'How do I claim the $3 Freeplay bonus?',
    a: 'Simply register a new account on Winning Heaven. Once logged in, go to the Redeem / Freeplay tab in your lobby, choose your game platform (e.g. GameVault or Juwa), and submit a freeplay request. Our 24/7 automated support will generate your login with free bonus credits!'
  },
  {
    q: 'What payment methods are supported for instant cashouts?',
    a: 'We support instant transactions via Cash App, Venmo, Zelle, PayPal, Apple Pay, and Cryptocurrency (Bitcoin/USDT). Cashout requests are processed 24/7 by our finance team.'
  },
  {
    q: 'Is Winning Heaven legal to play?',
    a: 'Yes! Winning Heaven operates under standard legal sweepstakes structures. Sweepstakes gaming is legal for adults aged 18+ in most US states and regions.'
  },
  {
    q: 'Can I play on my mobile phone?',
    a: 'Yes, you can play directly in your mobile browser, install our Android APK file, or add our iOS Progressive Web App (PWA) to your iPhone home screen for a 1-tap full-screen experience.'
  }
];

export default function HowToPlayPage() {
  const jsonLd = {
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
  };

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Games Catalog
            </Link>
            <Link href="/blog" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Blog Articles
            </Link>
          </div>
        </header>

        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            <span className="gold-gradient-text">HOW TO PLAY &</span> <span className="cyan-gradient-text">INSTANT CASHOUT GUIDE</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.6rem' }}>
            Everything you need to know about starting, playing, and cashing out on Winning Heaven.
          </p>
        </section>

        {/* Step-by-Step Box */}
        <section style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'var(--gold-primary)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            4 Simple Steps to Winning Real Money Winnings
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>1</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Free Registration</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Sign up in under 60 seconds with email or 1-click Google account login.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>2</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Claim $3 Freeplay</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Request freeplay for GameVault or Juwa directly inside your player lobby.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>3</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Deposit & Play</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Load coins using Cash App, Zelle, or Venmo to unlock high-jackpot games.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
              <span style={{ background: 'var(--gold-primary)', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>4</span>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Instant Cashout</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                Submit cashout redeem requests anytime — our finance team pays out 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'var(--cyan-glow)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Frequently Asked Questions (FAQ)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-primary)', fontWeight: 700, margin: '0 0 0.4rem' }}>
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
        <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
          <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.1rem' }}>
            REGISTER NOW & CLAIM $3 FREEPLAY
          </Link>
        </div>

        <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} Winning Heaven. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
