'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlogAdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [toast, setToast] = useState(null);

  // Modal State for Creating / Editing Articles
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [editingBlog, setEditingBlog] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sweepstakes Games');
  const [author, setAuthor] = useState('Winning Heaven Team');
  const [readTime, setReadTime] = useState('5 min read');
  const [image, setImage] = useState('/winning_heaven_banner.png');
  const [tags, setTags] = useState('Sweepstakes Games, Freeplay, Cashout');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem('winning_heaven_blog_admin_session');
    if (!raw) {
      router.push('/blog-admin/login');
      return;
    }
    try {
      setSession(JSON.parse(raw));
    } catch {
      router.push('/blog-admin/login');
      return;
    }
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs?admin=true');
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load articles from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('winning_heaven_blog_admin_session');
    router.push('/blog-admin/login');
  };

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setTitle('');
    setCategory('Sweepstakes Games');
    setAuthor('Winning Heaven Team');
    setReadTime('5 min read');
    setImage('/winning_heaven_banner.png');
    setTags('Sweepstakes Games, Freeplay, Cashout');
    setSummary('');
    setContent(`
      <p class="lead">Write your article introduction here to grab readers' attention...</p>

      <h2>Main Heading 1</h2>
      <p>Detail your sweepstakes game tips, features, or guide here.</p>

      <div class="blog-cta-box">
        <h3>Claim $3 Freeplay Bonus Today!</h3>
        <p>Register on Winning Heaven to play with instant cashouts.</p>
        <a href="/register" class="btn-gold-glow">Register & Claim Freeplay</a>
      </div>
    `);
    setStatus('published');
    setFeatured(false);
    setActiveTab('edit');
    setEditorOpen(true);
  };

  const handleOpenEditModal = (blog) => {
    setEditingBlog(blog);
    setTitle(blog.title || '');
    setCategory(blog.category || 'Sweepstakes Games');
    setAuthor(blog.author || 'Winning Heaven Team');
    setReadTime(blog.readTime || '5 min read');
    setImage(blog.image || '/winning_heaven_banner.png');
    setTags(Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || '');
    setSummary(blog.summary || '');
    setContent(blog.content || '');
    setStatus(blog.status || 'published');
    setFeatured(Boolean(blog.featured));
    setActiveTab('edit');
    setEditorOpen(true);
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        summary,
        category,
        author,
        readTime,
        image,
        tags,
        content,
        status,
        featured
      };

      let res;
      if (editingBlog?.id) {
        payload.id = editingBlog.id;
        res = await fetch('/api/blogs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(editingBlog ? 'Article updated successfully!' : 'New article published successfully!', 'success');
        setEditorOpen(false);
        fetchBlogs();
      } else {
        showToast(data.message || 'Failed to save article.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id, articleTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${articleTitle}"?`)) return;

    try {
      const res = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Article deleted successfully.', 'success');
        fetchBlogs();
      } else {
        showToast(data.message || 'Failed to delete article.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting article.', 'error');
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesCat = filterCategory === 'All' || b.category === filterCategory;
    const matchesQuery =
      (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (!mounted || !session) return null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '2rem 1rem' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`notification-banner ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        {/* Top Header Navigation */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge-gold">BLOG CMS PORTAL</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged in as {session.name}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', margin: '0.3rem 0 0' }}>
              <span className="gold-gradient-text">ARTICLE</span> <span className="cyan-gradient-text">MANAGER</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/blog" target="_blank" className="btn-glass-secondary" style={{ textDecoration: 'none' }}>
              <i className="fa-solid fa-external-link" /> View Live Blog
            </Link>
            <button onClick={handleOpenCreateModal} className="btn-gold-glow">
              <i className="fa-solid fa-plus" /> Create New Article
            </button>
            <button onClick={handleLogout} className="btn-glass-secondary" style={{ color: '#ff80ab', borderColor: 'rgba(255,0,85,0.3)' }}>
              <i className="fa-solid fa-right-from-bracket" /> Logout
            </button>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none'
            }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: '#0e1224',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none'
            }}
          >
            <option value="All">All Categories</option>
            <option value="Sweepstakes Games">Sweepstakes Games</option>
            <option value="Freeplay & Bonuses">Freeplay & Bonuses</option>
            <option value="App Guides">App Guides</option>
            <option value="Cashout & Payment">Cashout & Payment</option>
            <option value="Gaming Strategies">Gaming Strategies</option>
          </select>
        </div>

        {/* Articles Table / Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }} />
            <p>Loading articles from database...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No articles found. Click &quot;Create New Article&quot; to publish your first post!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredBlogs.map((b) => (
              <div
                key={b.id || b._id}
                style={{
                  background: 'var(--card-bg)',
                  border: b.featured ? '1.5px solid var(--gold-primary)' : '1px solid var(--card-border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                  <img src={b.image || '/winning_heaven_banner.png'} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: b.status === 'draft' ? '#ff9800' : 'var(--emerald-primary)', color: '#000', fontWeight: 900, fontSize: '0.7rem', padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                    {b.status === 'draft' ? 'DRAFT' : 'PUBLISHED'}
                  </span>
                  {b.featured && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--gold-primary)', color: '#000', fontWeight: 900, fontSize: '0.7rem', padding: '3px 8px', borderRadius: '8px' }}>
                      FEATURED
                    </span>
                  )}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)', fontWeight: 700 }}>{b.category}</span>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800, margin: '0.3rem 0 0.5rem', lineHeight: 1.4 }}>{b.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', flex: 1, margin: '0 0 1rem', lineHeight: 1.5 }}>
                    {b.summary}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="btn-glass-secondary"
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                    >
                      <i className="fa-solid fa-pen-to-square" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(b.id, b.title)}
                      className="btn-glass-secondary"
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', color: '#ff5c93', borderColor: 'rgba(255,0,85,0.25)' }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {editorOpen && (
        <div className="modal-backdrop-custom">
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              background: '#0a0d1d',
              border: '1px solid var(--gold-primary)',
              borderRadius: '24px',
              padding: '1.75rem',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.95)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                {editingBlog ? 'Edit Article' : 'Create New Article'}
              </h2>
              <button
                onClick={() => setEditorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Editor vs Preview Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'edit' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                  color: activeTab === 'edit' ? '#000' : '#fff'
                }}
              >
                <i className="fa-solid fa-code" /> Form & Content Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'preview' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.08)',
                  color: activeTab === 'preview' ? '#000' : '#fff'
                }}
              >
                <i className="fa-solid fa-eye" /> Live Reader Preview
              </button>
            </div>

            {activeTab === 'edit' ? (
              <form onSubmit={handleSaveArticle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      ARTICLE TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Top 7 Sweepstakes Games in 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0e1224', border: '1px solid var(--card-border)', color: '#fff' }}
                    >
                      <option value="Sweepstakes Games">Sweepstakes Games</option>
                      <option value="Freeplay & Bonuses">Freeplay & Bonuses</option>
                      <option value="App Guides">App Guides</option>
                      <option value="Cashout & Payment">Cashout & Payment</option>
                      <option value="Gaming Strategies">Gaming Strategies</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      AUTHOR NAME
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      ESTIMATED READ TIME
                    </label>
                    <input
                      type="text"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      COVER IMAGE URL
                    </label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    SUMMARY / META DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short summary for Google search snippet and blog cards..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                      ARTICLE BODY CONTENT (HTML / MARKDOWN) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setContent((prev) => prev + `\n<div class="blog-cta-box">\n  <h3>Claim $3 Freeplay Bonus Today!</h3>\n  <p>Register on Winning Heaven to play with instant cashouts.</p>\n  <a href="/register" class="btn-gold-glow">Register & Claim Freeplay</a>\n</div>`)}
                      style={{ background: 'none', border: '1px dashed var(--gold-primary)', color: 'var(--gold-primary)', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      + Insert CTA Box
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#060812', border: '1px solid var(--card-border)', color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginRight: '0.5rem' }}>
                      STATUS:
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: '#0e1224', border: '1px solid var(--card-border)', color: '#fff' }}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    Feature this post on Blog Hub Spotlight
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setEditorOpen(false)} className="btn-glass-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-gold-glow">
                    {submitting ? <i className="fa-solid fa-spinner fa-spin" /> : editingBlog ? 'Save Changes' : 'Publish Article'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 900, marginBottom: '0.5rem' }}>{title || 'Article Title Preview'}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>By {author} • {readTime}</p>
                <div
                  className="blog-article-body"
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{ fontSize: '0.95rem', lineHeight: 1.7 }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
