'use client';

import React, { useState, useEffect } from 'react';
import { mutate } from 'swr';
import ParticlesBackground from '../../components/ParticlesBackground';
import AdminDashboard from '../../components/AdminDashboard';
import LoadingOverlay from '../../components/LoadingOverlay';
import { AdminGameModal, ApproveAccountModal, AdminGatewayModal, ViewProofModal, SupportModal } from '../../components/Modals';
import useSessionGuard from '../../hooks/useSessionGuard';
import { cleanErrorMessage } from '../../lib/safeFetch';

export default function AdminPage({ portalName, forcedRole }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  // Overlay states
  const [loadingActive, setLoadingActive] = useState(false);
  const [toast, setToast] = useState(null);
  const [completedActionIds, setCompletedActionIds] = useState({});
  
  // Modal Controls
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editGameData, setEditGameData] = useState(null);
  
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activeRequestDetails, setActiveRequestDetails] = useState(null);

  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [editGatewayData, setEditGatewayData] = useState(null);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  // If this staff account is deleted while they are still online, kick them out.
  const staffLoginPath =
    forcedRole === 'financial_admin' ? '/finance'
    : forcedRole === 'operation_admin' ? '/operations'
    : forcedRole === 'coins_admin' ? '/coins-staff'
    : forcedRole === 'support_admin' ? '/support-staff'
    : forcedRole === 'admin' && portalName?.includes('Boss') ? '/boss'
    : '/admin';
  useSessionGuard(authenticated ? adminUser?.email : null, {
    redirectTo: staffLoginPath,
    intervalMs: 2000
  });

  useEffect(() => {
    // Check local session
    const adminSession = localStorage.getItem('winning_heaven_admin_session');
    if (adminSession && adminSession !== 'active') {
      try {
        const parsed = JSON.parse(adminSession);
        if (parsed && parsed.role) {
          const cleanRoles = (parsed.role || '').toLowerCase().split(',').map(r => r.trim());
          if (forcedRole && !cleanRoles.includes(forcedRole) && !cleanRoles.includes('admin')) {
            localStorage.removeItem('winning_heaven_admin_session');
            setAuthenticated(false);
            setAdminUser(null);
          } else {
            setAuthenticated(true);
            setAdminUser(parsed);
          }
        }
      } catch (e) {
        setAuthenticated(true);
        setAdminUser({ name: 'System Admin', email: 'admin@winningheaven.com', role: 'admin' });
      }
    } else if (adminSession === 'active') {
      setAuthenticated(true);
      setAdminUser({ name: 'System Admin', email: 'admin@winningheaven.com', role: 'admin' });
    }

    // Multi-tab Real-Time Synchronization Listener
    const handleStorageEvent = (e) => {
      if (e.key === 'winning_heaven_admin_session') {
        const sess = localStorage.getItem('winning_heaven_admin_session');
        if (sess && sess !== 'null') {
          setAuthenticated(true);
          try {
            setAdminUser(JSON.parse(sess));
          } catch (err) {
            setAdminUser({ name: 'System Admin', email: 'admin@winningheaven.com', role: 'admin' });
          }
        } else {
          setAuthenticated(false);
          setAdminUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Shared toast trigger — clear prior timer so late responses don't wipe early toasts
  const toastTimerRef = React.useRef(null);
  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    const cleanMsg = cleanErrorMessage(message, 'Action failed.');
    setToast({ message: cleanMsg, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  const triggerLoading = (duration = 1000, callback) => {
    setLoadingActive(true);
    setTimeout(() => {
      setLoadingActive(false);
      if (callback) callback();
    }, duration);
  };

  // Admin login credentials check against database users
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await response.json();

      if (data.success) {
        const user = data.user;
        const allowedRoles = ['admin', 'financial_admin', 'coins_admin', 'support_admin', 'operation_admin'];
        const cleanRoles = (user.role || '').toLowerCase().split(',').map(r => r.trim());

        if (allowedRoles.some(r => cleanRoles.includes(r))) {
          if (user.distributorId) {
            setLoginError('Access Denied. Distributor staff must log in at the distributor portal.');
            setSubmitting(false);
            return;
          }

          if (forcedRole && !cleanRoles.includes(forcedRole) && !cleanRoles.includes('admin')) {
            setLoginError(`Access Denied: This portal is strictly restricted to ${forcedRole.toUpperCase().replace('_', ' ')} accounts.`);
            setSubmitting(false);
            return;
          }

          triggerLoading(1200, () => {
            setAuthenticated(true);
            setAdminUser(user);
            localStorage.setItem('winning_heaven_admin_session', JSON.stringify(user));
            showToast(`Welcome back, ${user.name}! Session Initiated.`, 'success');
            
            // Refresh stats SWR cache globally
            mutate('/api/admin/stats');
          });
        } else {
          setLoginError('Access Denied. You do not have administrator privileges.');
          setSubmitting(false);
        }
      } else {
        setLoginError(data.message || 'Invalid Administrator credentials.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setLoginError('Connection error during login.');
      setSubmitting(false);
    }
  };

  const handleAdminLogout = () => {
    triggerLoading(800, () => {
      setAuthenticated(false);
      setAdminUser(null);
      localStorage.removeItem('winning_heaven_admin_session');
      localStorage.removeItem('winning_heaven_session');
      setAdminEmail('');
      setAdminPassword('');
      showToast('Logged out of Admin Portal.', 'info');
    });
  };

  const handleUpdateUserCoins = async (email, coins) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, coins })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`User coins updated to ${coins}!`, 'success');
        
        // Mutate users list caches
        mutate((key) => typeof key === 'string' && key.startsWith('/api/users'));
      } else {
        showToast(data.message || 'Failed to update coins.', 'error');
      }
    } catch (err) {
      console.error('Update coins API error:', err);
      showToast('Connection error updating coins.', 'error');
    }
  };

  const handleCreateAdmin = async (adminData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password,
          name: adminData.name,
          role: adminData.role,
          ...(adminData.allowedGameIds ? { allowedGameIds: adminData.allowedGameIds } : {})
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Admin staff account created for ${adminData.name}!`, 'success');
        
        // Revalidate users endpoint
        mutate((key) => typeof key === 'string' && key.startsWith('/api/users'));
      } else {
        showToast(data.message || 'Failed to create admin staff.', 'error');
      }
    } catch (err) {
      console.error('Create admin API error:', err);
      showToast('Connection error creating admin staff.', 'error');
    }
  };

  const handleUpdateSettings = async (firstDepositBonus, regularDepositBonus, referralBonus, usdtAddress, usdtQrCode, affiliatePayoutNetwork, affiliatePayoutWallet, affiliatePayoutQrCode, affiliatePlatformCommissionRate) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstDepositBonus,
          regularDepositBonus,
          referralBonus,
          usdtAddress,
          usdtQrCode,
          affiliatePayoutNetwork,
          affiliatePayoutWallet,
          affiliatePayoutQrCode,
          affiliatePlatformCommissionRate
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('System settings updated successfully!', 'success');
        
        // Mutate SWR settings cache
        mutate('/api/settings');
      } else {
        showToast(data.message || 'Failed to update settings.', 'error');
      }
    } catch (err) {
      console.error('Update settings API error:', err);
      showToast('Connection error updating settings.', 'error');
    }
  };

  const handleUpdateCoinsNotification = async (id, status, read, holdNote) => {
    // Instant queue clear — rollback if API fails
    if (status === 'COMPLETED' || status === 'HOLD') {
      setCompletedActionIds(prev => ({ ...prev, [id]: true }));
    }
    try {
      const response = await fetch('/api/coins-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, read, holdNote, processedBy: adminUser?.email || 'admin@winningheaven.com', adminEmail: adminUser?.email || '' })
      });
      const data = await response.json();
      if (data.success) {
        if (status === 'COMPLETED') {
          showToast('Coin allotment request marked as DONE!', 'success');
        } else if (status === 'HOLD') {
          showToast('Allotment task placed ON HOLD.', 'info');
        } else {
          showToast('Notification status updated.', 'success');
        }
        
        // Revalidate stats & allotment queues caches
        mutate('/api/admin/stats');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
      } else {
        if (status === 'COMPLETED' || status === 'HOLD') {
          setCompletedActionIds(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
        showToast(data.message || 'Failed to update notification.', 'error');
      }
    } catch (err) {
      if (status === 'COMPLETED' || status === 'HOLD') {
        setCompletedActionIds(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      console.error('Update notification API error:', err);
      showToast('Connection error updating notification.', 'error');
    }
  };

  const handleUpdateGameCoinsPool = async (gameId, coins, openPanelLink, resetUsedCoins) => {
    try {
      const body = { id: gameId };
      if (coins !== undefined) body.availableCoins = Number(coins);
      if (openPanelLink !== undefined) body.openPanelLink = openPanelLink;
      if (resetUsedCoins !== undefined) body.resetUsedCoins = Boolean(resetUsedCoins);

      const response = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        showToast('Game pool details updated successfully!', 'success');
        mutate('/api/games');
      } else {
        showToast(data.message || 'Failed to update game details.', 'error');
      }
    } catch (err) {
      console.error('Update game details API error:', err);
      showToast('Connection error updating game details.', 'error');
    }
  };

  // Games CRUDs
  const handleSaveGame = async (gameItem) => {
    try {
      const method = gameItem.id ? 'PUT' : 'POST';
      const response = await fetch('/api/games', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameItem)
      });
      const data = await response.json();
      if (data.success) {
        showToast(gameItem.id ? `Game updated successfully!` : `Game "${gameItem.title}" created successfully!`, 'success');
        mutate('/api/games');
      } else {
        showToast(data.message || 'Failed to save game.', 'error');
      }
    } catch (err) {
      console.error('Save game API error:', err);
      showToast('Connection error saving game.', 'error');
    }
    setGameModalOpen(false);
  };

  const handleDeleteGame = async (id) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        const response = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          showToast('Game deleted successfully.', 'error');
          mutate('/api/games');
        } else {
          showToast(data.message || 'Failed to delete game.', 'error');
        }
      } catch (err) {
        console.error('Delete game API error:', err);
        showToast('Connection error deleting game.', 'error');
      }
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Delete user account "${email}"?`)) {
      try {
        const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          showToast('User account deleted.', 'error');
          mutate((key) => typeof key === 'string' && key.startsWith('/api/users'));
        } else {
          showToast(data.message || 'Failed to delete user.', 'error');
        }
      } catch (err) {
        console.error('Delete user API error:', err);
        showToast('Connection error deleting user.', 'error');
      }
    }
  };

  // Account Request Approvals
  const handleOpenApproveRequest = (requestItem) => {
    setActiveRequestDetails(requestItem);
    setApproveModalOpen(true);
  };

  const handleSaveApprovedAccount = async (credData) => {
    try {
      // Single fast PUT — creates game account + marks READY (same path as Shift Dashboard)
      const reqResponse = await fetch('/api/account-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credData.requestId,
          status: 'READY',
          gameAccountUsername: credData.username,
          gameAccountPassword: credData.password,
          processedBy: adminUser?.email || 'admin@winningheaven.com',
          adminEmail: adminUser?.email || ''
        })
      });
      const reqResult = await reqResponse.json();

      if (reqResponse.ok && reqResult.success) {
        showToast(`Account credentials sent to ${credData.userEmail}!`, 'success');
        setCompletedActionIds(prev => ({ ...prev, [credData.requestId]: true }));
        setApproveModalOpen(false);
        mutate('/api/admin/stats');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/account-requests'));
      } else {
        showToast(reqResult.message || 'Failed to finalize request approval.', 'error');
      }
    } catch (err) {
      console.error('Approve account request API error:', err);
      showToast('Connection error approving request.', 'error');
    }
  };

  // Transaction Ledger Approvals
  const handleApproveTransaction = async (txId) => {
    // Instant hide + toast — do not wait for Mongo / coins task round-trip
    setCompletedActionIds(prev => ({ ...prev, [txId]: true }));
    showToast('Transaction approved successfully.', 'success');
    // Kick list refreshes in parallel with the approve call (coins row appears ASAP)
    mutate('/api/admin/stats');
    mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
    mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));

    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status: 'SUCCESS', processedBy: adminUser?.email || 'admin@winningheaven.com' })
      });
      const data = await response.json();
      if (data.success) {
        // Revalidate again once coins notification is definitely written
        mutate('/api/admin/stats');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
        // Wake other admin tabs on this browser instantly (coins staff)
        try {
          const bc = new BroadcastChannel('winning-heaven-admin-events');
          bc.postMessage({
            type: 'coins',
            distributorId: data.coinsNotification?.distributorId || '',
            transactionId: txId
          });
          bc.postMessage({ type: 'transactions', status: data.status || 'COINS_LOADING' });
          bc.close();
        } catch {
          /* ignore */
        }
      } else {
        setCompletedActionIds(prev => {
          const next = { ...prev };
          delete next[txId];
          return next;
        });
        showToast(data.message || 'Failed to approve transaction.', 'error');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
      }
    } catch (err) {
      setCompletedActionIds(prev => {
        const next = { ...prev };
        delete next[txId];
        return next;
      });
      console.error('Approve transaction API error:', err);
      showToast('Connection error approving transaction.', 'error');
      mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
      mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
    }
  };

  const handleFailTransaction = async (txId) => {
    const feedbackMsg = window.prompt('Enter reason for rejection/failure:', 'Payment not received');
    if (feedbackMsg === null) return;

    setCompletedActionIds(prev => ({ ...prev, [txId]: true }));
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status: 'FAILED', note: feedbackMsg || 'Declined by Admin', processedBy: adminUser?.email || 'admin@winningheaven.com' })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Transaction set to FAILED status.', 'error');
        
        // Mutate stats and transaction lists
        mutate('/api/admin/stats');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
      } else {
        setCompletedActionIds(prev => {
          const next = { ...prev };
          delete next[txId];
          return next;
        });
        showToast(data.message || 'Failed to decline transaction.', 'error');
      }
    } catch (err) {
      setCompletedActionIds(prev => {
        const next = { ...prev };
        delete next[txId];
        return next;
      });
      console.error('Decline transaction API error:', err);
      showToast('Connection error declining transaction.', 'error');
    }
  };

  // View Screenshot proof trigger
  const handleInspectProof = async (imgUrl, txId, preferredField = null) => {
    if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
      setProofImageUrl(imgUrl);
      setProofModalOpen(true);
      return;
    }

    if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
      setProofImageUrl(imgUrl);
      setProofModalOpen(true);
      return;
    }

    if (txId) {
      setProofImageUrl('');
      setProofModalOpen(true);
      try {
        const res = await fetch(`/api/transactions?id=${txId}&adminRole=admin`);
        const data = await res.json();
        let proof;
        if (preferredField === 'tagQrScreenshot') {
          proof = data.transaction?.tagQrScreenshot;
        } else if (preferredField === 'screenshot') {
          proof = data.transaction?.screenshot;
        } else if (preferredField === 'payoutProof') {
          proof = data.transaction?.payoutProof;
        } else {
          proof = data.transaction?.payoutProof || data.transaction?.screenshot || data.transaction?.paymentProof || data.transaction?.tagQrScreenshot;
        }
        if (data.success && proof && proof !== true) {
          setProofImageUrl(proof);
        } else {
          alert('Failed to load payment receipt screenshot.');
          setProofModalOpen(false);
        }
      } catch (err) {
        console.error(err);
        alert('Error fetching payment proof.');
        setProofModalOpen(false);
      }
      return;
    }

    if (imgUrl) {
      setProofImageUrl(imgUrl);
      setProofModalOpen(true);
    }
  };

  // Payment Gateway CRUDs
  const handleAddGatewayClick = () => {
    setEditGatewayData(null);
    setGatewayModalOpen(true);
  };

  const handleEditGatewayClick = (gateway) => {
    setEditGatewayData(gateway);
    setGatewayModalOpen(true);
  };

  const handleSaveGateway = async (gtData) => {
    try {
      const method = gtData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/gateways', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gtData)
      });
      const data = await response.json();
      if (data.success) {
        showToast(gtData.id ? `Gateway "${gtData.name}" updated successfully.` : `Gateway "${gtData.name}" created successfully.`, 'success');
        mutate('/api/gateways');
      } else {
        showToast(data.message || 'Failed to save gateway.', 'error');
      }
    } catch (err) {
      console.error('Save gateway API error:', err);
      showToast('Connection error saving gateway.', 'error');
    }
    setGatewayModalOpen(false);
  };

  const handleDeleteGateway = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment gateway?')) {
      try {
        const response = await fetch(`/api/gateways?id=${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          showToast('Payment gateway deleted.', 'error');
          mutate('/api/gateways');
        } else {
          showToast(data.message || 'Failed to delete gateway.', 'error');
        }
      } catch (err) {
        console.error('Delete gateway API error:', err);
        showToast('Connection error deleting gateway.', 'error');
      }
    }
  };

  return (
    <>
      <ParticlesBackground />
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      {toast && (
        <div className={`notification-banner ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`} style={{
              color: toast.type === 'error' ? 'var(--red-primary, #ff0055)' : toast.type === 'success' ? 'var(--emerald-primary, #00e676)' : 'var(--gold-primary, #ffd700)',
              fontSize: '1.1rem',
              flexShrink: 0
            }} />
            <span>{toast.message}</span>
          </div>
          <button className="close-notification" onClick={() => setToast(null)} aria-label="Close notification">&times;</button>
        </div>
      )}

      {/* A) SECURE ADMINISTRATIVE SIGN-IN PANEL */}
      {!authenticated ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem',
          position: 'relative',
          zIndex: 10,
          background: 'radial-gradient(ellipse at 50% 20%, rgba(20, 26, 50, 0.9) 0%, rgba(4, 5, 11, 0.98) 70%)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '450px',
            background: 'rgba(10, 14, 30, 0.92)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1.5px solid rgba(255, 215, 0, 0.35)',
            borderRadius: '26px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 45px rgba(255, 200, 0, 0.18)',
            padding: '2.5rem 2.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Gold Glowing Accent Bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)',
              boxShadow: '0 0 15px #ffd700'
            }} />

            {/* Header / Security Badge */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '74px',
                height: '74px',
                margin: '0 auto 1.1rem auto',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(10, 14, 30, 0.8) 100%)',
                border: '1.5px solid var(--gold-primary, #ffd700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(255, 215, 0, 0.35)',
                position: 'relative'
              }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: '#ffd700', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6))' }} />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.85rem',
                borderRadius: '20px',
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                color: '#00e676',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.65rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', display: 'inline-block' }} />
                SECURE ACCESS GATEWAY
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
                fontSize: '1.65rem',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 0.4rem 0',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                <span style={{ color: '#fff' }}>WINNING</span>{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff9100 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>HEAVEN</span>
              </h1>

              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {portalName ? `${portalName.toUpperCase()} COMMAND PORTAL` : 'ADMINISTRATION & CONTROL CENTER'}
              </div>
            </div>

            {/* Error Message if any */}
            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#ff6b6b',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.95rem' }} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Admin Email Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.45rem'
                }}>
                  Admin Email Address
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  transition: 'all 0.25s ease'
                }}>
                  <i className="fa-solid fa-envelope" style={{
                    position: 'absolute',
                    left: '14px',
                    color: '#ffd700',
                    fontSize: '0.9rem',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="email"
                    placeholder="admin@winningheaven.com"
                    value={adminEmail}
                    onChange={(e) => { setAdminEmail(e.target.value); setLoginError(''); }}
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.85rem 1rem 0.85rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.45rem'
                }}>
                  Security Access Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(6, 8, 18, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  transition: 'all 0.25s ease'
                }}>
                  <i className="fa-solid fa-lock" style={{
                    position: 'absolute',
                    left: '14px',
                    color: '#ffd700',
                    fontSize: '0.9rem',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }}
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.85rem 2.6rem 0.85rem 2.6rem',
                      color: '#fff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '4px'
                    }}
                  >
                    <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.95rem',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#04050b',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 25px rgba(255, 170, 0, 0.4)',
                  transition: 'all 0.25s ease'
                }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket" />
                    <span>SECURE LOGIN ACCESS &rarr;</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Security Badges */}
            <div style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 600
            }}>
              <span><i className="fa-solid fa-lock" style={{ color: '#ffd700', marginRight: '4px' }} /> 256-Bit SSL</span>
              <span><i className="fa-solid fa-shield-check" style={{ color: '#00e676', marginRight: '4px' }} /> Multi-Role Auth</span>
            </div>
          </div>
        </div>
      ) : (
        /* B) EXPANDED ADMINISTRATIVE WORKSPACE */
        <AdminDashboard
          adminUser={adminUser}
          completedActionIds={completedActionIds}
          onLogout={handleAdminLogout}
          onAddGameClick={() => { setEditGameData(null); setGameModalOpen(true); }}
          onEditGameClick={(game) => { setEditGameData(game); setGameModalOpen(true); }}
          onDeleteGame={handleDeleteGame}
          onDeleteUser={handleDeleteUser}
          onApproveRequest={handleOpenApproveRequest}
          onApproveTransaction={handleApproveTransaction}
          onFailTransaction={handleFailTransaction}
          onInspectProof={handleInspectProof}
          onAddGatewayClick={handleAddGatewayClick}
          onEditGatewayClick={handleEditGatewayClick}
          onDeleteGateway={handleDeleteGateway}
          onUpdateUserCoins={handleUpdateUserCoins}
          onCreateAdmin={handleCreateAdmin}
          onUpdateSettings={handleUpdateSettings}
          onUpdateCoinsNotification={handleUpdateCoinsNotification}
          onUpdateGameCoinsPool={handleUpdateGameCoinsPool}
        />
      )}

      {/* CRUD Games Modal */}
      <AdminGameModal
        isOpen={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
        onSave={handleSaveGame}
        editGame={editGameData}
      />

      {/* Allot login credentials Modal */}
      <ApproveAccountModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onApprove={handleSaveApprovedAccount}
        requestDetails={activeRequestDetails}
      />

      {/* CRUD Gateway settings Modal */}
      <AdminGatewayModal
        isOpen={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        onSave={handleSaveGateway}
        editGateway={editGatewayData}
      />

      {/* Proof Inspection Modal viewer */}
      <ViewProofModal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        proofUrl={proofImageUrl}
      />

      {authenticated && !supportOpen && (
        <button
          type="button"
          className="portal-support-fab"
          onClick={() => setSupportOpen(true)}
          aria-label="Open support chat"
          title="Support Desk"
        >
          <i className="fa-solid fa-headset" />
        </button>
      )}

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        currentUser={adminUser}
      />

      <LoadingOverlay active={loadingActive} />
    </>
  );
}
