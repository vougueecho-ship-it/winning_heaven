import "./globals.css";
import ClientChunkGuard from "../components/ClientChunkGuard";
import NativeSplash from "../components/NativeSplash";
import NativeChrome from "../components/NativeChrome";
import NativeBackButton from "../components/NativeBackButton";
import MetaPixel from "../components/MetaPixel";
import FloatingChatButton from "../components/player/FloatingChatButton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  metadataBase: new URL('https://winningheaven.com'),
  title: {
    default: 'Winning Heaven - Sweepstakes Casino & Cashout',
    template: '%s | Winning Heaven'
  },
  description: 'Play top online sweepstakes casino games (GameVault, Juwa, Vegas Sweeps). Get $3 freeplay signup bonus, instant 24/7 cashouts, and mobile APK download!',
  keywords: [
    'Winning Heaven',
    'Sweepstakes Casino',
    'GameVault 777',
    'Juwa Casino',
    'Vegas Sweeps',
    'Instant Cashout Casino',
    'Freeplay Casino Bonus',
    'Sweepstakes APK Download',
    'Play GameVault Online'
  ],
  alternates: {
    canonical: './'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  applicationName: 'Winning Heaven',
  authors: [{ name: 'Winning Heaven Team' }],
  creator: 'Winning Heaven',
  publisher: 'Winning Heaven',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Winning Heaven - Sweepstakes Casino & Cashout',
    description: 'Play top sweepstakes games, grab $3 freeplay bonus, and redeem instant 24/7 cashouts.',
    url: 'https://winningheaven.com',
    siteName: 'Winning Heaven',
    images: [
      {
        url: '/winning_heaven_banner.png',
        width: 1200,
        height: 630,
        alt: 'Winning Heaven Sweepstakes Casino'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winning Heaven - Sweepstakes Casino',
    description: 'Instant 24/7 Cashouts & Freeplay Signup Bonus on GameVault, Juwa & Vegas Sweeps.',
    images: ['/winning_heaven_banner.png']
  },
  icons: {
    icon: [
      { url: '/winning_heaven_logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/winning_heaven_logo.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/winning_heaven_logo.png', sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Winning Heaven'
  },
  formatDetection: {
    telephone: false
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '7mN3z-FIOGyzL7cTGDDR9qIwfG8jYWtPGj498Lw3CFc'
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#04050b"
};

export default function RootLayout({ children }) {
  const globalSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://winningheaven.com/#organization',
        name: 'Winning Heaven',
        url: 'https://winningheaven.com',
        logo: 'https://winningheaven.com/winning_heaven_logo.png',
        sameAs: ['https://winningheaven.com']
      },
      {
        '@type': 'WebSite',
        '@id': 'https://winningheaven.com/#website',
        url: 'https://winningheaven.com',
        name: 'Winning Heaven',
        description: 'Premier Online Sweepstakes Casino Platform',
        publisher: {
          '@id': 'https://winningheaven.com/#organization'
        }
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon & Web Icons */}
        <link rel="icon" type="image/png" href="/winning_heaven_logo.png" />
        <link rel="shortcut icon" href="/winning_heaven_logo.png" />
        <link rel="apple-touch-icon" href="/winning_heaven_logo.png" />

        {/* Google Fonts: Outfit (headings) & Inter (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* FontAwesome Icon Library */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

        {/* Global WebSite & Organization JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
      </head>
      <body suppressHydrationWarning>
        <MetaPixel />
        <NativeChrome />
        <NativeBackButton />
        <NativeSplash />
        <ClientChunkGuard />
        {children}
        <FloatingChatButton />
      </body>
    </html>
  );
}
