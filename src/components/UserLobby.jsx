'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Player Sub-Components
import PlayerNavbar from './player/PlayerNavbar';
import PlayerSidebar from './player/PlayerSidebar';
import GameGrid from './player/GameGrid';
import GameHubPage from './player/GameHubPage';
import PlayerLedger from './player/PlayerLedger';
import PlayerProfileTab from './player/PlayerProfileTab';
import MobileBottomNav from './player/MobileBottomNav';
import PlayerFooter from './player/PlayerFooter';

// Dedicated Full-View Deposit & Withdraw Pages
import PlayerDepositPage from './player/PlayerDepositPage';
import PlayerWithdrawPage from './player/PlayerWithdrawPage';

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
  onRefresh,
  onOpenAuthModal,
  initialTab = 'main'
}) {
  // Navigation State ('main' | 'deposit' | 'withdraw' | 'history' | 'referrals' | 'profile' | 'game_hub')
  const [activeTab, setActiveTab] = useState(initialTab || 'main');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    if (initialTab && initialTab !== 'main') {
      setActiveTab(initialTab);
    }
  }

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

  // Auth Protection Guard Wrappers
  const handleRequestFreeplayForGame = (gameTitle = '') => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('register');
      return;
    }
    setFreeplayGameTitle(gameTitle || '');
    setFreeplayModalOpen(true);
  };

  const handleOpenDepositForGame = (gameTitle = '') => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setDepositGameTitle(gameTitle || '');
    setSelectedGameHub(null);
    setSelectedGameAccount(null);
    setActiveTab('deposit');
  };

  const handleOpenWithdrawForGame = (gameTitle = '') => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setWithdrawGameTitle(gameTitle || '');
    setSelectedGameHub(null);
    setSelectedGameAccount(null);
    setActiveTab('withdraw');
  };

  const handleRequestAccount = async (gameTitle) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    if (onRequestAccount) {
      await onRequestAccount(gameTitle);
    }
  };

  const handlePlayGame = (game, userAcc) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setSelectedGameHub(game);
    setSelectedGameAccount(userAcc || null);
    setActiveTab('game_hub');
  };

  const handleViewCredentials = (game, userAcc) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setSelectedGameHub(game);
    setSelectedGameAccount(userAcc);
    setActiveTab('game_hub');
  };

  const handleSelectTab = (tab) => {
    if (['deposit', 'withdraw', 'history', 'profile', 'referrals'].includes(tab) && !currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setSelectedGameHub(null);
    setSelectedGameAccount(null);
    setActiveTab(tab);
  };

  const [claimedRemainderIds, setClaimedRemainderIds] = useState([]);

  const handleClaimPlayerRemainder = async (tx) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
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

  return (
    <div className="player-shell-container">
      {/* Offline Banner Indicator */}
      <OfflineBanner />

      {/* 100vh Fixed Sidebar on Desktop / Offcanvas Drawer on Mobile */}
      <PlayerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        games={games}
        gameAccounts={gameAccounts}
        accountRequests={accountRequests}
        onOpenDeposit={() => handleOpenDepositForGame('')}
        onOpenWithdraw={() => handleOpenWithdrawForGame('')}
        onOpenFreeplay={() => handleRequestFreeplayForGame('')}
        onOpenSupport={onOpenSupport}
        onOpenAuth={(tab) => onOpenAuthModal && onOpenAuthModal(tab)}
        onLogout={onLogout}
        onInstallApp={() => setAppInstallOpen(true)}
        onPlayGame={handlePlayGame}
        onRequestAccount={(game) => handlePlayGame(game, null)}
      />

      {/* Right Side Scrollable Page View (Navbar + Content Pane + Footer) */}
      <div className="player-right-wrapper">
        <PlayerNavbar
          currentUser={currentUser}
          onRefresh={onRefresh}
          onOpenDeposit={() => handleOpenDepositForGame('')}
          onOpenWithdraw={() => handleOpenWithdrawForGame('')}
          onOpenSupport={onOpenSupport}
          supportUnread={supportUnread}
          onOpenProfile={() => handleSelectTab('profile')}
          onLogout={onLogout}
          onSelectTab={handleSelectTab}
          activeTab={activeTab}
          canClaimRemainder={canClaimRemainder}
          onClaimRemainder={() => handleSelectTab('history')}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenAuth={(tab) => onOpenAuthModal && onOpenAuthModal(tab)}
        />

        {/* Content Pane */}
        <div className="player-content-pane">
          <PullToRefresh onRefresh={onRefresh}>
            <main className="player-main-container">
              {/* Main Game Lobby View — Persisted in DOM so images, cards, and state never re-render or reload */}
              <div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
                {/* 12-Card Live Approved Cashout Stream Marquee Ticker */}
                <LivePayoutsMarquee liveTransactions={transactions} />

                {/* Sleek VIP Bonus Strip — Informs player of all bonuses without large messy banner boxes */}
                <div className="lobby-bonus-strip">
                  <div
                    className="bonus-strip-item freeplay"
                    onClick={() => handleRequestFreeplayForGame('')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="bonus-strip-icon green">
                      <i className="fa-solid fa-gift" />
                    </div>
                    <div className="bonus-strip-info">
                      <span className="bonus-strip-badge green">TASK BONUS</span>
                      <span className="bonus-strip-text">Claim <strong>$3.00 Freeplay</strong> (No Deposit)</span>
                    </div>
                    <i className="fa-solid fa-chevron-right bonus-strip-arrow" />
                  </div>

                  <div
                    className="bonus-strip-item deposit"
                    onClick={() => handleOpenDepositForGame('')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="bonus-strip-icon gold">
                      <i className="fa-solid fa-coins" />
                    </div>
                    <div className="bonus-strip-info">
                      <span className="bonus-strip-badge gold">MATCH BONUS</span>
                      <span className="bonus-strip-text"><strong>100% Instant Match</strong> on Deposits</span>
                    </div>
                    <i className="fa-solid fa-chevron-right bonus-strip-arrow" />
                  </div>

                  <div
                    className="bonus-strip-item referral"
                    onClick={() => handleSelectTab('referrals')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="bonus-strip-icon cyan">
                      <i className="fa-solid fa-users-viewfinder" />
                    </div>
                    <div className="bonus-strip-info">
                      <span className="bonus-strip-badge cyan">VIP REWARDS</span>
                      <span className="bonus-strip-text">Earn <strong>Friend Referral</strong> Cash</span>
                    </div>
                    <i className="fa-solid fa-chevron-right bonus-strip-arrow" />
                  </div>
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

              {/* Dedicated Full Page Deposit View */}
              {activeTab === 'deposit' && (
                <PlayerDepositPage
                  userEmail={currentUserEmail}
                  gateways={gateways}
                  games={games}
                  transactions={transactions}
                  onSubmitTransaction={onSubmitTransaction}
                  showToast={showToast}
                  onBack={() => setActiveTab('main')}
                  defaultGameTitle={depositGameTitle}
                />
              )}

              {/* Dedicated Full Page Cashout / Withdraw View */}
              {activeTab === 'withdraw' && (
                <PlayerWithdrawPage
                  userEmail={currentUserEmail}
                  gateways={gateways}
                  games={games}
                  transactions={transactions}
                  onSubmitTransaction={onSubmitTransaction}
                  showToast={showToast}
                  onBack={() => setActiveTab('main')}
                  defaultGameTitle={withdrawGameTitle}
                  frontendSettings={frontendSettings}
                />
              )}

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
                      onOpenReuploadProof={() => handleOpenDepositForGame('')}
                      claimedRemainderIds={claimedRemainderIds}
                      onClaimRemainder={handleClaimPlayerRemainder}
                      onDepositFromCashout={(tx) => handleOpenDepositForGame(tx.gameTitle || '')}
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
        </div>

        {/* --- Player Footer Links --- */}
        <PlayerFooter />
      </div>

      {/* Fixed Bottom Dock for Mobile Viewports */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenDeposit={() => handleOpenDepositForGame('')}
        onOpenWithdraw={() => handleOpenWithdrawForGame('')}
        onInstallApp={() => setAppInstallOpen(true)}
        onOpenSupport={onOpenSupport}
        supportUnread={supportUnread}
      />

      {/* --- Centered Deposit Modal (Fallback) --- */}
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

      {/* --- Centered Cashout Modal (Fallback) --- */}
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
          frontendSettings={frontendSettings}
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
          gameAccounts={gameAccounts}
          accountRequests={accountRequests}
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
          showToast={showToast}
        />
      )}

      {/* --- Subscribe Push Notification Prompt on Login --- */}
      {currentUser && (
        <SubscribePromptModal
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* --- In-App Promo Modal --- */}
      {currentUser && (
        <PlayerPromoModal
          currentUser={currentUser}
          onOpenDeposit={() => handleOpenDepositForGame('')}
          showToast={showToast}
        />
      )}

      <style jsx>{`
        .player-shell-container {
          min-height: 100vh;
          width: 100%;
          background: var(--bg-primary);
          color: var(--text-light);
          display: flex;
          position: relative;
        }
        .player-right-wrapper {
          flex: 1;
          min-width: 0;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        @media (min-width: 1025px) {
          .player-right-wrapper {
            margin-left: 280px;
            width: calc(100% - 280px);
          }
        }
        .player-content-pane {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .player-main-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 1rem 1.25rem 2.5rem 1.25rem;
          flex: 1;
          box-sizing: border-box;
        }
        .lobby-bonus-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 0.75rem;
          margin: 0.25rem 0 1rem 0;
        }
        .bonus-strip-item {
          background: rgba(14, 18, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .bonus-strip-item:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 200, 0, 0.4);
          background: rgba(20, 26, 54, 0.95);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        .bonus-strip-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .bonus-strip-icon.green {
          background: rgba(0, 230, 118, 0.15);
          border: 1px solid rgba(0, 230, 118, 0.35);
          color: #00e676;
        }
        .bonus-strip-icon.gold {
          background: rgba(255, 200, 0, 0.15);
          border: 1px solid rgba(255, 200, 0, 0.35);
          color: #ffc800;
        }
        .bonus-strip-icon.cyan {
          background: rgba(0, 240, 255, 0.15);
          border: 1px solid rgba(0, 240, 255, 0.35);
          color: #00f0ff;
        }
        .bonus-strip-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .bonus-strip-badge {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          width: fit-content;
          padding: 0.12rem 0.4rem;
          border-radius: 6px;
        }
        .bonus-strip-badge.green {
          background: rgba(0, 230, 118, 0.2);
          color: #00e676;
        }
        .bonus-strip-badge.gold {
          background: rgba(255, 200, 0, 0.2);
          color: #ffc800;
        }
        .bonus-strip-badge.cyan {
          background: rgba(0, 240, 255, 0.2);
          color: #00f0ff;
        }
        .bonus-strip-text {
          font-size: 0.82rem;
          color: var(--text-light);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bonus-strip-text strong {
          color: #fff;
        }
        .bonus-strip-arrow {
          font-size: 0.75rem;
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .bonus-strip-item:hover .bonus-strip-arrow {
          transform: translateX(3px);
          color: #fff;
        }
        @media (max-width: 768px) {
          .player-shell-container {
            padding-bottom: calc(4.8rem + max(env(safe-area-inset-bottom, 0px), var(--sab, 0px)));
          }
          .lobby-bonus-strip {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 0.5rem;
            margin: 0.15rem 0 0.5rem 0;
            padding-bottom: 0.25rem;
            scrollbar-width: none;
          }
          .lobby-bonus-strip::-webkit-scrollbar {
            display: none;
          }
          .bonus-strip-item {
            flex: 0 0 240px;
            scroll-snap-align: start;
            padding: 0.55rem 0.75rem;
            gap: 0.55rem;
            border-radius: 12px;
          }
          .bonus-strip-icon {
            width: 30px;
            height: 30px;
            font-size: 0.85rem;
          }
          .bonus-strip-text {
            font-size: 0.76rem;
          }
          .player-main-container {
            padding: 0.35rem 0.6rem 2rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}
