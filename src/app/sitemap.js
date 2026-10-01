import { blogPosts as fallbackSeedPosts } from '../lib/blogData';
import { getDb } from '../lib/mongodb';

export default async function sitemap() {
  const baseUrl = 'https://winningheaven.com';
  const staticLastMod = '2026-09-30T00:00:00.000Z';

  // Core static public routes (excluding utility/auth pages like /login and /register)
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
    { route: '/account-deletion', priority: 0.5, frequency: 'monthly' }
  ].map(({ route, priority, frequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: staticLastMod,
    changeFrequency: frequency,
    priority: priority
  }));

  // Dynamic blog post routes from MongoDB + fallback seed posts
  let posts = fallbackSeedPosts;
  try {
    const db = await getDb();
    const dbPosts = await db.collection('blogs').find({ status: { $ne: 'draft' } }).toArray();
    if (dbPosts && dbPosts.length > 0) {
      const slugSet = new Set(dbPosts.map((p) => p.slug));
      posts = [
        ...dbPosts,
        ...fallbackSeedPosts.filter((p) => !slugSet.has(p.slug))
      ];
    }
  } catch (err) {
    console.warn('Failed to query blogs for sitemap, falling back to seed posts:', err?.message || err);
  }

  const blogRoutes = posts.map((post) => {
    let modDate = staticLastMod;
    try {
      if (post.updatedAt) {
        modDate = new Date(post.updatedAt).toISOString();
      } else if (post.date) {
        modDate = new Date(post.date).toISOString();
      }
    } catch {
      modDate = staticLastMod;
    }

    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: modDate,
      changeFrequency: 'monthly',
      priority: 0.7
    };
  });

  return [...staticRoutes, ...blogRoutes];
}
