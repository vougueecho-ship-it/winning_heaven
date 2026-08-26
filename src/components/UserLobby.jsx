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
  const [depositGameTitle, setDepositGameTitle] = useState('');
  const [withdrawGameTitle, setWithdrawGameTitle] = useState('');

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
        message: 'Select one game and claim your signup freeplay.'
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

    if (depositTotalAfter >= 25) {
      return {
        canClaim: true,
        phase: 'deposit',
        isFirst: false,
        message: 'You qualify for another freeplay after depositing $25+.'
      };
    }

    const remaining = Math.max(0, 25 - depositTotalAfter);
    return {
      canClaim: false,
      phase: 'need_deposit',
      isFirst: false,
      depositTotal: depositTotalAfter,
      remaining,
      message: lastCashoutAfterFreeplay
        ? `You will be eligible for freeplay after depositing $${remaining.toFixed(2)} more since your last cashout ($${depositTotalAfter.toFixed(2)} / $25.00).`
        : `You will be eligible for freeplay after depositing $${remaining.toFixed(2)} more ($${depositTotalAfter.toFixed(2)} / $25.00).`
    };
  }, [transactions]);

  const canClaimRemainder = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) return false;
    return transactions.some((t) => canShowClaimRemainderButton(t));
  }, [transactions]);

  const handleRequestFreeplayForGame = async (gameTitle) => {
    if (!onSubmitTransaction || !gameTitle) return;
    if (!freeplayGate.canClaim) {
      if (showToast) showToast(freeplayGate.message || 'Freeplay request not available right now.', 'error');
      return;
    }
    const fpAmount = frontendSettings?.settings?.signupFreeplay !== undefined
      ? Number(frontendSettings.settings.signupFreeplay)
      : 3;
    try {
      await onSubmitTransaction({
        amount: fpAmount,
        type: 'BONUS',
        gameTitle,
        code: freeplayGate.phase === 'signup' ? 'SIGNUP-FREE3' : 'FREEPLAY',
        note: `Promo Freeplay request for ${gameTitle}`
      });
      if (showToast) showToast(`Freeplay request for ${gameTitle} submitted!`, 'success');
    } catch (err) {
      if (showToast) showToast(err?.message || 'Freeplay request failed', 'error');
    }
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
            />

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
