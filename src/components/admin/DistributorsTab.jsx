'use client';

import PanelModalBackdrop from '../PanelModalBackdrop';
import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function DistributorsTab() {
  const { data, mutate } = useSWR('/api/distributors', fetcher);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('A');
  const [commissionRate, setCommissionRate] = useState(10);
  const [websiteCommissionRate, setWebsiteCommissionRate] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingDist, setEditingDist] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editType, setEditType] = useState('A');
  const [editCommissionRate, setEditCommissionRate] = useState(0);
  const [editWebsiteCommissionRate, setEditWebsiteCommissionRate] = useState(0);

  // Referred Players List View Modal
  const [viewingPlayersDist, setViewingPlayersDist] = useState(null);
  const [referredPlayersList, setReferredPlayersList] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  const distributors = data?.distributors || [];

  const typeACount = distributors.filter(d => (d.type || 'A') === 'A').length;
  const typeBCount = distributors.filter(d => d.type === 'B').length;

  const filteredDistributors = distributors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.id && d.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill out all distributor login credential fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password.trim(),
          type,
          commissionRate: Number(commissionRate),
          websiteCommissionRate: Number(websiteCommissionRate)
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setName('');
        setEmail('');
        setPassword('');
        setType('A');
        setCommissionRate(10);
        setWebsiteCommissionRate(5);
        mutate();
        alert('Distributor created successfully!');
      } else {
        alert(resData.message || 'Failed to create distributor.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (dist) => {
    setEditingDist(dist);
    setEditName(dist.name);
    setEditEmail(dist.email);
    setEditPassword('');
    setEditType(dist.type || 'A');
    setEditCommissionRate(dist.commissionRate || 0);
    setEditWebsiteCommissionRate(dist.websiteCommissionRate || 0);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      alert('Distributor Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingDist.id,
        name: editName.trim(),
        email: editEmail.toLowerCase().trim(),
        type: editType,
        commissionRate: Number(editCommissionRate),
        websiteCommissionRate: Number(editWebsiteCommissionRate)
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const response = await fetch('/api/distributors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();
      if (resData.success) {
        setEditingDist(null);
        mutate();
        alert('Distributor details updated successfully!');
      } else {
        alert(resData.message || 'Failed to update distributor.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating distributor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id, name) => {
    if (window.confirm(`Delete distributor "${name}"?\n\nPlayers keep all game data. Their requests, deposits & coins go to Super Admin until you Undo — then they return to this distributor.`)) {
      try {
        const response = await fetch(`/api/distributors?id=${id}`, {
          method: 'DELETE'
        });
        const resData = await response.json();
        if (resData.success) {
          mutate();
          alert('Distributor deleted successfully.');
        } else {
          alert(resData.message || 'Failed to delete distributor.');
        }
      } catch (err) {
        console.error(err);
        alert('Error deleting distributor.');
      }
    }
  };

  const handleViewPlayers = async (dist) => {
    setViewingPlayersDist(dist);
    setIsLoadingPlayers(true);
    setReferredPlayersList([]);
    try {
      const res = await fetch(`/api/distributors/stats?distributorId=${dist.id}`);
      const resData = await res.json();
      if (resData.success) {
        setReferredPlayersList(resData.players || []);
      } else {
        alert(resData.message || 'Failed to load players.');
      }
    } catch (err) {
      console.error(err);
      alert('Error loading players.');
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in 0.2s ease-out' }}>
      
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
            <i className="fa-solid fa-handshake-angle" style={{ color: '#ffd700' }} />
            <span>DISTRIBUTORS &amp; <span className="gold-gradient-text">PARTNER NETWORK</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Register platform distributors, configure profit commission splits, and audit network volume
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            color: '#ffd700',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <i className="fa-solid fa-sitemap" />
            <span>{distributors.length} Total Partners</span>
          </div>
          <div style={{
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            color: '#00f0ff',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <i className="fa-solid fa-server" />
            <span>{typeACount} Type A (Standard)</span>
          </div>
          <div style={{
            background: 'rgba(255, 77, 109, 0.1)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            color: '#ff4d6d',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <i className="fa-solid fa-fire" />
            <span>{typeBCount} Type B (Independent)</span>
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN WORKSPACE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 440px) 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* 1) REGISTER FORM CARD */}
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
              <i className="fa-solid fa-user-plus" style={{ color: '#ffd700' }} />
              <span>Register New Distributor</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Onboard a franchise distributor with custom profit splits.
            </span>
          </div>

          <form onSubmit={handleCreateSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Distributor / Business Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-building" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. California Gold Partner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                Login Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="email"
                  placeholder="dist@winningheaven.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                Initial Access Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="SecurePassword123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Distributor Infrastructure Architecture
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div
                  onClick={() => setType('A')}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '12px',
                    background: type === 'A' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                    border: `1.5px solid ${type === 'A' ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: type === 'A' ? '0 0 12px rgba(0, 240, 255, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: type === 'A' ? '#00f0ff' : '#fff', fontWeight: 800, fontSize: '0.82rem' }}>
                    <i className="fa-solid fa-server" />
                    <span>Type A (Standard)</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.3' }}>
                    Uses System Gateways &amp; Main Operations Staff.
                  </div>
                </div>

                <div
                  onClick={() => setType('B')}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '12px',
                    background: type === 'B' ? 'rgba(255, 77, 109, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                    border: `1.5px solid ${type === 'B' ? '#ff4d6d' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: type === 'B' ? '0 0 12px rgba(255, 77, 109, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: type === 'B' ? '#ff4d6d' : '#fff', fontWeight: 800, fontSize: '0.82rem' }}>
                    <i className="fa-solid fa-fire" />
                    <span>Type B (Independent)</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.3' }}>
                    Uses their own custom Gateways &amp; assigned Staff.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Distributor Comm (%)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.85rem' }} />
                  <input
                    type="number"
                    placeholder="10"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  % Net profit earned by partner
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Platform Comm (%)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-hand-holding-dollar" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.85rem' }} />
                  <input
                    type="number"
                    placeholder="5"
                    min="0"
                    max="100"
                    value={websiteCommissionRate}
                    onChange={(e) => setWebsiteCommissionRate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  % Net profit paid to house
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.95rem',
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
                border: 'none',
                borderRadius: '14px',
                color: '#04050b',
                fontSize: '0.92rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 6px 20px rgba(255, 170, 0, 0.4)',
                transition: 'all 0.25s ease'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>REGISTERING DISTRIBUTOR...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-handshake" />
                  <span>REGISTER DISTRIBUTOR &rarr;</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* 2) DISTRIBUTORS LIST */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-network-wired" style={{ color: '#ffd700' }} />
                <span>Distributors Network Directory</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Active partner accounts, commission splits, and cumulative volume.
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 215, 0, 0.12)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '10px',
              padding: '0.35rem 0.75rem',
              color: '#ffd700',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {filteredDistributors.length} Partners Listed
            </div>
          </div>

          {/* Search Bar */}
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
            }} />
            <input
              type="text"
              placeholder="Search by ID, name, or login email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th style={{ color: '#ffd700' }}>Distributor Partner</th>
                  <th style={{ color: '#ffd700' }}>Type</th>
                  <th style={{ color: '#ffd700' }}>Rev Share Split</th>
                  <th style={{ color: '#ffd700' }}>Performance Metrics</th>
                  <th style={{ color: '#ffd700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistributors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <i className="fa-solid fa-sitemap" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                      No distributor partners registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredDistributors.map((dist) => {
                    const isTypeB = dist.type === 'B';
                    return (
                      <tr key={dist.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              background: isTypeB ? 'rgba(255, 77, 109, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                              border: `1px solid ${isTypeB ? 'rgba(255, 77, 109, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.85rem',
                              color: isTypeB ? '#ff4d6d' : '#00f0ff'
                            }}>
                              {(dist.name || 'D').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>{dist.name}</strong>
                              <span style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{dist.email}</span>
                              <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>[ID: {dist.id}]</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            background: isTypeB ? 'rgba(255, 77, 109, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                            border: `1px solid ${isTypeB ? 'rgba(255, 77, 109, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`,
                            color: isTypeB ? '#ff4d6d' : '#00f0ff',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            <i className={`fa-solid ${isTypeB ? 'fa-fire' : 'fa-server'}`} />
                            {isTypeB ? 'Type B (Indep.)' : 'Type A (Standard)'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem' }}>
                            <div>Partner Comm: <strong style={{ color: '#ffd700' }}>{dist.commissionRate || 0}%</strong></div>
                            <div>Platform Comm: <strong style={{ color: '#00e676' }}>{dist.websiteCommissionRate || 0}%</strong></div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <span>Players: <strong style={{ color: '#fff' }}>{dist.playersCount || 0}</strong></span>
                              <span>Deposits: <strong style={{ color: '#00e676' }}>${(dist.totalDeposits || 0).toFixed(2)}</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <span>Payouts: <strong style={{ color: '#ef4444' }}>${(dist.totalWithdrawals || 0).toFixed(2)}</strong></span>
                              <span>Net Profit: <strong style={{ color: '#ffd700' }}>${(dist.netProfit ?? Math.max(0, (dist.totalDeposits || 0) - (dist.totalWithdrawals || 0))).toFixed(2)}</strong></span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.2rem', marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Earned Comm: <strong style={{ color: '#ffd700' }}>${(dist.commissionEarned || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleViewPlayers(dist)}
                              title="View Referred Players"
                              style={{
                                background: 'rgba(0, 240, 255, 0.12)',
                                border: '1px solid rgba(0, 240, 255, 0.35)',
                                color: '#00f0ff',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fa-solid fa-users" />
                            </button>
                            <button
                              onClick={() => handleEditClick(dist)}
                              title="Edit Details"
                              style={{
                                background: 'rgba(255, 215, 0, 0.12)',
                                border: '1px solid rgba(255, 215, 0, 0.35)',
                                color: '#ffd700',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(dist.id, dist.name)}
                              title="Delete Distributor"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#ef4444',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* 3) EDIT DISTRIBUTOR MODAL */}
      {editingDist && (
        <PanelModalBackdrop onClick={() => setEditingDist(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'rgba(10, 14, 30, 0.95)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(255, 200, 0, 0.2)',
              padding: '2rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-user-gear" style={{ color: '#ffd700' }} />
                <span>Edit Distributor Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDist(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Distributor Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-building" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                  Login Email
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
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
                  New Password (Leave blank to keep unchanged)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="text"
                    placeholder="Enter new password if changing..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Architecture Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div
                    onClick={() => setEditType('A')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: editType === 'A' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                      border: `1.5px solid ${editType === 'A' ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: editType === 'A' ? '#00f0ff' : '#fff',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}
                  >
                    Type A (Standard)
                  </div>
                  <div
                    onClick={() => setEditType('B')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: editType === 'B' ? 'rgba(255, 77, 109, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                      border: `1.5px solid ${editType === 'B' ? '#ff4d6d' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: editType === 'B' ? '#ff4d6d' : '#fff',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}
                  >
                    Type B (Independent)
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Distributor Comm (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editCommissionRate}
                    onChange={(e) => setEditCommissionRate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Platform Comm (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editWebsiteCommissionRate}
                    onChange={(e) => setEditWebsiteCommissionRate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 215, 0, 0.22)',
                      borderRadius: '14px',
                      padding: '0.75rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.9rem',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#04050b',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 6px 20px rgba(255, 170, 0, 0.4)',
                  transition: 'all 0.25s ease'
                }}
              >
                {isSubmitting ? 'UPDATING...' : 'SAVE & UPDATE DETAILS'}
              </button>
            </form>
          </div>
        </PanelModalBackdrop>
      )}

      {/* 4) REFERRED PLAYERS LIST MODAL */}
      {viewingPlayersDist && (
        <PanelModalBackdrop onClick={() => setViewingPlayersDist(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'rgba(10, 14, 30, 0.95)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(255, 200, 0, 0.2)',
              padding: '2rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-users" style={{ color: '#ffd700' }} />
                  <span>Referred Players Directory</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Partner: <strong style={{ color: '#ffd700' }}>{viewingPlayersDist.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlayersDist(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {isLoadingPlayers ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#ffd700' }} />
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading referred player roster...</p>
                </div>
              ) : referredPlayersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                  No players signed up under this distributor yet.
                </div>
              ) : (
                <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ background: 'rgba(6, 8, 18, 0.9)' }}>
                        <th style={{ color: '#ffd700' }}>Player Name</th>
                        <th style={{ color: '#ffd700' }}>Email Address</th>
                        <th style={{ color: '#ffd700', textAlign: 'center' }}>Account Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredPlayersList.map((player) => (
                        <tr key={player.email}>
                          <td><strong style={{ color: '#fff' }}>{player.name}</strong></td>
                          <td style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{player.email}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: 'rgba(0, 230, 118, 0.15)',
                              color: '#00e676',
                              border: '1px solid rgba(0, 230, 118, 0.35)',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </PanelModalBackdrop>
      )}

    </div>
  );
}
