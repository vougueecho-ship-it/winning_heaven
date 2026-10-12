'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImageFile } from '../../lib/imageCompress';
import SearchableGameSelect from './SearchableGameSelect';
import {
  generateDepositNoteCode,
  readPendingDeposit,
  writePendingDeposit,
  clearPendingDeposit,
  remainingSeconds,
  pendingMatchesGame,
  DEPOSIT_CODE_TTL_MS
} from '../../lib/pendingDeposit';
import { cleanErrorMessage } from '../../lib/safeFetch';

const getCurrentTime = () => (typeof window !== 'undefined' ? Date.now() : 0);

export default function PlayerDepositPage({
  userEmail,
  gateways = [],
  games = [],
  transactions = [],
  onSubmitTransaction,
  showToast,
  onBack,
  defaultGameTitle = ''
}) {
  // Lazy initial state restored from localStorage
  const [pendingRestored] = useState(() => {
    if (typeof window === 'undefined' || !userEmail) return null;
    const pending = readPendingDeposit(userEmail);
    if (pending && remainingSeconds(pending.expiresAt) > 0) return pending;
    return null;
  });

  const [amount, setAmount] = useState(() => (pendingRestored?.amount ? String(pendingRestored.amount) : '25'));
  const [targetGameTitle, setTargetGameTitle] = useState(
    () => defaultGameTitle || pendingRestored?.gameTitle || games[0]?.title || ''
  );
  const [selectedGateway, setSelectedGateway] = useState(() => pendingRestored?.gateway || gateways[0] || null);
  const [noteCode, setNoteCode] = useState(() => pendingRestored?.noteCode || generateDepositNoteCode());
  const [senderTag, setSenderTag] = useState(() => pendingRestored?.senderTag || '');
  const [screenshot, setScreenshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoomedQr, setZoomedQr] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => (pendingRestored?.expiresAt ? remainingSeconds(pendingRestored.expiresAt) : 600));
  const fileInputRef = useRef(null);

  // If initial default game title changes, keep it synced
  useEffect(() => {
    if (defaultGameTitle) {
      setTargetGameTitle(defaultGameTitle);
    }
  }, [defaultGameTitle]);

  // Ensure an initial gateway is selected
  useEffect(() => {
    if (gateways?.length > 0 && !selectedGateway) {
      setSelectedGateway(gateways[0]);
    }
  }, [gateways, selectedGateway]);

  const availableHoldTxs = React.useMemo(() => {
    return (transactions || []).filter((tx) =>
      ['WITHDRAW', 'COMMISSION_WITHDRAW', 'AFFILIATE_COMMISSION_WITHDRAW'].includes((tx.type || '').toUpperCase()) &&
      (tx.status === 'SUCCESS' || tx.status === 'APPROVED') &&
      parseFloat(tx.payoutHold || 0) > 0 &&
      tx.remainderPaid !== true
    );
  }, [transactions]);

  const totalAvailableHold = React.useMemo(() => {
    return availableHoldTxs.reduce((sum, tx) => sum + parseFloat(tx.payoutHold || 0), 0);
  }, [availableHoldTxs]);

  // Countdown timer for note code
  useEffect(() => {
    if (!noteCode) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearPendingDeposit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [noteCode]);

  // Persist pending deposit
  useEffect(() => {
    if (userEmail && selectedGateway && noteCode) {
      writePendingDeposit({
        userEmail,
        gameTitle: targetGameTitle,
        amount: parseFloat(amount) || 0,
        gateway: selectedGateway,
        noteCode,
        senderTag,
        expiresAt: getCurrentTime() + (timeLeft > 0 ? timeLeft * 1000 : DEPOSIT_CODE_TTL_MS)
      });
    }
  }, [userEmail, targetGameTitle, amount, selectedGateway, noteCode, senderTag, timeLeft]);

  const handleSelectGateway = (g) => {
    setSelectedGateway(g);
    const pending = readPendingDeposit(userEmail);
    const reuse = pending && pendingMatchesGame(pending, targetGameTitle) && remainingSeconds(pending.expiresAt) > 0;
    const code = reuse ? pending.noteCode : generateDepositNoteCode();
    const currentTime = getCurrentTime();
    const expiresAt = reuse ? pending.expiresAt : currentTime + DEPOSIT_CODE_TTL_MS;
    const left = remainingSeconds(expiresAt);

    setNoteCode(code);
    setTimeLeft(left);

    writePendingDeposit({
      userEmail,
      gameTitle: targetGameTitle,
      amount: parseFloat(amount) || 0,
      gateway: g,
      noteCode: code,
      senderTag,
      expiresAt
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 900, quality: 0.55 });
      if (compressed) {
        setScreenshot(compressed);
        if (showToast) showToast('Screenshot proof attached successfully!', 'success');
      } else {
        throw new Error('Could not process image');
      }
    } catch (err) {
      console.error('Deposit screenshot error:', err);
      if (showToast) showToast('Failed to process image file. Please try another image.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRegenerateCode = () => {
    clearPendingDeposit();
    const newCode = generateDepositNoteCode();
    const newExpiresAt = getCurrentTime() + DEPOSIT_CODE_TTL_MS;
    setNoteCode(newCode);
    setTimeLeft(600);

    if (userEmail && selectedGateway) {
      writePendingDeposit({
        userEmail,
        gameTitle: targetGameTitle,
        amount: parseFloat(amount) || 0,
        gateway: selectedGateway,
        noteCode: newCode,
        senderTag,
        expiresAt: newExpiresAt
      });
    }
    if (showToast) showToast(`Fresh memo code "${newCode}" generated! Valid for 10 minutes.`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetGameTitle) {
      if (showToast) showToast('Please select a game platform.', 'error');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt < 5) {
      if (showToast) showToast('Minimum deposit amount is $5.00.', 'error');
      return;
    }
    if (!selectedGateway) {
      if (showToast) showToast('Please select a payment method.', 'error');
      return;
    }
    if (timeLeft <= 0) {
      if (showToast) showToast('Note code has expired. Please tap "Refresh Code" to generate a valid code.', 'error');
      return;
    }
    if (!senderTag.trim()) {
      if (showToast) showToast('Please enter your sender tag/account name used to send payment.', 'error');
      return;
    }
    if (!screenshot) {
      if (showToast) showToast('Payment screenshot receipt is required for deposit verification.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitTransaction({
        amount: numAmt,
        type: 'DEPOSIT',
        gameTitle: targetGameTitle,
        gateway: selectedGateway?.name || 'Payment Gateway',
        gatewayName: selectedGateway?.name || 'Payment Gateway',
        noteCode,
        senderTag: senderTag.trim(),
        senderName: senderTag.trim(),
        screenshot
      });
      clearPendingDeposit();
      if (showToast) showToast('Deposit submitted successfully! Processing in 2-5 minutes.', 'success');
      if (onBack) onBack();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Deposit submission failed.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositFromHold = async () => {
    if (!targetGameTitle || !targetGameTitle.trim()) {
      if (showToast) showToast('Please select a platform game to deposit coins into.', 'error');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      if (showToast) showToast('Please enter a valid deposit amount.', 'error');
      return;
    }
    if (numAmt > totalAvailableHold) {
      if (showToast) showToast(`Deposit amount ($${numAmt.toFixed(2)}) exceeds available cashout hold ($${totalAvailableHold.toFixed(2)}).`, 'error');
      return;
    }

    const parentTx = availableHoldTxs[0];
    setSubmitting(true);
    try {
      await onSubmitTransaction({
        amount: numAmt,
        type: 'DEPOSIT',
        gameTitle: targetGameTitle,
        isDepositFromCashout: true,
        parentTxId: parentTx?.id,
        note: `Added deposit from remaining cashout ($${numAmt.toFixed(2)})`
      });
      if (showToast) showToast(`Deposit of $${numAmt.toFixed(2)} from cashout hold submitted!`, 'success');
      if (onBack) onBack();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Deposit from cashout failed.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');

  // Compute recipient tag and payUrl
  const rawTag = (selectedGateway?.accountNumber || selectedGateway?.recipientTag || selectedGateway?.tag || selectedGateway?.handle || selectedGateway?.accountName || '').trim();
  const isTagAUrl = rawTag.startsWith('http://') || rawTag.startsWith('https://');
  const isGenericPlaceholder = isTagAUrl || ['stripe-checkout', 'stripe-pay', 'cashapp-pay', 'none', 'n/a'].includes(rawTag.toLowerCase());

  let payUrl = (selectedGateway?.redirectUrl || selectedGateway?.payUrl || selectedGateway?.link || '').trim();
  if (!payUrl && isTagAUrl) {
    payUrl = rawTag;
  }

  const nameLower = (selectedGateway?.name || '').toLowerCase();
  const themeLower = (selectedGateway?.theme || '').toLowerCase();
  const isCashApp = themeLower === 'cashapp' || nameLower.includes('cash app') || nameLower.includes('cashapp');
  const isStripe = themeLower === 'stripe' || nameLower.includes('stripe');

  if (isCashApp && !payUrl && rawTag && !isGenericPlaceholder) {
    const cleanCashtag = rawTag.replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanCashtag) {
      const amtNum = parseFloat(amount || 0).toFixed(2);
      payUrl = `https://cash.app/$${cleanCashtag}/${amtNum}`;
    }
  }

  if (payUrl) {
    payUrl = payUrl
      .replace(/\{amount\}/gi, encodeURIComponent(amount || ''))
      .replace(/\{code\}/gi, encodeURIComponent(noteCode || ''))
      .replace(/\{note\}/gi, encodeURIComponent(noteCode || ''));
  }

  // QR Code Image source (supports all admin schema fields: qrImage, qrCode, qrCodeUrl, imageUrl, etc.)
  const gatewayQrImage = (
    selectedGateway?.qrImage ||
    selectedGateway?.qrCode ||
    selectedGateway?.qrCodeUrl ||
    selectedGateway?.imageUrl ||
    selectedGateway?.qr ||
    selectedGateway?.image
  );

  // Only show QR Code if an actual QR image was uploaded/configured by admin
  // (User requested: "jin ka qr code nai ha tu unka qr code show na ho")
  const displayQrSrc = (gatewayQrImage && typeof gatewayQrImage === 'string' && gatewayQrImage.trim()) ? gatewayQrImage.trim() : null;

  const handleOpenPayLink = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payUrl) return;
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: payUrl, presentationStyle: 'popover' });
        return;
      }
    } catch {}
    window.open(payUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQr = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!displayQrSrc) return;
    try {
      setDownloadingQr(true);
      const filename = `${(selectedGateway?.name || 'payment').toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      if (displayQrSrc.startsWith('data:image')) {
        const a = document.createElement('a');
        a.href = displayQrSrc;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(displayQrSrc);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      if (showToast) showToast('QR code downloaded successfully!', 'success');
    } catch (err) {
      const a = document.createElement('a');
      a.href = displayQrSrc;
      a.download = `${(selectedGateway?.name || 'payment').toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (showToast) showToast('Opening QR code image...', 'info');
    } finally {
      setDownloadingQr(false);
    }
  };

  const tagLabel = isCashApp
    ? 'CASH APP CASHTAG ($TAG)'
    : themeLower === 'zelle'
    ? 'ZELLE RECIPIENT'
    : themeLower === 'chime'
    ? 'CHIME HANDLE'
    : themeLower === 'crypto'
    ? 'CRYPTO WALLET ADDRESS'
    : 'RECIPIENT PAY TAG / PHONE / ACCOUNT';

  return (
    <div className="deposit-page-wrapper">
      {/* Top Header */}
      <div className="deposit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={onBack}
            className="btn-back-lobby"
            title="Return to Game Lobby"
          >
            <i className="fa-solid fa-arrow-left" /> Back to Lobby
          </button>
          <div className="deposit-badge-glow">
            <i className="fa-solid fa-bolt" /> 24/7 INSTANT COIN RELOAD
          </div>
        </div>

        <div className="deposit-fast-badge">
          <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--gold-primary)' }} />
          <span>Average Credit Time: <strong>2-5 Mins</strong></span>
        </div>
      </div>

      {/* Cashout Hold Alert Banner if applicable */}
      {totalAvailableHold > 0 && (
        <div className="hold-funds-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="hold-icon">
              <i className="fa-solid fa-vault" />
            </div>
            <div>
              <div style={{ color: '#00e676', fontWeight: 800, fontSize: '0.92rem' }}>
                Available Cashout Hold Balance: ${totalAvailableHold.toFixed(2)}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                You have approved cashout funds on hold. You can reload them directly into any game!
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDepositFromHold}
            disabled={submitting}
            className="btn-gold-glow"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-repeat" /> Reload from Hold (${parseFloat(amount || 0).toFixed(2)})
          </button>
        </div>
      )}

      {/* Main Single-Step Deposit Form */}
      <form onSubmit={handleSubmit} className="deposit-card-main">
        {/* LEFT COLUMN: Game Selection, Amount, Payment Method */}
        <div className="deposit-card-left-col">
          {/* 1. SELECT GAME PLATFORM (Searchable Dropdown) */}
          <div className="deposit-section-block game-select-block">
            <SearchableGameSelect
              games={games}
              selectedGameTitle={targetGameTitle}
              onSelectGame={setTargetGameTitle}
              label="1. SELECT DESTINATION GAME PLATFORM *"
              theme="gold"
            />
          </div>

          {/* 2. CHOOSE COIN RELOAD AMOUNT */}
          <div className="deposit-section-block">
            <label className="input-label">2. CHOOSE COIN RELOAD AMOUNT (USD) *</label>

            <div className="quick-amounts-grid">
              {['10', '25', '50', '100', '200', '500'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`quick-amt-btn ${amount === val ? 'selected' : ''}`}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', marginTop: '0.75rem' }}>
              <span className="dollar-prefix">$</span>
              <input
                type="number"
                min="5"
                step="1"
                required
                placeholder="Enter custom deposit amount (Min $5)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="custom-amt-input"
              />
            </div>
          </div>

          {/* 3. SELECT PAYMENT METHOD */}
          <div className="deposit-section-block">
            <label className="input-label">3. CHOOSE PAYMENT APP / METHOD *</label>

            <div className="gateways-grid">
              {gateways.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  Contact 24/7 support for direct manual payment instructions.
                </div>
              ) : (
                gateways.map((g) => {
                  const isSelected = selectedGateway && (selectedGateway.id === g.id || selectedGateway.name === g.name);
                  return (
                    <div
                      key={g.id || g._id || g.name}
                      onClick={() => handleSelectGateway(g)}
                      className={`gateway-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="gateway-avatar">
                        {g.name?.toLowerCase().includes('cash') ? (
                          <i className="fa-solid fa-dollar-sign" style={{ color: '#00d632' }} />
                        ) : g.name?.toLowerCase().includes('chime') ? (
                          <i className="fa-solid fa-building-columns" style={{ color: '#25c974' }} />
                        ) : g.name?.toLowerCase().includes('zelle') ? (
                          <i className="fa-solid fa-bolt" style={{ color: '#7414ca' }} />
                        ) : g.name?.toLowerCase().includes('crypto') ? (
                          <i className="fa-brands fa-bitcoin" style={{ color: '#f7931a' }} />
                        ) : (
                          <i className="fa-solid fa-credit-card" style={{ color: 'var(--gold-primary)' }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="gateway-name-text">{g.name}</div>
                        <div className="gateway-sub-text">{isSelected ? '✓ Ready' : 'Tap to pay'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Transfer Instructions & Confirmation */}
        {selectedGateway && (
          <div className="deposit-card-right-col">
            <div className="clean-payment-flow-card">
              {/* Header: Gateway Name + Status */}
              <div className="flow-card-header">
                <div>
                  <div className="flow-step-tag">TRANSFER INSTRUCTIONS</div>
                  <h3 className="flow-title">Send to {selectedGateway?.name}</h3>
                </div>
                <span className="gateway-badge-glow">{selectedGateway?.name?.toUpperCase()}</span>
              </div>

              {/* Direct 1-Click Pay App Button if pay link available */}
              {payUrl && (
                <button
                  type="button"
                  onClick={handleOpenPayLink}
                  className="btn-pay-direct-action"
                  style={{
                    background: isStripe ? 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)' : isCashApp ? 'linear-gradient(135deg, #00d632 0%, #009922 100%)' : 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                    color: isStripe ? '#fff' : '#000'
                  }}
                >
                  <i className={isStripe ? 'fa-brands fa-stripe' : isCashApp ? 'fa-solid fa-dollar-sign' : 'fa-solid fa-arrow-up-right-from-square'} />
                  <span>OPEN &amp; PAY ${parseFloat(amount || 0).toFixed(2)} ON {selectedGateway?.name?.toUpperCase()} &rarr;</span>
                </button>
              )}

              {/* Recipient Handle Row */}
              {rawTag && !isGenericPlaceholder && (
                <div className="clean-info-row">
                  <div className="info-text-col">
                    <span className="row-label">{tagLabel}</span>
                    <span className="row-value cyan-val">{rawTag}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rawTag);
                      if (showToast) showToast('Payment recipient handle copied!', 'success');
                    }}
                    className="btn-pill-copy"
                  >
                    <i className="fa-solid fa-copy" /> COPY TAG
                  </button>
                </div>
              )}

              {/* Payment Memo / Note Code Row with Timer */}
              <div className={`clean-info-row memo-highlight-row ${timeLeft <= 0 ? 'expired' : ''}`}>
                <div className="info-text-col">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="row-label">Payment Note / Memo Code</span>
                    <span className={`pill-timer-badge ${timeLeft <= 0 ? 'expired' : timeLeft < 120 ? 'urgent' : ''}`}>
                      <i className="fa-regular fa-clock" /> {timeLeft <= 0 ? 'EXPIRED' : `${minutes}:${seconds}`}
                    </span>
                  </div>
                  <span className="row-value gold-val note-val">{noteCode}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(noteCode);
                      if (showToast) showToast(`Note code "${noteCode}" copied!`, 'success');
                    }}
                    className="btn-pill-copy gold-glow"
                  >
                    <i className="fa-solid fa-copy" /> COPY NOTE
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="btn-refresh-mini"
                    title="Generate new active code"
                  >
                    <i className="fa-solid fa-arrows-rotate" />
                  </button>
                </div>
              </div>

              {/* QR Code Section with Direct DOWNLOAD Button */}
              {displayQrSrc && (
                <div className="qr-integrated-box">
                  <div
                    className="qr-canvas-wrap"
                    onClick={() => setZoomedQr(true)}
                    title="Tap to zoom QR Code"
                  >
                    <img
                      src={displayQrSrc}
                      alt={`${selectedGateway?.name} Payment QR`}
                      className="qr-img-canvas"
                    />
                    <span className="qr-zoom-hint"><i className="fa-solid fa-magnifying-glass-plus" /> Tap to zoom</span>
                  </div>

                  <div className="qr-details-wrap">
                    <div className="qr-details-title">
                      <i className="fa-solid fa-qrcode" style={{ color: 'var(--gold-primary)' }} />
                      <span>{selectedGateway?.name} QR Code</span>
                    </div>
                    <p className="qr-details-sub">
                      Scan in {selectedGateway?.name} app or download this QR image to your phone gallery.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={downloadingQr}
                      className="btn-download-qr-direct"
                    >
                      <i className={`fa-solid ${downloadingQr ? 'fa-spinner fa-spin' : 'fa-download'}`} />{' '}
                      {downloadingQr ? 'DOWNLOADING...' : 'DOWNLOAD QR CODE'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sender Tag Field */}
              <div className="clean-field-group">
                <label className="clean-field-label">YOUR SENDER $TAG / NAME ON PAYMENT APP *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $your_cashtag or sender account name"
                  value={senderTag}
                  onChange={(e) => setSenderTag(e.target.value)}
                  className="clean-field-input"
                />
              </div>

              {/* Payment Screenshot Receipt Upload */}
              <div className="clean-field-group">
                <label className="clean-field-label">PAYMENT SCREENSHOT RECEIPT *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {screenshot ? (
                  <div className="clean-proof-attached">
                    <img src={screenshot} alt="Receipt Preview" className="proof-thumb-preview" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#00e676', fontWeight: 800, fontSize: '0.85rem' }}>✓ Screenshot Receipt Attached</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Ready for automated verification</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-proof-action"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreenshot('')}
                        className="btn-proof-action red"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="clean-dropzone-button"
                  >
                    {uploading ? (
                      <span><i className="fa-solid fa-spinner fa-spin" /> Compressing Proof...</span>
                    ) : (
                      <span><i className="fa-solid fa-cloud-arrow-up gold-gradient-text" style={{ fontSize: '1.25rem' }} /> Tap to Attach Screenshot Receipt</span>
                    )}
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !screenshot || timeLeft <= 0}
                className="btn-gold-glow submit-deposit-action"
                style={{ opacity: (submitting || !screenshot || timeLeft <= 0) ? 0.65 : 1 }}
              >
                {submitting ? (
                  <span><i className="fa-solid fa-spinner fa-spin" /> Verifying Deposit...</span>
                ) : (
                  <span><i className="fa-solid fa-paper-plane" /> CONFIRM &amp; SUBMIT DEPOSIT (${parseFloat(amount || 0).toFixed(2)})</span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Lightbox Modal for enlarged QR Code */}
      {zoomedQr && displayQrSrc && (
        <div
          className="qr-lightbox-backdrop"
          onClick={() => setZoomedQr(false)}
        >
          <div
            className="qr-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-lightbox-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
                <i className="fa-solid fa-qrcode" style={{ color: 'var(--gold-primary)' }} />
                <span>{selectedGateway?.name} Payment QR</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedQr(false)}
                className="qr-lightbox-close"
                aria-label="Close zoomed QR"
              >
                &times;
              </button>
            </div>

            <div className="qr-lightbox-body">
              <img
                src={displayQrSrc}
                alt={`${selectedGateway?.name} QR Enlarged`}
                className="qr-lightbox-img"
              />
            </div>

            <div className="qr-lightbox-footer">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloadingQr}
                className="btn-gold-glow"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
              >
                <i className={`fa-solid ${downloadingQr ? 'fa-spinner fa-spin' : 'fa-download'}`} />{' '}
                {downloadingQr ? 'Downloading...' : 'Download QR'}
              </button>
              <button
                type="button"
                onClick={() => setZoomedQr(false)}
                className="btn-glass-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .deposit-page-wrapper {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 0.5rem 0.5rem 2rem 0.5rem;
          box-sizing: border-box;
        }
        .deposit-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 200, 0, 0.2);
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
          color: var(--gold-primary);
        }
        .deposit-badge-glow {
          font-size: 0.75rem;
          font-weight: 800;
          color: #00e676;
          background: rgba(0, 230, 118, 0.12);
          border: 1px solid rgba(0, 230, 118, 0.35);
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .deposit-fast-badge {
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .hold-funds-banner {
          background: rgba(0, 230, 118, 0.08);
          border: 1.5px solid rgba(0, 230, 118, 0.4);
          border-radius: 18px;
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .hold-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(0, 230, 118, 0.25);
          border: 1px solid #00e676;
          color: #00e676;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .deposit-card-main {
          background: rgba(8, 12, 28, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255, 200, 0, 0.25);
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 200, 0, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .deposit-card-left-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .deposit-card-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        @media (min-width: 960px) {
          .deposit-card-main {
            display: grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 1.75rem;
            align-items: start;
          }
          .deposit-card-left-col {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .deposit-card-right-col {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
        }
        .deposit-section-block {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .deposit-section-block.game-select-block {
          margin-bottom: 0.65rem;
        }
        .input-label {
          display: block;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        /* QUICK AMOUNTS */
        .quick-amounts-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.45rem;
        }
        @media (max-width: 640px) {
          .quick-amounts-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .quick-amt-btn {
          background: rgba(14, 18, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 10px;
          padding: 0.55rem 0.25rem;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .quick-amt-btn:hover {
          border-color: var(--gold-primary);
          color: var(--gold-primary);
        }
        .quick-amt-btn.selected {
          background: var(--gold-primary);
          color: #000;
          border-color: var(--gold-primary);
          box-shadow: 0 0 15px rgba(255, 200, 0, 0.4);
        }
        .dollar-prefix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gold-primary);
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
          border-color: var(--gold-primary);
          box-shadow: 0 0 15px rgba(255, 200, 0, 0.2);
        }
        .bonus-preview-card {
          background: rgba(255, 200, 0, 0.08);
          border: 1px dashed rgba(255, 200, 0, 0.35);
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bonus-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 200, 0, 0.2);
          color: var(--gold-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .badge-gold {
          background: rgba(255, 200, 0, 0.2);
          color: var(--gold-primary);
          border: 1px solid rgba(255, 200, 0, 0.4);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        /* GATEWAYS GRID */
        .gateways-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
          gap: 0.6rem;
        }
        .gateway-card {
          background: rgba(14, 18, 38, 0.85);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.6rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          cursor: pointer;
          transition: all 0.18s ease;
          user-select: none;
        }
        .gateway-card:hover {
          border-color: rgba(255, 200, 0, 0.4);
          transform: translateY(-2px);
          background: rgba(20, 26, 54, 0.95);
        }
        .gateway-card.selected {
          border-color: var(--gold-primary);
          background: rgba(255, 200, 0, 0.12);
          box-shadow: 0 0 16px rgba(255, 200, 0, 0.2);
        }
        .gateway-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .gateway-name-text {
          font-size: 0.82rem;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gateway-sub-text {
          font-size: 0.65rem;
          color: var(--gold-primary);
          font-weight: 700;
        }
        /* CLEAN STREAMLINED PAYMENT FLOW (NO NESTED BOXES) */
        .clean-payment-flow-card {
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
        }
        .flow-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(255, 200, 0, 0.2);
        }
        .flow-step-tag {
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: var(--gold-primary);
        }
        .flow-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0.15rem 0 0 0;
        }
        .gateway-badge-glow {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--gold-primary);
          background: rgba(255, 200, 0, 0.12);
          border: 1px solid rgba(255, 200, 0, 0.35);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
        }
        .btn-pay-direct-action {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 0.85rem;
          font-weight: 900;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
          transition: transform 0.18s ease;
        }
        .btn-pay-direct-action:hover {
          transform: translateY(-2px);
        }
        .clean-info-row {
          background: rgba(14, 18, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .clean-info-row.memo-highlight-row {
          border-color: rgba(255, 200, 0, 0.35);
          background: linear-gradient(135deg, rgba(22, 28, 58, 0.9) 0%, rgba(12, 16, 36, 0.9) 100%);
        }
        .clean-info-row.memo-highlight-row.expired {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(30, 10, 18, 0.9);
        }
        .info-text-col {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }
        .row-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .row-value {
          font-size: 1rem;
          font-weight: 800;
          word-break: break-all;
        }
        .cyan-val {
          color: var(--cyan-primary);
          font-family: monospace;
        }
        .gold-val.note-val {
          color: var(--gold-primary);
          font-family: monospace;
          font-size: 1.15rem;
          letter-spacing: 0.05em;
        }
        .pill-timer-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: #00e676;
          background: rgba(0, 230, 118, 0.12);
          border: 1px solid rgba(0, 230, 118, 0.3);
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .pill-timer-badge.urgent {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
        }
        .pill-timer-badge.expired {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
        }
        .btn-pill-copy {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 0.4rem 0.85rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .btn-pill-copy:hover {
          background: rgba(255, 255, 255, 0.18);
          color: var(--gold-primary);
        }
        .btn-pill-copy.gold-glow {
          background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
          border: none;
          color: #000000;
          box-shadow: 0 0 12px rgba(255, 200, 0, 0.3);
        }
        .btn-pill-copy.gold-glow:hover {
          box-shadow: 0 0 18px rgba(255, 200, 0, 0.5);
          transform: translateY(-1px);
        }
        .btn-refresh-mini {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .btn-refresh-mini:hover {
          color: #fff;
          border-color: rgba(255, 200, 0, 0.4);
        }
        /* QR INTEGRATED BOX & DOWNLOAD */
        .qr-integrated-box {
          background: rgba(14, 18, 38, 0.6);
          border: 1px solid rgba(255, 200, 0, 0.2);
          border-radius: 14px;
          padding: 0.85rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        @media (max-width: 480px) {
          .qr-integrated-box {
            flex-direction: column;
            text-align: center;
          }
        }
        .qr-canvas-wrap {
          background: #ffffff;
          padding: 0.45rem;
          border-radius: 12px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          transition: transform 0.15s ease;
        }
        .qr-canvas-wrap:hover {
          transform: scale(1.03);
        }
        .qr-img-canvas {
          width: 105px;
          height: 105px;
          object-fit: contain;
          display: block;
        }
        .qr-zoom-hint {
          font-size: 0.6rem;
          color: #64748b;
          font-weight: 700;
          margin-top: 0.2rem;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .qr-details-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .qr-details-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        @media (max-width: 480px) {
          .qr-details-title {
            justify-content: center;
          }
        }
        .qr-details-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.35;
          margin: 0;
        }
        .btn-download-qr-direct {
          align-self: flex-start;
          margin-top: 0.25rem;
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid var(--cyan-primary);
          color: var(--cyan-primary);
          padding: 0.42rem 0.85rem;
          border-radius: 9px;
          font-size: 0.74rem;
          font-weight: 800;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.15s ease;
        }
        @media (max-width: 480px) {
          .btn-download-qr-direct {
            align-self: center;
          }
        }
        .btn-download-qr-direct:hover {
          background: rgba(0, 240, 255, 0.22);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }
        /* CLEAN FIELD GROUPS */
        .clean-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .clean-field-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .clean-field-input {
          width: 100%;
          background: rgba(14, 18, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #ffffff;
          font-size: 0.92rem;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }
        .clean-field-input:focus {
          outline: none;
          border-color: var(--gold-primary);
        }
        .clean-proof-attached {
          background: rgba(0, 230, 118, 0.08);
          border: 1px solid rgba(0, 230, 118, 0.3);
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .proof-thumb-preview {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #00e676;
        }
        .btn-proof-action {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          font-size: 0.74rem;
          cursor: pointer;
        }
        .btn-proof-action.red {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }
        .clean-dropzone-button {
          width: 100%;
          background: rgba(14, 18, 38, 0.5);
          border: 1.5px dashed rgba(255, 200, 0, 0.3);
          border-radius: 12px;
          padding: 0.95rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.15s ease;
        }
        .clean-dropzone-button:hover {
          border-color: var(--gold-primary);
          color: #ffffff;
          background: rgba(20, 26, 56, 0.8);
        }
        .submit-deposit-action {
          width: 100%;
          padding: 0.95rem;
          font-size: 0.95rem;
          border-radius: 12px;
          justify-content: center;
          font-weight: 900;
          letter-spacing: 0.04em;
          margin-top: 0.4rem;
        }
      `}</style>
    </div>
  );
}
