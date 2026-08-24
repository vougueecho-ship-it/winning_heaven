import InfoPageClient from '../../components/InfoPageClient';

export const metadata = {
  title: 'Info & Contact - 24/7 Support | Winning Heaven',
  description:
    'Official Winning Heaven contact channels — 24/7 Live Support, Telegram, WhatsApp, Facebook, Instagram, and support email for instant player assistance.'
};

export default function InfoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Winning Heaven Support & Contact',
    description: 'Official 24/7 support channels for Winning Heaven players.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Winning Heaven',
      url: 'https://winningheaven.com',
      logo: 'https://winningheaven.com/winning_heaven_logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@winningheaven.com',
        availableLanguage: ['English']
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InfoPageClient />
    </>
  );
}
