'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImageFile } from '../../lib/imageCompress';
import SearchableGameSelect from './SearchableGameSelect';
import useSWR from 'swr';
import { getDepositBasedMinWithdraw, getDepositWithdrawRule, findLastSuccessDeposit } from '../../lib/withdrawRules';
import { cleanErrorMessage } from '../../lib/safeFetch';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function PlayerWithdrawPage({
  userEmail,
  gateways = [],
  games = [],
  transactions = [],
  onSubmitTransaction,
  showToast,
  onBack,
  defaultGameTitle = '',
  frontendSettings
}) {
  const [amount, setAmount] = useState('');
  const [targetGameTitle, setTargetGameTitle] = useState(() => defaultGameTitle || games[0]?.title || '');
  const [prevDefaultTitle, setPrevDefaultTitle] = useState(defaultGameTitle);
  if (defaultGameTitle !== prevDefaultTitle) {
    setPrevDefaultTitle(defaultGameTitle);
    if (defaultGameTitle) {
      setTargetGameTitle(defaultGameTitle);
    }
  }

  // Fetch gateways dynamically if gateways prop is not yet passed or empty
  const { data: directGatewaysData } = useSWR(!gateways || gateways.length === 0 ? '/api/gateways' : null, fetcher);
  const allGateways = (gateways && gateways.length > 0) ? gateways : (directGatewaysData?.gateways || []);

  // Filter ONLY gateways configured by admin for cashout
  // (User request: "or cashout ky liye jo method peechy sy hum ny admin panel sy rakah ha bs wohi show ho")
  const cashoutGateways = React.useMemo(() => {
    if (!allGateways || allGateways.length === 0) return [];
    const enabled = allGateways.filter((g) => g.isWithdrawActive === true);
    return enabled.length > 0 ? enabled : allGateways;
  }, [allGateways]);

  const [selectedGateway, setSelectedGateway] = useState(() => cashoutGateways[0] || null);

  useEffect(() => {
    if (cashoutGateways.length > 0) {
      const match = cashoutGateways.find((g) => (g.id || g._id || g.name) === (selectedGateway?.id || selectedGateway?._id || selectedGateway?.name));
      if (!match) {
        setSelectedGateway(cashoutGateways[0]);
      }
    }
  }, [cashoutGateways, selectedGateway]);

  const payoutMethod = selectedGateway?.name || 'Cash App';
  const [recipientTag, setRecipientTag] = useState('');
  const [nameOnTag, setNameOnTag] = useState('');
  const [phoneOnTag, setPhoneOnTag] = useState('');
  const [emailOnTag, setEmailOnTag] = useState('');
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [tagQrScreenshot, setTagQrScreenshot] = useState('');
  const [uploadingGameShot, setUploadingGameShot] = useState(false);
  const [uploadingTagQr, setUploadingTagQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const gameShotInputRef = useRef(null);
  const tagQrInputRef = useRef(null);

  const { data: feData } = useSWR('/api/settings/frontend', fetcher);
  const activeSettings = React.useMemo(() => {
    return frontendSettings?.settings || frontendSettings || feData?.settings || {};
  }, [frontendSettings, feData]);

  const freeplayMin = Number(activeSettings?.freeplayMinWithdraw ?? 30);

  const sortedTx = React.useMemo(() => {
    return [...(transactions || [])].sort((a, b) => {
      if (a.id && b.id) return parseFloat(b.id) - parseFloat(a.id);
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });
  }, [transactions]);

  const lastFreeplay = React.useMemo(() => {
    return sortedTx.find(
      (t) => t.type === 'BONUS' && (t.code === 'SIGNUP-FREE3' || t.code === 'FREEPLAY') && t.status === 'SUCCESS'
    );
  }, [sortedTx]);

  const isFreeplaySession = React.useMemo(() => {
    if (!lastFreeplay) return false;
    const isAfter = (t, anchor) => {
      if (t.id && anchor.id) return parseFloat(t.id) > parseFloat(anchor.id);
      return new Date(t.date || t.createdAt || 0).getTime() > new Date(anchor.date || anchor.createdAt || 0).getTime();
    };
    const hasDepositAfter = sortedTx.some((t) => t.type === 'DEPOSIT' && t.status === 'SUCCESS' && isAfter(t, lastFreeplay));
    const hasFreeplayWithdrawAfter = sortedTx.some((t) => t.type === 'WITHDRAW' && t.isFreeplayWithdraw && isAfter(t, lastFreeplay));
    return !hasDepositAfter && !hasFreeplayWithdrawAfter;
  }, [lastFreeplay, sortedTx]);

  const lastDeposit = React.useMemo(() => {
    return findLastSuccessDeposit(sortedTx, { userEmail, gameTitle: targetGameTitle });
  }, [sortedTx, userEmail, targetGameTitle]);

  const calculatedMinWithdraw = React.useMemo(() => {
    if (isFreeplaySession) return freeplayMin;
    if (lastDeposit) {
      return getDepositBasedMinWithdraw(lastDeposit.amount);
    }
    return 20;
  }, [isFreeplaySession, freeplayMin, lastDeposit]);

  const depositRule = React.useMemo(() => {
    if (isFreeplaySession) return null;
    return getDepositWithdrawRule(lastDeposit?.amount);
  }, [isFreeplaySession, lastDeposit]);

  const handleGameShotChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGameShot(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 900, quality: 0.55 });
      if (compressed) {
        setGameScreenshot(compressed);
        if (showToast) showToast('Game balance screenshot attached!', 'success');
      } else {
        throw new Error('Image compression returned empty');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to attach screenshot. Please try another image.', 'error');
    } finally {
      setUploadingGameShot(false);
      if (gameShotInputRef.current) gameShotInputRef.current.value = '';
    }
  };

  const handleTagQrChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTagQr(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 900, quality: 0.55 });
      if (compressed) {
        setTagQrScreenshot(compressed);
        if (showToast) showToast('Receiving QR proof attached!', 'success');
      } else {
        throw new Error('Image compression returned empty');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to attach QR code.', 'error');
    } finally {
      setUploadingTagQr(false);
      if (tagQrInputRef.current) tagQrInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetGameTitle) {
      if (showToast) showToast('Please select a game platform to cashout from.', 'error');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || isNaN(numAmt) || numAmt <= 0) {
      if (showToast) showToast('Please enter a valid cashout amount.', 'error');
      return;
    }
    if (numAmt < calculatedMinWithdraw) {
      if (showToast) showToast(`Minimum cashout amount for this session is $${calculatedMinWithdraw.toFixed(2)}.`, 'error');
      return;
    }
    if (selectedGateway?.requireTag !== false && !recipientTag.trim()) {
      if (showToast) showToast(`Please provide your receiving ${payoutMethod} account tag or address.`, 'error');
      return;
    }
    if (selectedGateway?.requireNameOnTag && !nameOnTag.trim()) {
      if (showToast) showToast(`Please provide the account holder name for ${payoutMethod}.`, 'error');
      return;
    }
    if (selectedGateway?.requirePhoneOnTag && !phoneOnTag.trim()) {
      if (showToast) showToast(`Please provide the phone number for ${payoutMethod}.`, 'error');
      return;
    }
    if (selectedGateway?.requireEmailOnTag && !emailOnTag.trim()) {
      if (showToast) showToast(`Please provide the email address for ${payoutMethod}.`, 'error');
      return;
    }
    if (!gameScreenshot) {
      if (showToast) showToast('Game balance screenshot is required to verify your winnings.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitTransaction({
        amount: numAmt,
        type: 'WITHDRAW',
        gameTitle: targetGameTitle,
        gateway: payoutMethod,
        code: recipientTag.trim(),
        nameOnTag: nameOnTag.trim() || undefined,
        phoneOnTag: phoneOnTag.trim() || undefined,
        emailOnTag: emailOnTag.trim() || undefined,
        isFreeplayWithdraw: isFreeplaySession,
        screenshot: gameScreenshot,
        payoutQr: tagQrScreenshot || undefined
      });
      if (showToast) showToast('Cashout request submitted successfully! Processing in 5-15 mins.', 'success');
      if (onBack) onBack();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Failed to submit withdrawal request.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="withdraw-page-wrapper">
      {/* Header Bar */}
      <div className="withdraw-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={onBack}
            className="btn-back-lobby"
            title="Return to Game Lobby"
          >
            <i className="fa-solid fa-arrow-left" /> Back to Lobby
          </button>
          <div className="withdraw-badge-glow">
            <i className="fa-solid fa-bolt" /> 24/7 LIGHTNING CASHOUT DESK
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Processed within <strong style={{ color: '#00e676' }}>5 - 15 minutes</strong> 24/7
        </div>
      </div>

      {/* Freeplay Notice Banner if applicable */}
      {isFreeplaySession && (
        <div className="freeplay-notice-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="freeplay-icon">
              <i className="fa-solid fa-gift" />
            </div>
            <div>
              <div style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.92rem' }}>
                Active Freeplay Bonus Session
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                You are cashing out from your freeplay bonus winnings. Minimum withdrawal is <strong>${freeplayMin.toFixed(2)}</strong>.
              </div>
            </div>
          </div>
          <span className="freeplay-pill">FREEPLAY CASHOUT</span>
        </div>
      )}

      {/* Main Cashout Console Form */}
      <form onSubmit={handleSubmit} className="withdraw-card-main">
        {/* LEFT COLUMN: Game Dropdown, Amount Input, Payout Method */}
        <div className="withdraw-card-left-col">
          <div>
            <h2 className="section-title">
              <i className="fa-solid fa-wallet gold-gradient-text" /> 24/7 Player Cashout Request
            </h2>
            <p className="section-subtitle">
              Instant payout direct to your selected payout method.
            </p>
          </div>

          {/* 1. Game Platform Selection (Compact Searchable Dropdown) */}
          <div className="withdraw-section-block">
            <SearchableGameSelect
              games={games}
              selectedGameTitle={targetGameTitle}
              onSelectGame={setTargetGameTitle}
              label="1. SELECT GAME PLATFORM TO CASHOUT FROM *"
              theme="cyan"
            />
          </div>

          {/* 2. Amount Input with Live Limit Badge */}
          <div className="withdraw-section-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="input-label" style={{ margin: 0 }}>2. ENTER CASHOUT AMOUNT (USD) *</label>
              <span className="min-cashout-badge">
                Min: ${calculatedMinWithdraw.toFixed(2)}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <span className="dollar-prefix">$</span>
              <input
                type="number"
                step="any"
                min={calculatedMinWithdraw}
                required
                placeholder={`Min $${calculatedMinWithdraw.toFixed(2)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="custom-amt-input"
              />
            </div>

            {depositRule && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Based on your last deposit of ${parseFloat(lastDeposit?.amount || 0).toFixed(2)}, min cashout rule applies.
              </div>
            )}
          </div>

          {/* 3. Payout Method Selector */}
          <div className="withdraw-section-block">
            <label className="input-label">3. CHOOSE RECEIVING PAYOUT APP / METHOD *</label>
            {cashoutGateways.length === 0 ? (
              <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                No cashout gateways configured in Admin panel yet.
              </div>
            ) : (
              <div className="payout-methods-grid">
                {cashoutGateways.map((gt) => {
                  const isSelected = (selectedGateway?.id || selectedGateway?._id || selectedGateway?.name) === (gt.id || gt._id || gt.name);
                  const theme = (gt.theme || gt.name || '').toLowerCase();
                  let iconClass = 'fa-solid fa-credit-card';
                  if (theme.includes('cashapp') || theme.includes('cash app')) iconClass = 'fa-solid fa-dollar-sign';
                  else if (theme.includes('chime')) iconClass = 'fa-solid fa-building-columns';
                  else if (theme.includes('zelle')) iconClass = 'fa-solid fa-bolt';
                  else if (theme.includes('crypto') || theme.includes('btc') || theme.includes('bitcoin')) iconClass = 'fa-brands fa-bitcoin';
                  else if (theme.includes('venmo')) iconClass = 'fa-brands fa-vimeo-v';
                  else if (theme.includes('paypal')) iconClass = 'fa-brands fa-paypal';
                  else if (theme.includes('stripe') || theme.includes('card')) iconClass = 'fa-solid fa-credit-card';

                  return (
                    <button
                      key={gt.id || gt._id || gt.name}
                      type="button"
                      onClick={() => setSelectedGateway(gt)}
                      className={`payout-method-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <i className={iconClass} />
                      <span>{gt.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Recipient Tag, Name, Screenshot Uploads & Submit */}
        <div className="withdraw-card-right-col">
          <div className="recipient-details-box">
            {/* Handle / Tag Details Input */}
            <div>
              <label className="input-label">
                4. YOUR {payoutMethod.toUpperCase()} {
                  (selectedGateway?.theme || '').toLowerCase() === 'crypto'
                    ? 'WALLET ADDRESS'
                    : (selectedGateway?.theme || '').toLowerCase() === 'cashapp'
                      ? 'CASHTAG ($TAG)'
                      : (selectedGateway?.theme || '').toLowerCase() === 'chime'
                        ? 'CHIME SIGN / HANDLE'
                        : (selectedGateway?.theme || '').toLowerCase() === 'zelle'
                          ? 'ZELLE EMAIL / PHONE'
                          : 'HANDLE / RECIPIENT TAG'
                } {selectedGateway?.requireTag !== false ? '*' : '(OPTIONAL)'}
              </label>
              <input
                type="text"
                required={selectedGateway?.requireTag !== false}
                placeholder={
                  (selectedGateway?.theme || '').toLowerCase() === 'cashapp'
                    ? 'e.g. $your_cashtag'
                    : (selectedGateway?.theme || '').toLowerCase() === 'zelle'
                      ? 'e.g. email or phone registered on Zelle'
                      : (selectedGateway?.theme || '').toLowerCase() === 'chime'
                        ? 'e.g. $chimesign or registered phone'
                        : (selectedGateway?.theme || '').toLowerCase() === 'crypto'
                          ? 'e.g. BTC or USDT-TRC20 Wallet Address'
                          : `e.g. your ${payoutMethod} account username or tag`
                }
                value={recipientTag}
                onChange={(e) => setRecipientTag(e.target.value)}
                className="custom-amt-input"
                style={{ fontSize: '0.95rem', paddingLeft: '1rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedGateway?.requireEmailOnTag ? 'repeat(auto-fit, minmax(130px, 1fr))' : '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div>
                <label className="input-label">
                  NAME ON ACCOUNT {selectedGateway?.requireNameOnTag ? '*' : '(OPTIONAL)'}
                </label>
                <input
                  type="text"
                  required={Boolean(selectedGateway?.requireNameOnTag)}
                  placeholder="e.g. John Doe"
                  value={nameOnTag}
                  onChange={(e) => setNameOnTag(e.target.value)}
                  className="custom-amt-input"
                  style={{ fontSize: '0.85rem', paddingLeft: '0.85rem' }}
                />
              </div>

              <div>
                <label className="input-label">
                  PHONE NUMBER {selectedGateway?.requirePhoneOnTag ? '*' : '(OPTIONAL)'}
                </label>
                <input
                  type="text"
                  required={Boolean(selectedGateway?.requirePhoneOnTag)}
                  placeholder="e.g. +1 (555) 000-0000"
                  value={phoneOnTag}
                  onChange={(e) => setPhoneOnTag(e.target.value)}
                  className="custom-amt-input"
                  style={{ fontSize: '0.85rem', paddingLeft: '0.85rem' }}
                />
              </div>

              {selectedGateway?.requireEmailOnTag && (
                <div>
                  <label className="input-label">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. player@example.com"
                    value={emailOnTag}
                    onChange={(e) => setEmailOnTag(e.target.value)}
                    className="custom-amt-input"
                    style={{ fontSize: '0.85rem', paddingLeft: '0.85rem' }}
                  />
                </div>
              )}
            </div>

            {/* Screenshot Proof of Game Balance */}
            <div style={{ marginTop: '0.85rem' }}>
              <label className="input-label">5. ATTACH GAME BALANCE SCREENSHOT *</label>
              <input
                type="file"
                ref={gameShotInputRef}
                accept="image/*"
                onChange={handleGameShotChange}
                style={{ display: 'none' }}
              />

              {gameScreenshot ? (
                <div className="proof-attached-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img src={gameScreenshot} alt="Game Balance Preview" className="proof-preview-thumb" />
                    <div>
                      <div style={{ color: '#00e676', fontWeight: 800, fontSize: '0.88rem' }}>✓ Game Screenshot Attached</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Balance verified for redemption</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGameScreenshot('')}
                    className="btn-glass-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--red-primary)' }}
                  >
                    &times; Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => gameShotInputRef.current?.click()}
                  className="btn-upload-dropzone"
                >
                  {uploadingGameShot ? (
                    <span><i className="fa-solid fa-spinner fa-spin" /> Processing Image...</span>
                  ) : (
                    <span><i className="fa-solid fa-camera cyan-gradient-text" style={{ fontSize: '1.35rem' }} /> Tap to Attach Game Balance Screenshot</span>
                  )}
                </button>
              )}
            </div>

            {/* Optional QR Screenshot */}
            <div style={{ marginTop: '0.85rem' }}>
              <label className="input-label">6. ATTACH CASHTAG / WALLET QR CODE (OPTIONAL)</label>
              <input
                type="file"
                ref={tagQrInputRef}
                accept="image/*"
                onChange={handleTagQrChange}
                style={{ display: 'none' }}
              />

              {tagQrScreenshot ? (
                <div className="proof-attached-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img src={tagQrScreenshot} alt="QR Preview" className="proof-preview-thumb" />
                    <div style={{ color: '#00e676', fontWeight: 800, fontSize: '0.88rem' }}>✓ Receiving QR Code Attached</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTagQrScreenshot('')}
                    className="btn-glass-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--red-primary)' }}
                  >
                    &times; Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => tagQrInputRef.current?.click()}
                  className="btn-glass-secondary"
                  style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  {uploadingTagQr ? (
                    <span><i className="fa-solid fa-spinner fa-spin" /> Uploading...</span>
                  ) : (
                    <span><i className="fa-solid fa-qrcode" /> + Attach Receiving QR Code (Optional)</span>
                  )}
                </button>
              )}
            </div>

            {/* Submit Action */}
            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={submitting || !gameScreenshot || !recipientTag}
                className="btn-cyan-glow proceed-btn"
                style={{ opacity: (submitting || !gameScreenshot || !recipientTag) ? 0.65 : 1 }}
              >
                {submitting ? (
                  <span><i className="fa-solid fa-spinner fa-spin" /> Submitting Request...</span>
                ) : (
                  <span>
                    <i className="fa-solid fa-paper-plane" /> SUBMIT CASHOUT REQUEST{' '}
                    {amount && !isNaN(parseFloat(amount)) ? `($${parseFloat(amount).toFixed(2)})` : ''}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        .withdraw-page-wrapper {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 0.5rem 0.5rem 2rem 0.5rem;
          box-sizing: border-box;
        }
        .withdraw-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(0, 240, 255, 0.2);
        }
        .btn-back-lobby {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 10px;
          padding: 0.45rem 0.95rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-back-lobby:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--cyan-primary);
        }
        .withdraw-badge-glow {
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid var(--cyan-primary);
          color: var(--cyan-primary);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .freeplay-notice-banner {
          background: linear-gradient(135deg, rgba(255, 200, 0, 0.12) 0%, rgba(6, 9, 22, 0.9) 100%);
          border: 1.5px solid var(--gold-primary);
          border-radius: 16px;
          padding: 0.95rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .freeplay-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 200, 0, 0.25);
          border: 1px solid var(--gold-primary);
          color: var(--gold-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .freeplay-pill {
          background: var(--gold-primary);
          color: #000;
          font-weight: 900;
          font-size: 0.72rem;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
        }
        .withdraw-card-main {
          background: rgba(8, 12, 28, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(0, 240, 255, 0.3);
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 960px) {
          .withdraw-card-main {
            display: grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 1.75rem;
            align-items: start;
          }
          .withdraw-card-left-col {
            display: flex;
            flex-direction: column;
            gap: 1.35rem;
          }
          .withdraw-card-right-col {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
        }
        .withdraw-section-block {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #fff;
          font-family: var(--font-heading);
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }
        .input-label {
          display: block;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .min-cashout-badge {
          font-size: 0.72rem;
          color: var(--cyan-primary);
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.3);
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-weight: 800;
        }
        .dollar-prefix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--cyan-primary);
          font-size: 1.15rem;
          font-weight: 800;
        }
        .custom-amt-input {
          width: 100%;
          background: #060914;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 0.75rem 1rem 0.75rem 2.2rem;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .custom-amt-input:focus {
          border-color: var(--cyan-primary);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
        }
        .payout-methods-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        @media (max-width: 640px) {
          .payout-methods-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .payout-method-btn {
          background: rgba(14, 18, 38, 0.85);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          border-radius: 12px;
          padding: 0.65rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: all 0.18s ease;
        }
        .payout-method-btn:hover {
          border-color: var(--cyan-primary);
          background: rgba(20, 26, 54, 0.95);
        }
        .payout-method-btn.selected {
          border-color: var(--cyan-primary);
          background: rgba(0, 240, 255, 0.14);
          color: var(--cyan-primary);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.25);
        }
        .recipient-details-box {
          background: rgba(12, 16, 38, 0.85);
          border: 1.5px solid rgba(0, 240, 255, 0.25);
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .proof-attached-card {
          background: rgba(0, 230, 118, 0.08);
          border: 1px solid rgba(0, 230, 118, 0.35);
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .proof-preview-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #00e676;
        }
        .btn-upload-dropzone {
          width: 100%;
          background: rgba(6, 9, 22, 0.7);
          border: 1.5px dashed rgba(0, 240, 255, 0.35);
          border-radius: 12px;
          padding: 1.15rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }
        .btn-upload-dropzone:hover {
          border-color: var(--cyan-primary);
          color: #fff;
          background: rgba(14, 18, 42, 0.9);
        }
        .btn-glass-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .btn-glass-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .btn-cyan-glow {
          background: var(--cyan-primary);
          color: #000;
          font-weight: 900;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(0, 240, 255, 0.4);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .btn-cyan-glow:hover {
          box-shadow: 0 6px 25px rgba(0, 240, 255, 0.7);
        }
        .proceed-btn {
          width: 100%;
          padding: 0.95rem;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
