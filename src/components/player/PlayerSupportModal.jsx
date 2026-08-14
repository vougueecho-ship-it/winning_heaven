'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLightbox } from '../Modals';
import { compressImageFile } from '../../lib/imageCompress';
import { formatDeviceTime } from '../../lib/formatDateTime';

const QUICK_OPTIONS = [
  {
    id: 'deposit',
    icon: 'fa-solid fa-coins',
    color: '#00e676',
    label: 'Deposit Help & Bonus',
    title: '100% FIRST DEPOSIT MATCH & INSTANT COIN LOAD',
    badge: '100% BONUS ACTIVE',
    details: 'Load coins instantly using Chime, CashApp, Venmo, Zelle, or Crypto (BTC/USDT). First deposits receive up to 100% bonus credits. Coins are allotted to your platform account in under 3 minutes.',
    perks: ['Instant Coin Allotment (Under 3 mins)', '100% First Deposit Match', 'Multiple Verified Payment Gateways'],
    actionLabel: 'Ask Agent About Deposit',
    query: 'Hi! I need help making a deposit and claiming the deposit match bonus.'
  },
  {
    id: 'cashout',
    icon: 'fa-solid fa-wallet',
    color: '#00f0ff',
    label: 'Cashout & Redemption Rules',
    title: 'FAST & SECURE CASHOUTS (CHIME / CASHAPP / CRYPTO)',
    badge: 'UNDER 5 MIN PAYOUTS',
    details: 'Redeem your winnings 24/7. Standard minimum cashout is $25.00 (or deposit multiplier). Freeplay sessions require $100.00 minimum request with a $30.00 max cashout cap. Payouts are sent directly to your payment tag.',
    perks: ['Zero Processing Fees', 'Fast Payout Direct to Tag / QR', 'Split & Partial Payout Support'],
    actionLabel: 'Ask Agent About Cashout',
    query: 'Hi! I have a question regarding my cashout request and payout rules.'
  },
  {
    id: 'freeplay',
    icon: 'fa-solid fa-gift',
    color: '#ffc800',
    label: 'Daily Freeplay & Rewards',
    title: 'DAILY FREEPLAY & EXCLUSIVE SPIN CREDITS',
    badge: 'FREE COINS DAILY',
    details: 'Claim your daily freeplay spins every 24 hours on your favorite platform game. Freeplay winnings can be redeemed up to $30.00 cash upon reaching $100 in-game score.',
    perks: ['Daily Free Spin Claims', '$30 Max Freeplay Win Cap', 'No Deposit Required to Try'],
    actionLabel: 'Claim Daily Freeplay',
    query: 'Hi! Can you please check and activate my daily freeplay bonus?'
  },
  {
    id: 'credentials',
    icon: 'fa-solid fa-gamepad',
    color: '#a855f7',
    label: 'Game Login & Accounts',
    title: 'DEDICATED GAME PLATFORM CREDENTIALS',
    badge: 'JUWA / GAMEVAULT / VEGAS',
    details: 'Need a new game account or forgot your credentials? Our 24/7 staff provisions and resets player accounts on Juwa, GameVault, Vegas Sweeps, FireKirin, UltraPanda, and Blue Dragon.',
    perks: ['Instant Password Reset', 'Direct Platform Link', 'Multi-Platform Sync'],
    actionLabel: 'Request Game Account Credentials',
    query: 'Hi! I need help with my game account username, password, or login link.'
  },
  {
    id: 'referral',
    icon: 'fa-solid fa-users-line',
    color: '#f43f5e',
    label: 'Referral Program',
    title: 'REFER & EARN LIFETIME COMMISSIONS',
    badge: 'SHARE & EARN',
    details: 'Share your personal referral link with friends. When they register and make their first deposit, you automatically receive free coins and ongoing reward bonuses.',
    perks: ['Instant Referral Reward', 'Unique Tracking Link', 'Unlimited Friend Invites'],
    actionLabel: 'Ask About Referral Rewards',
    query: 'Hi! How do I check my referral link and claim my referral bonus?'
  }
];

export default function PlayerSupportModal({
  isOpen,
  onClose,
  currentUser,
  onMessagesSeen
}) {
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const onMessagesSeenRef = useRef(onMessagesSeen);
  onMessagesSeenRef.current = onMessagesSeen;

  // Identity helper (logged in user vs guest)
  const getChatIdentity = () => {
    if (currentUser) {
      return { email: currentUser.email, name: currentUser.name || currentUser.email.split('@')[0], isGuest: false };
    }
    if (typeof window !== 'undefined') {
      let email = localStorage.getItem('winning_heaven_guest_email');
      let name = localStorage.getItem('winning_heaven_guest_name');
      if (!email) {
        const randId = Math.floor(100000 + Math.random() * 900000);
        email = `guest_${randId}@winningheavenguest.com`;
        name = 'Guest';
        localStorage.setItem('winning_heaven_guest_email', email);
        localStorage.setItem('winning_heaven_guest_name', name);
      }
      return { email, name: name || 'Guest', isGuest: true };
    }
    return { email: 'guest@winningheaven.com', name: 'Guest', isGuest: true };
  };

  useEffect(() => {
    if (!isOpen) {
      setLoadingChat(false);
      setIsMinimized(false);
      setSelectedPromo(null);
      return;
    }

    const identity = getChatIdentity();
    let firstLoad = true;
    setLoadingChat(true);
    setMessages([]);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support?email=${encodeURIComponent(identity.email)}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
          if (typeof onMessagesSeenRef.current === 'function') {
            onMessagesSeenRef.current(data.messages || []);
          }
          const hasUnreadAdmin = (data.messages || []).some((m) => m.senderType === 'admin' && !m.read);
          if (hasUnreadAdmin) {
            fetch('/api/support', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: identity.email, role: 'player' })
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to fetch support messages:', err);
      } finally {
        if (firstLoad) {
          firstLoad = false;
          setLoadingChat(false);
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const msgToSend = customText !== null ? customText : input;
    if (!msgToSend.trim() && !attachment) return;

    const { email: userEmail, name: userName } = getChatIdentity();
    const msgText = msgToSend;
    const currentAttachment = attachment;

    if (customText === null) {
      setInput('');
    }
    setAttachment('');
    setSending(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          message: msgText,
          attachment: currentAttachment,
          senderType: 'player',
          senderEmail: userEmail
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Send support msg error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const compressed = await compressImageFile(file, { maxSize: 1200, quality: 0.65 });
      if (compressed) {
        setAttachment(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => setAttachment(reader.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Support upload error:', err);
      const reader = new FileReader();
      reader.onload = () => setAttachment(reader.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const unreadCount = messages.filter((m) => m.senderType === 'admin' && !m.read).length;

  return (
    <>
      {/* Dynamic visible scrollbars style */}
      <style>{`
        .custom-support-feed::-webkit-scrollbar {
          width: 6px;
        }
        .custom-support-feed::-webkit-scrollbar-track {
          background: rgba(4, 6, 15, 0.8);
          border-radius: 8px;
        }
        .custom-support-feed::-webkit-scrollbar-thumb {
          background: rgba(255, 200, 0, 0.45);
          border-radius: 8px;
          border: 1px solid rgba(255, 200, 0, 0.2);
        }
        .custom-support-feed::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 200, 0, 0.75);
        }
        .custom-chips-bar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-chips-bar::-webkit-scrollbar-track {
          background: rgba(6, 8, 18, 0.8);
        }
        .custom-chips-bar::-webkit-scrollbar-thumb {
          background: rgba(0, 240, 255, 0.4);
          border-radius: 4px;
        }
      `}</style>

      <AnimatePresence>
        {isMinimized ? (
          /* FLOATING COLLAPSED MINI BADGE */
          <motion.div
            key="minimized-support"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setIsMinimized(false)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 100000,
              background: 'linear-gradient(135deg, rgba(14, 20, 42, 0.95) 0%, rgba(6, 9, 24, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255, 200, 0, 0.4)',
              borderRadius: '30px',
              padding: '0.6rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 200, 0, 0.25)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <img src="/winning_heaven_logo.png" alt="Winning Heaven" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #060918',
                boxShadow: '0 0 8px #10b981'
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                VIP Live Chat
              </span>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                ● 24/7 Agent Online
              </span>
            </div>
            {unreadCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 900,
                borderRadius: '12px',
                padding: '0.15rem 0.5rem',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
              }}>
                {unreadCount}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '0 0 0 0.25rem'
              }}
            >
              &times;
            </button>
          </motion.div>
        ) : (
          /* FLOATING EXPANDED LIVE CHAT DOCK */
          <motion.div
            key="expanded-support"
            initial={{ opacity: 0, scale: 0.92, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 35 }}
            transition={{ duration: 0.28, cubicBezier: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 100000,
              width: '430px',
              maxWidth: 'calc(100vw - 32px)',
              height: '620px',
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(165deg, rgba(14, 18, 38, 0.98) 0%, rgba(5, 7, 18, 0.99) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1.5px solid rgba(255, 200, 0, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 200, 0, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* TOP HEADER */}
            <div style={{
              padding: '0.95rem 1.15rem',
              background: 'linear-gradient(135deg, rgba(22, 28, 56, 0.98) 0%, rgba(10, 14, 30, 0.98) 100%)',
              borderBottom: '1px solid rgba(255, 200, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: '2px solid #ffc800',
                  background: '#04060e',
                  overflow: 'hidden',
                  boxShadow: '0 0 15px rgba(255,200,0,0.4)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px'
                }}>
                  <img src="/winning_heaven_logo.png" alt="Winning Heaven" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
                      WINNING <span style={{ background: 'linear-gradient(135deg, #ffc800 0%, #e6a100 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SUPPORT</span>
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                    24/7 LIVE AGENT • ONLINE
                  </div>
                </div>
              </div>

              {/* ACTION CONTROLS (MINIMIZE & CLOSE) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Minimize Chat"
                >
                  <i className="fa-solid fa-minus" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'rgba(255, 200, 0, 0.1)',
                    border: '1px solid rgba(255, 200, 0, 0.25)',
                    color: '#ffc800',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Close Chat"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {/* QUICK ASSISTANCE CHIPS WITH PROMO DETAILS */}
            <div
              className="custom-chips-bar"
              style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(6, 8, 18, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.45rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              {QUICK_OPTIONS.map((opt) => {
                const isSelected = selectedPromo?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPromo(isSelected ? null : opt)}
                    style={{
                      background: isSelected ? 'rgba(255, 200, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? `1.5px solid ${opt.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? opt.color : '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 12px ${opt.color}40` : 'none'
                    }}
                  >
                    <i className={opt.icon} style={{ color: opt.color }} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* EXPANDABLE PROMO INFORMATION BANNER */}
            <AnimatePresence>
              {selectedPromo && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 16, 42, 0.98) 0%, rgba(8, 10, 24, 0.98) 100%)',
                    borderBottom: `1.5px solid ${selectedPromo.color}`,
                    padding: '0.9rem 1.1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.7)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        background: `${selectedPromo.color}22`,
                        border: `1px solid ${selectedPromo.color}`,
                        color: selectedPromo.color,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        letterSpacing: '0.04em'
                      }}>
                        {selectedPromo.badge}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPromo(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        lineHeight: 1
                      }}
                    >
                      &times;
                    </button>
                  </div>

                  <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 800, margin: '0.4rem 0 0.3rem 0', fontFamily: 'var(--font-heading)' }}>
                    {selectedPromo.title}
                  </h4>

                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', lineHeight: 1.45, margin: '0 0 0.6rem 0' }}>
                    {selectedPromo.details}
                  </p>

                  {/* Perks list */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {selectedPromo.perks.map((perk, pidx) => (
                      <span key={pidx} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffd700',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#00e676', fontSize: '0.65rem' }} />
                        {perk}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendMessage(null, selectedPromo.query);
                      setSelectedPromo(null);
                    }}
                    style={{
                      width: '100%',
                      background: `linear-gradient(135deg, ${selectedPromo.color} 0%, #ffaa00 100%)`,
                      color: '#000',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: `0 4px 15px ${selectedPromo.color}40`
                    }}
                  >
                    <i className="fa-solid fa-paper-plane" />
                    <span>{selectedPromo.actionLabel} &rarr;</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MESSAGES FEED CONTAINER WITH VISIBLE SCROLLBAR */}
            <div
              className="custom-support-feed"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 0.95rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: 'radial-gradient(circle at 50% 30%, rgba(255,200,0,0.02) 0%, transparent 70%), #04060f',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {loadingChat ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#ffc800', display: 'block', marginBottom: '0.5rem' }} />
                  Connecting to Support Agent...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '1rem', maxWidth: '300px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                    <i className="fa-solid fa-headset" style={{ fontSize: '1.6rem', color: '#ffc800' }} />
                  </div>
                  <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 0.3rem 0' }}>Welcome to VIP Live Support!</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>
                    Tap any topic above to view rules &amp; promos, or send a message below to chat instantly.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderType === 'player';
                  const hasMsgAttachment = Boolean(msg.attachment && String(msg.attachment).trim());

                  return (
                    <div
                      key={msg.id || msg._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {!isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', paddingLeft: '0.15rem' }}>
                          <img src="/winning_heaven_logo.png" alt="Agent" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffc800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Support Agent
                          </span>
                        </div>
                      )}

                      <div style={{
                        background: isMe
                          ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 150, 255, 0.25) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 200, 0, 0.14) 0%, rgba(212, 160, 23, 0.2) 100%)',
                        color: '#fff',
                        border: isMe ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 200, 0, 0.35)',
                        borderLeft: isMe ? '1px solid rgba(0, 240, 255, 0.4)' : '3px solid #ffc800',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '16px',
                        borderBottomRightRadius: isMe ? '2px' : '16px',
                        borderBottomLeftRadius: isMe ? '16px' : '2px',
                        fontSize: '0.82rem',
                        maxWidth: '86%',
                        fontWeight: 500,
                        wordBreak: 'break-word',
                        boxShadow: isMe ? '0 4px 15px rgba(0, 240, 255, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.4)',
                        lineHeight: 1.45
                      }}>
                        {msg.message}
                        {hasMsgAttachment && (
                          <div style={{ marginTop: '0.45rem' }}>
                            <img
                              src={msg.attachment}
                              alt="Attachment"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '180px',
                                display: 'block',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                cursor: 'zoom-in',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxSrc(msg.attachment);
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', paddingRight: isMe ? '0.15rem' : 0 }}>
                        <span>{isMe ? 'You' : 'Agent'}</span>
                        <span>•</span>
                        <span>{formatDeviceTime(msg.timestamp)}</span>
                        {isMe && (
                          msg.read ? (
                            <span style={{ color: '#00f0ff', fontWeight: 800 }}>• <i className="fa-solid fa-check-double" /> Seen</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>• <i className="fa-solid fa-check" /> Sent</span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* ATTACHMENT PREVIEW BOX */}
            {attachment && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(8, 12, 26, 0.98)',
                padding: '0.5rem 0.95rem',
                borderTop: '1.5px solid #ffc800'
              }}>
                <img src={attachment} alt="preview" style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #ffc800' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#ffc800', fontWeight: 800 }}>Image Proof Attached</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ready to send with message</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment('')}
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
                >
                  &times;
                </button>
              </div>
            )}

            {/* INPUT BAR DOCK */}
            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem 0.95rem',
              background: 'rgba(10, 14, 30, 0.98)',
              borderTop: '1px solid rgba(255, 200, 0, 0.2)',
              alignItems: 'center'
            }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAttachmentUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAttachment}
                style={{
                  background: 'rgba(255, 200, 0, 0.12)',
                  border: '1.5px solid rgba(255, 200, 0, 0.35)',
                  borderRadius: '12px',
                  color: '#ffc800',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Attach Screenshot / Image"
              >
                {uploadingAttachment ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paperclip" />}
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(6, 8, 18, 0.95)',
                  border: '1.5px solid rgba(255, 200, 0, 0.25)',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  height: '40px'
                }}
              />

              <button
                type="submit"
                disabled={sending || (!input.trim() && !attachment)}
                className="submit-btn"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  padding: 0,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ffc800 0%, #e6a100 100%)',
                  color: '#000',
                  margin: 0,
                  boxShadow: '0 4px 15px rgba(255,200,0,0.3)',
                  opacity: (sending || (!input.trim() && !attachment)) ? 0.5 : 1
                }}
              >
                {sending ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc('')} alt="Support attachment" />
    </>
  );
}
