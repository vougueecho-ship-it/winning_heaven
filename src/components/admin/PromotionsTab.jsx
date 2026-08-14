'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { formatDeviceDate } from '../../lib/formatDateTime';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function PromotionsTab({ adminUser }) {
  const [activeSubTab, setActiveSubTab] = useState('segments'); // 'segments' | 'broadcast'

  // SEGMENTS TAB STATES
  const [segment, setSegment] = useState('subscribed'); // 'subscribed' | 'unsubscribed' | 'active'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch segmented users
  const { data: userData, mutate: mutateUsers, error: userError } = useSWR(
    `/api/users?segment=${segment}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${limit}`,
    fetcher
  );

  const usersList = userData?.users || [];
  const totalUsers = userData?.totalUsers || 0;
  const totalPages = userData?.totalPages || 1;

  // BROADCAST TAB FORM STATES
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [promoImageError, setPromoImageError] = useState('');
  const [promoTarget, setPromoTarget] = useState('all'); // 'all' | 'subscribed' | 'unsubscribed' | 'active'
  const [dispatchChannel, setDispatchChannel] = useState('all'); // 'all' | 'push' | 'email' | 'website'
  const [promoType, setPromoType] = useState('message'); // 'message' | 'freeplay' | 'deposit_bonus'
  const [promoFreeplayAmount, setPromoFreeplayAmount] = useState('');
  const [promoBonusPercent, setPromoBonusPercent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handlePromoImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setPromoImageError('Image flyer size must be less than 8MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_width = 800; // Optimal width for lobby banner flyer
        if (width > max_width) {
          height *= max_width / width;
          width = max_width;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75); // 75% JPEG
        setPromoImage(compressedBase64);
        setPromoImageError('');
      };
    };
    reader.readAsDataURL(file);
  };

  // Fetch past broadcasts
  const { data: promoData, mutate: mutatePromos } = useSWR('/api/promotions', fetcher);
  const pastPromotions = promoData?.promotions || [];

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoMessage.trim()) {
      alert('Please fill in Title and Message fields.');
      return;
    }
    if (promoType === 'freeplay' && !(parseFloat(promoFreeplayAmount) > 0)) {
      alert('Enter a freeplay amount greater than 0 for a freeplay offer.');
      return;
    }
    if (promoType === 'deposit_bonus' && !(parseFloat(promoBonusPercent) > 0)) {
      alert('Enter a bonus percentage greater than 0 for a deposit bonus offer.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: promoTitle.trim(),
          message: promoMessage.trim(),
          targetGroup: promoTarget,
          dispatchChannel,
          image: promoImage.trim(),
          promoType,
          freeplayAmount: promoType === 'freeplay' ? parseFloat(promoFreeplayAmount) || 0 : 0,
          bonusPercent: promoType === 'deposit_bonus' ? parseFloat(promoBonusPercent) || 0 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Promotion successfully broadcasted to target players!');
        setPromoTitle('');
        setPromoMessage('');
        setPromoImage('');
        setPromoTarget('all');
        setDispatchChannel('all');
        setPromoType('message');
        setPromoFreeplayAmount('');
        setPromoBonusPercent('');
        mutatePromos();
      } else {
        alert(data.message || 'Failed to send promotion.');
      }
    } catch (err) {
      console.error(err);
      alert('Error broadcasting promotion.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion? It will be removed from player lobbies.')) {
      return;
    }
    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        mutatePromos();
      } else {
        alert(data.message || 'Failed to delete promotion.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting promotion.');
    }
  };

  return (
    <div className="promotions-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in 0.2s ease-out' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'rgba(14, 18, 36, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '20px',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className="fa-solid fa-bullhorn" style={{ color: '#ffd700' }} />
            <span>PROMOTIONS &amp; <span className="gold-gradient-text">PLAYER SEGMENTS</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Filter player audiences, dispatch targeted campaigns, and broadcast in-app offers
          </div>
        </div>

        {/* Tab Navigation header */}
        <div className="promotions-subtabs" style={{ margin: 0 }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('segments')}
            className={`promotions-subtab${activeSubTab === 'segments' ? ' is-active' : ''}`}
          >
            <i className="fa-solid fa-users-gear" aria-hidden="true"></i>
            <span>Player Databases &amp; Segments</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('broadcast')}
            className={`promotions-subtab${activeSubTab === 'broadcast' ? ' is-active' : ''}`}
          >
            <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
            <span>Send Promotion / Broadcast</span>
          </button>
        </div>
      </div>

      {/* VIEW A: PLAYER SEGMENTS */}
      {activeSubTab === 'segments' && (
        <section style={{
          background: 'rgba(14, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div className="promotions-segments-toolbar">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)' }}>
                Audience Database Segmentation
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Filter registered players by subscription status, deposits, or activity.
              </span>
            </div>
            
            {/* Segment selectors */}
            <div className="promotions-segment-pills">
              {[
                { id: 'subscribed', label: 'Subscribed List', icon: 'fa-envelope-open-text' },
                { id: 'unsubscribed', label: 'Unsubscribed List', icon: 'fa-envelope' },
                { id: 'active', label: 'Active Depositors List', icon: 'fa-circle-dollar-to-slot' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSegment(s.id); setPage(1); }}
                  className={`promotions-segment-pill${segment === s.id ? ' is-active' : ''}`}
                >
                  <i className={`fa-solid ${s.icon}`} aria-hidden="true"></i>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute',
              left: '14px',
              color: '#ffd700',
              fontSize: '0.9rem',
              pointerEvents: 'none'
            }}></i>
            <input
              type="text"
              placeholder="Search players in this segment by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(6, 8, 18, 0.85)',
                border: '1.5px solid rgba(255, 215, 0, 0.25)',
                borderRadius: '14px',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>

          <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
            <table className="admin-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(6, 8, 18, 0.9)' }}>
                  <th style={{ color: '#ffd700', width: '50px' }}>#</th>
                  <th style={{ color: '#ffd700' }}>Player Name</th>
                  <th style={{ color: '#ffd700' }}>Email Address</th>
                  <th style={{ color: '#ffd700' }}>Subscriber Status</th>
                  <th style={{ color: '#ffd700' }}>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {!userData && !userError ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--gold-primary)', marginRight: '8px', fontSize: '1.1rem' }}></i> Loading segment players...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2.5rem', fontSize: '0.88rem' }}>
                      <i className="fa-solid fa-users-slash" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                      No players found matching this criteria.
                    </td>
                  </tr>
                ) : (
                  usersList.map((user, idx) => (
                    <tr key={user.email}>
                      <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * limit + idx + 1}</td>
                      <td><strong style={{ color: '#fff' }}>{user.name}</strong></td>
                      <td style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{user.email}</td>
                      <td>
                        <span className={`admin-badge-preview ${user.isSubscribed ? 'b-ready' : 'b-new'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
                          {user.isSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge-preview ${user.status === 'suspended' ? 'b-failed' : 'b-ready'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
                          {user.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Segment Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing page {page} of {totalPages} ({totalUsers} total players)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="action-row-btn"
                  style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.75rem', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  &larr; Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="action-row-btn"
                  style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.75rem', opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* VIEW B: BROADCAST PROMOTION */}
      {activeSubTab === 'broadcast' && (
        <div className="promotions-broadcast-grid">
          
          {/* Send Promo Form */}
          <section style={{
            background: 'rgba(14, 18, 36, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.18)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-paper-plane" style={{ color: '#ffd700' }} />
                <span>Broadcast New Campaign Flyer</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Dispatch push notifications, email blasts, and in-game lobby announcement popups.
              </span>
            </div>

            <form onSubmit={handleBroadcastSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Promotion Title
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-heading" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="text"
                    placeholder="e.g. 400% Weekend Gold Reload Match!"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Message / Announcement Body
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-message" style={{ position: 'absolute', left: '14px', top: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <textarea
                    rows="3"
                    placeholder="Describe the offer rules, coupon code, or promo details here..."
                    value={promoMessage}
                    onChange={(e) => setPromoMessage(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Upload Promotion Banner Image (Optional)
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px dashed rgba(255, 215, 0, 0.35)',
                  borderRadius: '14px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer'
                }}>
                  <i className="fa-solid fa-file-image" style={{ color: '#ffd700', fontSize: '1rem', marginRight: '0.75rem' }}></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePromoImageUpload}
                    style={{
                      width: '100%',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                {promoImageError && <span style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>{promoImageError}</span>}
                {promoImage && (
                  <div className="promotions-image-preview">
                    <div className="promotions-image-thumb">
                      <img src={promoImage} alt="Promo Preview" />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold' }}>Banner flyer attached ✓</span>
                    <button type="button" onClick={() => setPromoImage('')} className="promotions-remove-image">Remove</button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Campaign Offer Type
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-gift" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }}></i>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="message" style={{ background: '#0a0d16' }}>Message Only (Informational Announcement)</option>
                    <option value="freeplay" style={{ background: '#0a0d16' }}>Freeplay Offer (Player requests free credits on game)</option>
                    <option value="deposit_bonus" style={{ background: '#0a0d16' }}>Deposit Bonus Offer (% Bonus applied to next deposit)</option>
                  </select>
                </div>
              </div>

              {promoType === 'freeplay' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Freeplay Amount ($)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-coins" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }}></i>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 10"
                      value={promoFreeplayAmount}
                      onChange={(e) => setPromoFreeplayAmount(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(255, 215, 0, 0.22)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {promoType === 'deposit_bonus' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Deposit Bonus Percentage (%)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }}></i>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 400"
                      value={promoBonusPercent}
                      onChange={(e) => setPromoBonusPercent(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(6, 8, 18, 0.85)',
                        border: '1.5px solid rgba(255, 215, 0, 0.22)',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Target Player Audience
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-users-viewfinder" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }}></i>
                  <select
                    value={promoTarget}
                    onChange={(e) => setPromoTarget(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="all" style={{ background: '#0a0d16' }}>All Registered Players (Universal Blast)</option>
                    <option value="subscribed" style={{ background: '#0a0d16' }}>Subscribed Players Only</option>
                    <option value="unsubscribed" style={{ background: '#0a0d16' }}>Unsubscribed Players Only</option>
                    <option value="active" style={{ background: '#0a0d16' }}>Active Depositors Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Dispatch Delivery Channels
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-tower-broadcast" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }}></i>
                  <select
                    value={dispatchChannel}
                    onChange={(e) => setDispatchChannel(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="all" style={{ background: '#0a0d16' }}>ALL Channels (Push Notification + Email + In-Lobby Banner)</option>
                    <option value="push" style={{ background: '#0a0d16' }}>App Push Notification Only</option>
                    <option value="email" style={{ background: '#0a0d16' }}>Email Broadcast Only</option>
                    <option value="website" style={{ background: '#0a0d16' }}>Website Promo Banner Only (In-App Lobby)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.95rem',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#04050b',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: isBroadcasting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 6px 20px rgba(255, 170, 0, 0.4)',
                  transition: 'all 0.25s ease'
                }}
              >
                {isBroadcasting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>BROADCASTING PROMOTION...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" />
                    <span>BROADCAST PROMO LIVE &rarr;</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Past Broadcasts List */}
          <section style={{
            background: 'rgba(14, 18, 36, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.18)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#ffd700' }} />
                <span>Active Campaign History</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Previously dispatched promotions currently displaying in player lobbies.
              </span>
            </div>

            {pastPromotions.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-bullhorn" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: '0.5rem' }} />
                No promotional campaigns have been dispatched yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '520px', overflowY: 'auto' }}>
                {pastPromotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="promotions-past-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.88rem', minWidth: 0, wordBreak: 'break-word' }}>{promo.title}</strong>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id)}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0.3rem 0.55rem', borderRadius: '8px', flexShrink: 0 }}
                        title="Delete Promotion"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0', whiteSpace: 'normal', lineHeight: '1.45', wordBreak: 'break-word' }}>
                      {promo.message}
                    </p>
                    {promo.promoType && promo.promoType !== 'message' && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)' }}>
                          {promo.promoType === 'freeplay'
                            ? `Freeplay $${Number(promo.freeplayAmount || 0).toFixed(2)}`
                            : `Deposit Bonus ${Number(promo.bonusPercent || 0)}%`}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Audience: <strong style={{ color: '#ffd700' }}>{promo.targetGroup.toUpperCase()}</strong></span>
                      <span>{formatDeviceDate(promo.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
}
