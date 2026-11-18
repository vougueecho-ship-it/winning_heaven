'use client';

import React, { useMemo, useRef, useState } from 'react';
import { mutate } from 'swr';
import AdminDashboard from '../../components/AdminDashboard';
import { AdminGameModal, ApproveAccountModal, AdminGatewayModal, ViewProofModal } from '../../components/Modals';
import { cleanErrorMessage } from '../../lib/safeFetch';

export default function DistributorAdminShell({ distSession, onLogout }) {
  const distId = distSession?.id || '';
  const distributorType = distSession?.type || 'A';

  const adminUser = useMemo(
    () => ({
      name: distSession?.name || 'Distributor',
      role: distSession?.isStaff ? (distSession.staffRole || distSession.role || 'coins_admin') : 'distributor',
      distributorId: distId,
      email: distSession?.email || '',
      allowedGameIds: distSession?.allowedGameIds || []
    }),
    [distSession, distId]
  );

  const gatewaysListUrl =
    distributorType === 'B' && distId
      ? `/api/distributors/gateways?distributorId=${distId}`
      : null;

  const [completedActionIds, setCompletedActionIds] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activeRequestDetails, setActiveRequestDetails] = useState(null);

  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [editGatewayData, setEditGatewayData] = useState(null);

  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editGameData, setEditGameData] = useState(null);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [proofMeta, setProofMeta] = useState(null);

  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message: cleanErrorMessage(message, 'Action failed.'), type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  const handleInspectProof = async (url, txId, preferredField = null, txData = null) => {
    setProofMeta(txData || null);
    const isValidUrl = typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/'));
    if (isValidUrl) {
      setProofImageUrl(url);
      setProofModalOpen(true);
      if (!txId) return;
    }
    if (txId) {
      if (!isValidUrl) {
        setProofImageUrl('LOADING');
        setProofModalOpen(true);
      }
      try {
        const res = await fetch(
          `/api/transactions?id=${txId}&adminRole=${encodeURIComponent(adminUser.role)}&email=${encodeURIComponent(adminUser.email)}&adminDistributorId=${distId}`
        );
        const data = await res.json();
        if (data.success && data.transaction) {
          setProofMeta(data.transaction);
          let targetImage;
          if (preferredField === 'tagQrScreenshot') targetImage = data.transaction?.tagQrScreenshot || '';
          else if (preferredField === 'screenshot') targetImage = data.transaction?.screenshot || '';
          else if (preferredField === 'payoutProof') targetImage = data.transaction?.payoutProof || '';
          else targetImage = data.transaction?.screenshot || data.transaction?.payoutProof || data.transaction?.tagQrScreenshot || '';
          if (targetImage && targetImage !== true) setProofImageUrl(targetImage);
          else if (!isValidUrl) {
            showToast('No screenshot proof found for this transaction.', 'error');
            setProofModalOpen(false);
          }
        } else if (!isValidUrl) {
          showToast('Failed to load transaction details.', 'error');
          setProofModalOpen(false);
        }
      } catch (err) {
        console.error(err);
        if (!isValidUrl) showToast('Error loading receipt image.', 'error');
      }
    }
  };

  const handleUpdateCoinsNotification = async (id, status, read, holdNote) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      setCompletedActionIds((prev) => ({ ...prev, [id]: true }));
    }
    try {
      const response = await fetch('/api/coins-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          read,
          holdNote,
          processedBy: adminUser.name,
          adminEmail: adminUser.email
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Notification updated.', 'success');
        mutate((key) => typeof key === 'string' && key.includes('/api/admin/stats'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
      } else {
        showToast(data.message || 'Failed to update notification.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
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
        showToast('Game pool updated.', 'success');
        mutate((key) => typeof key === 'string' && key.includes('/api/games'));
      } else {
        showToast(data.message || 'Failed to update game.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleOpenApproveRequest = (requestItem) => {
    setActiveRequestDetails(requestItem);
    setApproveModalOpen(true);
  };

  const handleSaveApprovedAccount = async (credData) => {
    try {
      const reqResponse = await fetch('/api/account-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credData.requestId,
          status: 'READY',
          gameAccountUsername: credData.username,
          gameAccountPassword: credData.password,
          processedBy: adminUser.name,
          adminEmail: adminUser.email
        })
      });
      const reqResult = await reqResponse.json();
      if (reqResponse.ok && reqResult.success) {
        showToast(`Credentials sent to ${credData.userEmail}!`, 'success');
        setCompletedActionIds((prev) => ({ ...prev, [credData.requestId]: true }));
        setApproveModalOpen(false);
        mutate((key) => typeof key === 'string' && key.includes('/api/admin/stats'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/account-requests'));
      } else {
        showToast(reqResult.message || 'Failed to approve request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleApproveTransaction = async (txId) => {
    setCompletedActionIds((prev) => ({ ...prev, [txId]: true }));
    showToast('Transaction approved.', 'success');
    mutate((key) => typeof key === 'string' && key.includes('/api/admin/stats'));
    mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
    mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));

    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status: 'SUCCESS', processedBy: adminUser.name })
      });
      const data = await response.json();
      if (data.success) {
        mutate((key) => typeof key === 'string' && key.includes('/api/admin/stats'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/coins-notifications'));
        try {
          const bc = new BroadcastChannel('winning-heaven-admin-events');
          bc.postMessage({ type: 'coins', distributorId: distId, transactionId: txId });
          bc.postMessage({ type: 'transactions', distributorId: distId });
          bc.close();
        } catch {
          /* ignore */
        }
      } else {
        setCompletedActionIds((prev) => {
          const next = { ...prev };
          delete next[txId];
          return next;
        });
        showToast(data.message || 'Failed to approve.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleFailTransaction = async (txId) => {
    const feedbackMsg = window.prompt('Enter reason for rejection:', 'Payment not received');
    if (feedbackMsg === null) return;
    setCompletedActionIds((prev) => ({ ...prev, [txId]: true }));
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: txId,
          status: 'FAILED',
          note: feedbackMsg || 'Declined',
          processedBy: adminUser.name
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Transaction declined.', 'info');
        mutate((key) => typeof key === 'string' && key.includes('/api/admin/stats'));
        mutate((key) => typeof key === 'string' && key.startsWith('/api/transactions'));
      } else {
        showToast(data.message || 'Failed to decline.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleAddGatewayClick = () => {
    setEditGatewayData(null);
    setGatewayModalOpen(true);
  };

  const handleEditGatewayClick = (gateway) => {
    setEditGatewayData(gateway);
    setGatewayModalOpen(true);
  };

  const handleSaveGateway = async (gtData) => {
    if (distributorType !== 'B') return;
    try {
      const method = gtData.id ? 'PUT' : 'POST';
      const body = { ...gtData, distributorId: distId };
      const response = await fetch('/api/distributors/gateways', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        showToast(gtData.id ? 'Gateway updated.' : 'Gateway created.', 'success');
        if (gatewaysListUrl) mutate(gatewaysListUrl);
      } else {
        showToast(data.message || 'Failed to save gateway.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
    setGatewayModalOpen(false);
  };

  const handleDeleteGateway = async (id) => {
    if (distributorType !== 'B') return;
    if (!window.confirm('Delete this payment gateway?')) return;
    try {
      const response = await fetch(`/api/distributors/gateways?id=${id}&distributorId=${distId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Gateway deleted.', 'success');
        if (gatewaysListUrl) mutate(gatewaysListUrl);
      } else {
        showToast(data.message || 'Failed to delete gateway.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleSaveGame = async (gameItem) => {
    try {
      const method = gameItem.id ? 'PUT' : 'POST';
      const body = { ...gameItem, ownerDistributorId: distId };
      const response = await fetch('/api/games', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        showToast(gameItem.id ? 'Game updated.' : 'Game created.', 'success');
        mutate((key) => typeof key === 'string' && key.includes('/api/games'));
      } else {
        showToast(data.message || 'Failed to save game.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
    setGameModalOpen(false);
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Delete this game from your library?')) return;
    try {
      const response = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Game deleted.', 'success');
        mutate((key) => typeof key === 'string' && key.includes('/api/games'));
      } else {
        showToast(data.message || 'Failed to delete game.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const noop = () => {};

  return (
    <>
      {toast && (
        <div className={`notification-banner ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <i
              className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}
              style={{
                color: toast.type === 'error' ? 'var(--red-primary, #ff0055)' : toast.type === 'success' ? 'var(--emerald-primary, #00e676)' : 'var(--gold-primary, #ffd700)',
                fontSize: '1.1rem',
                flexShrink: 0
              }}
            />
            <span>{toast.message}</span>
          </div>
          <button type="button" className="close-notification" onClick={() => setToast(null)} aria-label="Close notification">
            &times;
          </button>
        </div>
      )}

      <AdminDashboard
        adminUser={adminUser}
        portalBasePath="/distributor"
        distributorType={distributorType}
        distributorSession={distSession}
        completedActionIds={completedActionIds}
        onLogout={onLogout}
        onAddGameClick={() => {
          setEditGameData(null);
          setGameModalOpen(true);
        }}
        onEditGameClick={(game) => {
          setEditGameData(game);
          setGameModalOpen(true);
        }}
        onDeleteGame={handleDeleteGame}
        onDeleteUser={noop}
        onApproveRequest={handleOpenApproveRequest}
        onApproveTransaction={handleApproveTransaction}
        onFailTransaction={handleFailTransaction}
        onInspectProof={handleInspectProof}
        onAddGatewayClick={handleAddGatewayClick}
        onEditGatewayClick={handleEditGatewayClick}
        onDeleteGateway={handleDeleteGateway}
        onCreateAdmin={noop}
        onUpdateSettings={noop}
        onUpdateCoinsNotification={handleUpdateCoinsNotification}
        onUpdateGameCoinsPool={handleUpdateGameCoinsPool}
        showToast={showToast}
        gatewaysListUrl={gatewaysListUrl || '/api/gateways'}
      />

      <AdminGameModal
        isOpen={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
        onSave={handleSaveGame}
        editGame={editGameData}
      />

      <ApproveAccountModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onApprove={handleSaveApprovedAccount}
        requestDetails={activeRequestDetails}
      />

      <AdminGatewayModal
        isOpen={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        onSave={handleSaveGateway}
        editGateway={editGatewayData}
      />

      <ViewProofModal
        isOpen={proofModalOpen}
        onClose={() => {
          setProofModalOpen(false);
          setProofImageUrl('');
          setProofMeta(null);
        }}
        proofUrl={proofImageUrl}
        proofMeta={proofMeta}
      />
    </>
  );
}