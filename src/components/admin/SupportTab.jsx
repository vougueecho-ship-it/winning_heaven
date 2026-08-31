import React, { useState, useEffect, useRef } from 'react';
import usePollingSWR from '../../hooks/usePollingSWR';
import { POLL } from '../../lib/pollingConfig';
import { registerNativeBackHandler } from '../../lib/nativeBack';
import { ImageLightbox } from '../Modals';
import { formatDeviceTime } from '../../lib/formatDateTime';

export default function SupportTab({ adminUser }) {
  const [chatSearch, setChatSearch] = useState('');
  const [activeChatEmail, setActiveChatEmail] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminAttachment, setAdminAttachment] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [playerHits, setPlayerHits] = useState([]);
  const [playerSearchLoading, setPlayerSearchLoading] = useState(false);
  const [openedPlayers, setOpenedPlayers] = useState({}); // email -> { email, name }
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Translation States (Roman Urdu <-> English)
  const [translatedMessages, setTranslatedMessages] = useState({}); // msgId -> { loading, show, romanUrdu, urdu }
  const [autoTranslateIncoming, setAutoTranslateIncoming] = useState(false);
  const [isTranslatingAdmin, setIsTranslatingAdmin] = useState(false);
  const [adminTranslationPreview, setAdminTranslationPreview] = useState(null);
  const [adminOriginalRoman, setAdminOriginalRoman] = useState('');

  // Message Edit & Delete States
  const [editingMessage, setEditingMessage] = useState(null); // { id, message }
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null); // { id, senderType, message, isMe }
  
  const chatEndRef = useRef(null);
  const adminInputRef = useRef(null);

  const distQueryParam = adminUser?.distributorId ? `&adminDistributorId=${adminUser.distributorId}` : '';

  // Android back: close lightbox first, then open chat
  useEffect(() => {
    return registerNativeBackHandler(() => {
      if (lightboxSrc) {
        setLightboxSrc('');
        return true;
      }
      if (!activeChatEmail) return false;
      setActiveChatEmail(null);
      return true;
    });
  }, [activeChatEmail, lightboxSrc]);

  const { data: convData, mutate: mutateConversations, error: convError } = usePollingSWR(
    `/api/support?limit=200${distQueryParam}`,
    POLL.SUPPORT
  );

  // keepPreviousData:false — switching chats must NOT keep showing the previous customer's messages
  // limit=100 newest messages so long threads still show the latest replies
  const {
    data: activeChatData,
    mutate: mutateActiveChat,
    isLoading: chatLoading,
    isValidating: chatValidating
  } = usePollingSWR(
    activeChatEmail
      ? `/api/support?email=${encodeURIComponent(activeChatEmail)}&limit=100${distQueryParam}`
      : null,
    POLL.CHAT,
    { keepPreviousData: false }
  );

  // Search registered players by Gmail/name so staff can message before player texts first
  useEffect(() => {
    const q = chatSearch.trim();
    if (q.length < 2) {
      setPlayerHits([]);
      setPlayerSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setPlayerSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const distParam = adminUser?.distributorId
          ? `&adminDistributorId=${encodeURIComponent(adminUser.distributorId)}`
          : '';
        const res = await fetch(
          `/api/users?search=${encodeURIComponent(q)}&limit=8&page=1${distParam}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (!data.success) {
          setPlayerHits([]);
          return;
        }
        const hits = (data.users || [])
          .filter((u) => {
            const role = String(u.role || 'user').toLowerCase();
            return !role || role === 'user';
          })
          .map((u) => ({
            email: String(u.email || '').toLowerCase().trim(),
            name: (u.name || '').trim() || String(u.email || '').split('@')[0]
          }))
          .filter((u) => u.email);
        setPlayerHits(hits);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Support player search failed:', err);
          setPlayerHits([]);
        }
      } finally {
        setPlayerSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [chatSearch, adminUser?.distributorId]);

  const allMessages = convData?.messages || [];
  // Only show messages for the currently selected email (guards against any stale cache)
  const activeChatMessages = (() => {
    const msgs = activeChatData?.messages || [];
    if (!activeChatEmail || !msgs.length) return msgs;
    const emailKey = activeChatEmail.toLowerCase();
    const mismatched = msgs.some(
      (m) => m.userEmail && String(m.userEmail).toLowerCase() !== emailKey
    );
    return mismatched ? [] : msgs;
  })();
  const showChatLoading = Boolean(activeChatEmail) && (chatLoading || (chatValidating && !activeChatData));

  const resolveDisplayName = (email, preferredName) => {
    const emailKey = String(email || '').toLowerCase().trim();
    if (!emailKey) return 'Guest';
    if (emailKey.includes('@winningheavenguest.com') || emailKey.startsWith('guest_')) {
      return 'Guest';
    }
    const raw = String(preferredName || '').trim();
    if (raw && !/^support\s*agent$/i.test(raw) && !/^player$/i.test(raw)) {
      if (/^guest(\s*#?\d+)?$/i.test(raw)) return 'Guest';
      return raw;
    }
    return emailKey.split('@')[0] || 'Guest';
  };

  // Prefer server-built conversation list (includes unread threads that raw
  // message windows used to drop). Fall back to grouping messages.
  let conversations = [];
  if (Array.isArray(convData?.conversations)) {
    conversations = convData.conversations.map((c) => ({
      email: String(c.email || c.userEmail || '').toLowerCase().trim(),
      name: resolveDisplayName(c.email || c.userEmail, c.name || c.playerName),
      lastMessage: c.lastMessage || '',
      timestamp: c.timestamp,
      unread: !!c.unread
    })).filter((c) => c.email);
  } else {
    const groups = {};
    allMessages.forEach((msg) => {
      const email = (msg.userEmail || '').toLowerCase();
      if (!email) return;

      if (!groups[email]) {
        groups[email] = {
          email: msg.userEmail,
          name: null,
          lastMessage: msg.message || (msg.attachment ? '[Image]' : ''),
          timestamp: msg.timestamp,
          unread: false
        };
      }

      const g = groups[email];
      const candidate =
        msg.playerName ||
        (msg.senderType === 'player' ? msg.userName : '') ||
        '';
      if (candidate && !/^support\s*agent$/i.test(String(candidate))) {
        g.name = candidate;
      }
      if (msg.senderType === 'player' && msg.read === false) {
        g.unread = true;
      }
    });

    conversations = Object.values(groups).map((c) => ({
      ...c,
      email: String(c.email || '').toLowerCase().trim(),
      name: resolveDisplayName(c.email, c.name)
    }));
  }

  // Keep manually opened registered players in the list even before first message
  Object.values(openedPlayers).forEach((p) => {
    const email = (p.email || '').toLowerCase();
    if (!email || conversations.some((c) => c.email === email)) return;
    conversations.push({
      email,
      name: resolveDisplayName(email, p.name),
      lastMessage: 'No messages yet — start the chat',
      timestamp: p.openedAt || new Date().toISOString(),
      unread: false,
      isNewThread: true
    });
  });

  conversations = conversations.sort((a, b) => {
    if (a.unread && !b.unread) return -1;
    if (!a.unread && b.unread) return 1;
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });

  const filteredConversations = conversations.filter(
    (c) =>
      !chatSearch.trim() ||
      c.email.toLowerCase().includes(chatSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(chatSearch.toLowerCase()))
  );

  const activeChatDisplayName = activeChatEmail
    ? resolveDisplayName(
        activeChatEmail,
        activeChatData?.playerName ||
          openedPlayers[activeChatEmail.toLowerCase()]?.name ||
          conversations.find((c) => c.email.toLowerCase() === activeChatEmail.toLowerCase())?.name ||
          activeChatMessages.find((m) => m.playerName)?.playerName ||
          activeChatMessages.find((m) => m.senderType === 'player' && m.userName)?.userName
      )
    : '';

  const openPlayerChat = (player) => {
    const email = String(player.email || '').toLowerCase().trim();
    if (!email) return;
    setOpenedPlayers((prev) => ({
      ...prev,
      [email]: {
        email,
        name: resolveDisplayName(email, player.name),
        openedAt: new Date().toISOString()
      }
    }));
    setActiveChatEmail(email);
    setChatSearch('');
    setPlayerHits([]);
    setAdminReplyText('');
    setAdminAttachment('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  useEffect(() => {
    if (!activeChatEmail) return;

    const markAsRead = async () => {
      try {
        await fetch('/api/support', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: activeChatEmail, role: 'admin' })
        });
        mutateConversations();
      } catch (err) {
        console.error('Failed to mark support messages as read:', err);
      }
    };

    markAsRead();
  }, [activeChatEmail, activeChatMessages.length, mutateConversations]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('Image file size must be less than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAdminAttachment(reader.result);
    };
    reader.onerror = () => {
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Translate Roman Urdu to English for Admin message
  const handleTranslateAdminText = async () => {
    const text = adminReplyText.trim();
    if (!text || isTranslatingAdmin) return;
    setIsTranslatingAdmin(true);
    setAdminOriginalRoman(text);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: 'to_english' })
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setAdminTranslationPreview(data.translation);
      } else {
        alert(data.message || 'Could not translate text.');
      }
    } catch (err) {
      console.error('Admin translation error:', err);
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslatingAdmin(false);
    }
  };

  // Translate Roman Urdu to English and Send to Player in 1 Click
  const handleTranslateAndSendAdminReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = adminReplyText.trim();
    if (!text && !adminAttachment) return;
    if (!text && adminAttachment) {
      handleSendAdminReply(e);
      return;
    }

    setIsTranslatingAdmin(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: 'to_english' })
      });
      const data = await res.json();
      const englishText = data.success && data.translation ? data.translation : text;
      handleSendAdminReply(e, englishText);
    } catch (err) {
      console.error('Admin translate & send error:', err);
      handleSendAdminReply(e, text);
    } finally {
      setIsTranslatingAdmin(false);
    }
  };

  // Translate Player message to Roman Urdu (and Urdu script)
  const handleTranslateMessage = async (msgId, text) => {
    if (!msgId || !text) return;
    const existing = translatedMessages[msgId];
    if (existing?.romanUrdu) {
      setTranslatedMessages((prev) => ({
        ...prev,
        [msgId]: { ...existing, show: !existing.show }
      }));
      return;
    }

    setTranslatedMessages((prev) => ({
      ...prev,
      [msgId]: { loading: true, show: true }
    }));

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: 'to_roman_urdu' })
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedMessages((prev) => ({
          ...prev,
          [msgId]: {
            loading: false,
            show: true,
            romanUrdu: data.romanUrdu || data.translation || text,
            urdu: data.urdu || ''
          }
        }));
      } else {
        setTranslatedMessages((prev) => ({
          ...prev,
          [msgId]: { loading: false, show: true, romanUrdu: 'Translation failed', urdu: '' }
        }));
      }
    } catch (err) {
      console.error('Player msg translation error:', err);
      setTranslatedMessages((prev) => ({
        ...prev,
        [msgId]: { loading: false, show: true, romanUrdu: 'Translation failed', urdu: '' }
      }));
    }
  };

  // Auto-translate incoming player messages if autoTranslateIncoming toggle is ON
  useEffect(() => {
    if (!autoTranslateIncoming || !activeChatMessages.length) return;
    activeChatMessages.forEach((msg) => {
      if (msg.senderType === 'player' && msg.message && !translatedMessages[msg.id]) {
        handleTranslateMessage(msg.id, msg.message);
      }
    });
  }, [autoTranslateIncoming, activeChatMessages]);

  // Start editing an admin message
  const handleStartEdit = (msg) => {
    if (!msg) return;
    setReplyingTo(null);
    setEditingMessage({ id: msg.id, message: msg.message });
    setAdminReplyText(msg.message);
    adminInputRef.current?.focus();
  };

  // Delete message for me (hidden from admin view)
  const handleDeleteForMe = async (msgId) => {
    if (!msgId) return;
    setDeleteTargetMessage(null);
    mutateActiveChat((current) => {
      const prev = current?.messages || activeChatMessages;
      return {
        ...current,
        messages: prev.filter((m) => m.id !== msgId)
      };
    }, false);

    try {
      await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          action: 'delete_for_me',
          role: 'admin',
          userIdentifier: 'admin'
        })
      });
    } catch (err) {
      console.error('Delete for me error:', err);
    }
  };

  // Delete message for everyone (replaces with "🚫 This message was deleted")
  const handleDeleteForEveryone = async (msgId) => {
    if (!msgId) return;
    setDeleteTargetMessage(null);
    mutateActiveChat((current) => {
      const prev = current?.messages || activeChatMessages;
      return {
        ...current,
        messages: prev.map((m) =>
          m.id === msgId
            ? { ...m, message: '🚫 This message was deleted', deletedForEveryone: true, hasAttachment: false, attachment: '' }
            : m
        )
      };
    }, false);

    try {
      await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          action: 'delete_for_everyone',
          role: 'admin'
        })
      });
    } catch (err) {
      console.error('Delete for everyone error:', err);
    }
  };

  const handleSendAdminReply = async (e, overrideText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const replyMsg = (overrideText !== null ? overrideText : adminReplyText).trim();
    if ((!replyMsg && !adminAttachment) || !activeChatEmail || !adminUser) return;

    // IF IN EDIT MODE
    if (editingMessage) {
      const editId = editingMessage.id;
      const updatedText = replyMsg;
      setEditingMessage(null);
      setAdminReplyText('');
      mutateActiveChat((current) => {
        const prev = current?.messages || activeChatMessages;
        return {
          ...current,
          messages: prev.map((m) =>
            m.id === editId
              ? { ...m, message: updatedText, isEdited: true, editedAt: new Date().toISOString() }
              : m
          )
        };
      }, false);

      try {
        await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editId,
            message: updatedText,
            role: 'admin',
            action: 'edit'
          })
        });
      } catch (err) {
        console.error('Failed to edit admin message:', err);
      }
      return;
    }

    setAdminReplyText('');
    setAdminTranslationPreview(null);
    setAdminOriginalRoman('');
    const replyAttachment = adminAttachment;
    setAdminAttachment('');
    const currentReplyTo = replyingTo;
    setReplyingTo(null);
    setShowEmojiPicker(false);

    const tempId = 'temp-' + Date.now();
    const tempMessage = {
      id: tempId,
      userEmail: activeChatEmail,
      userName: activeChatDisplayName || 'Player',
      message: replyMsg,
      attachment: replyAttachment,
      senderType: 'admin',
      senderEmail: adminUser.email,
      timestamp: new Date().toISOString(),
      replyTo: currentReplyTo
    };

    mutateActiveChat(
      { success: true, messages: [...activeChatMessages, tempMessage], playerName: activeChatDisplayName },
      false
    );

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: activeChatEmail,
          userName: activeChatDisplayName || 'Player',
          message: replyMsg,
          attachment: replyAttachment,
          senderType: 'admin',
          senderEmail: adminUser.email,
          replyTo: currentReplyTo
        })
      });
      const data = await response.json();
      if (data.success) {
        const saved = data.message || {};
        const confirmed = {
          ...saved,
          playerName: activeChatDisplayName,
          // Keep inline preview if we just uploaded; otherwise use lazy URL
          attachment: replyAttachment
            || (saved.hasAttachment && saved.id
              ? `/api/support?attachmentId=${encodeURIComponent(saved.id)}`
              : '')
        };
        // Replace temp bubble with saved message — don't wait on a full refetch that
        // can briefly wipe the thread (and used to drop newest msgs past the old limit).
        mutateActiveChat(
          (current) => {
            const prev = current?.messages || activeChatMessages;
            const withoutTemp = prev.filter((m) => m.id !== tempId);
            const already = withoutTemp.some((m) => m.id === confirmed.id);
            return {
              success: true,
              playerName: activeChatDisplayName,
              messages: already ? withoutTemp : [...withoutTemp, confirmed]
            };
          },
          { revalidate: true }
        );
        mutateConversations();
      } else {
        // Roll back optimistic bubble on failure
        mutateActiveChat(
          (current) => ({
            success: true,
            playerName: activeChatDisplayName,
            messages: (current?.messages || []).filter((m) => m.id !== tempId)
          }),
          false
        );
        alert(data.message || 'Failed to send reply.');
      }
    } catch (err) {
      console.error('Send admin reply error:', err);
      mutateActiveChat(
        (current) => ({
          success: true,
          playerName: activeChatDisplayName,
          messages: (current?.messages || []).filter((m) => m.id !== tempId)
        }),
        false
      );
    }
  };

  return (
    <div className={`support-chat-layout admin-layout-split${activeChatEmail ? ' support-chat-layout--active' : ''}`}>
      <div className="admin-section-card support-chat-sidebar">
        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--gold-primary)', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
            <i className="fa-solid fa-comments"></i> Active Conversations
          </h4>
          <div className="input-wrapper search-wrapper" style={{ background: '#0b0d16', padding: '0.35rem 0.75rem' }}>
            <input
              type="text"
              placeholder="Search chats or player Gmail..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              style={{ fontSize: '0.75rem' }}
            />
          </div>
          <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.35 }}>
            Search a registered player&apos;s Gmail to message them even if they never opened support.
          </p>

          {(playerSearchLoading || playerHits.length > 0 || chatSearch.trim().length >= 2) && chatSearch.trim().length >= 2 && (
            <div
              style={{
                marginTop: '0.5rem',
                background: '#070912',
                border: '1px solid rgba(255,215,0,0.18)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-primary)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                Registered players
              </div>
              {playerSearchLoading && playerHits.length === 0 ? (
                <p style={{ fontSize: '0.7rem', opacity: 0.55, padding: '0.65rem', margin: 0 }}>Searching...</p>
              ) : playerHits.length > 0 ? (
                playerHits.map((p) => (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => openPlayerChat(p)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      color: '#fff'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.75rem' }}>{p.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {p.email}
                    </span>
                    <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.6rem', color: '#86efac', fontWeight: 700 }}>
                      Message player →
                    </span>
                  </button>
                ))
              ) : (
                <p style={{ fontSize: '0.7rem', opacity: 0.55, padding: '0.65rem', margin: 0 }}>
                  No registered player found for that search.
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
          {!convData && !convError ? (
            <p style={{ fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', margin: 'auto' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Loading chats...
            </p>
          ) : convError ? (
            <p style={{ fontSize: '0.75rem', color: '#f87171', textAlign: 'center', margin: 'auto' }}>
              Could not load chats. Pull to refresh or reopen this tab.
            </p>
          ) : filteredConversations.length === 0 ? (
            <p style={{ fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', margin: 'auto' }}>No chats found.</p>
          ) : (
            filteredConversations.map((chat) => (
              <div
                key={chat.email}
                onClick={() => {
                  setActiveChatEmail(chat.email);
                  setAdminReplyText('');
                  setAdminAttachment('');
                }}
                style={{
                  padding: '0.75rem',
                  background: activeChatEmail === chat.email ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.01)',
                  border: activeChatEmail === chat.email ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: activeChatEmail === chat.email ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeChatEmail === chat.email ? 'var(--gold-primary)' : 'var(--text-muted)', fontSize: '0.9rem', flexShrink: 0 }}>
                  <i className="fa-solid fa-circle-user"></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.775rem', color: '#fff', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>
                      {chat.name}
                    </strong>
                    {chat.unread && (
                      <span style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '0.55rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        flexShrink: 0
                      }}>
                        New
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                    {chat.lastMessage}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-section-card support-chat-window">
        {activeChatEmail ? (
          <>
            <div className="support-chat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', gap: '0.5rem', background: 'rgba(14, 18, 36, 0.98)', borderBottom: '1px solid rgba(255, 215, 0, 0.18)', boxSizing: 'border-box', flexShrink: 0 }}>
            <button
              type="button"
              className="support-chat-back-btn"
              onClick={() => setActiveChatEmail(null)}
              style={{
                background: 'rgba(255, 215, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                color: 'var(--gold-primary)',
                padding: '0.4rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <i className="fa-solid fa-chevron-left"></i>
              <span>Chats</span>
            </button>

            <div className="support-chat-player-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', border: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }}>
                <i className="fa-solid fa-user" style={{ fontSize: '0.9rem' }}></i>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeChatDisplayName}
                </h4>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeChatEmail}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#10b981', marginTop: '1px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <span>Live Chat</span>
                </div>
              </div>
            </div>

            {/* Action Controls on Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setAutoTranslateIncoming((prev) => !prev)}
                style={{
                  background: autoTranslateIncoming ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: autoTranslateIncoming ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.55rem',
                  color: autoTranslateIncoming ? 'var(--gold-primary)' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap'
                }}
                title={autoTranslateIncoming ? 'Auto Roman Urdu translation: ON' : 'Turn ON Auto Roman Urdu translation'}
              >
                <i className="fa-solid fa-language" style={{ fontSize: '0.85rem' }}></i>
                <span>{autoTranslateIncoming ? 'Auto Ur' : 'Auto Ur'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveChatEmail(null); }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#aaa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                title="Close chat window"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            </div>

            <div className="support-chat-messages">
              {showChatLoading ? (
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.7, padding: '1.25rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.55rem' }}></i>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Loading chat…</p>
                </div>
              ) : activeChatMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.55, padding: '1.25rem', maxWidth: '280px' }}>
                  <i className="fa-solid fa-paper-plane" style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.55rem' }}></i>
                  <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                    No messages yet with <strong style={{ color: '#fff' }}>{activeChatDisplayName}</strong>. Send the first message below.
                  </p>
                </div>
              ) : (
                activeChatMessages.map((msg) => {
                  const isMe = msg.senderType === 'admin';
                  const msgTranslation = translatedMessages[msg.id];

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: isMe ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                        color: isMe ? '#000' : '#fff',
                        padding: '0.55rem 0.8rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: isMe ? '2px' : '12px',
                        borderBottomLeftRadius: isMe ? '12px' : '2px',
                        fontSize: '0.8rem',
                        maxWidth: 'min(82%, 100%)',
                        fontWeight: isMe ? '600' : 'normal',
                        wordBreak: 'break-word',
                        position: 'relative'
                      }}>
                        {/* QUOTED REPLY BANNER (WHATSAPP STYLE) */}
                        {msg.replyTo && (
                          <div
                            style={{
                              background: isMe ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.4)',
                              borderLeft: `3px solid ${msg.replyTo.senderType === 'admin' ? '#000' : 'var(--gold-primary)'}`,
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              marginBottom: '0.4rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.1rem'
                            }}
                          >
                            <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: isMe ? '#000' : 'var(--gold-primary)' }}>
                              {msg.replyTo.senderType === 'admin' ? 'Agent' : 'Player'}
                            </span>
                            <span style={{ fontSize: '0.68rem', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.replyTo.message || (msg.replyTo.hasAttachment ? '📷 Attached Photo' : '')}
                            </span>
                          </div>
                        )}

                        {/* Message Content or Deleted Notice */}
                        {msg.deletedForEveryone ? (
                          <div style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.1rem 0' }}>
                            <i className="fa-solid fa-ban" style={{ fontSize: '0.8rem', opacity: 0.8 }}></i>
                            <span>This message was deleted</span>
                          </div>
                        ) : (
                          <>
                            <div>{msg.message}</div>

                            {/* ROMAN URDU TRANSLATION BOX FOR PLAYER MESSAGES */}
                            {!isMe && msgTranslation?.show && (
                              <div style={{
                                marginTop: '0.45rem',
                                marginBottom: '0.15rem',
                                padding: '0.45rem 0.6rem',
                                background: 'rgba(0, 0, 0, 0.4)',
                                borderLeft: '3px solid var(--gold-primary)',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                fontSize: '0.72rem'
                              }}>
                                {msgTranslation.loading ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8, fontSize: '0.68rem', color: 'var(--gold-primary)' }}>
                                    <i className="fa-solid fa-spinner fa-spin"></i> Translating to Roman Urdu...
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: 1.35 }}>
                                      <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.65rem', flexShrink: 0 }}>
                                        🗣️ Roman Urdu:
                                      </span>
                                      <span style={{ color: '#fff', fontWeight: 500 }}>
                                        {msgTranslation.romanUrdu}
                                      </span>
                                    </div>
                                    {msgTranslation.urdu && msgTranslation.urdu !== msgTranslation.romanUrdu && (
                                      <div style={{ direction: 'rtl', textAlign: 'right', opacity: 0.85, fontSize: '0.72rem', color: '#e2e8f0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.25rem', marginTop: '0.1rem' }}>
                                        {msgTranslation.urdu}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {msg.attachment && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <img
                                  src={msg.attachment}
                                  alt="Chat attachment"
                                  loading="lazy"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '180px',
                                    borderRadius: '6px',
                                    cursor: 'zoom-in',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'block'
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxSrc(msg.attachment);
                                  }}
                                  title="Click to enlarge screenshot"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Message Actions: Reply + Edit + Delete + Translate */}
                        {!msg.deletedForEveryone && (
                          <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.45rem', marginTop: '0.3rem', paddingTop: '0.25rem', borderTop: isMe ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Reply */}
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo({
                                  id: msg.id,
                                  message: msg.message,
                                  senderType: msg.senderType,
                                  userName: msg.userName,
                                  hasAttachment: Boolean(msg.attachment)
                                });
                                adminInputRef.current?.focus();
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                                fontSize: '0.62rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: 0
                              }}
                              title="Reply to this message"
                            >
                              <i className="fa-solid fa-reply" /> Reply
                            </button>

                            {/* Edit Button (Admin's own messages) */}
                            {isMe && msg.message && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                                  fontSize: '0.62rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: 0
                                }}
                                title="Edit your message"
                              >
                                <i className="fa-solid fa-pen-to-square" /> Edit
                              </button>
                            )}

                            {/* Delete Options Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteTargetMessage({ id: msg.id, senderType: msg.senderType, message: msg.message, isMe })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                                fontSize: '0.62rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: 0
                              }}
                              title="Delete message options"
                            >
                              <i className="fa-solid fa-trash-can" /> Delete
                            </button>

                            {/* Player Message Translate Button */}
                            {!isMe && msg.message && (
                              <button
                                type="button"
                                onClick={() => handleTranslateMessage(msg.id, msg.message)}
                                style={{
                                  background: msgTranslation?.show ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                                  border: 'none',
                                  color: msgTranslation?.show ? 'var(--gold-primary)' : 'rgba(255,255,255,0.55)',
                                  fontSize: '0.62rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s'
                                }}
                                title="Translate player message to Roman Urdu"
                              >
                                {msgTranslation?.loading ? (
                                  <><i className="fa-solid fa-spinner fa-spin"></i> Translating...</>
                                ) : (
                                  <><i className="fa-solid fa-language"></i> {msgTranslation?.show ? 'Hide Roman Urdu' : 'Roman Urdu'}</>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: '0.55rem', opacity: 0.65, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {isMe ? 'You (Agent)' : (msg.userName && !/^support\s*agent$/i.test(msg.userName) ? msg.userName : activeChatDisplayName || 'Player')} • {formatDeviceTime(msg.timestamp)}
                        {msg.isEdited && <span style={{ color: '#ffd700', fontStyle: 'italic', fontWeight: 'bold' }}>• (edited)</span>}
                        {isMe && (
                          msg.read ? (
                            <span style={{ color: '#60a5fa', fontWeight: 'bold', marginLeft: '3px' }}>
                              • <i className="fa-solid fa-check-double" style={{ fontSize: '0.6rem' }}></i> Seen
                            </span>
                          ) : (
                            <span style={{ opacity: 0.6, marginLeft: '3px' }}>
                              • <i className="fa-solid fa-check" style={{ fontSize: '0.6rem' }}></i> Sent
                            </span>
                          )
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendAdminReply} style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', gap: '0.4rem', flexShrink: 0 }}>
              {/* Editing Mode Banner */}
              {editingMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(255, 215, 0, 0.15)',
                  borderLeft: '3px solid var(--gold-primary)',
                  borderRadius: '6px',
                  fontSize: '0.72rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                      <i className="fa-solid fa-pen-to-square"></i> Editing message:
                    </span>
                    <span style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{editingMessage.message}"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditingMessage(null); setAdminReplyText(''); }}
                    style={{ background: 'transparent', border: 'none', color: '#ffd700', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: '0 4px', whiteSpace: 'nowrap' }}
                  >
                    &times; Cancel
                  </button>
                </div>
              )}

              {/* Quoted Reply Preview Above Admin Input */}
              {replyingTo && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderLeft: `3px solid ${replyingTo.senderType === 'admin' ? '#ffd700' : '#00f0ff'}`,
                  borderRadius: '6px'
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                    <strong style={{ color: replyingTo.senderType === 'admin' ? '#ffd700' : '#00f0ff', marginRight: '5px' }}>
                      Replying to {replyingTo.senderType === 'admin' ? 'Agent' : 'Player'}:
                    </strong>
                    <span style={{ opacity: 0.8 }}>{replyingTo.message || '📷 Photo'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* ROMAN URDU -> ENGLISH TRANSLATION PREVIEW BANNER */}
              {adminTranslationPreview !== null && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(20, 24, 40, 0.98), rgba(12, 14, 23, 0.98))',
                  border: '1px solid rgba(255, 215, 0, 0.35)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> English Message (Player will receive):
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdminTranslationPreview(null)}
                      style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                      title="Dismiss Preview"
                    >
                      &times;
                    </button>
                  </div>

                  {adminOriginalRoman && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#ffd700', fontWeight: 'bold' }}>Roman Urdu:</span>
                      <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{adminOriginalRoman}"</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <input
                      type="text"
                      value={adminTranslationPreview}
                      onChange={(e) => setAdminTranslationPreview(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#070912',
                        border: '1px solid rgba(255,215,0,0.3)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                      placeholder="English message to player..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminReplyText(adminTranslationPreview);
                        setAdminTranslationPreview(null);
                        adminInputRef.current?.focus();
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-pen"></i> Put in Box
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSendAdminReply(e, adminTranslationPreview)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#fff',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="fa-solid fa-paper-plane"></i> Send English Now
                    </button>
                  </div>
                </div>
              )}

              {adminAttachment && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ position: 'relative', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={adminAttachment} alt="preview" style={{ maxHeight: '60px', borderRadius: '4px', display: 'block' }} />
                    <button
                      type="button"
                      onClick={() => setAdminAttachment('')}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Emojis Bar for Staff */}
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', overflowX: 'auto', padding: '0.1rem 0' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>EMOJIS:</span>
                {['🎰', '🔥', '💰', '👑', '💎', '🚀', '👍', '❤️', '🙌', '🎉'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAdminReplyText((prev) => prev + em)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.1rem 0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {(() => {
                const isTypeBSupportChat = activeChatMessages.some(m => m.distributorType === 'B');
                const isGlobalAdminView = !adminUser?.distributorId;
                const isReadOnlyChat = isTypeBSupportChat && isGlobalAdminView;

                if (isReadOnlyChat) {
                  return (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold', margin: '0.5rem 0' }}>
                      <i className="fa-solid fa-lock" style={{ marginRight: '5px' }}></i> Live chat is managed by distributor staff.
                    </div>
                  );
                }

                return (
                  <div className="support-chat-compose" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
                    {/* Row 1: Attachment + Input */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#0c0e17',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          color: 'var(--gold-primary)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                        title="Attach Image Proof"
                      >
                        <i className="fa-solid fa-paperclip"></i>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <input
                        ref={adminInputRef}
                        type="text"
                        placeholder={activeChatMessages.length === 0 ? 'Write in Roman Urdu or English...' : replyingTo ? `Replying to ${replyingTo.senderType === 'admin' ? 'Agent' : 'Player'}...` : 'Type in Roman Urdu or English...'}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleTranslateAdminText();
                          }
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: '#0c0e17',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.9rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                        required={!adminAttachment}
                      />
                    </div>

                    {/* Row 2: Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
                      {/* 1-Click Translate & Send English */}
                      <button
                        type="button"
                        onClick={handleTranslateAndSendAdminReply}
                        disabled={!adminReplyText.trim() || isTranslatingAdmin}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0.85rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          cursor: !adminReplyText.trim() || isTranslatingAdmin ? 'not-allowed' : 'pointer',
                          opacity: !adminReplyText.trim() || isTranslatingAdmin ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap'
                        }}
                        title="Translate Roman Urdu to English and Send to Player instantly"
                      >
                        <i className="fa-solid fa-bolt"></i>
                        <span>Translate & Send</span>
                      </button>

                      {/* Translate (Preview) Button */}
                      <button
                        type="button"
                        onClick={handleTranslateAdminText}
                        disabled={!adminReplyText.trim() || isTranslatingAdmin}
                        style={{
                          background: adminReplyText.trim() ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: adminReplyText.trim() ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem',
                          color: adminReplyText.trim() ? 'var(--gold-primary)' : 'var(--text-muted)',
                          cursor: !adminReplyText.trim() || isTranslatingAdmin ? 'not-allowed' : 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          whiteSpace: 'nowrap'
                        }}
                        title="Translate Roman Urdu to English Preview (or press Ctrl+Enter)"
                      >
                        {isTranslatingAdmin ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fa-solid fa-language" style={{ fontSize: '0.9rem' }}></i>
                            <span>Preview</span>
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        className="submit-btn support-chat-reply-btn"
                        style={{ margin: 0, padding: '0.6rem 0.95rem', width: 'auto', background: 'linear-gradient(135deg, #ffd700 0%, #cca000 100%)', color: '#000', fontWeight: 'bold', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        title="Send message directly"
                      >
                        {activeChatMessages.length === 0 ? 'Send' : 'Reply'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5, padding: '1rem' }}>
            <i className="fa-solid fa-headset" style={{ fontSize: '3rem', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.5rem' }}></i>
            <p style={{ fontSize: '0.85rem' }}>Select a conversation or search a player Gmail to start chatting.</p>
          </div>
        )}
      </div>

      {/* Delete Message Options Modal (WhatsApp Style) */}
      {deleteTargetMessage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #101426 0%, #080a14 100%)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            maxWidth: '350px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <i className="fa-solid fa-trash-can"></i> Delete Message?
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.4 }}>
              "{deleteTargetMessage.message?.slice(0, 80) || 'Attachment'}{deleteTargetMessage.message?.length > 80 ? '...' : ''}"
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => handleDeleteForEveryone(deleteTargetMessage.id)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-users"></i> Delete for Everyone
              </button>
              
              <button
                type="button"
                onClick={() => handleDeleteForMe(deleteTargetMessage.id)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-user"></i> Delete for Me
              </button>
              
              <button
                type="button"
                onClick={() => setDeleteTargetMessage(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc('')} alt="Chat screenshot" />
    </div>
  );
}
