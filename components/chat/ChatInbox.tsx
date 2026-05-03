'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Participant { userId: string; role: string; name: string; }
interface Convo {
  _id: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadFor: string[];
}
interface Msg {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatInbox() {
  const { user } = useAuth();
  const [convos,   setConvos]   = useState<Convo[]>([]);
  const [active,   setActive]   = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRef    = useRef<string>('');

  const loadConvos = useCallback(async () => {
    const res  = await fetch('/api/chat/conversations');
    const data = await res.json();
    if (data.conversations) setConvos(data.conversations);
    setLoading(false);
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  const fetchMsgs = useCallback(async (id: string, since?: string) => {
    const url = since
      ? `/api/chat/conversations/${id}/messages?after=${encodeURIComponent(since)}`
      : `/api/chat/conversations/${id}/messages`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.messages) return;
    if (since) {
      if (data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        lastRef.current = data.messages.at(-1).createdAt;
        // refresh unread
        setConvos(prev => prev.map(c => c._id === id ? { ...c, unreadFor: c.unreadFor.filter(x => x !== user?._id) } : c));
      }
    } else {
      setMessages(data.messages);
      if (data.messages.length > 0) lastRef.current = data.messages.at(-1).createdAt;
    }
  }, [user]);

  useEffect(() => {
    if (!active) { if (pollRef.current) clearInterval(pollRef.current); return; }
    lastRef.current = '';
    fetchMsgs(active._id);
    pollRef.current = setInterval(() => fetchMsgs(active._id, lastRef.current), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active, fetchMsgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || !active || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const res  = await fetch(`/api/chat/conversations/${active._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        lastRef.current = data.message.createdAt;
        setConvos(prev => prev.map(c =>
          c._id === active._id ? { ...c, lastMessage: content, lastMessageAt: data.message.createdAt } : c
        ));
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function otherParty(convo: Convo): Participant {
    return convo.participants.find(p => p.userId !== user?._id) ?? convo.participants[0];
  }

  const totalUnread = convos.filter(c => c.unreadFor.includes(user?._id ?? '')).length;

  return (
    <div className="ci-layout">

      {/* Sidebar — conversation list */}
      <div className="ci-sidebar">
        <div className="ci-sidebar-header">
          <h3 className="ci-sidebar-title">
            Messages
            {totalUnread > 0 && <span className="ci-unread-badge">{totalUnread}</span>}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {[1,2,3].map(i => (
              <div key={i} className="ci-convo-skeleton">
                <div className="ci-sk-av" />
                <div className="ci-sk-lines"><div /><div /></div>
              </div>
            ))}
          </div>
        ) : convos.length === 0 ? (
          <div className="ci-no-convos">
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p>No conversations yet.</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Start a chat from any shop or service page.</p>
          </div>
        ) : (
          <div className="ci-convo-list">
            {convos.map(c => {
              const other   = otherParty(c);
              const unread  = c.unreadFor.includes(user?._id ?? '');
              const isOpen  = active?._id === c._id;
              return (
                <button
                  key={c._id}
                  className={`ci-convo-item${isOpen ? ' ci-convo-active' : ''}${unread ? ' ci-convo-unread' : ''}`}
                  onClick={() => { setActive(c); setMessages([]); }}
                >
                  <div className="ci-convo-av">{other.name.slice(0, 2).toUpperCase()}</div>
                  <div className="ci-convo-info">
                    <div className="ci-convo-name-row">
                      <span className="ci-convo-name">{other.name}</span>
                      <span className="ci-convo-time">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="ci-convo-preview">
                      {c.lastMessage || 'Start the conversation…'}
                      {unread && <span className="ci-dot" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat pane */}
      <div className="ci-chat">
        {!active ? (
          <div className="ci-chat-empty">
            <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="ci-chat-header">
              <button className="ci-back" onClick={() => setActive(null)}>←</button>
              <div className="ci-chat-av">{otherParty(active).name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="ci-chat-name">{otherParty(active).name}</div>
                <div className="ci-chat-role">
                  {otherParty(active).role === 'vendor' ? '🏪 Shop' : otherParty(active).role === 'provider' ? '🛠️ Provider' : '👤 Customer'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="ci-messages">
              {messages.length === 0 && (
                <div className="ci-msgs-empty">
                  <span>👋</span> Say hello to <strong>{otherParty(active).name}</strong>!
                </div>
              )}
              {messages.map(m => {
                const mine = m.senderId === user?._id;
                return (
                  <div key={m._id} className={`ci-msg${mine ? ' ci-msg-mine' : ''}`}>
                    {!mine && <div className="ci-msg-name">{m.senderName}</div>}
                    <div className="ci-bubble">{m.content}</div>
                    <div className="ci-msg-time">{fmt(m.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="ci-input-row">
              <textarea
                className="ci-input"
                placeholder="Type a message… (Enter to send)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                maxLength={2000}
                disabled={sending}
              />
              <button className="ci-send" onClick={send} disabled={!input.trim() || sending}>
                {sending ? '…' : '➤'}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
