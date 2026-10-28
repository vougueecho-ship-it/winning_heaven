'use client';

import React, { useState, useEffect } from 'react';
import PanelModalBackdrop from '../PanelModalBackdrop';

// Common payment gateway fallback presets
const GATEWAY_FALLBACK_PRESETS = [
  { name: 'Cash App', defaultTag: '$WinningHeavenVIP' },
  { name: 'Chime', defaultTag: '$WinningHeavenChime' },
  { name: 'Zelle', defaultTag: 'pay@winningheaven.com' },
  { name: 'Apple Pay', defaultTag: '+1 (555) 789-0123' },
  { name: 'Venmo', defaultTag: '@WinningHeaven' },
  { name: 'Bitcoin / Crypto', defaultTag: 'BTC-Wallet-Primary' },
  { name: 'PayPal', defaultTag: 'support@winningheaven.com' },
  { name: 'Other', defaultTag: '' }
];

export default function DirectChatDepositModal({
  isOpen,
  onClose,
  playerEmail,
  playerName = 'Player',
  adminUser,
  onSuccess
}) {
  const [depositAmount, setDepositAmount] = useState('50');
  const [adminGateways, setAdminGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [gatewayTag, setGatewayTag] = useState('');
  const [senderTag, setSenderTag] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  
  // Game & Coins
  const [games, setGames] = useState([]);
  const [selectedGameTitle, setSelectedGameTitle] = useState('');
  const [bonusPreset, setBonusPreset] = useState('halloween'); // 'halloween' | '100' | '50' | 'none' | 'custom'
  const [customBonusAmount, setCustomBonusAmount] = useState('0');
  const [coinsLoaded, setCoinsLoaded] = useState('125'); // 50 + 150% = 125
  
  // Game Credentials
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [playerClaimedBonus, setPlayerClaimedBonus] = useState(null);
  
  // Receipt
  const [postToChat, setPostToChat] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const calculateCoins = (amtStr, preset, customBonusStr) => {
    const amt = parseFloat(amtStr) || 0;
    let bonus = 0;
    if (preset === 'halloween') {
      const pct = (playerClaimedBonus?.bonusPercent ? playerClaimedBonus.bonusPercent : 150) / 100;
      bonus = amt * pct;
    } else if (preset === '100') {
      bonus = amt * 1.0;
    } else if (preset === '50') {
      bonus = amt * 0.5;
    } else if (preset === 'custom') {
      bonus = parseFloat(customBonusStr) || 0;
    }
    const total = amt + bonus;
    return total > 0 ? total.toFixed(2).replace(/\.00$/, '') : '0';
  };

  const handleAmountChange = (newAmt) => {
    setDepositAmount(newAmt);
    setCoinsLoaded(calculateCoins(newAmt, bonusPreset, customBonusAmount));
  };

  const handleBonusPresetChange = (newPreset) => {
    setBonusPreset(newPreset);
    setCoinsLoaded(calculateCoins(depositAmount, newPreset, customBonusAmount));
  };

  const generateNewCredentials = React.useCallback(() => {
    const prefix = (playerEmail || 'player').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 7);
    const randNum = Math.floor(100 + Math.random() * 900);
    setGameUsername(`${prefix || 'user'}${randNum}`);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
    let pass = 'Win';
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGamePassword(pass);
  }, [playerEmail]);

  // Fetch admin configured gateways from database
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const distParam = adminUser?.distributorId ? `?distributorId=${encodeURIComponent(adminUser.distributorId)}` : '';
    fetch(`/api/gateways${distParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.gateways) && data.gateways.length > 0) {
          setAdminGateways(data.gateways);
          const firstGw = data.gateways[0];
          setSelectedGateway(firstGw.name);
          setGatewayTag(firstGw.tag || firstGw.phone || '');
        } else {
          setSelectedGateway(GATEWAY_FALLBACK_PRESETS[0].name);
          setGatewayTag(GATEWAY_FALLBACK_PRESETS[0].defaultTag);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching admin gateways:', err);
        setSelectedGateway(GATEWAY_FALLBACK_PRESETS[0].name);
        setGatewayTag(GATEWAY_FALLBACK_PRESETS[0].defaultTag);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, adminUser?.distributorId]);

  // Fetch games list & player active Halloween bonus
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.games?.length > 0) {
          setGames(data.games);
          if (!selectedGameTitle) {
            setSelectedGameTitle(data.games[0].title);
          }
        }
      })
      .catch((err) => console.error('Error fetching games:', err));

    if (playerEmail) {
      fetch(`/api/halloween/claim?email=${encodeURIComponent(playerEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.claimedBonus) {
            setPlayerClaimedBonus(data.claimedBonus);
            if (data.claimedBonus.bonusPercent) {
              setBonusPreset('halloween');
            }
          }
        })
        .catch((err) => console.error('Error fetching player claimed Halloween bonus:', err));
    }
  }, [isOpen, selectedGameTitle, playerEmail]);

  // Handle gateway change - auto populates gateway tag/handle from admin settings
  const handleSelectGateway = (gwName) => {
    setSelectedGateway(gwName);
    const matchAdmin = adminGateways.find((g) => g.name === gwName || g.id === gwName);
    if (matchAdmin) {
      setGatewayTag(matchAdmin.tag || matchAdmin.phone || '');
      return;
    }
    const matchPreset = GATEWAY_FALLBACK_PRESETS.find((g) => g.name === gwName);
    if (matchPreset) {
      setGatewayTag(matchPreset.defaultTag);
    }
  };

  // Check existing game account credentials for this player and selected game
  useEffect(() => {
    if (!playerEmail || !selectedGameTitle || !isOpen) return;

    let isMounted = true;
    fetch(`/api/game-accounts?email=${encodeURIComponent(playerEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.gameAccounts)) {
          const match = data.gameAccounts.find(
            (acc) => acc.gameTitle?.toLowerCase() === selectedGameTitle?.toLowerCase()
          );
          if (match) {
            setGameUsername(match.username || '');
            setGamePassword(match.password || '');
            setIsExistingAccount(true);
          } else {
            setIsExistingAccount(false);
            generateNewCredentials();
          }
        } else {
          setIsExistingAccount(false);
          generateNewCredentials();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error checking game credentials:', err);
        generateNewCredentials();
      })
      .finally(() => {
        if (isMounted) setCheckingAccount(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playerEmail, selectedGameTitle, isOpen, generateNewCredentials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const amt = parseFloat(depositAmount);
    const coins = parseFloat(coinsLoaded);

    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid deposit amount ($5+).');
      return;
    }

    if (isNaN(coins) || coins <= 0) {
      setErrorMsg('Please enter a valid coins amount.');
      return;
    }

    if (!selectedGameTitle) {
      setErrorMsg('Please select a casino game.');
      return;
    }

    if (!gameUsername || !gamePassword) {
      setErrorMsg('Please enter or generate the player\'s game username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/chat-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: playerEmail,
          depositAmount: amt,
          gateway: selectedGateway,
          gatewayTag,
          senderTag,
          gameTitle: selectedGameTitle,
          coinsLoaded: coins,
          bonusPercent: bonusPreset === 'halloween' ? 150 : (bonusPreset === '100' ? 100 : (bonusPreset === '50' ? 50 : 0)),
          bonusAmount: Math.max(0, coins - amt),
          gameUsername,
          gamePassword,
          createOrUpdateAccount: true,
          postToChat,
          note: paymentNote,
          adminEmail: adminUser?.email,
          adminName: adminUser?.name || 'Support Staff',
          adminRole: adminUser?.role || 'staff'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to process chat deposit.');
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while processing deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <PanelModalBackdrop onClose={onClose} zIndex={10050}>
      <div
        className="direct-chat-deposit-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0b0f1e 0%, #060913 100%)',
          border: '1.5px solid rgba(255, 200, 0, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 200, 0, 0.15)',
          borderRadius: '18px',
          width: '94%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#fff',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 200, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ffc800 0%, #ff7518 100%)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 900,
              boxShadow: '0 0 15px rgba(255, 200, 0, 0.4)'
            }}>
              <i className="fa-solid fa-bolt" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                Process Live Chat Deposit & Load Coins
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Directly confirm player payment, credit game coins, and issue game credentials in chat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Player Banner */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.2rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--cyan-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}>
                <i className="fa-solid fa-user" />
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                  {playerName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {playerEmail}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {playerClaimedBonus && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 117, 24, 0.22) 0%, rgba(147, 51, 234, 0.22) 100%)',
                  border: '1px solid rgba(255, 117, 24, 0.55)',
                  color: '#ff9d42',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span>🎃 Claimed: {playerClaimedBonus.name} (+{playerClaimedBonus.bonusPercent}%)</span>
                </div>
              )}
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: '#4ade80',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}>
                Active in Chat
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Payment Received */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>1. Payment Details Received</span>
              </div>

              {/* Amount Inputs & Quick Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Deposit Amount ($) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)', fontWeight: 800 }}>$</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={depositAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2rem',
                        background: 'rgba(0, 0, 0, 0.55)',
                        border: '1.5px solid rgba(255, 200, 0, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 800,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Payment Gateway *
                  </label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => handleSelectGateway(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(0, 0, 0, 0.55)',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {adminGateways.length > 0 ? (
                      adminGateways.map((g) => (
                        <option key={g.id || g.name} value={g.name} style={{ background: '#0b0f1e', color: '#fff' }}>
                          {g.name} {g.tag ? `— (${g.tag})` : (g.phone ? `— (${g.phone})` : '')}
                        </option>
                      ))
                    ) : (
                      GATEWAY_FALLBACK_PRESETS.map((g) => (
                        <option key={g.name} value={g.name} style={{ background: '#0b0f1e', color: '#fff' }}>
                          {g.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {['10', '20', '50', '100', '200'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAmountChange(chip)}
                    style={{
                      background: depositAmount === chip ? 'rgba(255, 200, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: depositAmount === chip ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: depositAmount === chip ? 'var(--gold-primary)' : '#cbd5e1',
                      borderRadius: '6px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ${chip}
                  </button>
                ))}
              </div>

              {/* Gateway Tag & Sender Ref */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Received On Tag / Account (Company)
                    </label>
                    {gatewayTag && (
                      <span style={{ fontSize: '0.67rem', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <i className="fa-solid fa-circle-check" /> Auto-populated
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={gatewayTag}
                    onChange={(e) => setGatewayTag(e.target.value)}
                    placeholder="e.g. $WinningHeavenVIP"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#00f0ff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Player Sender Tag / Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderTag}
                    onChange={(e) => setSenderTag(e.target.value)}
                    placeholder="e.g. $JohnDoe / Ref# 9382"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Game Platform & Coins Loading */}
            <div style={{
              marginBottom: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff7518', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>2. Select Game Platform & Coins to Credit</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Target Game Platform *
                  </label>
                  <select
                    value={selectedGameTitle}
                    onChange={(e) => setSelectedGameTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(0, 0, 0, 0.55)',
                      border: '1.5px solid rgba(255, 117, 24, 0.35)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {games.map((g) => (
                      <option key={g.id || g.title} value={g.title} style={{ background: '#0b0f1e', color: '#fff' }}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Bonus Match
                  </label>
                  <select
                    value={bonusPreset}
                    onChange={(e) => handleBonusPresetChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(0, 0, 0, 0.55)',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#ffa200',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="halloween" style={{ background: '#0b0f1e', color: '#ff7518' }}>
                      🎃 {playerClaimedBonus?.bonusPercent ? `${playerClaimedBonus.bonusPercent}% ${playerClaimedBonus.name || 'Halloween'} (Claimed)` : '150% Halloween Match'}
                    </option>
                    <option value="100" style={{ background: '#0b0f1e', color: '#ffc800' }}>100% Match (Double Coins)</option>
                    <option value="50" style={{ background: '#0b0f1e', color: '#fff' }}>50% Reload Bonus</option>
                    <option value="none" style={{ background: '#0b0f1e', color: '#fff' }}>No Bonus (1:1)</option>
                    <option value="custom" style={{ background: '#0b0f1e', color: '#fff' }}>Custom Bonus Amount ($)</option>
                  </select>
                </div>
              </div>

              {/* Total Coins Loaded Field */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 200, 0, 0.1) 0%, rgba(255, 117, 24, 0.1) 100%)',
                border: '1.5px solid rgba(255, 200, 0, 0.35)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>
                    🪙 TOTAL COINS TO LOAD ON GAME:
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Base: ${depositAmount || '0'} + Bonus Coins
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="number"
                    step="any"
                    value={coinsLoaded}
                    onChange={(e) => setCoinsLoaded(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '0.45rem 0.65rem',
                      background: '#000',
                      border: '1.5px solid var(--gold-primary)',
                      borderRadius: '8px',
                      color: 'var(--gold-primary)',
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)' }}>COINS</span>
                </div>
              </div>
            </div>

            {/* Step 3: Game Credentials */}
            <div style={{
              marginBottom: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>3. Player Game Account Credentials</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                    background: isExistingAccount ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                    color: isExistingAccount ? '#4ade80' : 'var(--cyan-primary)',
                    border: isExistingAccount ? '1px solid #22c55e' : '1px solid rgba(0, 240, 255, 0.3)'
                  }}>
                    {checkingAccount ? 'Checking...' : (isExistingAccount ? '✓ Existing Account' : '+ New Account')}
                  </span>
                  <button
                    type="button"
                    onClick={generateNewCredentials}
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                    title="Generate Random Credentials"
                  >
                    <i className="fa-solid fa-arrows-rotate" />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Game Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                    placeholder="Game username"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Game Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={gamePassword}
                    onChange={(e) => setGamePassword(e.target.value)}
                    placeholder="Game password"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Receipt in Chat */}
            <div style={{
              marginBottom: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={postToChat}
                  onChange={(e) => setPostToChat(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  Send Instant Confirmation Receipt to Player in Live Support Chat
                </span>
              </label>

              {postToChat && (
                <div style={{
                  marginTop: '0.65rem',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  fontFamily: 'monospace'
                }}>
                  <div style={{ color: '#4ade80', fontWeight: 800 }}>Preview Message:</div>
                  <div>🎉 DEPOSIT & GAME CREDITS CONFIRMED!</div>
                  <div>💵 ${parseFloat(depositAmount || 0).toFixed(2)} via {selectedGateway} {gatewayTag ? `(${gatewayTag})` : ''}</div>
                  <div>🎮 Game: {selectedGameTitle || 'Game'}</div>
                  <div>🪙 Loaded: {coinsLoaded} Coins</div>
                  <div>🔑 Username: {gameUsername} | Password: {gamePassword}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.5rem'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #ffc800 0%, #ff7518 100%)',
                  border: 'none',
                  color: '#000',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 18px rgba(255, 200, 0, 0.35)',
                  filter: submitting ? 'opacity(0.7)' : 'none'
                }}
              >
                <i className={submitting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check-double"} />
                <span>
                  {submitting ? 'Confirming...' : `Confirm Deposit ($${depositAmount || '0'} ➔ ${coinsLoaded} Coins)`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PanelModalBackdrop>
  );
}
