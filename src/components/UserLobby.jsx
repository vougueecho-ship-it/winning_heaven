'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Player Sub-Components
import PlayerNavbar from './player/PlayerNavbar';
import PlayerHeroBanner from './player/PlayerHeroBanner';
import GameGrid from './player/GameGrid';
import GameHubPage from './player/GameHubPage';
import PlayerLedger from './player/PlayerLedger';
import PlayerProfileTab from './player/PlayerProfileTab';
import MobileBottomNav from './player/MobileBottomNav';
import PlayerFooter from './player/PlayerFooter';

// Core Player Features & Modals
import ReferralCenter from './ReferralCenter';
import AppInstallModal from './AppInstallModal';
import OfflineBanner from './OfflineBanner';
import PullToRefresh from './PullToRefresh';
import CasinoRulesAccordion from './player/CasinoRulesAccordion';
import LivePayoutsMarquee from './player/LivePayoutsMarquee';
import SubscribePromptModal from './player/SubscribePromptModal';
import PlayerPromoModal from './player/PlayerPromoModal';
import FreeplayTaskModal from './player/FreeplayTaskModal';
import { PlayerDepositModal, PlayerWithdrawModal, PlayerGameAccountModal } from './player/PlayerModals';
import { canShowClaimRemainderButton } from '../lib/remainderClaim';

export default function UserLobby({
  games = [],
  accountRequests = [],
  gameAccounts = [],
  transactions = [],
  gateways = [],
  coinsNotifications = [],
  onUpdateCoinsNotification,
  onInstallApp,
  currentUser,
  currentUserEmail,
  onLogout,
  showToast,
  onOpenSupport,
  supportUnread = false,
  onRequestAccount,
  onSubmitTransaction,
  frontendSettings = {},
  onUpdateUser,
  onRefresh
}) {
  // Navigation State ('main' | 'history' | 'referrals' | 'profile' | 'game_hub')
  const [activeTab, setActiveTab] = useState('main');

  // Modals & Active Game Hub State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [freeplayModalOpen, setFreeplayModalOpen] = useState(false);
  const [depositGameTitle, setDepositGameTitle] = useState('');
  const [withdrawGameTitle, setWithdrawGameTitle] = useState('');
  const [freeplayGameTitle, setFreeplayGameTitle] = useState('');

  const [gameRequestModalOpen, setGameRequestModalOpen] = useState(false);
  const [selectedGameForRequest, setSelectedGameForRequest] = useState(null);
  const [selectedGameHub, setSelectedGameHub] = useState(null);
  const [selectedGameAccount, setSelectedGameAccount] = useState(null);
  const [appInstallOpen, setAppInstallOpen] = useState(false);

  // Favorites State from localStorage
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('winning_heaven_favs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (gameId) => {
    setFavorites((prev) => {
      const updated = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId];
      try {
        localStorage.setItem('winning_heaven_favs', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  // Freeplay Session & Eligibility Gate Computation
  const isFreeplaySession = useMemo(() => {
    const sorted = [...(transactions || [])].sort((a, b) => {
      if (a.id && b.id) return parseFloat(b.id) - parseFloat(a.id);
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });
    const lastFreeplay = sorted.find(
      (t) => t.type === 'BONUS' && (t.code === 'SIGNUP-FREE3' || t.code === 'FREEPLAY') && t.status === 'SUCCESS'
    );
    if (!lastFreeplay) return false;
    const isAfterTx = (t, anchor) => {
      if (t.id && anchor.id) return parseFloat(t.id) > parseFloat(anchor.id);
      return new Date(t.date || t.createdAt || 0).getTime() > new Date(anchor.date || anchor.createdAt || 0).getTime();
    };
    const hasDepositAfter = sorted.some((t) => t.type === 'DEPOSIT' && t.status === 'SUCCESS' && isAfterTx(t, lastFreeplay));
    const hasFreeplayWithdrawAfter = sorted.some((t) => t.type === 'WITHDRAW' && t.isFreeplayWithdraw && isAfterTx(t, lastFreeplay));
    return !hasDepositAfter && !hasFreeplayWithdrawAfter;
  }, [transactions]);

  const unlockDepositTarget = useMemo(() => {
    return frontendSettings?.settings?.freeplayUnlockDeposit !== undefined
      ? Number(frontendSettings.settings.freeplayUnlockDeposit)
      : 10;
  }, [frontendSettings]);

  // Check if player's latest freeplay was rejected by admin
  const lastRejectedFreeplay = useMemo(() => {
    const sorted = [...(transactions || [])].sort((a, b) => {
      if (a.id && b.id) return parseFloat(b.id) - parseFloat(a.id);
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });
    const isFreeplayTx = (t) => t.type === 'BONUS' && (t.code === 'SIGNUP-FREE3' || t.code === 'FREEPLAY');
    const lastSuccess = sorted.find((t) => isFreeplayTx(t) && t.status === 'SUCCESS');
    const lastFail = sorted.find((t) => isFreeplayTx(t) && (t.status === 'FAILED' || t.status === 'REJECTED' || Boolean(t.rejectionReason)));
    if (lastFail) {
      if (!lastSuccess) return lastFail;
      const isFailAfter = (lastFail.id && lastSuccess.id)
        ? parseFloat(lastFail.id) > parseFloat(lastSuccess.id)
        : new Date(lastFail.createdAt || lastFail.date || 0) > new Date(lastSuccess.createdAt || lastSuccess.date || 0);
      if (isFailAfter) return lastFail;
    }
    return null;
  }, [transactions]);

  const freeplayRejectionReason = lastRejectedFreeplay?.rejectionReason || lastRejectedFreeplay?.note || '';

  const freeplayGate = useMemo(() => {
    const sorted = [...(transactions || [])].sort((a, b) => {
      if (a.id && b.id) return parseFloat(b.id) - parseFloat(a.id);
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });

    const isFreeplayTx = (t) =>
      t.type === 'BONUS' && (t.code === 'SIGNUP-FREE3' || t.code === 'FREEPLAY');

    const pending = sorted.filter(
      (t) => isFreeplayTx(t) && ['COINS_LOADING', 'PENDING', 'PENDING_COINS'].includes(t.status)
    );
    const success = sorted.filter((t) => isFreeplayTx(t) && t.status === 'SUCCESS');

    if (pending.length > 0) {
      return {
        canClaim: false,
        phase: 'pending',
        isFirst: success.length === 0,
        message: 'Your freeplay request is already submitted. Please wait for approval.'
      };
    }

    if (success.length === 0) {
      return {
        canClaim: true,
        phase: 'signup',
        isFirst: true,
        message: 'Complete the email verification task to claim your signup freeplay.'
      };
    }

    const mostRecent = success[0];
    const isAfterTx = (t, anchor) => {
      if (t.id && anchor.id) return parseFloat(t.id) > parseFloat(anchor.id);
      return new Date(t.date || t.createdAt || 0).getTime() > new Date(anchor.date || anchor.createdAt || 0).getTime();
    };

    const lastCashoutAfterFreeplay = sorted.find(
      (t) =>
        t.type === 'WITHDRAW' &&
        t.status !== 'FAILED' &&
        isAfterTx(t, mostRecent)
    );
    const depositAnchor = lastCashoutAfterFreeplay || mostRecent;

    const depositTotalAfter = sorted.reduce((sum, t) => {
      if (t.type === 'DEPOSIT' && t.status === 'SUCCESS' && isAfterTx(t, depositAnchor)) {
        return sum + parseFloat(t.amount || 0);
      }
      return sum;
    }, 0);

    if (depositTotalAfter >= unlockDepositTarget) {
      return {
        canClaim: true,
        phase: 'deposit',
        isFirst: false,
        message: `You qualify for another freeplay after depositing $${unlockDepositTarget}+.`
      };
    }

    const remaining = Math.max(0, unlockDepositTarget - depositTotalAfter);
    return {
      canClaim: false,
      phase: 'need_deposit',
      isFirst: false,
      depositTotal: depositTotalAfter,
      remaining,
      message: lastCashoutAfterFreeplay
        ? `You will be eligible for freeplay after depositing $${remaining.toFixed(2)} more since your last cashout ($${depositTotalAfter.toFixed(2)} / $${unlockDepositTarget.toFixed(2)}).`
        : `You will be eligible for freeplay after depositing $${remaining.toFixed(2)} more ($${depositTotalAfter.toFixed(2)} / $${unlockDepositTarget.toFixed(2)}).`
    };
  }, [transactions, unlockDepositTarget]);

  const canClaimRemainder = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) return false;
    return transactions.some((t) => canShowClaimRemainderButton(t));
  }, [transactions]);

  const handleRequestFreeplayForGame = (gameTitle = '') => {
    setFreeplayGameTitle(gameTitle || '');
    setFreeplayModalOpen(true);
  };

  const handleOpenDepositForGame = (gameTitle = '') => {
    setDepositGameTitle(gameTitle || '');
    setDepositModalOpen(true);
  };

  const handleOpenWithdrawForGame = (gameTitle = '') => {
    setWithdrawGameTitle(gameTitle || '');
    setWithdrawModalOpen(true);
  };

  const handleRequestAccount = async (gameTitle) => {
    if (onRequestAccount) {
      await onRequestAccount(gameTitle);
    }
  };

  const handleViewCredentials = (game, userAcc) => {
    setSelectedGameHub(game);
    setSelectedGameAccount(userAcc);
    setActiveTab('game_hub');
  };

  const [claimedRemainderIds, setClaimedRemainderIds] = useState([]);

  const handleClaimPlayerRemainder = async (tx) => {
    if (!onSubmitTransaction || !tx) return;
    if (claimedRemainderIds.includes(tx.id)) return;
    setClaimedRemainderIds((prev) => [...prev, tx.id]);
    try {
      await onSubmitTransaction({
        amount: parseFloat(tx.payoutHold || 0),
        type: 'WITHDRAW',
        gameTitle: tx.gameTitle || 'MAIN WALLET',
        isRemainderRequest: true,
        parentTxId: tx.id,
        note: `Remainder payout claim for #${tx.id || tx._id}`
      });
      if (showToast) showToast('Remainder cashout claim submitted to support!', 'success');
    } catch (err) {
      if (showToast) showToast(err?.message || 'Claim failed.', 'error');
    }
  };

  const handlePlayGame = (game, userAcc) => {
    setSelectedGameHub(game);
    setSelectedGameAccount(userAcc || null);
    setActiveTab('game_hub');
  };

  return (
    <div className="player-shell-container">
      {/* Offline Banner Indicator */}
      <OfflineBanner />

      {/* Top VIP Navigation Bar */}
      <PlayerNavbar
        currentUser={currentUser}
        onRefresh={onRefresh}
        onOpenDeposit={() => { setDepositGameTitle(''); setDepositModalOpen(true); }}
        onOpenWithdraw={() => { setWithdrawGameTitle(''); setWithdrawModalOpen(true); }}
        onOpenSupport={onOpenSupport}
        supportUnread={supportUnread}
        onOpenProfile={() => setActiveTab('profile')}
        onLogout={onLogout}
        onSelectTab={(tab) => {
          setSelectedGameHub(null);
          setSelectedGameAccount(null);
          setActiveTab(tab);
        }}
        activeTab={activeTab}
        canClaimRemainder={canClaimRemainder}
        onClaimRemainder={() => setActiveTab('history')}
      />

      {/* Main Container */}
      <PullToRefresh onRefresh={onRefresh}>
        <main className="player-main-container">
          {/* Main Game Lobby View — Persisted in DOM so images, cards, and state never re-render or reload */}
          <div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
            {/* 12-Card Live Approved Cashout Stream Marquee Ticker */}
            <LivePayoutsMarquee liveTransactions={transactions} />

            {/* Hero Banner Carousel */}
            <PlayerHeroBanner
              frontendSettings={frontendSettings}
              onOpenDeposit={() => { setDepositGameTitle(''); setDepositModalOpen(true); }}
              onOpenReferrals={() => setActiveTab('referrals')}
              onOpenFreeplay={() => { setFreeplayGameTitle(''); setFreeplayModalOpen(true); }}
            />

            {/* Prominent Freeplay Task Showcase Banner */}
            <div
              onClick={() => { setFreeplayGameTitle(''); setFreeplayModalOpen(true); }}
              style={{
                background: 'linear-gradient(135deg, rgba(20, 24, 52, 0.95) 0%, rgba(10, 14, 28, 0.95) 100%)',
                border: '1.5px solid rgba(255, 200, 0, 0.4)',
                borderRadius: '20px',
                padding: '1.1rem 1.4rem',
                margin: '0.85rem 0 1.25rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255, 200, 0, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Glow */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '160px',
                height: '160px',
                background: 'radial-gradient(circle, rgba(0,230,118,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255,200,0,0.25) 0%, rgba(0,230,118,0.25) 100%)',
                  border: '1.5px solid #ffc800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffc800',
                  fontSize: '1.45rem',
                  boxShadow: '0 0 15px rgba(255,200,0,0.3)',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-gift" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                      TASK BONUS
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#00e676', fontWeight: 800 }}>
                      ⚡ 30-Sec Verification
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#fff',
                    margin: '0 0 0.2rem 0',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    CLAIM $3.00 SIGNUP FREEPLAY
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Move our email from <strong style={{ color: '#fff' }}>Spam to Inbox</strong> &amp; upload screenshot. Deposit just <strong style={{ color: '#ffc800' }}>$10.00</strong> to qualify for recurring freeplays!
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-gold-glow"
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #00e676 0%, #00a152 100%)',
                  color: '#000',
                  fontWeight: 900,
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fa-solid fa-camera" /> CLAIM $3 FREEPLAY &rarr;
              </button>
            </div>

            {/* Game Catalog & Categories */}
            <GameGrid
              games={games}
              gameAccounts={gameAccounts}
              accountRequests={accountRequests}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onPlayGame={handlePlayGame}
              onRequestAccount={(game) => handlePlayGame(game, null)}
              onViewCredentials={handleViewCredentials}
              onDepositToGame={(game) => handleOpenDepositForGame(game.title)}
            />

            {/* Platform Rules & Player Guidelines Accordion */}
            <CasinoRulesAccordion frontendSettings={frontendSettings} />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'game_hub' && selectedGameHub && (
              <GameHubPage
                key="game_hub"
                game={selectedGameHub}
                userAccount={
                  gameAccounts.find(
                    (acc) => String(acc.gameTitle || '').toLowerCase().trim() === String(selectedGameHub.title || '').toLowerCase().trim()
                  ) || selectedGameAccount || null
                }
                hasPendingAccountRequest={
                  accountRequests.some(
                    (req) => req.status === 'PENDING' && String(req.gameTitle || '').toLowerCase().trim() === String(selectedGameHub.title || '').toLowerCase().trim()
                  )
                }
                onRequestAccount={handleRequestAccount}
                onBack={() => {
                  setSelectedGameHub(null);
                  setSelectedGameAccount(null);
                  setActiveTab('main');
                }}
                showToast={showToast}
                onOpenDepositForGame={handleOpenDepositForGame}
                onOpenWithdrawForGame={handleOpenWithdrawForGame}
                onRequestFreeplayForGame={handleRequestFreeplayForGame}
                onOpenSupport={onOpenSupport}
                transactions={transactions}
                accountRequests={accountRequests}
                freeplayGate={freeplayGate}
              />
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <PlayerLedger
                  transactions={transactions}
                  onOpenReuploadProof={() => { setDepositGameTitle(''); setDepositModalOpen(true); }}
                  claimedRemainderIds={claimedRemainderIds}
                  onClaimRemainder={handleClaimPlayerRemainder}
                  onDepositFromCashout={(tx) => {
                    setDepositGameTitle(tx.gameTitle || '');
                    setDepositModalOpen(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'referrals' && (
              <motion.div
                key="referrals"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ReferralCenter
                  currentUserEmail={currentUserEmail}
                  referralCode={currentUser?.referralCode || ''}
                  referralsList={[]}
                  onClose={() => setActiveTab('main')}
                  onOpenSupport={onOpenSupport}
                  showToast={showToast}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <PlayerProfileTab
                  currentUser={currentUser}
                  onUpdateUser={onUpdateUser}
                  showToast={showToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </PullToRefresh>

      {/* Fixed Bottom Dock for Mobile Viewports */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedGameHub(null);
          setSelectedGameAccount(null);
          setActiveTab(tab);
        }}
        onOpenSupport={onOpenSupport}
        supportUnread={supportUnread}
      />

      {/* --- Centered Deposit Modal --- */}
      {depositModalOpen && (
        <PlayerDepositModal
          isOpen={true}
          onClose={() => setDepositModalOpen(false)}
          gateways={gateways}
          onSubmitTransaction={onSubmitTransaction}
          showToast={showToast}
          userEmail={currentUserEmail}
          defaultGameTitle={depositGameTitle}
          games={games}
          transactions={transactions}
        />
      )}

      {/* --- Centered Cashout Modal --- */}
      {withdrawModalOpen && (
        <PlayerWithdrawModal
          isOpen={true}
          onClose={() => setWithdrawModalOpen(false)}
          gateways={gateways}
          onSubmitTransaction={onSubmitTransaction}
          showToast={showToast}
          userEmail={currentUserEmail}
          defaultGameTitle={withdrawGameTitle}
          games={games}
          transactions={transactions}
        />
      )}

      {/* --- Centered Freeplay Task Modal --- */}
      {freeplayModalOpen && (
        <FreeplayTaskModal
          isOpen={true}
          onClose={() => setFreeplayModalOpen(false)}
          currentUser={currentUser}
          userEmail={currentUserEmail}
          defaultGameTitle={freeplayGameTitle}
          games={games}
          transactions={transactions}
          freeplayGate={freeplayGate}
          onSubmitTransaction={onSubmitTransaction}
          showToast={showToast}
          rejectionReason={freeplayRejectionReason}
        />
      )}

      {/* --- Centered Request Game Account Modal --- */}
      {gameRequestModalOpen && selectedGameForRequest && (
        <PlayerGameAccountModal
          isOpen={true}
          onClose={() => { setGameRequestModalOpen(false); setSelectedGameForRequest(null); }}
          game={selectedGameForRequest}
          onRequestAccount={onRequestAccount}
          showToast={showToast}
        />
      )}

      {/* --- App Install Modal --- */}
      {appInstallOpen && (
        <AppInstallModal
          isOpen={true}
          onClose={() => setAppInstallOpen(false)}
          onInstallApp={onInstallApp}
        />
      )}

      {/* --- Subscribe Push Notification Prompt on Login --- */}
      <SubscribePromptModal
        currentUser={currentUser}
        showToast={showToast}
      />

      {/* --- In-App Promo Modal --- */}
      <PlayerPromoModal
        currentUser={currentUser}
        onOpenDeposit={() => { setDepositGameTitle(''); setDepositModalOpen(true); }}
        showToast={showToast}
      />

      {/* --- Player Footer Links --- */}
      <PlayerFooter />

      <style jsx>{`
        .player-shell-container {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-light);
          display: flex;
          flex-direction: column;
          position: relative;
          padding-bottom: 1.5rem;
        }
        .player-main-container {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 1.25rem 1.25rem 2.5rem 1.25rem;
          flex: 1;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .player-shell-container {
            padding-bottom: calc(4.8rem + max(env(safe-area-inset-bottom, 0px), var(--sab, 0px)));
          }
        }
        @media (max-width: 640px) {
          .player-main-container {
            padding: 0.75rem 0.65rem 2rem 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}
