'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlogAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/blogs/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('winning_heaven_blog_admin_session', JSON.stringify(data.user));
        router.push('/blog-admin');
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', color: '#fff' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--card-bg)',
          border: '1px solid var(--gold-primary)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(255,200,0,0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-primary), #b8860b)', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '1.5rem', marginBottom: '0.8rem', boxShadow: '0 0 20px var(--gold-glow)' }}>
            <i className="fa-solid fa-newspaper" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            <span className="gold-gradient-text">BLOG CMS</span> <span className="cyan-gradient-text">LOGIN</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Winning Heaven Dedicated Blog Content Portal
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,0,85,0.15)', border: '1px solid var(--red-primary)', color: '#ff80ab', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Blog Admin Email
            </label>
            <input
              type="email"
              required
              placeholder="blogadmin@winningheaven.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--card-border)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--card-border)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold-glow"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : 'SIGN IN TO BLOG CMS'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <Link href="/blog" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← View Public Blog Hub
          </Link>
        </div>
      </div>
    </main>
  );
}
