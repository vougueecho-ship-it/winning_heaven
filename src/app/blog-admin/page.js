'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { compressImageFile } from '../../lib/imageCompress';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'content' | 'faqs' | 'seo' | 'preview'
  const [editingBlog, setEditingBlog] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [category, setCategory] = useState('Sweepstakes Games');
  const [author, setAuthor] = useState('Winning Heaven Team');
  const [readTime, setReadTime] = useState('5 min read');
  const [image, setImage] = useState('/winning_heaven_banner.png');
  const [imageUploading, setImageUploading] = useState(false);
  const [tags, setTags] = useState('Sweepstakes Games, Freeplay, Cashout');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [featured, setFeatured] = useState(false);
  const [faqs, setFaqs] = useState([]); // [{ question: '', answer: '' }]
  const [submitting, setSubmitting] = useState(false);

  // Link Tool State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('/register');
  const [linkNewTab, setLinkNewTab] = useState(false);

  const contentTextareaRef = useRef(null);

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

  // Title change auto updates slug and metaTitle if user hasn't set custom ones
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!isCustomSlug && !editingBlog) {
      setSlug(slugify(val));
    }
    if (!metaTitle || metaTitle === title) {
      setMetaTitle(val);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setTitle('');
    setSlug('');
    setIsCustomSlug(false);
    setMetaTitle('');
    setMetaDescription('');
    setCanonicalUrl('');
    setCategory('Sweepstakes Games');
    setAuthor('Winning Heaven Team');
    setReadTime('5 min read');
    setImage('/winning_heaven_banner.png');
    setTags('Sweepstakes Games, Freeplay, Cashout');
    setSummary('');
    setContent(`
      <p class="lead">Write your engaging article introduction here to hook players...</p>

      <h2>Main Heading 1</h2>
      <p>Detail your sweepstakes game tips, platform features, or registration guide here.</p>

      <div class="blog-cta-box">
        <h3>Claim $3 Freeplay Bonus Today!</h3>
        <p>Register on Winning Heaven to play top games with instant cashouts.</p>
        <a href="/register" class="btn-gold-glow">Register & Claim Freeplay</a>
      </div>

      <h2>Frequently Asked Questions</h2>
      <p>Check the FAQs section below for quick answers to common questions.</p>
    `);
    setFaqs([
      {
        question: 'How do I claim my $3 Freeplay bonus on Winning Heaven?',
        answer: 'Simply <a href="/register">create your free player account</a>, verify your email, and your $3 freeplay will be activated automatically!'
      },
      {
        question: 'What is the minimum cashout limit?',
        answer: 'The standard minimum cashout is $25.00 via verified CashApp, Chime, Venmo, or Crypto with under 5-minute processing.'
      }
    ]);
    setStatus('published');
    setFeatured(false);
    setActiveTab('general');
    setEditorOpen(true);
  };

  const handleOpenEditModal = (blog) => {
    setEditingBlog(blog);
    setTitle(blog.title || '');
    setSlug(blog.slug || slugify(blog.title));
    setIsCustomSlug(true);
    setMetaTitle(blog.metaTitle || blog.title || '');
    setMetaDescription(blog.metaDescription || blog.summary || '');
    setCanonicalUrl(blog.canonicalUrl || '');
    setCategory(blog.category || 'Sweepstakes Games');
    setAuthor(blog.author || 'Winning Heaven Team');
    setReadTime(blog.readTime || '5 min read');
    setImage(blog.image || '/winning_heaven_banner.png');
    setTags(Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || '');
    setSummary(blog.summary || '');
    setContent(blog.content || '');
    setFaqs(Array.isArray(blog.faqs) && blog.faqs.length > 0 ? blog.faqs : []);
    setStatus(blog.status || 'published');
    setFeatured(Boolean(blog.featured));
    setActiveTab('general');
    setEditorOpen(true);
  };

  // Direct Image File Uploader
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    try {
      setImageUploading(true);
      const compressed = await compressImageFile(file, { maxSize: 1200, quality: 0.72 });
      setImage(compressed);
      showToast('Featured image uploaded & optimized successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to process image file.', 'error');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  // FAQ Manager Handlers
  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleFaqChange = (index, field, value) => {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveFaq = (index) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  // Content Toolbar Format Inserter
  const insertFormatting = (tagStart, tagEnd = '', placeholder = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + `${tagStart}${placeholder}${tagEnd}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newContent = content.substring(0, start) + `${tagStart}${selectedText}${tagEnd}` + content.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 50);
  };

  // Insert Link Action
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const textToUse = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}"${targetAttr}>${textToUse}</a>`;
    insertFormatting(linkHtml, '', '');
    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('/register');
    setLinkNewTab(false);
  };

  const handleSaveArticle = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) {
      showToast('Article Title is required.', 'error');
      setActiveTab('general');
      return;
    }
    if (!content.trim()) {
      showToast('Article Content is required.', 'error');
      setActiveTab('content');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        slug: slug.trim() || slugify(title),
        metaTitle: metaTitle.trim() || title.trim(),
        metaDescription: metaDescription.trim() || summary.trim() || title.substring(0, 155),
        summary: summary.trim() || metaDescription.trim() || title.substring(0, 155),
        category,
        author,
        readTime,
        image,
        tags,
        content,
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
        canonicalUrl: canonicalUrl.trim(),
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
      (b.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.slug || '').toLowerCase().includes(searchQuery.toLowerCase());
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
            placeholder="Search articles by title, keyword, or slug..."
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
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden', background: '#0b0d18' }}>
                  <img src={b.image || '/winning_heaven_banner.png'} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: b.status === 'draft' ? '#ff9800' : 'var(--emerald-primary)', color: '#000', fontWeight: 900, fontSize: '0.7rem', padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                    {b.status === 'draft' ? 'DRAFT' : 'PUBLISHED'}
                  </span>
                  {b.featured && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--gold-primary)', color: '#000', fontWeight: 900, fontSize: '0.7rem', padding: '3px 8px', borderRadius: '8px' }}>
                      FEATURED
                    </span>
                  )}
                  {Array.isArray(b.faqs) && b.faqs.length > 0 && (
                    <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0, 240, 255, 0.85)', color: '#000', fontWeight: 800, fontSize: '0.65rem', padding: '2px 7px', borderRadius: '6px' }}>
                      <i className="fa-solid fa-circle-question"></i> {b.faqs.length} FAQs
                    </span>
                  )}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)', fontWeight: 700 }}>{b.category}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/blog/{b.slug}</span>
                  </div>
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
                    <Link
                      href={`/blog/${b.slug}`}
                      target="_blank"
                      className="btn-glass-secondary"
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', textDecoration: 'none', color: 'var(--gold-primary)' }}
                      title="View live article"
                    >
                      <i className="fa-solid fa-eye" />
                    </Link>
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

      {/* CREATE / EDIT ARTICLE MODAL */}
      {editorOpen && (
        <div className="modal-backdrop-custom">
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '92vh',
              background: '#0a0d1d',
              border: '1px solid var(--gold-primary)',
              borderRadius: '24px',
              padding: '1.75rem',
              overflowY: 'auto',
              boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-pen-nib"></i>
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                  {editingBlog ? `Edit: ${editingBlog.title}` : 'Create New Article'}
                </h2>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.6rem', cursor: 'pointer' }}
                title="Close Editor"
              >
                &times;
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { id: 'general', label: '1. General & Image', icon: 'fa-solid fa-sliders' },
                { id: 'content', label: '2. Article Body (HTML)', icon: 'fa-solid fa-newspaper' },
                { id: 'faqs', label: `3. FAQs (${faqs.length})`, icon: 'fa-solid fa-circle-question' },
                { id: 'seo', label: '4. SEO & Meta Tags', icon: 'fa-solid fa-magnifying-glass' },
                { id: 'preview', label: '5. Live Reader Preview', icon: 'fa-solid fa-eye' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    background: activeTab === t.id ? 'linear-gradient(135deg, #ffd700 0%, #cca000 100%)' : 'rgba(255,255,255,0.06)',
                    color: activeTab === t.id ? '#000' : '#fff'
                  }}
                >
                  <i className={t.icon} style={{ marginRight: '6px' }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT AREAS */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {/* TAB 1: GENERAL & IMAGE */}
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                        ARTICLE TITLE *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Best Sweepstakes Games to Play Online in 2026"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                        CATEGORY
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0e1224', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.9rem' }}
                      >
                        <option value="Sweepstakes Games">Sweepstakes Games</option>
                        <option value="Freeplay & Bonuses">Freeplay & Bonuses</option>
                        <option value="App Guides">App Guides</option>
                        <option value="Cashout & Payment">Cashout & Payment</option>
                        <option value="Gaming Strategies">Gaming Strategies</option>
                        <option value="Platform News">Platform News</option>
                      </select>
                    </div>
                  </div>

                  {/* FEATURED IMAGE UPLOADER */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '14px', padding: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.6rem' }}>
                      <i className="fa-solid fa-image"></i> FEATURED COVER IMAGE (UPLOAD OR URL)
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
                            border: '1px dashed var(--gold-primary)',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            cursor: 'pointer',
                            color: '#ffd700',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textAlign: 'center'
                          }}
                        >
                          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.1rem' }}></i>
                          <span>{imageUploading ? 'Processing & Optimizing...' : 'Upload Image from Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                          Auto-compressed for instant fast loading on mobile and desktop.
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Or enter Image URL / Path:
                        </span>
                        <input
                          type="text"
                          placeholder="/winning_heaven_banner.png or https://..."
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>

                    {/* Image Preview */}
                    {image && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '120px', height: '68px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: '#000' }}>
                          <img src={image} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setImage('/winning_heaven_banner.png')}
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#aaa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Reset to Default
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                        READ TIME
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
                        TAGS (COMMA SEPARATED)
                      </label>
                      <input
                        type="text"
                        placeholder="Sweepstakes, Freeplay, Juwa"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      ARTICLE SHORT SUMMARY (CARD SNIPPET)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Short 1-2 line summary to display on the blog listing grid..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
                      Feature this post on Blog Spotlight / Top Banner
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: ARTICLE BODY & CONTENT (HTML) */}
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* RICH FORMATTING TOOLBAR */}
                  <div style={{ background: '#0c0f20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}>FORMAT:</span>
                    
                    {/* Headings */}
                    <button type="button" onClick={() => insertFormatting('<h2>', '</h2>', 'Heading 2')} style={toolbarBtnStyle} title="Heading 2">H2</button>
                    <button type="button" onClick={() => insertFormatting('<h3>', '</h3>', 'Heading 3')} style={toolbarBtnStyle} title="Heading 3">H3</button>
                    <button type="button" onClick={() => insertFormatting('<h4>', '</h4>', 'Heading 4')} style={toolbarBtnStyle} title="Heading 4">H4</button>
                    
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

                    {/* Styles */}
                    <button type="button" onClick={() => insertFormatting('<strong>', '</strong>', 'bold text')} style={toolbarBtnStyle} title="Bold"><strong>B</strong></button>
                    <button type="button" onClick={() => insertFormatting('<em>', '</em>', 'italic text')} style={toolbarBtnStyle} title="Italic"><em>I</em></button>
                    <button type="button" onClick={() => insertFormatting('<u>', '</u>', 'underlined text')} style={toolbarBtnStyle} title="Underline"><u>U</u></button>
                    <button type="button" onClick={() => insertFormatting('<p>', '</p>', 'Paragraph text...')} style={toolbarBtnStyle} title="Paragraph">&lt;p&gt;</button>
                    
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

                    {/* Lists & Quotes */}
                    <button type="button" onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n  <li>Point 2</li>\n</ul>', 'Point 1')} style={toolbarBtnStyle} title="Bullet List"><i className="fa-solid fa-list-ul"></i></button>
                    <button type="button" onClick={() => insertFormatting('<ol>\n  <li>', '</li>\n  <li>Step 2</li>\n</ol>', 'Step 1')} style={toolbarBtnStyle} title="Numbered List"><i className="fa-solid fa-list-ol"></i></button>
                    <button type="button" onClick={() => insertFormatting('<blockquote>', '</blockquote>', 'Important key takeaway quote...')} style={toolbarBtnStyle} title="Quote"><i className="fa-solid fa-quote-left"></i></button>

                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

                    {/* Interlinking & Media */}
                    <button
                      type="button"
                      onClick={() => setLinkModalOpen(true)}
                      style={{ ...toolbarBtnStyle, color: 'var(--cyan-glow)', borderColor: 'rgba(0,240,255,0.3)' }}
                      title="Insert Internal / External Link"
                    >
                      <i className="fa-solid fa-link"></i> Link
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting('<img src="/winning_heaven_banner.png" alt="Game banner" style="width:100%; border-radius:12px; margin: 1rem 0;" />')}
                      style={toolbarBtnStyle}
                      title="Insert Image Tag"
                    >
                      <i className="fa-solid fa-image"></i> Img
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting('<table style="width:100%; border-collapse: collapse; margin: 1rem 0;">\n  <thead>\n    <tr style="background: rgba(255,215,0,0.15); color: #ffd700;">\n      <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">Feature</th>\n      <th style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">Details</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">Freeplay</td>\n      <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">$3 Instant Bonus</td>\n    </tr>\n  </tbody>\n</table>')}
                      style={toolbarBtnStyle}
                      title="Insert Table"
                    >
                      <i className="fa-solid fa-table"></i> Table
                    </button>

                    {/* CTA Widgets */}
                    <button
                      type="button"
                      onClick={() => insertFormatting(`\n<div class="blog-cta-box">\n  <h3>Claim $3 Freeplay Bonus Today!</h3>\n  <p>Register on Winning Heaven to play with instant cashouts.</p>\n  <a href="/register" class="btn-gold-glow">Register & Claim Freeplay</a>\n</div>\n`)}
                      style={{ ...toolbarBtnStyle, color: '#ffd700', borderColor: 'rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.1)' }}
                      title="Insert Freeplay CTA Box"
                    >
                      <i className="fa-solid fa-gift"></i> + Freeplay CTA
                    </button>
                  </div>

                  {/* Interlink Helper Modal / Quick Popup */}
                  {linkModalOpen && (
                    <div style={{ background: '#0e1224', border: '1px solid var(--cyan-glow)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan-glow)' }}>
                          <i className="fa-solid fa-link"></i> Insert Link / Interlink:
                        </span>
                        <button type="button" onClick={() => setLinkModalOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>&times;</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Link Text:</label>
                          <input
                            type="text"
                            placeholder="e.g. Register & Claim Bonus"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target URL / Route:</label>
                          <input
                            type="text"
                            placeholder="e.g. /register, /games, /lobby, /contact"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      {/* Quick Internal Route Badges */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Quick Routes:</span>
                        {['/register', '/games', '/lobby', '/contact', '/login', '/download-app'].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setLinkUrl(r)}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffd700', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer' }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                        <label style={{ fontSize: '0.72rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
                          Open in new tab
                        </label>
                        <button
                          type="button"
                          onClick={handleInsertLink}
                          style={{ background: 'var(--cyan-glow)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Insert Link Tag
                        </button>
                      </div>
                    </div>
                  )}

                  {/* HTML Content Textarea */}
                  <textarea
                    ref={contentTextareaRef}
                    rows={16}
                    required
                    placeholder="Write article HTML content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: '#060812',
                      border: '1px solid var(--card-border)',
                      color: '#fff',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      outline: 'none',
                      minHeight: '360px'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Supports all standard HTML elements: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;a&gt;, &lt;table&gt;, &lt;img&gt;, etc.</span>
                    <span>{content.length} characters</span>
                  </div>
                </div>
              )}

              {/* TAB 3: DYNAMIC FAQS BUILDER */}
              {activeTab === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontWeight: 800 }}>
                        <i className="fa-solid fa-circle-question text-gold"></i> Dynamic Article FAQs
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        Each blog has its own custom FAQs. These render with FAQPage Schema for Google Search.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="btn-gold-glow"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      <i className="fa-solid fa-plus"></i> Add FAQ Question
                    </button>
                  </div>

                  {faqs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                      <i className="fa-solid fa-circle-question" style={{ fontSize: '2.5rem', color: 'var(--gold-primary)', opacity: 0.5, marginBottom: '0.75rem' }}></i>
                      <h5 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.4rem' }}>No FAQs added for this article yet</h5>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 1rem' }}>
                        Add common customer questions and answers to improve SEO rankings and reader satisfaction.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="btn-glass-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        + Add First FAQ
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          style={{
                            background: '#0c0f20',
                            border: '1px solid rgba(255,215,0,0.25)',
                            borderRadius: '14px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                              FAQ #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(index)}
                              style={{ background: 'none', border: 'none', color: '#ff5c93', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-trash"></i> Delete FAQ
                            </button>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 700 }}>
                              QUESTION:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. How long does a cashout take?"
                              value={faq.question}
                              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.85rem' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 700 }}>
                              ANSWER (SUPPORTS HTML & LINKS):
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Answer details..."
                              value={faq.answer}
                              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.85rem', lineHeight: 1.5 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SEO & META TAGS */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Google SERP Live Preview Box */}
                  <div style={{ background: '#1c1f2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <i className="fa-brands fa-google" style={{ color: '#4285f4' }}></i>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                        Google Search Snippet Preview
                      </span>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', color: '#202124', fontFamily: 'Arial, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#202124', marginBottom: '0.2rem' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>W</div>
                        <span style={{ fontWeight: 600 }}>Winning Heaven</span>
                        <span style={{ color: '#5f6368', fontSize: '0.75rem' }}>› blog › {slug || slugify(title) || 'article-slug'}</span>
                      </div>
                      <h4 style={{ color: '#1a0dab', fontSize: '1.15rem', fontWeight: 400, margin: '0 0 0.3rem', lineHeight: 1.3, cursor: 'pointer' }}>
                        {metaTitle || title || 'Your Article SEO Meta Title'} | Winning Heaven Blog
                      </h4>
                      <p style={{ color: '#4d5156', fontSize: '0.85rem', margin: 0, lineHeight: 1.45 }}>
                        {metaDescription || summary || 'Your custom meta description will appear here in Google search results to attract clicks and readers.'}
                      </p>
                    </div>
                  </div>

                  {/* SEO Form Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                          CUSTOM SEO META TITLE (TITLE TAG)
                        </label>
                        <span style={{ fontSize: '0.7rem', color: (metaTitle || title).length > 60 ? '#f87171' : '#86efac' }}>
                          {(metaTitle || title).length} / 60 characters (recommended)
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Best Sweepstakes Games in 2026 - Instant Cashouts"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                          CUSTOM META DESCRIPTION (GOOGLE SNIPPET)
                        </label>
                        <span style={{ fontSize: '0.7rem', color: (metaDescription || summary).length > 160 ? '#f87171' : '#86efac' }}>
                          {(metaDescription || summary).length} / 160 characters
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Write a compelling 150-160 character description including keywords to maximize Google CTR..."
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                            URL SLUG
                          </label>
                          <button
                            type="button"
                            onClick={() => { setSlug(slugify(title)); setIsCustomSlug(false); }}
                            style={{ background: 'none', border: 'none', color: 'var(--cyan-glow)', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            Reset from Title
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
                          <span style={{ padding: '0.75rem 0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>/blog/</span>
                          <input
                            type="text"
                            placeholder="article-slug"
                            value={slug}
                            onChange={(e) => { setSlug(slugify(e.target.value)); setIsCustomSlug(true); }}
                            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.3rem' }}>
                          CUSTOM CANONICAL URL (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="https://winningheaven.com/blog/..."
                          value={canonicalUrl}
                          onChange={(e) => setCanonicalUrl(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: '#fff', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LIVE READER PREVIEW */}
              {activeTab === 'preview' && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <span style={{ background: 'var(--gold-primary)', color: '#000', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {category}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• {readTime}</span>
                  </div>

                  <h1 style={{ fontSize: '1.85rem', color: '#fff', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {title || 'Article Title Preview'}
                  </h1>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    By {author} • Official Winning Heaven Guide
                  </p>

                  {image && (
                    <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', maxHeight: '320px', background: '#000' }}>
                      <img src={image} alt="Preview cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div
                    className="blog-article-body"
                    dangerouslySetInnerHTML={{ __html: content }}
                    style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.9)' }}
                  />

                  {/* FAQs Preview */}
                  {faqs.filter((f) => f.question && f.answer).length > 0 && (
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '1rem' }}>
                        <i className="fa-solid fa-circle-question"></i> Frequently Asked Questions
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {faqs.filter((f) => f.question && f.answer).map((f, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
                            <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '0 0 0.4rem', fontWeight: 700 }}>
                              Q{i + 1}: {f.question}
                            </h4>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: f.answer }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['general', 'content', 'faqs', 'seo', 'preview'];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                  }}
                  disabled={activeTab === 'general'}
                  className="btn-glass-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', opacity: activeTab === 'general' ? 0.4 : 1 }}
                >
                  ← Previous Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['general', 'content', 'faqs', 'seo', 'preview'];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                  }}
                  disabled={activeTab === 'preview'}
                  className="btn-glass-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', opacity: activeTab === 'preview' ? 0.4 : 1 }}
                >
                  Next Tab →
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditorOpen(false)} className="btn-glass-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveArticle}
                  disabled={submitting}
                  className="btn-gold-glow"
                  style={{ minWidth: '150px' }}
                >
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
                  ) : editingBlog ? (
                    <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
                  ) : (
                    <><i className="fa-solid fa-paper-plane" /> Publish Article</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const toolbarBtnStyle = {
  background: 'rgba(255, 255, 255, 0.07)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#fff',
  borderRadius: '6px',
  padding: '4px 8px',
  fontSize: '0.72rem',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.15s'
};
