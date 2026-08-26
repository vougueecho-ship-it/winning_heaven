import { blogPosts } from '../lib/blogData';

export default function sitemap() {
  const baseUrl = 'https://winningheaven.com';

  // Core static public routes
  const staticRoutes = [
    { route: '', priority: 1.0, frequency: 'daily' },
    { route: '/games', priority: 0.9, frequency: 'daily' },
    { route: '/download-app', priority: 0.9, frequency: 'weekly' },
    { route: '/how-to-play', priority: 0.8, frequency: 'weekly' },
    { route: '/blog', priority: 0.9, frequency: 'daily' },
    { route: '/about', priority: 0.8, frequency: 'weekly' },
    { route: '/contact', priority: 0.8, frequency: 'weekly' },
    { route: '/terms', priority: 0.8, frequency: 'weekly' },
    { route: '/privacy', priority: 0.8, frequency: 'weekly' },
    { route: '/responsible-gaming', priority: 0.8, frequency: 'weekly' },
    { route: '/login', priority: 0.7, frequency: 'monthly' },
    { route: '/register', priority: 0.8, frequency: 'weekly' },
    { route: '/account-deletion', priority: 0.5, frequency: 'monthly' }
  ].map(({ route, priority, frequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: frequency,
    priority: priority
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
