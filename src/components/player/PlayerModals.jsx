'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PanelModalBackdrop from '../PanelModalBackdrop';
import { compressImageFile } from '../../lib/imageCompress';
import {
  generateDepositNoteCode,
  readPendingDeposit,
  writePendingDeposit,
  clearPendingDeposit,
  remainingSeconds,
  pendingMatchesGame,
  DEPOSIT_CODE_TTL_MS
} from '../../lib/pendingDeposit';
import { getDepositBasedMinWithdraw, findLastSuccessDeposit } from '../../lib/withdrawRules';
import { cleanErrorMessage } from '../../lib/safeFetch';

/** Player Centered Deposit Modal */
export function PlayerDepositModal({
  isOpen,
  onClose,
  gateways = [],
  onSubmitTransaction,
  showToast,
  userEmail,
  defaultGameTitle = '',
  games = [],
  transactions = []
}) {
  const [step, setStep] = useState(1); // 1: Amount & Game, 2: Gateway, 3: Confirm & Proof
  const [amount, setAmount] = useState('25');
  const [targetGameTitle, setTargetGameTitle] = useState(defaultGameTitle);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [noteCode, setNoteCode] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (defaultGameTitle) setTargetGameTitle(defaultGameTitle);
  }, [defaultGameTitle]);

  // On mount (modal opens), try to restore a pending deposit session from localStorage
  useEffect(() => {
    if (!isOpen || !userEmail) return;
    const pending = readPendingDeposit(userEmail);
    if (pending && remainingSeconds(pending.expiresAt) > 0) {
      // Restore previous session
      setNoteCode(pending.noteCode);
      setTimeLeft(remainingSeconds(pending.expiresAt));
      if (pending.amount) setAmount(String(pending.amount));
      if (pending.gameTitle) setTargetGameTitle(pending.gameTitle);
      if (pending.gateway) {
        setSelectedGateway(pending.gateway);
        setStep(3);
      }
    }
  }, [isOpen, userEmail]);

  // Countdown timer — runs whenever we are on step 3 with a noteCode
  useEffect(() => {
    if (step !== 3 || !noteCode) return;
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
  }, [step, noteCode]);

  if (!isOpen) return null;

  const handleSelectGateway = (g) => {
    setSelectedGateway(g);

    // Check if a valid pending code already exists for this game
    const pending = readPendingDeposit(userEmail);
    const reuse = pending && pendingMatchesGame(pending, targetGameTitle) && remainingSeconds(pending.expiresAt) > 0;

    const code = reuse ? pending.noteCode : generateDepositNoteCode();
    const expiresAt = reuse ? pending.expiresAt : Date.now() + DEPOSIT_CODE_TTL_MS;
    const left = remainingSeconds(expiresAt);

    setNoteCode(code);
    setTimeLeft(left);

    // Persist to localStorage so closing modal doesn't lose the code
    writePendingDeposit({
      userEmail,
      gameTitle: targetGameTitle,
      amount: parseFloat(amount) || 0,
      gateway: g,
      noteCode: code,
      expiresAt
    });

    setStep(3);
  };  const handleFileChange = async (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt < 5) {
      if (showToast) showToast('Minimum deposit amount is $5.00.', 'error');
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
        screenshot
      });
      // Clear pending deposit on successful submit
      clearPendingDeposit();
      onClose();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Deposit submission failed.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel = clear localStorage so next open generates new code
  const handleCancelDeposit = () => {
    clearPendingDeposit();
    setNoteCode('');
    setScreenshot('');
    setSelectedGateway(null);
    setStep(1);
    if (showToast) showToast('Deposit cancelled. A new code will be generated next time.', 'info');
  };

  const handleProceedToGateways = () => {
    if (!targetGameTitle || !targetGameTitle.trim()) {
      if (showToast) showToast('Please select a platform game to deposit coins into.', 'error');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt < 5) {
      if (showToast) showToast('Minimum deposit amount is $5.00.', 'error');
      return;
    }
    setStep(2);
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
      onClose();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Deposit from cashout failed.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <PanelModalBackdrop isOpen={true} onClose={onClose}>
      <div
        className="modal-backdrop-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 5, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 99999
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'rgba(10, 14, 28, 0.96)',
            border: '1px solid var(--gold-primary)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '480px',
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(255,200,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
                LOAD COINS {targetGameTitle ? `FOR ${targetGameTitle.toUpperCase()}` : ''}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Step {step} of 3 — {step === 1 ? 'Choose Amount' : step === 2 ? 'Select Gateway' : 'Upload Proof'}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>
              &times;
            </button>
          </div>

          {/* Step 1: Amount Selection */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Cashout Hold Balance Available Alert Banner */}
              {totalAvailableHold > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                  border: '1.5px solid #eab308',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffc800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-coins" /> CASHOUT HOLD: ${totalAvailableHold.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleDepositFromHold}
                      className="btn-gold-glow"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                    >
                      {submitting ? <i className="fa-solid fa-spinner fa-spin" /> : 'USE HOLD BALANCE'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                    You can load coins into {targetGameTitle || 'your game account'} directly using your held cashout balance without paying extra!
                  </div>
                </div>
              )}

              {!defaultGameTitle && games.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                    SELECT PLATFORM GAME <span style={{ color: 'var(--red-primary)' }}>*</span>
                  </label>
                  <select
                    value={targetGameTitle}
                    onChange={(e) => setTargetGameTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.8)',
                      border: '1px solid var(--gold-primary)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select Platform Game --</option>
                    {games.map((g) => (
                      <option key={g.id || g.title} value={g.title}>{g.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  SELECT OR ENTER AMOUNT (MINIMUM $5.00) <span style={{ color: 'var(--gold-primary)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  {['5', '10', '25', '50', '100', '250'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      style={{
                        background: amount === val ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'rgba(255,255,255,0.06)',
                        color: amount === val ? '#000' : '#fff',
                        border: amount === val ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        padding: '0.65rem 0.5rem',
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--gold-primary)',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    pointerEvents: 'none'
                  }}>$</span>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5.00 (Minimum $5)"
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.8)',
                      border: parseFloat(amount) < 5 ? '1px solid var(--red-primary)' : '1px solid var(--gold-primary)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem 0.85rem 2.2rem',
                      color: 'var(--gold-primary)',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-heading)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {parseFloat(amount) < 5 && (
                  <div style={{ color: 'var(--red-primary)', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
                    <i className="fa-solid fa-triangle-exclamation" /> Minimum deposit is $5.00
                  </div>
                )}
              </div>

              <button onClick={handleProceedToGateways} className="btn-gold-glow" style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}>
                CONTINUE TO PAYMENT METHOD <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {/* Step 2: Gateway Selection */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gateways.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active payment gateways available. Contact support.
                  </div>
                ) : (
                  gateways.map((g) => (
                    <button
                      key={g.id || g.name}
                      onClick={() => handleSelectGateway(g)}
                      style={{
                        background: 'rgba(12, 16, 32, 0.85)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{g.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.subtitle || 'Instant Transfer'}</div>
                      </div>
                      <span className="badge-gold">SELECT</span>
                    </button>
                  ))
                )}
              </div>

              <button onClick={() => setStep(1)} className="btn-glass-secondary" style={{ padding: '0.65rem' }}>
                <i className="fa-solid fa-arrow-left" /> BACK TO AMOUNT
              </button>
            </div>
          )}

          {/* Step 3: Confirm Note Code & Upload Proof */}
          {step === 3 && (() => {
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
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Admin Gateway QR & Payment Details Box */}
                {selectedGateway && (
                  <div style={{
                    background: 'rgba(12, 16, 32, 0.95)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '16px',
                    padding: '1.15rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold-primary)', fontSize: '0.92rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-credit-card" /> PAYMENT METHOD: {selectedGateway.name?.toUpperCase()}
                    </div>

                    {/* Direct 1-Click Pay Now Button (For Stripe, Cash App, and any link gateways) */}
                    {payUrl && (
                      <div style={{ width: '100%' }}>
                        <button
                          type="button"
                          onClick={handleOpenPayLink}
                          style={{
                            width: '100%',
                            padding: '0.95rem 1.1rem',
                            borderRadius: '14px',
                            border: isStripe ? '1.5px solid #635bff' : isCashApp ? '1.5px solid #00d632' : '1.5px solid var(--gold-primary)',
                            background: isStripe ? 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)' : isCashApp ? 'linear-gradient(135deg, #00d632 0%, #009922 100%)' : 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                            color: isStripe ? '#ffffff' : '#000000',
                            fontWeight: 900,
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            cursor: 'pointer',
                            boxShadow: isStripe ? '0 0 25px rgba(99, 91, 255, 0.45)' : isCashApp ? '0 0 25px rgba(0, 214, 50, 0.45)' : '0 0 25px rgba(255, 200, 0, 0.45)',
                            transition: 'all 0.2s ease',
                            letterSpacing: '0.02em'
                          }}
                        >
                          <i className={isStripe ? 'fa-brands fa-stripe' : isCashApp ? 'fa-solid fa-dollar-sign' : 'fa-solid fa-arrow-up-right-from-square'} style={{ fontSize: '1.2rem' }} />
                          <span>OPEN &amp; PAY ${parseFloat(amount || 0).toFixed(2)} ON {selectedGateway.name?.toUpperCase()} &rarr;</span>
                        </button>
                        <div style={{ fontSize: '0.7rem', color: 'var(--cyan-primary)', marginTop: '0.35rem', fontWeight: 600 }}>
                          <i className="fa-solid fa-circle-check" /> Tap button above to open secure checkout link
                        </div>
                      </div>
                    )}

                    {/* QR Code Image display */}
                    {(selectedGateway.qrCode || selectedGateway.qrCodeUrl || selectedGateway.imageUrl || selectedGateway.qrImage || selectedGateway.qr || selectedGateway.image) && (
                      <div style={{
                        background: '#fff',
                        padding: '0.65rem',
                        borderRadius: '14px',
                        border: '2px solid var(--gold-primary)',
                        boxShadow: '0 0 20px rgba(255,200,0,0.3)',
                        maxWidth: '180px'
                      }}>
                        <img
                          src={selectedGateway.qrCode || selectedGateway.qrCodeUrl || selectedGateway.imageUrl || selectedGateway.qrImage || selectedGateway.qr || selectedGateway.image}
                          alt={`${selectedGateway.name} QR Code`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
                        />
                        <div style={{ fontSize: '0.68rem', color: '#000', fontWeight: 900, marginTop: '0.35rem' }}>
                          SCAN TO PAY WITH {selectedGateway.name.toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Account Tag / Cashtag / Handle (Only shown if not a generic placeholder like 'stripe-checkout') */}
                    {rawTag && !isGenericPlaceholder && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {tagLabel}
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            readOnly
                            value={rawTag}
                            style={{
                              flex: 1,
                              background: 'rgba(6, 8, 18, 0.9)',
                              border: '1px solid var(--gold-primary)',
                              borderRadius: '10px',
                              padding: '0.6rem 0.85rem',
                              color: 'var(--cyan-primary)',
                              fontSize: '0.9rem',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              outline: 'none',
                              textAlign: 'center'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(rawTag);
                              if (showToast) showToast(`${tagLabel} copied to clipboard!`, 'success');
                            }}
                            className="btn-gold-glow"
                            style={{ padding: '0.6rem 0.9rem', fontSize: '0.78rem' }}
                          >
                            <i className="fa-solid fa-copy" /> COPY
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Phone / Contact info if available */}
                    {selectedGateway.phone && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          PHONE / SMS CONTACT
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            readOnly
                            value={selectedGateway.phone}
                            style={{
                              flex: 1,
                              background: 'rgba(6, 8, 18, 0.9)',
                              border: '1px solid var(--border-muted)',
                              borderRadius: '10px',
                              padding: '0.55rem 0.85rem',
                              color: '#fff',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              outline: 'none',
                              textAlign: 'center'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedGateway.phone);
                              if (showToast) showToast('Phone copied to clipboard!', 'success');
                            }}
                            className="btn-glass-secondary"
                            style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem' }}
                          >
                            <i className="fa-solid fa-copy" /> COPY
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 1-2-3 Step-by-Step Payment Instructions Guide */}
                    <div style={{
                      background: 'rgba(255, 200, 0, 0.05)',
                      border: '1px solid rgba(255, 200, 0, 0.2)',
                      borderRadius: '12px',
                      padding: '0.75rem 0.9rem',
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="fa-solid fa-list-check" /> 3-STEP PAYMENT GUIDE:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                          <span style={{ background: 'var(--gold-primary)', color: '#000', borderRadius: '50%', width: '17px', height: '17px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, flexShrink: 0 }}>1</span>
                          <span>{payUrl ? <>Tap <strong>&ldquo;OPEN &amp; PAY&rdquo;</strong> button above.</> : <>Copy the payment handle or scan QR above.</>}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                          <span style={{ background: 'var(--gold-primary)', color: '#000', borderRadius: '50%', width: '17px', height: '17px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, flexShrink: 0 }}>2</span>
                          <span>Send exact <strong>${parseFloat(amount || 0).toFixed(2)}</strong> and write Note Code <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'monospace' }}>{noteCode}</strong> in memo.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                          <span style={{ background: 'var(--gold-primary)', color: '#000', borderRadius: '50%', width: '17px', height: '17px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, flexShrink: 0 }}>3</span>
                          <span>Upload payment screenshot proof below and submit for instant verification!</span>
                        </div>
                      </div>
                    </div>

                    {selectedGateway.instructions && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4, textAlign: 'left', width: '100%', borderLeft: '2px solid var(--gold-primary)', paddingLeft: '0.6rem' }}>
                        {selectedGateway.instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Total Coin Load & Note Code Highlight Box */}
                <div style={{
                  background: 'rgba(6, 8, 18, 0.9)',
                  border: '1.5px dashed var(--gold-primary)',
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL COIN LOAD</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                    ${parseFloat(amount || 0).toFixed(2)}
                  </div>

                  <div style={{
                    marginTop: '0.25rem',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.35)',
                    borderRadius: '12px',
                    padding: '0.45rem 0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      NOTE CODE:
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--cyan-primary)', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {noteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(noteCode);
                        if (showToast) showToast(`Note code "${noteCode}" copied to clipboard!`, 'success');
                      }}
                      className="btn-gold-glow"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem', fontWeight: 900, borderRadius: '6px' }}
                    >
                      <i className="fa-solid fa-copy" /> COPY
                    </button>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    <i className="fa-regular fa-clock" style={{ marginRight: '4px' }} /> Timer: <strong>{minutes}:{seconds}</strong> remaining
                  </div>
                </div>

                {/* Upload Screenshot with Live Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {screenshot ? (
                    <div style={{
                      background: 'rgba(6, 8, 18, 0.95)',
                      border: '1.5px solid #00e676',
                      borderRadius: '16px',
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={screenshot}
                          alt="Payment Proof Preview"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', border: '1.5px solid #00e676' }}
                        />
                        <div>
                          <div style={{ color: '#00e676', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <i className="fa-solid fa-circle-check" /> Proof Attached
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            Ready for submission
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setScreenshot('')}
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          &times; Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                        UPLOAD PAYMENT SCREENSHOT PROOF <span style={{ color: 'var(--red-primary)' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-glass-secondary"
                        style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem' }}
                      >
                        {uploading ? (
                          <span><i className="fa-solid fa-spinner fa-spin" /> Attaching Proof...</span>
                        ) : (
                          <span><i className="fa-solid fa-cloud-arrow-up" style={{ color: '#ffd700', marginRight: '6px' }} /> SELECT PAYMENT SCREENSHOT</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !screenshot}
                  className="btn-gold-glow"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '0.92rem',
                    opacity: submitting || !screenshot ? 0.5 : 1,
                    cursor: submitting || !screenshot ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? (
                    <span><i className="fa-solid fa-spinner fa-spin" /> Submitting Deposit...</span>
                  ) : (
                    <span><i className="fa-solid fa-paper-plane" /> SUBMIT COIN LOAD FOR VERIFICATION</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelDeposit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--red-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.4rem'
                  }}
                >
                  <i className="fa-solid fa-ban" /> CANCEL &amp; GENERATE NEW CODE
                </button>
              </form>
            );
          })()}
        </motion.div>
      </div>
    </PanelModalBackdrop>
  );
}

/** Player Centered Cashout / Withdraw Modal */
export function PlayerWithdrawModal({
  isOpen,
  onClose,
  gateways = [],
  onSubmitTransaction,
  showToast,
  userEmail,
  defaultGameTitle = '',
  games = [],
  transactions = []
}) {
  const [amount, setAmount] = useState('');
  const [targetGameTitle, setTargetGameTitle] = useState(defaultGameTitle);
  const [payoutMethod, setPayoutMethod] = useState('Chime');
  const [recipientTag, setRecipientTag] = useState('');
  const [nameOnTag, setNameOnTag] = useState('');
  const [phoneOnTag, setPhoneOnTag] = useState('');
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [tagQrScreenshot, setTagQrScreenshot] = useState('');
  const [uploadingGameShot, setUploadingGameShot] = useState(false);
  const [uploadingTagQr, setUploadingTagQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const gameShotInputRef = useRef(null);
  const tagQrInputRef = useRef(null);

  useEffect(() => {
    if (defaultGameTitle) setTargetGameTitle(defaultGameTitle);
  }, [defaultGameTitle]);

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
    if (isFreeplaySession) return 100;
    const depositMin = getDepositBasedMinWithdraw(lastDeposit?.amount);
    return depositMin != null ? depositMin : 25;
  }, [isFreeplaySession, lastDeposit]);

  if (!isOpen) return null;

  const handleGameShotChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGameShot(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 900, quality: 0.55 });
      if (compressed) {
        setGameScreenshot(compressed);
        if (showToast) showToast('Game balance screenshot attached!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to process image file.', 'error');
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
        if (showToast) showToast('Payment Tag / QR screenshot attached!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to process image file.', 'error');
    } finally {
      setUploadingTagQr(false);
      if (tagQrInputRef.current) tagQrInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetGameTitle || !targetGameTitle.trim()) {
      if (showToast) showToast('Please select a platform game for cashout.', 'error');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      if (showToast) showToast('Please enter a valid cashout amount.', 'error');
      return;
    }

    if (isFreeplaySession && numAmt < 100) {
      if (showToast) showToast('Freeplay withdraw request must be at least $100.', 'error');
      return;
    }

    if (!isFreeplaySession && numAmt < calculatedMinWithdraw) {
      const mult = Number(lastDeposit?.amount) < 50 ? 5 : 3;
      if (showToast) {
        showToast(
          lastDeposit
            ? `Minimum cashout is $${calculatedMinWithdraw.toFixed(2)} (last deposit $${parseFloat(lastDeposit.amount).toFixed(2)} × ${mult}).`
            : `Minimum cashout is $${calculatedMinWithdraw.toFixed(2)}.`,
          'error'
        );
      }
      return;
    }

    if (!recipientTag.trim()) {
      if (showToast) showToast('Please enter recipient tag / phone / email.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitTransaction({
        amount: numAmt,
        type: 'WITHDRAW',
        gameTitle: targetGameTitle,
        gateway: payoutMethod,
        payoutMethod,
        recipientTag,
        nameOnTag,
        phoneOnTag,
        screenshot: gameScreenshot,
        tagQrScreenshot,
        isFreeplayWithdraw: isFreeplaySession
      });
      onClose();
    } catch (err) {
      if (showToast) showToast(cleanErrorMessage(err, 'Cashout submission failed.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelModalBackdrop isOpen={true} onClose={onClose}>
      <div
        className="modal-backdrop-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 5, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 99999
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'rgba(10, 14, 28, 0.96)',
            border: '1px solid var(--cyan-primary)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '480px',
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(0,240,255,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
                REDEEM CASHOUT {targetGameTitle ? `FOR ${targetGameTitle.toUpperCase()}` : ''}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Submit coin redemption request
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>
              &times;
            </button>
          </div>

          {isFreeplaySession && (
            <div style={{
              background: 'rgba(155, 89, 182, 0.15)',
              border: '1px solid #9b59b6',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              color: '#e8b0ff',
              lineHeight: 1.4
            }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>
                <i className="fa-solid fa-gift" style={{ color: '#9b59b6', marginRight: '0.4rem' }}></i>
                FREEPLAY CASHOUT SESSION
              </strong>
              Freeplay withdraw request must be at least <strong>$100.00</strong>. Maximum payout allowed on freeplay wins is strictly capped at <strong>$30.00</strong>.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!defaultGameTitle && games.length > 0 && (
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  SELECT PLATFORM GAME
                </label>
                <select
                  value={targetGameTitle}
                  onChange={(e) => setTargetGameTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(6, 8, 18, 0.8)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Platform Game...</option>
                  {games.map((g) => (
                    <option key={g.id || g.title} value={g.title}>{g.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                CASHOUT AMOUNT ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to redeem"
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.8)',
                  border: '1px solid var(--cyan-primary)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  color: 'var(--cyan-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {isFreeplaySession ? (
                  'Minimum freeplay cashout: $100.00'
                ) : lastDeposit ? (
                  `Minimum cashout for ${targetGameTitle || 'this platform'}: $${calculatedMinWithdraw.toFixed(2)} (Last deposit $${parseFloat(lastDeposit.amount).toFixed(2)} × ${Number(lastDeposit.amount) < 50 ? 5 : 3})`
                ) : (
                  `Minimum cashout: $${calculatedMinWithdraw.toFixed(2)}`
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                PAYMENT METHOD
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.8)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="Chime">Chime</option>
                <option value="CashApp">Cash App</option>
                <option value="Venmo">Venmo</option>
                <option value="Zelle">Zelle</option>
                <option value="Crypto">Crypto (BTC / USDT)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                RECIPIENT TAG / EMAIL / PHONE
              </label>
              <input
                type="text"
                value={recipientTag}
                onChange={(e) => setRecipientTag(e.target.value)}
                placeholder="e.g. $Cashtag, Zelle Email, Wallet Address"
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.8)',
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
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                NAME ON ACCOUNT
              </label>
              <input
                type="text"
                value={nameOnTag}
                onChange={(e) => setNameOnTag(e.target.value)}
                placeholder="Full name registered on payment account"
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.8)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Optional/Required Screenshots for Cashout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Game Balance Screenshot */}
              <div>
                <input
                  type="file"
                  ref={gameShotInputRef}
                  accept="image/*"
                  onChange={handleGameShotChange}
                  style={{ display: 'none' }}
                />
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  GAME SCREENSHOT
                </label>
                {gameScreenshot ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={gameScreenshot} alt="Game Shot" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #00f0ff' }} />
                    <button
                      type="button"
                      onClick={() => setGameScreenshot('')}
                      style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => gameShotInputRef.current?.click()}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.8)',
                      border: '1px dashed var(--border-muted)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.4rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {uploadingGameShot ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-image" /> Add Game Shot</>}
                  </button>
                )}
              </div>

              {/* Tag / QR Screenshot */}
              <div>
                <input
                  type="file"
                  ref={tagQrInputRef}
                  accept="image/*"
                  onChange={handleTagQrChange}
                  style={{ display: 'none' }}
                />
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  TAG / QR SCREENSHOT
                </label>
                {tagQrScreenshot ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={tagQrScreenshot} alt="Tag QR" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #00f0ff' }} />
                    <button
                      type="button"
                      onClick={() => setTagQrScreenshot('')}
                      style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => tagQrInputRef.current?.click()}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 8, 18, 0.8)',
                      border: '1px dashed var(--border-muted)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.4rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {uploadingTagQr ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-qrcode" /> Add Tag QR</>}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-cyan-glow"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              {submitting ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-wallet" />} SUBMIT CASHOUT REQUEST
            </button>
          </form>
        </motion.div>
      </div>
    </PanelModalBackdrop>
  );
}

/** Player Centered Game Account Request Modal */
export function PlayerGameAccountModal({
  isOpen,
  onClose,
  game,
  onRequestAccount,
  showToast
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !game) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onRequestAccount(game.title);
      onClose();
    } catch (err) {
      if (showToast) showToast('Failed to submit account request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelModalBackdrop isOpen={true} onClose={onClose}>
      <div
        className="modal-backdrop-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 5, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 99999
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'rgba(10, 14, 28, 0.96)',
            border: '1px solid var(--gold-primary)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '420px',
            width: '90vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(255,200,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <h2 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: 0 }}>
            REQUEST GAME ACCOUNT FOR {game.title.toUpperCase()}
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Request a new player account for <strong>{game.title}</strong>. Our admin team will generate your credentials immediately.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn-glass-secondary" style={{ flex: 1, padding: '0.75rem' }}>
              CANCEL
            </button>
            <button onClick={handleConfirm} disabled={submitting} className="btn-gold-glow" style={{ flex: 1, padding: '0.75rem' }}>
              {submitting ? <i className="fa-solid fa-spinner fa-spin" /> : 'CONFIRM REQUEST'}
            </button>
          </div>
        </motion.div>
      </div>
    </PanelModalBackdrop>
  );
}
