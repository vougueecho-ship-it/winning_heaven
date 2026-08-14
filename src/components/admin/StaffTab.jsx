'use client';

import React, { useState } from 'react';
import PanelModalBackdrop from '../PanelModalBackdrop';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Super Admin', desc: 'Full unrestricted system access', icon: 'fa-crown', color: '#ffd700' },
  { value: 'operation_admin', label: 'Operational Manager', desc: 'Manage operations & shifts', icon: 'fa-bolt', color: '#00f0ff' },
  { value: 'financial_admin', label: 'Financial Admin', desc: 'Ledger, payouts & deposits', icon: 'fa-wallet', color: '#00e676' },
  { value: 'coins_admin', label: 'Coins & Games Admin', desc: 'Gateways, coin allotment & games', icon: 'fa-coins', color: '#ffb300' },
  { value: 'support_admin', label: 'Support Admin', desc: 'Live chat & customer help', icon: 'fa-headset', color: '#c084fc' }
];

export default function StaffTab({ adminUser, onCreateAdmin, onDeleteUser }) {
  const { data: usersData, mutate } = useSWR('/api/users?limit=200&segment=staff', fetcher);
  const { data: gamesData } = useSWR('/api/games', fetcher);
  const [staffSearch, setStaffSearch] = useState('');

  const catalogGames = gamesData?.games || [];

  // Admin Creation Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['financial_admin']);
  const [allowedGameIds, setAllowedGameIds] = useState([]);

  // Editing staff states
  const [editingStaff, setEditingStaff] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [selectedEditRoles, setSelectedEditRoles] = useState([]);
  const [editAllowedGameIds, setEditAllowedGameIds] = useState([]);

  const users = usersData?.users || [];
  
  // Identify all users that have admin/staff roles
  const { data: distsData } = useSWR('/api/distributors', fetcher);
  const distributorsList = distsData?.distributors || [];

  const [activeSubTab, setActiveSubTab] = useState('system'); // 'system' | 'distributor'

  const staffUsers = users.filter((u) => {
    if (!u.role) return false;
    if (u.distributorId) return false;
    const cleanRole = u.role.toLowerCase();
    return cleanRole.split(',').some(r => 
      ['admin', 'financial_admin', 'coins_admin', 'support_admin', 'operation_admin'].includes(r.trim())
    );
  });

  const distributorStaffUsers = users.filter((u) => {
    if (!u.role) return false;
    if (!u.distributorId) return false;
    const cleanRole = u.role.toLowerCase();
    return cleanRole.split(',').some(r => 
      ['admin', 'financial_admin', 'coins_admin', 'support_admin', 'operation_admin', 'distributor_staff'].includes(r.trim())
    );
  });

  const filteredStaff = (activeSubTab === 'system' ? staffUsers : distributorStaffUsers).filter(
    (s) =>
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const getDistributorEmail = (distId) => {
    const d = distributorsList.find(dist => dist.id === distId);
    return d ? `${d.name} (${d.email})` : distId || 'Unknown';
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleCheckboxChange = (roleVal) => {
    if (selectedRoles.includes(roleVal)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter(r => r !== roleVal));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleVal]);
    }
  };

  const handleEditRoleCheckboxChange = (roleVal) => {
    if (selectedEditRoles.includes(roleVal)) {
      if (selectedEditRoles.length > 1) {
        setSelectedEditRoles(selectedEditRoles.filter(r => r !== roleVal));
      }
    } else {
      setSelectedEditRoles([...selectedEditRoles, roleVal]);
    }
  };

  const handleGameCheckboxChange = (gameId, isEdit = false) => {
    const setter = isEdit ? setEditAllowedGameIds : setAllowedGameIds;
    const current = isEdit ? editAllowedGameIds : allowedGameIds;
    if (current.includes(gameId)) {
      setter(current.filter((id) => id !== gameId));
    } else {
      setter([...current, gameId]);
    }
  };

  const formatAllowedGames = (staff) => {
    if (!staff?.allowedGameIds?.length) return '—';
    const titles = staff.allowedGameIds
      .map((id) => catalogGames.find((g) => g.id === id)?.title)
      .filter(Boolean);
    return titles.length ? titles.join(', ') : staff.allowedGameIds.join(', ');
  };

  const needsGameAccess = (roles) => roles.includes('coins_admin');

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    if (selectedRoles.length === 0) {
      alert('Please check at least one role permission.');
      return;
    }

    if (needsGameAccess(selectedRoles) && allowedGameIds.length === 0) {
      alert('Please select at least one game for Coins Admin access.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newAdminName.trim(),
        email: newAdminEmail.toLowerCase().trim(),
        password: newAdminPassword.trim(),
        role: selectedRoles.join(',')
      };
      if (needsGameAccess(selectedRoles)) {
        payload.allowedGameIds = allowedGameIds;
      }

      await onCreateAdmin(payload);

      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setSelectedRoles(['financial_admin']);
      setAllowedGameIds([]);
    } catch (err) {
      console.error(err);
      alert('Failed to register staff user.');
    } finally {
      setIsSubmitting(false);
      mutate();
    }
  };

  const handleEditClick = (staff) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPassword('');
    setSelectedEditRoles(staff.role.split(',').map(r => r.trim()));
    setEditAllowedGameIds(Array.isArray(staff.allowedGameIds) ? [...staff.allowedGameIds] : []);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (selectedEditRoles.length === 0) {
      alert('Please select at least one permission role.');
      return;
    }

    if (needsGameAccess(selectedEditRoles) && editAllowedGameIds.length === 0) {
      alert('Please select at least one game for Coins Admin access.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        email: editEmail,
        name: editName.trim(),
        role: selectedEditRoles.join(',')
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      if (needsGameAccess(selectedEditRoles)) {
        payload.allowedGameIds = editAllowedGameIds;
      } else {
        payload.allowedGameIds = [];
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEditingStaff(null);
        mutate();
      } else {
        alert(data.message || 'Failed to update staff details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    if (email.toLowerCase() === adminUser?.email?.toLowerCase()) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff account "${email}"? Access will be immediately revoked.`)) {
      await onDeleteUser(email);
      mutate();
    }
  };

  const getRoleBadge = (roleVal) => {
    const clean = (roleVal || '').toLowerCase();
    const roles = clean.split(',').map(r => r.trim());
    
    return roles.map(r => {
      let bg = 'rgba(255, 215, 0, 0.15)';
      let border = 'rgba(255, 215, 0, 0.35)';
      let color = '#ffd700';
      let label = r.replace('_', ' ').toUpperCase();

      if (r === 'admin') {
        bg = 'rgba(255, 215, 0, 0.2)';
        border = '#ffd700';
        color = '#ffd700';
        label = 'SUPER ADMIN';
      } else if (r === 'financial_admin') {
        bg = 'rgba(0, 230, 118, 0.15)';
        border = 'rgba(0, 230, 118, 0.4)';
        color = '#00e676';
        label = 'FINANCE';
      } else if (r === 'coins_admin') {
        bg = 'rgba(255, 179, 0, 0.15)';
        border = 'rgba(255, 179, 0, 0.4)';
        color = '#ffb300';
        label = 'COINS & GAMES';
      } else if (r === 'support_admin') {
        bg = 'rgba(192, 132, 252, 0.15)';
        border = 'rgba(192, 132, 252, 0.4)';
        color = '#c084fc';
        label = 'SUPPORT';
      } else if (r === 'operation_admin') {
        bg = 'rgba(0, 240, 255, 0.15)';
        border = 'rgba(0, 240, 255, 0.4)';
        color = '#00f0ff';
        label = 'OPERATIONS';
      }

      return (
        <span key={r} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '8px',
          background: bg,
          border: `1px solid ${border}`,
          color: color,
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          margin: '2px'
        }}>
          {label}
        </span>
      );
    });
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
            <i className="fa-solid fa-users-gear" style={{ color: '#ffd700' }} />
            <span>STAFF &amp; <span className="gold-gradient-text">ACCESS CONTROL</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Provision staff accounts, configure granular role permissions, and audit active users
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
            <i className="fa-solid fa-user-shield" />
            <span>{staffUsers.length} System Staff</span>
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
            <i className="fa-solid fa-network-wired" />
            <span>{distributorStaffUsers.length} Distributor Staff</span>
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
              <span>Register New Staff</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Create internal credentials and assign authority permissions.
            </span>
          </div>

          <form onSubmit={handleAddStaffSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
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
                  placeholder="staff@winningheaven.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
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
                Temporary Security Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. staffPass2026!"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
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
                Authority Roles (Select Multiple)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {AVAILABLE_ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role.value);
                  return (
                    <div
                      key={role.value}
                      onClick={() => handleRoleCheckboxChange(role.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '12px',
                        background: isChecked ? 'rgba(255, 215, 0, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                        border: `1.5px solid ${isChecked ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isChecked ? '0 0 12px rgba(255, 200, 0, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className={`fa-solid ${role.icon}`} style={{ color: isChecked ? role.color : 'var(--text-muted)', fontSize: '0.9rem', width: '16px' }} />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isChecked ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                            {role.label}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {role.desc}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isChecked ? '#ffd700' : 'rgba(255,255,255,0.2)'}`,
                        background: isChecked ? 'linear-gradient(135deg, #ffd700 0%, #ff9100 100%)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isChecked && <i className="fa-solid fa-check" style={{ fontSize: '0.65rem', color: '#04050b', fontWeight: 900 }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {needsGameAccess(selectedRoles) && (
              <div style={{
                background: 'rgba(255, 179, 0, 0.08)',
                border: '1px solid rgba(255, 179, 0, 0.3)',
                borderRadius: '14px',
                padding: '0.9rem'
              }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#ffb300', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                  <i className="fa-solid fa-gamepad" style={{ marginRight: '6px' }} />
                  Game Access Delegation
                </label>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.6rem 0' }}>
                  Select which platform games this Coins Admin is authorized to credit &amp; manage:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {catalogGames.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading games...</span>
                  ) : (
                    catalogGames.map((game) => {
                      const isGameChecked = allowedGameIds.includes(game.id);
                      return (
                        <div
                          key={game.id}
                          onClick={() => handleGameCheckboxChange(game.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '8px',
                            background: isGameChecked ? 'rgba(255, 215, 0, 0.15)' : 'rgba(6, 8, 18, 0.8)',
                            border: `1px solid ${isGameChecked ? '#ffd700' : 'rgba(255,255,255,0.08)'}`,
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isGameChecked ? '#ffd700' : '#fff'
                          }}
                        >
                          <i className={`fa-solid ${isGameChecked ? 'fa-square-check' : 'fa-square'}`} style={{ color: isGameChecked ? '#ffd700' : 'rgba(255,255,255,0.3)' }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.title}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

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
                  <span>PROVISIONING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-shield" />
                  <span>CREATE STAFF USER &rarr;</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* 2) STAFF REGISTRY TABLE */}
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
                <i className="fa-solid fa-id-badge" style={{ color: '#ffd700' }} />
                <span>Administrative Staff Registry</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Active administrative accounts and assigned security clearance.
              </span>
            </div>

            {/* Subtabs */}
            <div className="promotions-subtabs" style={{ margin: 0, padding: '0.3rem' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('system')}
                className={`promotions-subtab${activeSubTab === 'system' ? ' is-active' : ''}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                <i className="fa-solid fa-shield-halved" />
                <span>System Staff ({staffUsers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('distributor')}
                className={`promotions-subtab${activeSubTab === 'distributor' ? ' is-active' : ''}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                <i className="fa-solid fa-network-wired" />
                <span>Distributor Staff ({distributorStaffUsers.length})</span>
              </button>
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
            }} />
            <input
              type="text"
              placeholder="Search staff registry by name, email, or role..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
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
                  <th style={{ color: '#ffd700' }}>Staff Member</th>
                  <th style={{ color: '#ffd700' }}>Login Email</th>
                  <th style={{ color: '#ffd700' }}>Privilege Clearance</th>
                  <th style={{ color: '#ffd700' }}>Game Access</th>
                  {activeSubTab === 'distributor' && <th style={{ color: '#ffd700' }}>Distributor</th>}
                  <th style={{ color: '#ffd700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={activeSubTab === 'distributor' ? 6 : 5} className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <i className="fa-solid fa-user-slash" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                      No staff accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelf = staff.email.toLowerCase() === adminUser?.email?.toLowerCase();
                    return (
                      <tr key={staff.email}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,145,0,0.1) 100%)',
                              border: '1px solid rgba(255,215,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              color: '#ffd700'
                            }}>
                              {(staff.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{staff.name}</strong>
                              {isSelf && (
                                <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: 'rgba(0,230,118,0.15)', color: '#00e676', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 800 }}>
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                          {staff.email}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                            {getRoleBadge(staff.role)}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '160px' }}>
                          {staff.role.split(',').map(r => r.trim()).includes('coins_admin')
                            ? formatAllowedGames(staff)
                            : '—'}
                        </td>
                        {activeSubTab === 'distributor' && (
                          <td style={{ color: '#ffd700', fontWeight: 700, fontSize: '0.82rem' }}>
                            {getDistributorEmail(staff.distributorId)}
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }}>
                          {isSelf ? (
                            <span style={{ fontSize: '0.72rem', color: '#00e676', fontWeight: 700 }}>
                              <i className="fa-solid fa-lock" style={{ marginRight: '4px' }} /> Active
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditClick(staff)}
                                title="Edit Staff Permissions"
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
                                <i className="fa-solid fa-user-pen" />
                              </button>
                              <button
                                onClick={() => handleDelete(staff.email)}
                                title="Revoke & Delete Staff Account"
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
                                <i className="fa-solid fa-user-minus" />
                              </button>
                            </div>
                          )}
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

      {/* 3) EDIT STAFF MODAL OVERLAY */}
      {editingStaff && (
        <PanelModalBackdrop onClick={() => setEditingStaff(null)}>
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
                <span>Edit Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Email Address (Fixed)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                  <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="text"
                    value={editEmail}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.85)',
                      border: '1.5px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      color: 'var(--cyan-primary, #00f0ff)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
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
                  New Password (Leave blank to keep unchanged)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                  <input
                    type="text"
                    placeholder="Enter new password if updating..."
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
                  Modify Authority Roles
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = selectedEditRoles.includes(role.value);
                    return (
                      <div
                        key={role.value}
                        onClick={() => handleEditRoleCheckboxChange(role.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          background: isChecked ? 'rgba(255, 215, 0, 0.12)' : 'rgba(6, 8, 18, 0.7)',
                          border: `1.5px solid ${isChecked ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className={`fa-solid ${role.icon}`} style={{ color: isChecked ? role.color : 'var(--text-muted)', fontSize: '0.85rem' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isChecked ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                            {role.label}
                          </span>
                        </div>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '5px',
                          border: `1.5px solid ${isChecked ? '#ffd700' : 'rgba(255,255,255,0.2)'}`,
                          background: isChecked ? 'linear-gradient(135deg, #ffd700 0%, #ff9100 100%)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isChecked && <i className="fa-solid fa-check" style={{ fontSize: '0.6rem', color: '#04050b', fontWeight: 900 }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {needsGameAccess(selectedEditRoles) && (
                <div style={{
                  background: 'rgba(255, 179, 0, 0.08)',
                  border: '1px solid rgba(255, 179, 0, 0.3)',
                  borderRadius: '14px',
                  padding: '0.85rem'
                }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#ffb300', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Game Access Delegation
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {catalogGames.map((game) => {
                      const isGameChecked = editAllowedGameIds.includes(game.id);
                      return (
                        <div
                          key={game.id}
                          onClick={() => handleGameCheckboxChange(game.id, true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '8px',
                            background: isGameChecked ? 'rgba(255, 215, 0, 0.15)' : 'rgba(6, 8, 18, 0.8)',
                            border: `1px solid ${isGameChecked ? '#ffd700' : 'rgba(255,255,255,0.08)'}`,
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isGameChecked ? '#ffd700' : '#fff'
                          }}
                        >
                          <i className={`fa-solid ${isGameChecked ? 'fa-square-check' : 'fa-square'}`} style={{ color: isGameChecked ? '#ffd700' : 'rgba(255,255,255,0.3)' }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                {isSubmitting ? 'UPDATING DETAILS...' : 'SAVE & UPDATE CLEARANCE'}
              </button>
            </form>
          </div>
        </PanelModalBackdrop>
      )}
    </div>
  );
}
