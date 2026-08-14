import "./globals.css";
import ClientChunkGuard from "../components/ClientChunkGuard";
import NativeSplash from "../components/NativeSplash";
import NativeChrome from "../components/NativeChrome";
import NativeBackButton from "../components/NativeBackButton";
import MetaPixel from "../components/MetaPixel";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: "Winning Heaven - Celestial Vegas Casino & Instant Cashouts",
  description: "Welcome to Winning Heaven Casino. Access sweepstakes games, grab heavenly bonuses, and cash out instantly!",
  applicationName: "Winning Heaven",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/winning_heaven_logo.png", sizes: "192x192", type: "image/png" },
      { url: "/winning_heaven_logo.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/winning_heaven_logo.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Winning Heaven"
  },
  formatDetection: {
    telephone: false
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
      </head>
      <body suppressHydrationWarning>
        <MetaPixel />
        <NativeChrome />
        <NativeBackButton />
        <NativeSplash />
        <ClientChunkGuard />
        {children}
      </body>
    </html>
  );
}
