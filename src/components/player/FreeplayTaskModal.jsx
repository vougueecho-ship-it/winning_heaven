'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PanelModalBackdrop from '../PanelModalBackdrop';
import { compressImageFile } from '../../lib/imageCompress';

export default function FreeplayTaskModal({
  isOpen,
  onClose,
  currentUser,
  userEmail,
  defaultGameTitle = '',
  games = [],
  transactions = [],
  gameAccounts = [],
  accountRequests = [],
  freeplayGate = {},
  onSubmitTransaction,
  showToast,
  rejectionReason = ''
}) {
  const [selectedGame, setSelectedGame] = useState(defaultGameTitle || '');
  const [screenshot, setScreenshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [taskId, setTaskId] = useState('');
  const fileInputRef = useRef(null);

  // Auto-fill selected game ONLY when defaultGameTitle is explicitly provided
  useEffect(() => {
    if (defaultGameTitle) {
      setSelectedGame(defaultGameTitle);
    } else {
      setSelectedGame('');
    }
  }, [defaultGameTitle]);

  const hasSelectedGame = Boolean(selectedGame && String(selectedGame).trim());
  const hasScreenshot = Boolean(screenshot && String(screenshot).trim());
  const isBlocked = freeplayGate?.canClaim === false;
  const canSubmit = hasSelectedGame && hasScreenshot && !uploading && !submitting && !isBlocked;

  const existingGameAccount = React.useMemo(() => {
    if (!hasSelectedGame || !Array.isArray(gameAccounts)) return null;
    return gameAccounts.find(
      (a) => a.gameTitle && a.gameTitle.toLowerCase().trim() === selectedGame.toLowerCase().trim()
    );
  }, [selectedGame, hasSelectedGame, gameAccounts]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Automatically dispatch task email on first open if user email exists
  const targetEmail = userEmail || currentUser?.email || '';
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (isOpen && targetEmail && !emailSentRef.current) {
      emailSentRef.current = true;
      handleSendTaskEmail();
    }
  }, [isOpen, targetEmail]);

  if (!isOpen) return null;

  const handleSendTaskEmail = async (isManualResend = false) => {
    if (!targetEmail) {
      if (showToast) showToast('Please provide a valid email address.', 'error');
      return;
    }
    if (isManualResend && resendCooldown > 0) return;

    setEmailSending(true);
    try {
      const res = await fetch('/api/freeplay/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: currentUser?.name || '',
          gameTitle: selectedGame || 'Your Selected Game'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSent(true);
        setTaskId(data.taskId || '');
        setResendCooldown(45); // 45s cooldown
        if (showToast) {
          showToast(
            isManualResend
              ? 'New verification email dispatched! Check Spam / Inbox.'
              : 'Verification email sent! Follow the task instructions.',
            'success'
          );
        }
      } else {
        if (showToast) showToast(data.message || 'Could not send verification email.', 'error');
      }
    } catch (err) {
      console.error('Failed to send freeplay task email:', err);
      if (showToast) showToast('Network error sending verification email.', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select a valid image file (PNG, JPG, or WebP).', 'error');
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 1280, quality: 0.7 });
      if (compressed) {
        setScreenshot(compressed);
        if (showToast) showToast('Inbox screenshot attached successfully!', 'success');
      } else {
        if (showToast) showToast('Failed to process image. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Screenshot compression error:', err);
      if (showToast) showToast('Could not load screenshot. Please try another image.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (freeplayGate?.canClaim === false) {
      if (showToast) showToast(freeplayGate.message || 'Freeplay is not available at this time.', 'error');
      return;
    }
    if (!selectedGame || !selectedGame.trim()) {
      if (showToast) showToast('Please select a casino game for your freeplay.', 'error');
      return;
    }
    if (!screenshot) {
      if (showToast) showToast('Please upload your Inbox screenshot proof before submitting.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fpAmount = 3;
      const code = freeplayGate?.phase === 'signup' || freeplayGate?.isFirst ? 'SIGNUP-FREE3' : 'FREEPLAY';

      if (onSubmitTransaction) {
        const res = await onSubmitTransaction({
          amount: fpAmount,
          type: 'BONUS',
          gameTitle: selectedGame,
          code,
          screenshot,
          hasScreenshot: true,
          note: `Freeplay Task Verification (${taskId || 'Inbox Verified'})`
        });
        if (res && res.success === false) {
          // If server rejected (e.g. pending exists or deposit required), keep modal open so user sees error
          return;
        }
      }

      onClose();
    } catch (err) {
      console.error('Freeplay submit error:', err);
      if (showToast) showToast(err?.message || 'Failed to submit freeplay request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelModalBackdrop onClose={onClose} zIndex={99999}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, #0d1226 0%, #060914 100%)',
          border: '1.5px solid rgba(255, 200, 0, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 35px rgba(255, 200, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Glow Bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #00f0ff 0%, #ffc800 50%, #00e676 100%)',
          width: '100%'
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,200,0,0.2) 0%, rgba(255,136,0,0.2) 100%)',
              border: '1px solid rgba(255, 200, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffc800',
              fontSize: '1.25rem'
            }}>
              <i className="fa-solid fa-gift" />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
                letterSpacing: '0.03em'
              }}>
                CLAIM $3.00 FREEPLAY
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#ffc800', fontWeight: 700 }}>
                Spam-to-Inbox Verification Task
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem'
        }}>

          {/* Pending Approval Alert */}
          {freeplayGate?.phase === 'pending' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 119, 255, 0.1) 100%)',
              border: '1.5px solid rgba(0, 240, 255, 0.5)',
              borderRadius: '16px',
              padding: '1rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxShadow: '0 4px 20px rgba(0, 240, 255, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00f0ff', fontWeight: 900, fontSize: '0.85rem' }}>
                <i className="fa-solid fa-clock fa-spin" />
                <span>APPROVAL PENDING</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#e0f7fa', lineHeight: 1.45 }}>
                Your freeplay request is already submitted and waiting for admin review. You cannot submit another request until your current request is processed.
              </p>
            </div>
          )}

          {/* Need Deposit Alert */}
          {freeplayGate?.phase === 'need_deposit' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '16px',
              padding: '1rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 900, fontSize: '0.85rem' }}>
                <i className="fa-solid fa-lock" />
                <span>$10.00 DEPOSIT REQUIRED FOR NEXT FREEPLAY</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#fef3c7', lineHeight: 1.45 }}>
                You have already claimed your signup freeplay. Please deposit at least <strong>${(freeplayGate.remaining !== undefined ? freeplayGate.remaining : 10).toFixed(2)}</strong> more ($${(freeplayGate.depositTotal || 0).toFixed(2)} / $10.00 deposited) to qualify for freeplay again!
              </p>
            </div>
          )}

          {/* Rejection Feedback Alert (if previous submission was rejected) */}
          {rejectionReason && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '16px',
              padding: '1rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 900, fontSize: '0.85rem' }}>
                <i className="fa-solid fa-triangle-exclamation fa-beat-fade" />
                <span>PREVIOUS SUBMISSION REQUIRES RE-SUBMISSION</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#fecaca', lineHeight: 1.45 }}>
                <strong>Staff Feedback:</strong> &ldquo;{rejectionReason}&rdquo;
              </p>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                Please review the 30-second steps below, take a new valid screenshot showing the email in your Inbox, and re-upload.
              </span>
            </div>
          )}

          {/* Email Status & Quick Resend Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 200, 0, 0.25)',
            borderRadius: '16px',
            padding: '1rem 1.15rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f0ff',
                fontSize: '0.95rem'
              }}>
                <i className="fa-solid fa-envelope-circle-check" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Verification Email Sent To
                </div>
                <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 800 }}>
                  {targetEmail}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSendTaskEmail(true)}
              disabled={emailSending || resendCooldown > 0}
              style={{
                background: resendCooldown > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255, 200, 0, 0.15)',
                border: resendCooldown > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ffc800',
                color: resendCooldown > 0 ? '#94a3b8' : '#ffc800',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: resendCooldown > 0 || emailSending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              {emailSending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>Sending...</span>
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <i className="fa-solid fa-clock" />
                  <span>Resend ({resendCooldown}s)</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate-right" />
                  <span>Resend Email</span>
                </>
              )}
            </button>
          </div>

          {/* Step-by-Step Interactive Guide */}
          <div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 900,
              color: '#ffc800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <i className="fa-solid fa-list-check" />
              <span>30-Second Task Instructions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              {/* Step 1 */}
              <div style={{
                background: 'rgba(10, 14, 28, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <span style={{
                  background: '#ffc800',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>1</span>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Check your <strong style={{ color: '#fff' }}>Spam / Junk</strong> folder (or Promotions tab) for an email from <strong style={{ color: '#00f0ff' }}>verified@winningheaven.com</strong>.
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: 'rgba(10, 14, 28, 0.7)',
                border: '1px solid rgba(0, 230, 118, 0.25)',
                borderRadius: '12px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <span style={{
                  background: '#00e676',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>2</span>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Open the email and click <strong style={{ color: '#00ff66' }}>&ldquo;Report Not Spam&rdquo;</strong> (or &ldquo;Move to Inbox&rdquo;) so it moves to your Primary Inbox.
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                background: 'rgba(10, 14, 28, 0.7)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '12px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <span style={{
                  background: '#00f0ff',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>3</span>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Open your <strong style={{ color: '#fff' }}>Primary Inbox</strong> and take a screenshot showing our email sitting in your Inbox list.
                </div>
              </div>

            </div>
          </div>

          {/* Privacy Note / Masking Demonstration */}
          <div style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px dashed rgba(0, 240, 255, 0.3)',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#00f0ff', fontSize: '1.2rem', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#a5f3fc', lineHeight: 1.45 }}>
              <strong>🔒 Privacy Guaranteed:</strong> You are welcome to cross out, draw lines over, or blur any personal emails below the Winning Heaven email in your screenshot.
            </p>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Game Selector */}
            <div>
              <label
                htmlFor="freeplay-game-select"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.45rem'
                }}
              >
                <i className="fa-solid fa-gamepad" style={{ color: '#ffc800', fontSize: '0.9rem' }} />
                <span>Select Game for Freeplay <span style={{ color: '#ef4444' }}>*</span></span>
              </label>
              <select
                id="freeplay-game-select"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(6, 8, 18, 0.95)',
                  border: hasSelectedGame ? '1.5px solid #00e676' : '1.5px solid rgba(255, 200, 0, 0.4)',
                  borderRadius: '12px',
                  padding: '0.85rem 1.15rem',
                  color: hasSelectedGame ? '#fff' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: hasSelectedGame ? '0 0 12px rgba(0, 230, 118, 0.2)' : 'none'
                }}
              >
                <option value="" style={{ background: '#0a0d16', color: '#94a3b8' }}>
                  -- Choose a Casino Game * --
                </option>
                {games.map((g) => (
                  <option key={g.id || g.title} value={g.title} style={{ background: '#0a0d16', color: '#fff' }}>
                    {g.title} {g.category ? `(${g.category})` : ''}
                  </option>
                ))}
              </select>
              {!hasSelectedGame ? (
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className="fa-solid fa-circle-exclamation" /> Please select which casino game you want your freeplay on.
                </span>
              ) : existingGameAccount ? (
                <span style={{ fontSize: '0.74rem', color: '#00e676', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-check" /> Existing Account Found: Freeplay will be loaded to your account ({existingGameAccount.username || selectedGame}).
                </span>
              ) : (
                <span style={{ fontSize: '0.74rem', color: '#00f0ff', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, background: 'rgba(0, 240, 255, 0.08)', padding: '0.25rem 0.55rem', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" /> No {selectedGame} account yet? A new account request will be auto-created alongside your freeplay!
                </span>
              )}
            </div>

            {/* Screenshot Uploader */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.4rem'
              }}>
                Upload Inbox Screenshot Proof <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {!screenshot ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(255, 200, 0, 0.4)',
                    background: 'rgba(255, 200, 0, 0.03)',
                    borderRadius: '16px',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ffc800';
                    e.currentTarget.style.background = 'rgba(255, 200, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 200, 0, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 200, 0, 0.03)';
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(255, 200, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffc800',
                    fontSize: '1.25rem'
                  }}>
                    {uploading ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      <i className="fa-solid fa-cloud-arrow-up" />
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', display: 'block' }}>
                      {uploading ? 'Compressing Image...' : 'Click to Upload Inbox Screenshot'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG, JPEG, or WebP (Auto-Compressed)
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1.5px solid #00e676',
                  background: '#04060e'
                }}>
                  <img
                    src={screenshot}
                    alt="Inbox Screenshot Proof"
                    style={{
                      width: '100%',
                      maxHeight: '180px',
                      objectFit: 'contain',
                      display: 'block',
                      background: '#020308'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(0,0,0,0.75)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square" /> Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      style={{
                        background: 'rgba(239, 68, 68, 0.85)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-trash" /> Remove
                    </button>
                  </div>
                  <div style={{
                    padding: '0.4rem 0.8rem',
                    background: 'rgba(0, 230, 118, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    color: '#00e676',
                    fontWeight: 700
                  }}>
                    <i className="fa-solid fa-circle-check" />
                    <span>Screenshot Attached & Ready for Admin Review</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hold & Deposit Notice */}
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              background: 'rgba(255,255,255,0.02)',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              💡 <strong>Freeplay Rule:</strong> Max cashout on freeplay winnings is $30.00. Excess balance is placed on Hold and unlocked upon a <strong>$10.00 deposit</strong>, which also qualifies you for future freeplays!
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: '0.95rem',
                background: !canSubmit
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #e65100 100%)',
                border: !canSubmit ? '1.5px solid rgba(255, 255, 255, 0.12)' : 'none',
                borderRadius: '14px',
                color: !canSubmit ? 'rgba(255, 255, 255, 0.35)' : '#04050b',
                fontSize: '0.92rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: canSubmit ? '0 8px 25px rgba(255, 170, 0, 0.4)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>SUBMITTING TASK PROOF...</span>
                </>
              ) : freeplayGate?.phase === 'pending' ? (
                <>
                  <i className="fa-solid fa-clock" />
                  <span>APPROVAL PENDING (WAITING FOR ADMIN)</span>
                </>
              ) : freeplayGate?.phase === 'need_deposit' ? (
                <>
                  <i className="fa-solid fa-lock" />
                  <span>DEPOSIT $10.00 TO UNLOCK NEXT FREEPLAY</span>
                </>
              ) : !hasSelectedGame ? (
                <>
                  <i className="fa-solid fa-gamepad" />
                  <span>1. SELECT A CASINO GAME FIRST</span>
                </>
              ) : !hasScreenshot ? (
                <>
                  <i className="fa-solid fa-camera" />
                  <span>2. UPLOAD INBOX SCREENSHOT TO SUBMIT</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" />
                  <span>SUBMIT TASK &amp; CLAIM $3 FREEPLAY &rarr;</span>
                </>
              )}
            </button>
          </form>

        </div>
      </motion.div>
    </PanelModalBackdrop>
  );
}
