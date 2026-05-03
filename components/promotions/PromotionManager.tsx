'use client';
import { useEffect, useState } from 'react';
import FileUpload from '@/components/ui/FileUpload';
import PlanSelector from '@/components/plans/PlanSelector';

interface Subscription {
  _id: string;
  maxPromotions: number;
  promotionsUsed: number;
  expiresAt: string;
  planId: { name: string };
}

interface Promotion {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  link: string;
  linkText: string;
  isActive: boolean;
  order: number;
  expiresAt?: string;
  createdByRole: string;
  createdAt: string;
}

const EMPTY = {
  title: '', description: '', mediaType: 'image' as const,
  mediaUrl: '', link: '/', linkText: 'Learn More',
  isActive: true, order: 0, expiresAt: '',
};

function MediaPreview({ mediaType, mediaUrl }: { mediaType: string; mediaUrl: string }) {
  if (!mediaUrl) return (
    <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>
      No media URL
    </div>
  );
  if (mediaType === 'video') {
    const isYt = mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');
    if (isYt) {
      const ytId = mediaUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      return ytId ? (
        <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: '100%', height: 120, border: 'none', borderRadius: 8 }} allowFullScreen />
      ) : <div style={{ color: '#ef4444', fontSize: 13 }}>Invalid YouTube URL</div>;
    }
    return <video src={mediaUrl} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} controls />;
  }
  return (
    <img src={mediaUrl} alt="Preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, background: '#f1f5f9' }} />
  );
}

export default function PromotionManager({ role }: { role: 'admin' | 'vendor' }) {
  const [promos,  setPromos]  = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<'list' | 'form' | 'plans'>('list');
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form,    setForm]    = useState<typeof EMPTY>({ ...EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [notice,  setNotice]  = useState('');
  const [deleting,setDeleting]= useState<string | null>(null);
  const [sub,     setSub]     = useState<Subscription | null | undefined>(undefined);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  function loadSub() {
    if (role !== 'vendor') return;
    fetch('/api/subscriptions/me')
      .then(r => r.json())
      .then(d => setSub(d.subscription ?? null))
      .catch(() => setSub(null));
  }

  function loadPromos() {
    setLoading(true);
    fetch('/api/promotions?all=true')
      .then(r => r.json())
      .then(d => setPromos(d.promotions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPromos(); loadSub(); }, []);

  const canCreate = role === 'admin' || (sub && sub.promotionsUsed < sub.maxPromotions && new Date(sub.expiresAt) > new Date());

  function openAdd() {
    if (role === 'vendor' && !canCreate) { setView('plans'); return; }
    setEditing(null);
    setForm({ ...EMPTY });
    setView('form');
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    setForm({
      title:       p.title,
      description: p.description,
      mediaType:   p.mediaType as 'image',
      mediaUrl:    p.mediaUrl,
      link:        p.link,
      linkText:    p.linkText,
      isActive:    p.isActive,
      order:       p.order,
      expiresAt:   p.expiresAt ? p.expiresAt.slice(0, 10) : '',
    });
    setView('form');
  }

  async function handleSave() {
    if (!form.title.trim()) { setNotice('Title is required'); return; }
    setSaving(true); setNotice('');
    try {
      const url    = editing ? `/api/promotions/${editing._id}` : '/api/promotions';
      const method = editing ? 'PUT' : 'POST';
      const body   = { ...form, expiresAt: form.expiresAt || null };
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setNotice(editing ? 'Promotion updated!' : 'Promotion created!');
      setTimeout(() => { setNotice(''); setView('list'); loadPromos(); }, 1000);
    } catch (e: unknown) {
      setNotice((e as Error).message);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promotion?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      loadPromos();
    } finally { setDeleting(null); }
  }

  async function toggleActive(p: Promotion) {
    await fetch(`/api/promotions/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    loadPromos();
  }

  /* ── PLANS VIEW ── */
  if (view === 'plans') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>💎 Promotion Plans</h2>
      </div>
      <PlanSelector onSubscribed={() => { loadSub(); setView('list'); }} />
    </div>
  );

  /* ── LIST ── */
  if (view === 'list') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🎯 Promotions</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {role === 'vendor' && (
            <button className="btn btn-outline btn-sm" onClick={() => setView('plans')}>💎 Plans</button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ New Promotion</button>
        </div>
      </div>

      {/* Vendor subscription status banner */}
      {role === 'vendor' && sub !== undefined && (
        sub ? (
          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#14532d', fontSize: 14 }}>✅ {sub.planId?.name ?? 'Active'} Plan</span>
              <span style={{ fontSize: 13, color: '#166534', marginLeft: 12 }}>
                {sub.promotionsUsed}/{sub.maxPromotions} used · expires {new Date(sub.expiresAt).toLocaleDateString('en-IN')}
              </span>
            </div>
            <button className="btn btn-sm" onClick={() => setView('plans')}
              style={{ background: '#16a34a', color: '#fff', border: 'none', fontSize: 12 }}>
              Upgrade →
            </button>
          </div>
        ) : (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#713f12' }}>⚠️ No active plan. Purchase a plan to create promotions.</span>
            <button className="btn btn-sm" onClick={() => setView('plans')}
              style={{ background: '#ca8a04', color: '#fff', border: 'none', fontSize: 12 }}>
              View Plans →
            </button>
          </div>
        )
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>Loading…</div>
      ) : promos.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h3 style={{ marginBottom: 8 }}>No promotions yet</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
            {role === 'vendor' && !canCreate ? 'Purchase a plan to start creating promotions.' : 'Create your first promotion to display on the home page slider.'}
          </p>
          <button className="btn btn-primary" onClick={openAdd}>
            {role === 'vendor' && !canCreate ? '💎 Choose a Plan' : 'Create Promotion'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {promos.map(p => (
            <div key={p._id} className="content-card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', opacity: p.isActive ? 1 : 0.6 }}>
              {/* Thumbnail */}
              <div style={{ width: 100, height: 64, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                {p.mediaUrl ? (
                  p.mediaType === 'video'
                    ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶️</div>
                    : <img src={p.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--text-light)' }}>🖼️</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15 }}>{p.title}</strong>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600,
                    background: p.isActive ? '#dcfce7' : '#fee2e2',
                    color: p.isActive ? '#166534' : '#991b1b' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600, background: '#ede9fe', color: '#6d28d9' }}>
                    {p.mediaType === 'video' ? '🎥 Video' : '🖼️ Image'}
                  </span>
                  {role === 'admin' && (
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>
                      {p.createdByRole}
                    </span>
                  )}
                </div>
                {p.description && <p style={{ fontSize: 13, color: 'var(--text-light)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0 }}>
                  Link: <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{p.link}</a>
                  {p.expiresAt && <span style={{ marginLeft: 12 }}>⏰ Expires: {new Date(p.expiresAt).toLocaleDateString()}</span>}
                  <span style={{ marginLeft: 12 }}>Order: {p.order}</span>
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(p)}>
                  {p.isActive ? 'Pause' : 'Activate'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" disabled={deleting === p._id} onClick={() => handleDelete(p._id)}>
                  {deleting === p._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── FORM ── */
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Promotion' : 'New Promotion'}</h2>
      </div>

      {notice && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
          background: notice.includes('!') || notice.includes('created') || notice.includes('updated') ? '#d1fae5' : '#fee2e2',
          color:      notice.includes('!') || notice.includes('created') || notice.includes('updated') ? '#065f46' : '#991b1b' }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: form fields */}
        <div className="content-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-input" placeholder="Summer Sale! 50% Off" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" rows={3} placeholder="Short compelling description shown under the title…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Order (lower = first)</label>
            <input type="number" className="form-input" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} />
          </div>

          <FileUpload
            label="Banner Image or Video"
            fileType="both"
            value={form.mediaUrl}
            onUpload={result => {
              set('mediaUrl', result.url);
              set('mediaType', result.type as 'image');
            }}
            onRemove={() => { set('mediaUrl', ''); set('mediaType', 'image'); }}
            hint="JPG, PNG, WebP, GIF (max 10 MB) · MP4, WebM (max 100 MB)"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>CTA Link</label>
              <input className="form-input" placeholder="/products or https://…" value={form.link} onChange={e => set('link', e.target.value)} />
            </div>
            <div className="form-group">
              <label>CTA Button Text</label>
              <input className="form-input" placeholder="Shop Now →" value={form.linkText} onChange={e => set('linkText', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Expires On (optional)</label>
              <input type="date" className="form-input" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0, paddingBottom: 10 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                Active (show on homepage)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update Promotion' : 'Create Promotion'}
            </button>
            <button className="btn btn-outline" onClick={() => setView('list')}>Cancel</button>
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="content-card" style={{ background: 'linear-gradient(135deg,#312e81,#6366f1)', color: 'white', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Slide Preview</div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, marginBottom: 8 }}>{form.title || 'Your Title'}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14, lineHeight: 1.5 }}>{form.description || 'Your description will appear here.'}</div>
            <div style={{ display: 'inline-block', background: 'white', color: '#1e293b', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {form.linkText || 'Learn More'} →
            </div>
          </div>

          <div className="content-card" style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--dark)', display: 'block', marginBottom: 6 }}>💡 Tips</strong>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>Use 1200×400px images for best results</li>
              <li>Keep titles under 40 characters</li>
              <li>Set Order=0 to appear first in slider</li>
              <li>Pause expired promos instead of deleting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
