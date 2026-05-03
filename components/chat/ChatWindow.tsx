'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Msg {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Props {
  targetUserId: string;
  targetRole: 'vendor' | 'provider';
  targetName: string;
  onClose: () => void;
}

export default function ChatWindow({ targetUserId, targetRole, targetName, onClose }: Props) {
  const { user, loading } = useAuth();
  const [convoId,   setConvoId]   = useState<string | null>(null);
  const [messages,  setMessages]  = useState<Msg[]>([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [initErr,   setInitErr]   = useState('');
  const [initing,   setIniting]   = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgRef = useRef<string>('');

  /* Start or get conversation once user is known */
  useEffect(() => {
    if (loading) return;
    if (!user) { setIniting(false); return; }

    setIniting(true);
    fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, targetRole }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setInitErr(d.error); return; }
        setConvoId(d.conversation._id);
      })
      .catch(() => setInitErr('Could not start chat. Try again.'))
      .finally(() => setIniting(false));
  }, [user, loading, targetUserId, targetRole]);

  /* Fetch all messages once convoId is set */
  const fetchMessages = useCallback(async (since?: string) => {
    if (!convoId) return;
    const url = since
      ? `/api/chat/conversations/${convoId}/messages?after=${encodeURIComponent(since)}`
      : `/api/chat/conversations/${convoId}/messages`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.messages) return;
    if (since) {
      if (data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        lastMsgRef.current = data.messages.at(-1).createdAt;
      }
    } else {
      setMessages(data.messages);
      if (data.messages.length > 0)
        lastMsgRef.current = data.messages.at(-1).createdAt;
    }
  }, [convoId]);

  useEffect(() => {
    if (!convoId) return;
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(lastMsgRef.current), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [convoId, fetchMessages]);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || !convoId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const res  = await fetch(`/api/chat/conversations/${convoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderName: user?.name ?? user?.shopName ?? user?.ownerName ?? 'Me' }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        lastMsgRef.current = data.message.createdAt;
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div className="cw-overlay" onClick={onClose}>
      <div className="cw-window" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-info">
            <div className="cw-avatar">{targetName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="cw-header-name">{targetName}</div>
              <div className="cw-header-role">{targetRole === 'vendor' ? '🏪 Shop' : '🛠️ Service Provider'}</div>
            </div>
          </div>
          <button className="cw-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="cw-body">

          {/* Not logged in */}
          {!loading && !user && (
            <div className="cw-gate">
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <h3>Login to Chat</h3>
              <p>Create a free account or sign in to start a conversation with this {targetRole === 'vendor' ? 'shop' : 'provider'}.</p>
              <Link href="/login"><button className="btn btn-primary" style={{ marginTop: 16 }}>Login Now →</button></Link>
              <Link href="/signup"><p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 10 }}>New here? Sign up free</p></Link>
            </div>
          )}

          {/* Initialising */}
          {(loading || (user && initing)) && (
            <div className="cw-gate"><div className="cw-spinner" /><p>Connecting…</p></div>
          )}

          {/* Error */}
          {initErr && (
            <div className="cw-gate">
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626' }}>{initErr}</p>
            </div>
          )}

          {/* Messages */}
          {user && !initing && !initErr && (
            <>
              {messages.length === 0 && (
                <div className="cw-empty">
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
                  <p>Say hello to <strong>{targetName}</strong>!</p>
                </div>
              )}
              {messages.map(m => {
                const mine = m.senderId === user._id;
                return (
                  <div key={m._id} className={`cw-msg${mine ? ' cw-msg-mine' : ''}`}>
                    {!mine && <div className="cw-msg-name">{m.senderName}</div>}
                    <div className="cw-bubble">{m.content}</div>
                    <div className="cw-msg-time">{fmt(m.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}

        </div>

        {/* Input */}
        {user && !initing && !initErr && (
          <div className="cw-input-row">
            <textarea
              className="cw-input"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={2000}
              disabled={sending}
            />
            <button className="cw-send" onClick={send} disabled={!input.trim() || sending}>
              {sending ? '…' : '➤'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
