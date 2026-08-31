import Link from 'next/link';
import PlayerFooter from '../../components/player/PlayerFooter';
import PublicNavbar from '../../components/PublicNavbar';

export const metadata = {
  title: 'Sweepstakes Casino APK Download - Winning Heaven Mobile App',
  description:
    'Download official Winning Heaven Android APK & setup iOS PWA for 1-click full-screen sweepstakes mobile gaming. Play GameVault 777, Juwa, Vegas Sweeps on mobile.',
  keywords: [
    'sweepstakes casino APK download',
    'Winning Heaven app download',
    'mobile sweepstakes app',
    'GameVault 777 APK download',
    'Juwa casino APK',
    'Vegas Sweeps app',
    'Android sweepstakes casino',
    'iOS sweepstakes casino app'
  ],
  alternates: {
    canonical: 'https://winningheaven.com/download-app'
  },
  openGraph: {
    title: 'Sweepstakes Casino APK Download - Winning Heaven Mobile App',
    description: 'Download the official release Android APK or setup iPhone PWA to play GameVault 777 & Juwa with instant 24/7 mobile cashouts.',
    url: 'https://winningheaven.com/download-app',
    siteName: 'Winning Heaven',
    images: [{ url: '/winning_heaven_banner.png', width: 1200, height: 630, alt: 'Winning Heaven Mobile App Download' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winning Heaven Sweepstakes Mobile App Download',
    description: 'Download Android APK & iOS setup for GameVault 777, Juwa & sweepstakes casino games.',
    images: ['/winning_heaven_banner.png']
  }
};

const appFaqs = [
  {
    q: 'Is the Winning Heaven sweepstakes casino APK download safe for Android?',
    a: 'Yes, our release APK (winning-heaven.apk) is compiled release-signed and scanned for security. You can download it directly from our official server with zero third-party adware.'
  },
  {
    q: 'How do I install Unknown Sources APKs on Android mobile phones?',
    a: 'When downloading winning-heaven.apk, Chrome will prompt you to allow installations from unknown sources. Tap Settings on the prompt and toggle "Allow from this source", then tap Install.'
  },
  {
    q: 'Can I play GameVault 777 and Juwa 777 on iPhone (iOS)?',
    a: 'Yes! On iOS, open winningheaven.com in Safari, tap Share, select "Add to Home Screen", and tap Add. You get a 1-tap full-screen Progressive Web App experience with Web Push notification support.'
  },
  {
    q: 'Do I get the $3 signup freeplay bonus when registering on mobile app?',
    a: 'Yes! Whether registering through our Android APK or iOS Web App, all new mobile players instantly qualify for the $3 freeplay signup bonus.'
  }
];

export default function DownloadAppPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Winning Heaven Sweepstakes Mobile App',
      operatingSystem: 'Android, iOS',
      applicationCategory: 'GameApplication',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD'
      },
      description: 'Download official Winning Heaven Android APK and play GameVault 777, Juwa, Vegas Sweeps, and sweepstakes games with 24/7 instant cashouts.'
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
          name: 'Download App',
          item: 'https://winningheaven.com/download-app'
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
      <PublicNavbar currentPath="/download-app" />

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary, #fcd34d)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            OFFICIAL MOBILE APP DOWNLOAD
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">SWEEPSTAKES CASINO</span> <span className="cyan-gradient-text">APK DOWNLOAD</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Enjoy HD sweepstakes gaming on Android and iPhone with 1-click home screen access, fast coin deposits, instant 24/7 Cash App cashouts, and Web Push notifications.
          </p>
        </section>

        {/* Download Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          {/* Android Card */}
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
              <i className="fa-brands fa-android" style={{ fontSize: '2.2rem', color: '#3ddc84' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800, margin: 0 }}>Android Native APK</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary, #fcd34d)', fontWeight: 700 }}>Release Build (Direct Download)</span>
              </div>
            </div>

            <ol style={{ paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              <li>Click <strong>Download Android APK</strong> button below.</li>
              <li>When prompted by Android, allow download of <code>winning-heaven.apk</code>.</li>
              <li>Enable &quot;Install from Unknown Sources&quot; if requested by Chrome.</li>
              <li>Tap Install and launch Winning Heaven from your app drawer.</li>
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
          <div style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
              <i className="fa-brands fa-apple" style={{ fontSize: '2.2rem', color: '#fff' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800, margin: 0 }}>iPhone iOS Setup</h2>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>Safari Home Screen PWA</span>
              </div>
            </div>

            <ol style={{ paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              <li>Open <code>winningheaven.com</code> in Safari on your iPhone.</li>
              <li>Tap the <strong>Share</strong> icon at the bottom bar of Safari.</li>
              <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in top right — launch full screen anytime!</li>
            </ol>

            <Link
              href="/login"
              className="btn-glass-secondary"
              style={{ textDecoration: 'none', textAlign: 'center', padding: '0.85rem', color: '#fff' }}
            >
              <i className="fa-solid fa-mobile-screen-button" style={{ marginRight: '8px' }} /> OPEN LOBBY ON IPHONE
            </Link>
          </div>
        </div>

        {/* App Installation FAQs */}
        <section style={{ background: 'var(--card-bg, rgba(15,23,42,0.65))', border: '1px solid var(--card-border, rgba(252,211,77,0.2))', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--gold-primary, #fcd34d)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', textAlign: 'center' }}>
            Sweepstakes Mobile App FAQ
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
      </div>

      <PlayerFooter />
    </main>
  );
}
