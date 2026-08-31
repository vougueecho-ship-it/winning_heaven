'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const EMOJI_CATEGORIES = [
  {
    name: 'VIP & Casino',
    emojis: ['🎰', '💰', '🔥', '👑', '💎', '🎲', '⚡', '🚀', '🏆', '💸', '✨', '🎁', '💯', '🍀', '💵', '🤑']
  },
  {
    name: 'Smileys & Vibes',
    emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🥳', '🥺', '🤩', '😜', '😉', '😇', '🤔', '🤐', '🤝']
  },
  {
    name: 'Hands & Gestures',
    emojis: ['👍', '👏', '🙌', '🙏', '✌️', '🤙', '👌', '💪', '🫡', '🎯', '💖', '⭐', '🎉', '🌟', '💥', '👀']
  }
];

const QUICK_REACTION_EMOJIS = ['❤️', '👍', '🔥', '😂', '🎰', '👏'];
const QUICK_INSERT_EMOJIS = ['🎰', '🔥', '💰', '👍', '👑', '💎', '🚀', '❤️', '😂', '🙏'];

// Web Audio API VIP chime synthesizer
const playNotificationChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09); // A5
    gain2.gain.setValueAtTime(0.12, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.38);
  } catch {
    /* ignore audio policy blocks */
  }
};

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

  // New Chat Features State
  const [replyingTo, setReplyingTo] = useState(null); // { id, message, senderType, userName, hasAttachment }
  const [editingMessage, setEditingMessage] = useState(null); // { id, message }
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null); // { id, message, isMe }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);

  // Chat Settings State (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('wh_chat_sound');
    return v !== null ? v === 'true' : true;
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return 'medium';
    return localStorage.getItem('wh_chat_font_size') || 'medium';
  });
  const [autoScroll, setAutoScroll] = useState(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('wh_chat_autoscroll');
    return v !== null ? v === 'true' : true;
  });

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMsgCountRef = useRef(0);
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

  const identity = useMemo(() => getChatIdentity(), [currentUser]);

  // Persist settings
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('wh_chat_sound', String(next));
      return next;
    });
  };
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('wh_chat_font_size', size);
  };
  const toggleAutoScroll = () => {
    setAutoScroll((prev) => {
      const next = !prev;
      localStorage.setItem('wh_chat_autoscroll', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setLoadingChat(false);
      setIsMinimized(false);
      setSelectedPromo(null);
      setReplyingTo(null);
      setEditingMessage(null);
      setShowEmojiPicker(false);
      setShowSettingsModal(false);
      return;
    }

    let firstLoad = true;
    setLoadingChat(true);
    setMessages([]);
    previousMsgCountRef.current = 0;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support?email=${encodeURIComponent(identity.email)}`);
        const data = await res.json();
        if (data.success) {
          const newMsgs = data.messages || [];
          // Sound chime if new admin message arrived
          if (!firstLoad && newMsgs.length > previousMsgCountRef.current) {
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg?.senderType === 'admin' && soundEnabled) {
              playNotificationChime();
            }
          }
          previousMsgCountRef.current = newMsgs.length;
          setMessages(newMsgs);

          if (typeof onMessagesSeenRef.current === 'function') {
            onMessagesSeenRef.current(newMsgs);
          }

          const hasUnreadAdmin = newMsgs.some((m) => m.senderType === 'admin' && !m.read);
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
  }, [isOpen, identity.email, soundEnabled]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (!isMinimized && autoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized, autoScroll]);

  // Smooth scroll to a quoted message
  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const targetEl = document.getElementById(`support-msg-${msgId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2500);
    }
  };

  // Send message or edit existing
  const handleSendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const msgToSend = customText !== null ? customText : input;
    if (!msgToSend.trim() && !attachment) return;

    // IF EDITING EXISTING MESSAGE
    if (editingMessage) {
      const editId = editingMessage.id;
      const updatedText = msgToSend.trim();
      setEditingMessage(null);
      setInput('');
      try {
        const res = await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editId,
            message: updatedText,
            userEmail: identity.email
          })
        });
        const d = await res.json();
        if (d.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === editId ? { ...m, message: updatedText, isEdited: true, editedAt: new Date().toISOString() } : m))
          );
        }
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
      return;
    }

    // Delete message for player only
    const handleDeleteForMe = async (msgId) => {
      if (!msgId) return;
      setDeleteTargetMessage(null);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      try {
        await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: msgId,
            action: 'delete_for_me',
            userEmail: identity.email,
            userIdentifier: identity.email,
            role: 'player'
          })
        });
      } catch (err) {
        console.error('Failed to delete message for me:', err);
      }
    };

    // Delete message for everyone
    const handleDeleteForEveryone = async (msgId) => {
      if (!msgId) return;
      setDeleteTargetMessage(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, message: '🚫 This message was deleted', deletedForEveryone: true, hasAttachment: false, attachment: '' }
            : m
        )
      );
      try {
        await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: msgId,
            action: 'delete_for_everyone',
            userEmail: identity.email,
            role: 'player'
          })
        });
      } catch (err) {
        console.error('Failed to delete message for everyone:', err);
      }
    };

    // NORMAL NEW MESSAGE / REPLY
    const msgText = msgToSend;
    const currentAttachment = attachment;
    const currentReplyTo = replyingTo;

    if (customText === null) {
      setInput('');
    }
    setAttachment('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setSending(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: identity.email,
          userName: identity.name,
          message: msgText,
          attachment: currentAttachment,
          senderType: 'player',
          senderEmail: identity.email,
          replyTo: currentReplyTo
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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Toggle emoji reaction on message
  const handleToggleReaction = async (msgId, emoji) => {
    setActiveMenuMsgId(null);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          action: 'react',
          emoji,
          userIdentifier: identity.email
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, reactions: data.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Attachment upload
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

  // Export chat transcript to .txt file
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert('No messages in chat history to export.');
      return;
    }
    const lines = messages.map((m) => {
      const time = new Date(m.timestamp).toLocaleString();
      const sender = m.senderType === 'player' ? (identity.name || 'You') : 'VIP Support Agent';
      const text = m.message || (m.hasAttachment || m.attachment ? '[Attached Screenshot]' : '');
      const replyInfo = m.replyTo ? ` (Replying to: "${m.replyTo.message?.slice(0, 40)}...")` : '';
      return `[${time}] ${sender}${replyInfo}: ${text}`;
    });
    const header = `=========================================================\nWINNING HEAVEN VIP 24/7 SUPPORT TRANSCRIPT\nPlayer: ${identity.name} (${identity.email})\nExported: ${new Date().toLocaleString()}\n=========================================================\n\n`;
    const fullContent = header + lines.join('\n\n');
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WinningHeaven_Chat_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your support chat history? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/support?email=${encodeURIComponent(identity.email)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setShowSettingsModal(false);
      } else {
        alert(data.message || 'Failed to clear chat history.');
      }
    } catch (err) {
      console.error(err);
      alert('Error clearing chat history.');
    }
  };

  if (!isOpen) return null;

  const unreadCount = messages.filter((m) => m.senderType === 'admin' && !m.read).length;
  const currentFontSizeStyle = fontSize === 'small' ? '0.76rem' : fontSize === 'large' ? '0.92rem' : '0.84rem';

  return (
    <>
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
        @keyframes highlightFlash {
          0% { background: rgba(255, 200, 0, 0.4); transform: scale(1.02); }
          50% { background: rgba(255, 200, 0, 0.2); }
          100% { background: transparent; transform: scale(1); }
        }
        .msg-highlighted {
          animation: highlightFlash 2s ease-out;
          border-radius: 16px;
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
              width: '450px',
              maxWidth: 'calc(100vw - 24px)',
              height: '650px',
              maxHeight: 'calc(100vh - 35px)',
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
              padding: '0.85rem 1.1rem',
              background: 'linear-gradient(135deg, rgba(22, 28, 56, 0.98) 0%, rgba(10, 14, 30, 0.98) 100%)',
              borderBottom: '1px solid rgba(255, 200, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
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
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
                      WINNING <span style={{ background: 'linear-gradient(135deg, #ffc800 0%, #e6a100 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SUPPORT</span>
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.12rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                    24/7 LIVE AGENT • ONLINE
                  </div>
                </div>
              </div>

              {/* ACTION CONTROLS (SETTINGS, MINIMIZE, CLOSE) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {/* Chat Settings Trigger */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal((prev) => !prev)}
                  style={{
                    background: showSettingsModal ? 'rgba(255, 200, 0, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: showSettingsModal ? '#ffc800' : 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Chat Settings & Preferences"
                >
                  <i className="fa-solid fa-gear" />
                </button>

                {/* Minimize Button */}
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
                    fontSize: '0.9rem',
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

                {/* Close Button */}
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
                    fontSize: '0.95rem',
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

            {/* CHAT SETTINGS POPUP MODAL */}
            <AnimatePresence>
              {showSettingsModal && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    background: 'rgba(10, 14, 30, 0.98)',
                    borderBottom: '1.5px solid rgba(255, 200, 0, 0.35)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    zIndex: 10,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffc800', fontWeight: 800, fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-sliders" /> CHAT PREFERENCES &amp; SETTINGS
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      &times;
                    </button>
                  </div>

                  {/* Setting 1: Sound Notifications */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Sound Alerts</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Play VIP chime when agent replies</div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSound}
                      style={{
                        background: soundEnabled ? '#10b981' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0.3rem 0.75rem',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Setting 2: Font Size */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Chat Text Size</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Scale message readability</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {['small', 'medium', 'large'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => changeFontSize(s)}
                          style={{
                            background: fontSize === s ? 'rgba(255, 200, 0, 0.25)' : 'rgba(255,255,255,0.06)',
                            border: fontSize === s ? '1px solid #ffc800' : '1px solid rgba(255,255,255,0.1)',
                            color: fontSize === s ? '#ffc800' : '#aaa',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            cursor: 'pointer'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Setting 3: Auto-scroll */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Auto Scroll</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Automatically scroll to new messages</div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAutoScroll}
                      style={{
                        background: autoScroll ? '#10b981' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0.3rem 0.75rem',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {autoScroll ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Setting 4: Actions (Export & Clear) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={handleExportChat}
                      style={{
                        flex: 1,
                        background: 'rgba(0, 240, 255, 0.12)',
                        border: '1px solid rgba(0, 240, 255, 0.35)',
                        color: '#00f0ff',
                        borderRadius: '10px',
                        padding: '0.45rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fa-solid fa-download" /> Export Transcript
                    </button>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      style={{
                        flex: 1,
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#ef4444',
                        borderRadius: '10px',
                        padding: '0.45rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fa-solid fa-trash-can" /> Clear History
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QUICK ASSISTANCE CHIPS */}
            <div
              className="custom-chips-bar"
              style={{
                padding: '0.45rem 0.85rem',
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
                      padding: '0.32rem 0.7rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
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
                    <button
                      type="button"
                      onClick={() => setSelectedPromo(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  </div>

                  <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 800, margin: '0.4rem 0 0.3rem 0', fontFamily: 'var(--font-heading)' }}>
                    {selectedPromo.title}
                  </h4>

                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.74rem', lineHeight: 1.45, margin: '0 0 0.6rem 0' }}>
                    {selectedPromo.details}
                  </p>

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

            {/* MESSAGES FEED CONTAINER */}
            <div
              ref={messagesContainerRef}
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
                  const isHighlighted = highlightedMsgId === msg.id;
                  const isReplyingThis = replyingTo?.id === msg.id;
                  const reactions = msg.reactions || {};

                  return (
                    <div
                      key={msg.id || msg._id}
                      id={`support-msg-${msg.id}`}
                      className={isHighlighted ? 'msg-highlighted' : ''}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        position: 'relative',
                        transition: 'all 0.2s ease'
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

                      {/* MESSAGE BUBBLE */}
                      <div
                        style={{
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
                          fontSize: currentFontSizeStyle,
                          maxWidth: '86%',
                          fontWeight: 500,
                          wordBreak: 'break-word',
                          boxShadow: isMe ? '0 4px 15px rgba(0, 240, 255, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.4)',
                          lineHeight: 1.45,
                          position: 'relative'
                        }}
                      >
                        {/* QUOTED REPLY PREVIEW (WHATSAPP STYLE) */}
                        {msg.replyTo && (
                          <div
                            onClick={() => scrollToMessage(msg.replyTo.id)}
                            style={{
                              background: 'rgba(0, 0, 0, 0.35)',
                              borderLeft: `3px solid ${msg.replyTo.senderType === 'admin' ? '#ffc800' : '#00f0ff'}`,
                              borderRadius: '8px',
                              padding: '0.35rem 0.55rem',
                              marginBottom: '0.45rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.15rem'
                            }}
                          >
                            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: msg.replyTo.senderType === 'admin' ? '#ffc800' : '#00f0ff' }}>
                              {msg.replyTo.senderType === 'admin' ? 'Support Agent' : 'You'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.replyTo.message || (msg.replyTo.hasAttachment ? '📷 Attached Photo' : '')}
                            </span>
                          </div>
                        )}

                        {/* Main Text Content or Deleted Notice */}
                        {msg.deletedForEveryone ? (
                          <div style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.15rem 0' }}>
                            <i className="fa-solid fa-ban" style={{ fontSize: '0.82rem', opacity: 0.8 }} />
                            <span>This message was deleted</span>
                          </div>
                        ) : (
                          <>
                            <div>{msg.message}</div>

                            {/* Attachment Image */}
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
                          </>
                        )}

                        {/* HOVER / TAP ACTION BUTTONS (REPLY, EDIT, DELETE, REACT) */}
                        {!msg.deletedForEveryone && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.35rem',
                            paddingTop: '0.35rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            justifyContent: isMe ? 'flex-end' : 'flex-start'
                          }}>
                            {/* Reply Button (WhatsApp Style) */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(null);
                                setReplyingTo({
                                  id: msg.id,
                                  message: msg.message,
                                  senderType: msg.senderType,
                                  userName: msg.userName,
                                  hasAttachment: hasMsgAttachment
                                });
                                inputRef.current?.focus();
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.68rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.35rem',
                                borderRadius: '4px'
                              }}
                              title="Reply to this message"
                            >
                              <i className="fa-solid fa-reply" /> Reply
                            </button>

                            {/* Edit Button (Only for player's own message) */}
                            {isMe && msg.message && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setEditingMessage({ id: msg.id, message: msg.message });
                                  setInput(msg.message);
                                  inputRef.current?.focus();
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'rgba(255,255,255,0.6)',
                                  fontSize: '0.68rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.15rem 0.35rem',
                                  borderRadius: '4px'
                                }}
                                title="Edit this message"
                              >
                                <i className="fa-solid fa-pen-to-square" /> Edit
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteTargetMessage({ id: msg.id, message: msg.message, isMe })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.68rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.35rem',
                                borderRadius: '4px'
                              }}
                              title="Delete message"
                            >
                              <i className="fa-solid fa-trash-can" /> Delete
                            </button>

                            {/* Quick Emoji Reaction Trigger */}
                            <div style={{ display: 'inline-flex', gap: '0.2rem', marginLeft: '0.25rem' }}>
                              {QUICK_REACTION_EMOJIS.slice(0, 3).map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, em)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    padding: '0.1rem',
                                    opacity: 0.7,
                                    transition: 'transform 0.15s ease'
                                  }}
                                  title={`React with ${em}`}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EMOJI REACTION PILLS ROW */}
                      {Object.keys(reactions).length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.25rem',
                          marginTop: '0.2rem',
                          padding: isMe ? '0 0.2rem 0 0' : '0 0 0 0.2rem'
                        }}>
                          {Object.entries(reactions).map(([em, voters]) => {
                            const count = Array.isArray(voters) ? voters.length : 0;
                            if (count === 0) return null;
                            const hasMyVote = Array.isArray(voters) && voters.includes(identity.email.toLowerCase().trim());
                            return (
                              <button
                                key={em}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, em)}
                                style={{
                                  background: hasMyVote ? 'rgba(255, 200, 0, 0.25)' : 'rgba(10, 14, 30, 0.8)',
                                  border: hasMyVote ? '1px solid #ffc800' : '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '12px',
                                  padding: '0.15rem 0.45rem',
                                  color: '#fff',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                }}
                              >
                                <span>{em}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: hasMyVote ? '#ffc800' : 'rgba(255,255,255,0.8)' }}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* TIMESTAMP & STATUS */}
                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', paddingRight: isMe ? '0.15rem' : 0 }}>
                        <span>{isMe ? 'You' : 'Agent'}</span>
                        <span>•</span>
                        <span>{formatDeviceTime(msg.timestamp)}</span>
                        {msg.isEdited && (
                          <span style={{ color: '#ffd700', fontStyle: 'italic', fontWeight: 600 }}>• (edited)</span>
                        )}
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

            {/* QUOTED REPLY BAR (WHATSAPP STYLE ABOVE INPUT) */}
            {replyingTo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.95rem',
                background: 'rgba(8, 12, 26, 0.98)',
                borderTop: '1.5px solid #00f0ff',
                borderLeft: `4px solid ${replyingTo.senderType === 'admin' ? '#ffc800' : '#00f0ff'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: replyingTo.senderType === 'admin' ? '#ffc800' : '#00f0ff' }}>
                    <i className="fa-solid fa-reply" style={{ marginRight: '4px' }} />
                    Replying to {replyingTo.senderType === 'admin' ? 'Support Agent' : 'Yourself'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replyingTo.message || (replyingTo.hasAttachment ? '📷 Attached Photo' : '')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  &times;
                </button>
              </div>
            )}

            {/* EDITING MESSAGE BAR */}
            {editingMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.95rem',
                background: 'rgba(255, 200, 0, 0.12)',
                borderTop: '1.5px solid #ffc800',
                color: '#ffc800'
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className="fa-solid fa-pen-to-square" /> Editing your message...
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(null);
                    setInput('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ffc800', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                >
                  Cancel Edit
                </button>
              </div>
            )}

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

            {/* QUICK 1-TAP EMOJI INSERT BAR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.95rem',
              background: 'rgba(8, 11, 24, 0.98)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto'
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '2px', flexShrink: 0 }}>
                QUICK:
              </span>
              {QUICK_INSERT_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInput((prev) => prev + em)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* EMOJI PICKER POPOVER */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '170px' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    background: 'rgba(10, 14, 30, 0.99)',
                    borderTop: '1.5px solid rgba(255, 200, 0, 0.35)',
                    padding: '0.65rem 0.95rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    zIndex: 15
                  }}
                >
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.name}>
                      <div style={{ fontSize: '0.65rem', color: '#ffc800', fontWeight: 800, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        {cat.name}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.35rem' }}>
                        {cat.emojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setInput((prev) => prev + em);
                              inputRef.current?.focus();
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '0.35rem',
                              fontSize: '1.15rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.1s ease'
                            }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* INPUT BAR DOCK */}
            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              gap: '0.45rem',
              padding: '0.7rem 0.95rem',
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

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAttachment}
                style={{
                  background: 'rgba(255, 200, 0, 0.12)',
                  border: '1.5px solid rgba(255, 200, 0, 0.35)',
                  borderRadius: '12px',
                  color: '#ffc800',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Attach Screenshot / Proof"
              >
                {uploadingAttachment ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paperclip" />}
              </button>

              {/* Emoji Picker Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                style={{
                  background: showEmojiPicker ? 'rgba(255, 200, 0, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: showEmojiPicker ? '1.5px solid #ffc800' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: showEmojiPicker ? '#ffc800' : '#fff',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Insert Emojis"
              >
                <i className="fa-regular fa-face-smile" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                placeholder={editingMessage ? 'Update message...' : replyingTo ? `Reply to ${replyingTo.senderType === 'admin' ? 'Agent' : 'Yourself'}...` : 'Type your message...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(6, 8, 18, 0.95)',
                  border: '1.5px solid rgba(255, 200, 0, 0.25)',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  color: '#fff',
                  fontSize: currentFontSizeStyle,
                  outline: 'none',
                  height: '38px'
                }}
              />

              {/* Send / Update Button */}
              <button
                type="submit"
                disabled={sending || (!input.trim() && !attachment)}
                className="submit-btn"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  padding: 0,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: editingMessage
                    ? 'linear-gradient(135deg, #00f0ff 0%, #00a8ff 100%)'
                    : 'linear-gradient(135deg, #ffc800 0%, #e6a100 100%)',
                  color: '#000',
                  margin: 0,
                  boxShadow: '0 4px 15px rgba(255,200,0,0.3)',
                  opacity: (sending || (!input.trim() && !attachment)) ? 0.5 : 1
                }}
                title={editingMessage ? 'Save Edited Message' : 'Send Message'}
              >
                {sending ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : editingMessage ? (
                  <i className="fa-solid fa-check" />
                ) : (
                  <i className="fa-solid fa-paper-plane" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Message Options Modal (WhatsApp Style) */}
      <AnimatePresence>
        {deleteTargetMessage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg, #101528 0%, #080a14 100%)',
                border: '1.5px solid rgba(255,200,0,0.3)',
                borderRadius: '16px',
                padding: '1.25rem',
                maxWidth: '340px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.95rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-trash-can" /> Delete Message?
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.4 }}>
                "{deleteTargetMessage.message?.slice(0, 80) || 'Attachment'}{deleteTargetMessage.message?.length > 80 ? '...' : ''}"
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.25rem' }}>
                {deleteTargetMessage.isMe && (
                  <button
                    type="button"
                    onClick={() => handleDeleteForEveryone(deleteTargetMessage.id)}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <i className="fa-solid fa-users" /> Delete for Everyone
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteForMe(deleteTargetMessage.id)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <i className="fa-solid fa-user" /> Delete for Me
                </button>
                
                <button
                  type="button"
                  onClick={() => setDeleteTargetMessage(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.55)',
                    padding: '0.4rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc('')} alt="Support attachment" />
    </>
  );
}
