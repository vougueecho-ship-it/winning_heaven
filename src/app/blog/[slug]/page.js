import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts as seedPosts } from '../../../lib/blogData';
import { getDb } from '../../../lib/mongodb';
import PlayerFooter from '../../../components/player/PlayerFooter';
import PublicNavbar from '../../../components/PublicNavbar';

async function fetchBlogBySlug(slug) {
  try {
    const db = await getDb();
    const blog = await db.collection('blogs').findOne({ slug });
    if (blog) return blog;
  } catch (err) {
    console.error('Failed to query blog from MongoDB:', err);
  }
  return seedPosts.find((p) => p.slug === slug) || null;
}

async function fetchRelatedBlogs(currentSlug) {
  try {
    const db = await getDb();
    const blogs = await db.collection('blogs').find({ slug: { $ne: currentSlug }, status: { $ne: 'draft' } }).limit(2).toArray();
    if (blogs && blogs.length > 0) return blogs;
  } catch (err) {
    console.error('Failed to query related blogs:', err);
  }
  return seedPosts.filter((p) => p.slug !== currentSlug).slice(0, 2);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = await fetchBlogBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: 'Article Not Found | Winning Heaven Blog'
    };
  }

  const tagsList = Array.isArray(post.tags) ? post.tags : (post.tags || '').split(',').map((t) => t.trim());
  const finalTitle = post.metaTitle ? (post.metaTitle.includes('Winning Heaven') ? post.metaTitle : `${post.metaTitle} | Winning Heaven Blog`) : `${post.title} | Winning Heaven Blog`;
  const finalDescription = post.metaDescription || post.summary || post.title;
  const canonicalUrl = post.canonicalUrl || `https://winningheaven.com/blog/${post.slug}`;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: tagsList,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: `https://winningheaven.com/blog/${post.slug}`,
      siteName: 'Winning Heaven Blog',
      images: [
        {
          url: post.image || '/winning_heaven_banner.png',
          alt: post.title
        }
      ],
      type: 'article',
      publishedTime: post.createdAt || new Date(post.date).toISOString()
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [post.image || '/winning_heaven_banner.png']
    }
  };
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = await fetchBlogBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await fetchRelatedBlogs(post.slug);
  const tagsList = Array.isArray(post.tags) ? post.tags : (post.tags || '').split(',').map((t) => t.trim());
  const faqsList = Array.isArray(post.faqs) ? post.faqs.filter((f) => f.question && f.answer) : [];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      image: post.image?.startsWith('http') ? post.image : `https://winningheaven.com${post.image || '/winning_heaven_banner.png'}`,
      author: {
        '@type': 'Organization',
        name: post.author || 'Winning Heaven Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Winning Heaven',
        logo: {
          '@type': 'ImageObject',
          url: 'https://winningheaven.com/winning_heaven_logo.png'
        }
      },
      datePublished: post.createdAt || new Date(post.date).toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://winningheaven.com/blog/${post.slug}`
      }
    }
  ];

  // Add FAQPage Schema if article has FAQs
  if (faqsList.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqsList.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer.replace(/<[^>]*>?/gm, '')
        }
      }))
    });
  }

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar currentPath="/blog" />

      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/blog" className="btn-glass-secondary" style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Blog Hub
          </Link>
          <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}>
            <i className="fa-solid fa-gift" /> Get $3 Freeplay
          </Link>
        </div>

        {/* Article Header */}
        <article style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '2rem 1.75rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--gold-primary)', color: '#000', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
              {post.category}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>• {post.date}</span>
            <span style={{ color: 'var(--cyan-glow)', fontSize: '0.82rem' }}>• {post.readTime}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 1rem' }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-primary), #ffaa00)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900 }}>
              WH
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{post.author || 'Winning Heaven Team'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Winning Heaven Official Guide</div>
            </div>
          </div>

          {/* Featured Image */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.75rem', maxHeight: '420px', background: '#0b0d18' }}>
            <img
              src={post.image || '/winning_heaven_banner.png'}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Article HTML Content */}
          <div
            className="blog-article-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.9)'
            }}
          />

          {/* FAQs Section if present */}
          {faqsList.length > 0 && (
            <section style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-circle-question" style={{ color: 'var(--cyan-glow)' }}></i> Frequently Asked Questions (FAQs)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {faqsList.map((faq, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,215,0,0.2)',
                      borderRadius: '16px',
                      padding: '1.25rem'
                    }}
                  >
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 0.6rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 900 }}>Q{fIdx + 1}:</span>
                      <span>{faq.question}</span>
                    </h3>
                    <div
                      style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem', lineHeight: 1.65, paddingLeft: '1.8rem' }}
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Article Tags */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TAGS:</span>
            {tagsList.map((tag, idx) => (
              <span key={idx} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ddd', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px' }}>
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', fontWeight: 800, margin: '0 0 1.25rem' }}>
              Related Sweepstakes Guides
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {relatedPosts.map((rel) => (
                <div key={rel.id || rel.slug} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '18px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)', fontWeight: 700 }}>{rel.category}</span>
                  <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 800, margin: '0.4rem 0 0.5rem' }}>{rel.title}</h3>
                  <Link href={`/blog/${rel.slug}`} style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                    Read Guide →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <PlayerFooter />
    </main>
  );
}
