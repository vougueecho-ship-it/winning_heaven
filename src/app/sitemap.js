import { blogPosts } from '../lib/blogData';

export default function sitemap() {
  const baseUrl = 'https://winningheaven.com';

  // Core static public routes
  const staticRoutes = [
    '',
    '/games',
    '/how-to-play',
    '/download-app',
    '/blog',
    '/info',
    '/privacy',
    '/login',
    '/register',
    '/account-deletion'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' || route === '/blog' || route === '/games' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/games' || route === '/blog' ? 0.9 : 0.8
  }));

  // Dynamic blog post routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date).toISOString() || new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  return [...staticRoutes, ...blogRoutes];
}
