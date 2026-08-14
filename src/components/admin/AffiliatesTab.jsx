'use client';

import PanelModalBackdrop from '../PanelModalBackdrop';
import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function AffiliatesTab() {
  const { data, mutate } = useSWR('/api/agents', fetcher);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [commissionRate, setCommissionRate] = useState(10);
  const [agentCode, setAgentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingAgent, setEditingAgent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCommissionRate, setEditCommissionRate] = useState(0);
  const [editAgentCode, setEditAgentCode] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editAccountType, setEditAccountType] = useState('agent');

  // Referred Players Modal
  const [viewingAgentPlayers, setViewingAgentPlayers] = useState(null);
  const [referredPlayersList, setReferredPlayersList] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // Team members modal
  const [viewingTeamMembers, setViewingTeamMembers] = useState(null);
  const [teamMembersList, setTeamMembersList] = useState([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const agents = data?.agents || [];

  const activeAgentsCount = agents.filter(a => (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.agentCode && a.agentCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.parentAgentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password.trim(),
          commissionRate: Number(commissionRate),
          agentCode: agentCode.trim()
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setName('');
        setEmail('');
        setPassword('');
        setCommissionRate(10);
        setAgentCode('');
        mutate();
        alert('Affiliate agent created successfully!');
      } else {
        alert(resData.message || 'Failed to create agent.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (agent) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(agent.email);
    setEditPassword('');
    setEditCommissionRate(agent.commissionRate || 0);
    setEditAgentCode(agent.agentCode || '');
    setEditStatus(agent.status || 'ACTIVE');
    setEditAccountType(agent.accountType || 'agent');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      alert('Agent Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAgent.id,
          name: editName.trim(),
          email: editEmail.toLowerCase().trim(),
          password: editPassword.trim(),
          commissionRate: Number(editCommissionRate),
          agentCode: editAgentCode.trim(),
          status: editStatus,
          accountType: editAccountType
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setEditingAgent(null);
        mutate();
        alert('Agent updated successfully!');
      } else {
        alert(resData.message || 'Failed to update agent.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating agent details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this affiliate agent? All referred players will lose their agent mapping.')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (resData.success) {
        mutate();
        alert('Agent successfully deleted.');
      } else {
        alert(resData.message || 'Failed to delete agent.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting agent.');
    }
  };

  const handleViewTeam = async (agent) => {
    setViewingTeamMembers(agent);
    setIsLoadingTeam(true);
    try {
      const response = await fetch(`/api/agents/stats?agentCode=${encodeURIComponent(agent.agentCode)}`);
      const resData = await response.json();
      if (resData.success) {
        setTeamMembersList(resData.teamMembers || []);
      } else {
        alert('Failed to load team members.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching team list.');
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleViewPlayers = async (agent) => {
    setViewingAgentPlayers(agent);
    setIsLoadingPlayers(true);
    try {
      const response = await fetch(`/api/agents/stats?agentCode=${encodeURIComponent(agent.agentCode)}`);
      const resData = await response.json();
      if (resData.success) {
        setReferredPlayersList(resData.players || []);
      } else {
        alert('Failed to load referred players.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching players list.');
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
            <i className="fa-solid fa-users-rays" style={{ color: '#ffd700' }} />
            <span>AFFILIATES &amp; <span className="gold-gradient-text">AGENT NETWORK</span></span>
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Provision affiliate partners, manage downline team hierarchies, and audit commission payouts
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
            <i className="fa-solid fa-user-group" />
            <span>{agents.length} Total Affiliates</span>
          </div>
          <div style={{
            background: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            color: '#00e676',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <i className="fa-solid fa-circle-check" />
            <span>{activeAgentsCount} Active Agents</span>
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
        
        {/* 1) REGISTER / EDIT FORM CARD */}
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
              <i className={`fa-solid ${editingAgent ? 'fa-user-pen' : 'fa-user-plus'}`} style={{ color: '#ffd700' }} />
              <span>{editingAgent ? 'Edit Affiliate Agent' : 'Create Affiliate Agent'}</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              {editingAgent ? 'Update credentials and commission parameters.' : 'Onboard a new affiliate agent with custom commission tracking.'}
            </span>
          </div>

          <form onSubmit={editingAgent ? handleEditSubmit : handleCreateSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. Spidy Affiliate"
                  value={editingAgent ? editName : name}
                  onChange={(e) => editingAgent ? setEditName(e.target.value) : setName(e.target.value)}
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
                  placeholder="agent@winningheaven.com"
                  value={editingAgent ? editEmail : email}
                  onChange={(e) => editingAgent ? setEditEmail(e.target.value) : setEmail(e.target.value)}
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
                {editingAgent ? 'Password (Leave blank to keep unchanged)' : 'Security Password'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editingAgent ? editPassword : password}
                  onChange={(e) => editingAgent ? setEditPassword(e.target.value) : setPassword(e.target.value)}
                  required={!editingAgent}
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

            <div style={{ display: 'grid', gridTemplateColumns: editingAgent ? '1fr 1fr' : '1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Commission Rate (%)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-percent" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.85rem' }} />
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    step="0.1"
                    value={editingAgent ? editCommissionRate : commissionRate}
                    onChange={(e) => editingAgent ? setEditCommissionRate(e.target.value) : setCommissionRate(e.target.value)}
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
              </div>

              {editingAgent && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
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
                  >
                    <option value="ACTIVE" style={{ background: '#0a0d16' }}>Active</option>
                    <option value="INACTIVE" style={{ background: '#0a0d16' }}>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Custom Invite Code (Optional)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-ticket" style={{ position: 'absolute', left: '14px', color: '#ffd700', fontSize: '0.88rem' }} />
                <input
                  type="text"
                  placeholder="e.g. SUB600718"
                  value={editingAgent ? editAgentCode : agentCode}
                  onChange={(e) => editingAgent ? setEditAgentCode(e.target.value) : setAgentCode(e.target.value)}
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
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Leave blank to auto-generate a unique system code (e.g. AGTxxxxxx).
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
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
                    <span>SAVING AGENT...</span>
                  </>
                ) : (
                  <>
                    <i className={`fa-solid ${editingAgent ? 'fa-floppy-disk' : 'fa-user-check'}`} />
                    <span>{editingAgent ? 'SAVE AGENT CHANGES &rarr;' : 'CREATE AFFILIATE AGENT &rarr;'}</span>
                  </>
                )}
              </button>

              {editingAgent && (
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* 2) AGENTS DIRECTORY LIST */}
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
                <i className="fa-solid fa-id-card-clip" style={{ color: '#ffd700' }} />
                <span>Affiliates Control Registry</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                Active referred player managers, team trees, and performance analytics.
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
              {filteredAgents.length} Agents Listed
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
              placeholder="Search by name, email, invite code, or parent..."
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
                  <th style={{ color: '#ffd700' }}>Agent Profile</th>
                  <th style={{ color: '#ffd700' }}>Role / Parent</th>
                  <th style={{ color: '#ffd700' }}>Invite Code</th>
                  <th style={{ color: '#ffd700' }}>Status</th>
                  <th style={{ color: '#ffd700' }}>Comm. Rate</th>
                  <th style={{ color: '#ffd700' }}>Volume Stats</th>
                  <th style={{ color: '#ffd700' }}>Balance</th>
                  <th style={{ color: '#ffd700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <i className="fa-solid fa-user-slash" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                      No affiliate agents found.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map(agent => {
                    const isActive = (agent.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                    return (
                      <tr key={agent.id}>
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
                              {(agent.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>{agent.name}</strong>
                              <span style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{agent.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            {agent.role || 'Agent'}
                          </span>
                          <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                            Parent: <strong>{agent.parentAgentName || '—'}</strong>
                            {agent.parentAgentCode ? ` (${agent.parentAgentCode})` : ''}
                          </div>
                        </td>
                        <td>
                          <code style={{
                            background: 'rgba(255, 215, 0, 0.12)',
                            border: '1px solid rgba(255, 215, 0, 0.35)',
                            color: '#ffd700',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}>
                            {agent.agentCode}
                          </code>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: isActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#00e676' : '#ef4444',
                            border: `1px solid ${isActive ? 'rgba(0, 230, 118, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            {agent.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#ffd700', fontSize: '0.88rem' }}>
                          {agent.commissionRate}%
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.74rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span>Players: <strong style={{ color: '#ffd700', cursor: 'pointer' }} onClick={() => handleViewPlayers(agent)}>{agent.playersCount || 0}</strong></span>
                              <span>Team: <strong style={{ color: '#c084fc', cursor: 'pointer' }} onClick={() => handleViewTeam(agent)}>{agent.teamMembersCount || 0}</strong></span>
                            </div>
                            <div>Deposits: <strong style={{ color: '#00e676' }}>${parseFloat(agent.totalDeposits || 0).toFixed(2)}</strong></div>
                            <div>Payouts: <strong style={{ color: '#ef4444' }}>${parseFloat(agent.totalWithdrawals || 0).toFixed(2)}</strong></div>
                            <div>Profit: <strong style={{ color: '#fff' }}>${parseFloat(agent.netProfit ?? Math.max(0, (agent.totalDeposits || 0) - (agent.totalWithdrawals || 0))).toFixed(2)}</strong></div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.74rem' }}>
                            <div>Earned: <strong style={{ color: '#00e676' }}>${parseFloat(agent.commissionEarned || 0).toFixed(2)}</strong></div>
                            <div>Withdrawn: <strong>${parseFloat(agent.totalWithdrawn || 0).toFixed(2)}</strong></div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.15rem', marginTop: '0.15rem' }}>
                              Available: <strong style={{ color: '#ffd700' }}>${parseFloat(agent.availableBalance || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleViewTeam(agent)}
                              title="View Team Tree"
                              style={{
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                color: '#c084fc',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              Team
                            </button>
                            <button
                              onClick={() => handleEditClick(agent)}
                              title="Edit Agent"
                              style={{
                                background: 'rgba(255, 215, 0, 0.12)',
                                border: '1px solid rgba(255, 215, 0, 0.35)',
                                color: '#ffd700',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(agent.id)}
                              title="Delete Agent"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#ef4444',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              Delete
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

      {/* 3. REFERRED PLAYERS VIEW MODAL */}
      {viewingAgentPlayers && (
        <PanelModalBackdrop>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '650px',
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
                  <span>Referred Players — {viewingAgentPlayers.name}</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Affiliate Code: <strong style={{ color: '#ffd700' }}>{viewingAgentPlayers.agentCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingAgentPlayers(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {isLoadingPlayers ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#ffd700' }} />
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading players list...</p>
                </div>
              ) : referredPlayersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                  No players registered under this affiliate yet.
                </div>
              ) : (
                <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ background: 'rgba(6, 8, 18, 0.9)' }}>
                        <th style={{ color: '#ffd700' }}>Player Info</th>
                        <th style={{ color: '#ffd700' }}>Status</th>
                        <th style={{ color: '#ffd700' }}>Total Deposits</th>
                        <th style={{ color: '#ffd700' }}>Total Cashouts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredPlayersList.map(player => (
                        <tr key={player.id}>
                          <td>
                            <strong style={{ color: '#fff', display: 'block' }}>{player.name}</strong>
                            <span style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{player.email}</span>
                          </td>
                          <td>
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
                              {player.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: '#00e676' }}>
                            ${parseFloat(player.totalDeposits || 0).toFixed(2)}
                          </td>
                          <td style={{ fontWeight: 800, color: '#ef4444' }}>
                            ${parseFloat(player.totalWithdrawals || 0).toFixed(2)}
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

      {/* 4. TEAM MEMBERS VIEW MODAL */}
      {viewingTeamMembers && (
        <PanelModalBackdrop>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '800px',
              background: 'rgba(10, 14, 30, 0.95)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(168, 85, 247, 0.2)',
              padding: '2rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-heading, "Outfit", sans-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-sitemap" style={{ color: '#c084fc' }} />
                  <span>Team Hierarchy — {viewingTeamMembers.name}</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Code: <strong style={{ color: '#ffd700' }}>{viewingTeamMembers.agentCode}</strong> &bull; Role: {viewingTeamMembers.role || 'Agent'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeamMembers(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {isLoadingTeam ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#c084fc' }} />
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading team members...</p>
                </div>
              ) : teamMembersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: '0.5rem' }} />
                  No team members or sub-referrals registered yet.
                </div>
              ) : (
                <div className="table-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ background: 'rgba(6, 8, 18, 0.9)' }}>
                        <th style={{ color: '#ffd700' }}>Name</th>
                        <th style={{ color: '#ffd700' }}>Email</th>
                        <th style={{ color: '#ffd700' }}>Code</th>
                        <th style={{ color: '#ffd700' }}>Role</th>
                        <th style={{ color: '#ffd700' }}>Status</th>
                        <th style={{ color: '#ffd700' }}>Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembersList.map((member) => (
                        <tr key={`${member.memberType}-${member.id}`}>
                          <td><strong style={{ color: '#fff' }}>{member.name}</strong></td>
                          <td style={{ color: 'var(--cyan-primary, #00f0ff)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{member.email}</td>
                          <td>
                            <code style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              {member.agentCode !== '—' ? member.agentCode : '—'}
                            </code>
                          </td>
                          <td>
                            <span style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                              {member.role}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: (member.status || 'ACTIVE').toLowerCase() === 'active' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: (member.status || 'ACTIVE').toLowerCase() === 'active' ? '#00e676' : '#ef4444',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              {member.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: '#ffd700' }}>
                            {member.memberType === 'player' ? '—' : `${member.commissionRate || 0}%`}
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
