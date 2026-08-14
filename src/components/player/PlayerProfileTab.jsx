'use client';

import React, { useState } from 'react';
import { safeFetchJson, cleanErrorMessage } from '../../lib/safeFetch';
import PanelModalBackdrop from '../PanelModalBackdrop';

export default function PlayerProfileTab({
  currentUser,
  onUpdateUser,
  showToast
}) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await safeFetchJson('/api/user/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          email: currentUser?.email,
          name,
          phone,
          currentPassword,
          newPassword
        })
      });

      if (!res.ok || !res.data?.success) {
        showToast(cleanErrorMessage(res.data?.message, 'Failed to update profile.'), 'error');
        return;
      }

      showToast('Profile updated successfully!', 'success');
      if (onUpdateUser) onUpdateUser(res.data.user || { ...currentUser, name, phone });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(cleanErrorMessage(err, 'Error updating profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deletionReason.trim()) {
      showToast('Please provide a reason for deletion.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/account-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          reason: deletionReason
        })
      });
      if (res.ok) {
        showToast('Account deletion request submitted to support.', 'success');
        setDeletionOpen(false);
      }
    } catch {
      showToast('Failed to submit deletion request.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1rem 0' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,16,40,0.95) 0%, rgba(10,12,24,0.95) 100%)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: 'var(--card-glow-shadow)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '2px solid var(--gold-primary)',
          background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontSize: '1.6rem',
          fontWeight: 900,
          fontFamily: 'var(--font-heading)',
          flexShrink: 0
        }}>
          {(currentUser?.name || currentUser?.email || 'P').charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
            {currentUser?.name || 'VIP Player'}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {currentUser?.email}
          </div>
          <div className="badge-gold" style={{ marginTop: '0.5rem', display: 'inline-flex' }}>
            VIP LEVEL 1 MEMBER
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileSave} style={{
        background: 'var(--card-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: 0 }}>
          ACCOUNT DETAILS
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>PHONE NUMBER</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              style={{
                width: '100%',
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: '0.75rem 0 0 0' }}>
          SECURITY & PASSWORD
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>NEW PASSWORD</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              style={{
                width: '100%',
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{
                width: '100%',
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setDeletionOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--red-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-trash" /> Request Account Deletion
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn-gold-glow"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem' }}
          >
            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />} SAVE CHANGES
          </button>
        </div>
      </form>

      {/* Deletion Modal */}
      {deletionOpen && (
        <PanelModalBackdrop isOpen={true} onClose={() => setDeletionOpen(false)}>
          <div style={{
            background: 'rgba(10,14,28,0.96)',
            border: '1px solid var(--red-primary)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '420px',
            width: '90vw',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ color: 'var(--red-primary)', fontWeight: 900, margin: 0 }}>REQUEST ACCOUNT DELETION</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Are you sure you want to request account deletion? Please explain your reason below:
            </p>
            <textarea
              rows={3}
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Reason for leaving..."
              style={{
                width: '100%',
                background: 'rgba(6,8,18,0.8)',
                border: '1px solid var(--border-muted)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletionOpen(false)} className="btn-glass-secondary">CANCEL</button>
              <button onClick={handleRequestDeletion} className="badge-red" style={{ cursor: 'pointer', padding: '0.6rem 1rem' }}>SUBMIT</button>
            </div>
          </div>
        </PanelModalBackdrop>
      )}
    </div>
  );
}
