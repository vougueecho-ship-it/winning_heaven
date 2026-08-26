'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { blogPosts as fallbackSeedPosts, blogCategories } from '../../lib/blogData';
import PlayerFooter from '../../components/player/PlayerFooter';

const fetcher = async (url) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.success && Array.isArray(data.blogs) && data.blogs.length > 0
      ? data.blogs
      : fallbackSeedPosts;
  } catch {
    return fallbackSeedPosts;
  }
};

export default function BlogHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: blogPosts = fallbackSeedPosts } = useSWR('/api/blogs', fetcher, {
    fallbackData: fallbackSeedPosts,
    revalidateOnFocus: true
  });

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesQuery =
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(post.tags) ? post.tags : []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const featuredPost = blogPosts.find((p) => p.featured) || blogPosts[0];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Winning Heaven Sweepstakes Gaming Blog',
      url: 'https://winningheaven.com/blog',
      description: 'Latest sweepstakes casino guides, game reviews, and instant cashout tips.'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What kind of articles are covered on the Winning Heaven Blog?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We cover sweepstakes casino strategy guides, game vault tips, instant cashout instructions, freeplay promo updates, and mobile app installation tutorials.'
          }
        }
      ]
    }
  ];

  return (
    <main className="info-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Navigation */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/login" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Back to Lobby
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/games" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              Games Catalog
            </Link>
            <Link href="/how-to-play" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              How to Play
            </Link>
            <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none' }}>
              Get $3 Freeplay
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            WINNING HEAVEN GAMING BLOG
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.4rem 0 0.8rem' }}>
            <span className="gold-gradient-text">SWEEPSTAKES GUIDES &</span> <span className="cyan-gradient-text">WINNING STRATEGIES</span>
          </h1>
          <p style={{ maxWidth: '680px', margin: '0 auto 1.5rem', fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            Stay updated with the latest sweepstakes casino strategies, instant cashout tips, freeplay promos, and game guides for GameVault, Juwa 777, and Vegas Sweeps.
          </p>

          {/* Search Input */}
          <div style={{ maxWidth: '480px', margin: '0 auto 1.5rem', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search articles, games, bonuses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem 0.8rem 2.8rem',
                borderRadius: '30px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--card-border)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--gold-primary)' : 'rgba(255,255,255,0.12)',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, var(--gold-primary), #b8860b)' : 'rgba(255,255,255,0.04)',
                  color: selectedCategory === cat ? '#000' : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Spotlight Card */}
        {!searchQuery && selectedCategory === 'All' && featuredPost && (
          <section style={{ marginBottom: '3rem' }}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--gold-primary)',
                borderRadius: '24px',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                boxShadow: '0 12px 40px rgba(212,175,55,0.15)'
              }}
            >
              <div style={{ height: '100%', minHeight: '260px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--gold-primary)', color: '#000', fontWeight: 900, fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  FEATURED SPOTLIGHT
                </span>
              </div>

              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ color: 'var(--cyan-glow)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {featuredPost.category} • {featuredPost.readTime}
                </span>
                <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 800, margin: '0 0 0.8rem', lineHeight: 1.3 }}>
                  {featuredPost.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                  {featuredPost.summary}
                </p>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="btn-gold-glow"
                  style={{ textDecoration: 'none', textAlign: 'center', width: 'fit-content', padding: '0.75rem 1.5rem' }}
                >
                  Read Full Guide →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Blog Post Grid */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-primary)', margin: '0 0 1.5rem' }}>
            {selectedCategory === 'All' ? 'Latest Gaming Articles' : `${selectedCategory} Articles`}
          </h2>

          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No articles match your search filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredPosts.map((post) => (
                <div
                  key={post.id || post.slug}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={post.image || '/winning_heaven_banner.png'}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.75)', border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)', padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {post.category}
                    </span>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {post.date} • {post.readTime}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800, margin: '0 0 0.6rem', lineHeight: 1.4 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, flex: 1, margin: '0 0 1rem' }}>
                      {post.summary}
                    </p>

                    <Link
                      href={`/blog/${post.slug}`}
                      style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      Read Article <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* High-Converting CTA Box */}
        <section
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(0,229,255,0.1))',
            border: '1px solid var(--gold-primary)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backdropFilter: 'var(--glass-blur)'
          }}
        >
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 0.6rem' }}>
            Claim $3 Freeplay Bonus Today
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Ready to test your skill on GameVault or Juwa? Register now on Winning Heaven and request your $3 freeplay signup bonus instantly!
          </p>
          <Link href="/register" className="btn-gold-glow" style={{ textDecoration: 'none', padding: '0.85rem 2rem', fontSize: '1rem' }}>
            REGISTER & CLAIM FREEPLAY
          </Link>
        </section>
      </div>

      <PlayerFooter />
    </main>
  );
}
