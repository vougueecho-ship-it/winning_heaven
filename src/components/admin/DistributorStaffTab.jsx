'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import PanelModalBackdrop from '../PanelModalBackdrop';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function DistributorStaffTab({ distributorId }) {
  const distId = distributorId || '';
  const { data: staffData, mutate: mutateStaff } = useSWR(
    distId ? `/api/distributors/staff?distributorId=${distId}` : null,
    fetcher
  );
  const { data: gamesData } = useSWR(
    distId ? `/api/games?distributorId=${distId}&ownedOnly=1` : null,
    fetcher
  );

  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('coins_admin');
  const [staffAllowedGameIds, setStaffAllowedGameIds] = useState([]);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('coins_admin');
  const [editStaffAllowedGameIds, setEditStaffAllowedGameIds] = useState([]);
  const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);

  const toggleStaffGameId = (gameId, setter) => {
    const id = String(gameId);
    setter((prev) => {
      const normalized = prev.map(String);
      return normalized.includes(id) ? prev.filter((x) => String(x) !== id) : [...prev, id];
    });
  };

  const gameTitleById = (id) => gamesData?.games?.find((g) => String(g.id) === String(id))?.title || id;

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      alert('All fields are required.');
      return;
    }
    if (staffRole === 'coins_admin' && staffAllowedGameIds.length === 0) {
      alert('Please select at least one game for Coins Admin access.');
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const payload = {
        name: staffName.trim(),
        email: staffEmail.toLowerCase().trim(),
        password: staffPassword.trim(),
        role: staffRole,
        distributorId: distId
      };
      if (staffRole === 'coins_admin') payload.allowedGameIds = staffAllowedGameIds;

      const res = await fetch('/api/distributors/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffAllowedGameIds([]);
        mutateStaff();
        alert('Staff account registered successfully!');
      } else {
        alert(data.message || 'Failed to register staff.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleEditStaffClick = (staff) => {
    setEditingStaffMember(staff);
    setEditStaffName(staff.name || '');
    setEditStaffEmail(staff.email || '');
    setEditStaffPassword('');
    setEditStaffRole(staff.role || 'coins_admin');
    setEditStaffAllowedGameIds(Array.isArray(staff.allowedGameIds) ? [...staff.allowedGameIds] : []);
  };

  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editStaffName.trim()) {
      alert('Please enter staff name.');
      return;
    }
    if (editStaffRole === 'coins_admin' && editStaffAllowedGameIds.length === 0) {
      alert('Please select at least one game for Coins Admin access.');
      return;
    }
    setIsUpdatingStaff(true);
    try {
      const payload = {
        email: editStaffEmail,
        name: editStaffName.trim(),
        role: editStaffRole,
        distributorId: distId,
        allowedGameIds: editStaffRole === 'coins_admin' ? editStaffAllowedGameIds : []
      };
      if (editStaffPassword.trim()) payload.password = editStaffPassword.trim();

      const res = await fetch('/api/distributors/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEditingStaffMember(null);
        mutateStaff();
        alert('Staff details updated successfully!');
      } else {
        alert(data.message || 'Failed to update staff.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating staff member.');
    } finally {
      setIsUpdatingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffEmailAddress) => {
    if (!window.confirm(`Delete staff registry account "${staffEmailAddress}"?`)) return;
    try {
      const res = await fetch(`/api/distributors/staff?email=${staffEmailAddress}&distributorId=${distId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        mutateStaff();
        alert('Staff account deleted.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const staffCount = staffData?.staff?.length || 0;

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="section-card-header"
        style={{
          background: 'rgba(14, 18, 36, 0.85)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '20px',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="fa-solid fa-user-shield" style={{ color: '#ffd700' }} />
            <span>STAFF &amp; <span className="gold-gradient-text">YOUR TEAM</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Same staff roles as HQ portal — limited to your distributor players.
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            color: '#ffd700',
            fontWeight: 800
          }}
        >
          <i className="fa-solid fa-users" style={{ marginRight: 6 }} />
          {staffCount} Staff
        </div>
      </div>

      <div
        className="dist-staff-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 400px) 1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        <section
          style={{
            background: 'rgba(14, 18, 36, 0.85)',
            border: '1px solid rgba(255, 215, 0, 0.18)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-user-plus gold-text" />
            Register Staff
          </h3>
          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Full Name</label>
              <div className="input-wrapper" style={{ background: '#07090f' }}>
                <i className="fa-solid fa-user input-icon" />
                <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Email</label>
              <div className="input-wrapper" style={{ background: '#07090f' }}>
                <i className="fa-solid fa-envelope input-icon" />
                <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
              </div>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Password</label>
              <div className="input-wrapper" style={{ background: '#07090f' }}>
                <i className="fa-solid fa-lock input-icon" />
                <input type="text" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              </div>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Authority Role</label>
              <select
                value={staffRole}
                onChange={(e) => {
                  setStaffRole(e.target.value);
                  if (e.target.value !== 'coins_admin') setStaffAllowedGameIds([]);
                }}
                className="admin-input"
              >
                <option value="coins_admin">Coins Admin</option>
                <option value="support_admin">Support Admin</option>
                <option value="financial_admin">Financial Admin</option>
              </select>
            </div>
            {staffRole === 'coins_admin' && (
              <div style={{ maxHeight: 140, overflowY: 'auto', padding: '0.5rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                {(gamesData?.games || []).map((game) => (
                  <label key={game.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={staffAllowedGameIds.map(String).includes(String(game.id))}
                      onChange={() => toggleStaffGameId(game.id, setStaffAllowedGameIds)}
                    />
                    {game.title}
                  </label>
                ))}
              </div>
            )}
            <button type="submit" className="submit-btn" disabled={isSubmittingStaff} style={{ width: '100%', marginTop: 0 }}>
              {isSubmittingStaff ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Registering…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-shield" /> Register Staff
                </>
              )}
            </button>
          </form>
        </section>

        <section style={{ minWidth: 0 }}>
          <input type="hidden" aria-hidden="true" />
          <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
            <table className="admin-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Game Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!staffData?.staff || staffData.staff.length === 0) ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <i className="fa-solid fa-user-slash" style={{ display: 'block', fontSize: '1.5rem', opacity: 0.25, marginBottom: '0.5rem' }} />
                      No staff registered yet.
                    </td>
                  </tr>
                ) : (
                  staffData.staff.map((s) => (
                    <tr key={s.email}>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.email}</td>
                      <td>
                        <span className="admin-badge-preview b-ready" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          {s.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 180 }}>
                        {s.role === 'coins_admin' && Array.isArray(s.allowedGameIds) && s.allowedGameIds.length
                          ? s.allowedGameIds.map((id) => gameTitleById(id)).join(', ')
                          : '—'}
                      </td>
                      <td>
                        <button type="button" onClick={() => handleEditStaffClick(s)} className="action-row-btn btn-edit" style={{ marginRight: '0.35rem' }}>
                          <i className="fa-solid fa-user-pen" />
                        </button>
                        <button type="button" onClick={() => handleDeleteStaff(s.email)} className="action-row-btn btn-delete">
                          <i className="fa-solid fa-user-minus" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editingStaffMember && (
        <PanelModalBackdrop onClick={() => setEditingStaffMember(null)}>
          <div className="panel-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>Edit Staff</h3>
            <form onSubmit={handleEditStaffSubmit} style={{ marginTop: '1rem' }}>
              <input type="text" value={editStaffEmail} readOnly disabled className="admin-input" style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
              <input type="text" value={editStaffName} onChange={(e) => setEditStaffName(e.target.value)} className="admin-input" style={{ marginBottom: '0.75rem' }} required />
              <input type="text" placeholder="New password (optional)" value={editStaffPassword} onChange={(e) => setEditStaffPassword(e.target.value)} className="admin-input" style={{ marginBottom: '0.75rem' }} />
              <select value={editStaffRole} onChange={(e) => { setEditStaffRole(e.target.value); if (e.target.value !== 'coins_admin') setEditStaffAllowedGameIds([]); }} className="admin-input" style={{ marginBottom: '0.75rem' }}>
                <option value="coins_admin">Coins Admin</option>
                <option value="support_admin">Support Admin</option>
                <option value="financial_admin">Financial Admin</option>
              </select>
              {editStaffRole === 'coins_admin' && (
                <div style={{ marginBottom: '1rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {(gamesData?.games || []).map((game) => (
                    <label key={game.id} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}>
                      <input type="checkbox" checked={editStaffAllowedGameIds.map(String).includes(String(game.id))} onChange={() => toggleStaffGameId(game.id, setEditStaffAllowedGameIds)} />
                      {game.title}
                    </label>
                  ))}
                </div>
              )}
              <button type="submit" className="btn-gold-glow" disabled={isUpdatingStaff} style={{ width: '100%' }}>
                {isUpdatingStaff ? 'UPDATING...' : 'UPDATE STAFF'}
              </button>
            </form>
          </div>
        </PanelModalBackdrop>
      )}
    </section>
  );
}