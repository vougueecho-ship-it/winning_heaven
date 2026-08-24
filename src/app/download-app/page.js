import Link from 'next/link';

export const metadata = {
  title: 'Download Winning Heaven App - Android APK & iOS Setup',
  description: 'Download the official Winning Heaven Android APK and setup iOS Progressive Web App (PWA) for 1-click full-screen sweepstakes mobile gaming.',
  alternates: {
    canonical: 'https://winningheaven.com/download-app'
  }
};

const appFaqs = [
  {
    q: 'Is the Winning Heaven Android APK safe to install?',
    a: 'Yes, our APK is compiled release-signed and scanned for safety. You can download winning-heaven.apk directly from our website without third-party popups.'
  },
  {
    q: 'How do I enable Unknown Sources on Android?',
    a: 'When downloading the APK, Chrome will prompt you to allow installations from unknown sources. Tap Settings on the prompt and toggle "Allow from this source".'
  },
  {
    q: 'Does Winning Heaven support push notifications on iPhone?',
    a: 'Yes! On iOS 16.4 and newer, once you add Winning Heaven to your iPhone Home Screen via Safari, you can receive instant Web Push notifications for coin deposits and bonuses.'
  }
];

export default function DownloadAppPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Winning Heaven Mobile App',
      operatingSystem: 'Android, iOS',
      applicationCategory: 'GameApplication',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD'
      },
      description: 'Play GameVault, Juwa, Vegas Sweeps, and sweepstakes games with instant cashouts on mobile.'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: appFaqs.map((faq) => ({
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
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Games
            </Link>
            <Link href="/blog" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Blog
            </Link>
          </div>
        </header>

        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            OFFICIAL MOBILE APP DOWNLOAD
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">WINNING HEAVEN</span> <span className="cyan-gradient-text">FOR MOBILE</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', margin: '0 auto' }}>
            Enjoy HD sweepstakes gaming on Android and iPhone with 1-click home screen access and instant push notifications.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {/* Android Card */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
              <i className="fa-brands fa-android" style={{ fontSize: '2.2rem', color: '#3ddc84' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800, margin: 0 }}>Android Native APK</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 700 }}>Compiled Release Build</span>
              </div>
            </div>

            <ol style={{ paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              <li>Click <strong>Download Android APK</strong> button below.</li>
              <li>When prompted by Android, allow download of <code>winning-heaven.apk</code>.</li>
              <li>Enable &quot;Install from Unknown Sources&quot; if requested by Chrome.</li>
              <li>Tap Install and open the app from your app drawer.</li>
            </ol>

            <a
              href="/downloads/winning-heaven.apk"
              download
              className="btn-gold-glow"
              style={{ textDecoration: 'none', textAlign: 'center', padding: '0.85rem' }}
            >
              <i className="fa-solid fa-download" style={{ marginRight: '8px' }} /> DOWNLOAD ANDROID APK
            </a>
          </div>

          {/* iPhone iOS Card */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
              <i className="fa-brands fa-apple" style={{ fontSize: '2.2rem', color: '#fff' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800, margin: 0 }}>iPhone iOS Setup</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)', fontWeight: 700 }}>Safari Home Screen PWA</span>
              </div>
            </div>

            <ol style={{ paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              <li>Open <code>winningheaven.com</code> in Safari on your iPhone.</li>
              <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
              <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in top right — launch directly from your iPhone home screen!</li>
            </ol>

            <Link
              href="/login"
              className="btn-glass-secondary"
              style={{ textDecoration: 'none', textAlign: 'center', padding: '0.85rem', color: '#fff' }}
            >
              <i className="fa-solid fa-mobile-screen-button" style={{ marginRight: '8px' }} /> OPEN WEB LOBBY ON IPHONE
            </Link>
          </div>
        </div>

        {/* App Installation FAQs */}
        <section style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.25rem', textAlign: 'center' }}>
            Mobile App Download FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {appFaqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i !== appFaqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.4rem' }}>Q: {faq.q}</h3>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} Winning Heaven. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
