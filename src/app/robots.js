export default function robots() {
  const baseUrl = 'https://winningheaven.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/blog-admin',
          '/blog-admin/',
          '/boss',
          '/boss/',
          '/finance',
          '/finance/',
          '/operations',
          '/operations/',
          '/distributor',
          '/distributor/',
          '/coins-staff',
          '/coins-staff/',
          '/support-staff',
          '/support-staff/',
          '/api/'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
