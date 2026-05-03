'use client';
import { useEffect, useState } from 'react';

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxPromotions: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  order: number;
}

const EMPTY = {
  name: '', description: '', price: '', durationDays: '30',
  maxPromotions: '3', features: '', isActive: true, isPopular: false, order: '0',
};

export default function PlanManager() {
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [notice,  setNotice]  = useState('');
  const [deleting,setDeleting]= useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  function loadPlans() {
    setLoading(true);
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => setPlans(d.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPlans(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setView('form');
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({
      name:          p.name,
      description:   p.description,
      price:         String(p.price),
      durationDays:  String(p.durationDays),
      maxPromotions: String(p.maxPromotions),
      features:      p.features.join('\n'),
      isActive:      p.isActive,
      isPopular:     p.isPopular,
      order:         String(p.order),
    });
    setView('form');
  }

  async function handleSave() {
    if (!form.name.trim()) { setNotice('Plan name is required'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setNotice('Valid price is required'); return; }
    setSaving(true); setNotice('');
    try {
      const url    = editing ? `/api/plans/${editing._id}` : '/api/plans';
      const method = editing ? 'PUT' : 'POST';
      const body = {
        name:          form.name.trim(),
        description:   form.description.trim(),
        price:         parseFloat(form.price),
        durationDays:  parseInt(form.durationDays) || 30,
        maxPromotions: parseInt(form.maxPromotions) || 1,
        features:      form.features.split('\n').map(s => s.trim()).filter(Boolean),
        isActive:      form.isActive,
        isPopular:     form.isPopular,
        order:         parseInt(form.order) || 0,
      };
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setNotice(editing ? 'Plan updated!' : 'Plan created!');
      setTimeout(() => { setNotice(''); setView('list'); loadPlans(); }, 900);
    } catch (e: unknown) {
      setNotice((e as Error).message);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this plan? Existing subscriptions are unaffected.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      loadPlans();
    } finally { setDeleting(null); }
  }

  async function toggleActive(p: Plan) {
    await fetch(`/api/plans/${p._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    loadPlans();
  }

  /* ── LIST ── */
  if (view === 'list') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>💎 Promotion Plans</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ New Plan</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>Loading…</div>
      ) : plans.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
          <h3 style={{ marginBottom: 8 }}>No plans yet</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>Create plans that vendors can purchase to run promotions.</p>
          <button className="btn btn-primary" onClick={openAdd}>Create First Plan</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {plans.map(p => (
            <div key={p._id} className="content-card" style={{ position: 'relative', opacity: p.isActive ? 1 : 0.6 }}>
              {p.isPopular && (
                <div style={{ position: 'absolute', top: -1, right: 16, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>
                  POPULAR
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
              {p.description && <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10 }}>{p.description}</div>}

              <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
                ₹{p.price.toLocaleString('en-IN')}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-light)' }}> / {p.durationDays} days</span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#6d28d9' }}>
                  🎯 {p.maxPromotions} promo{p.maxPromotions > 1 ? 's' : ''}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>
                  📅 {p.durationDays}d
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: p.isActive ? '#dcfce7' : '#fee2e2',
                  color: p.isActive ? '#166534' : '#991b1b' }}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {p.features.length > 0 && (
                <ul style={{ margin: '0 0 14px', paddingLeft: 16, fontSize: 13, color: 'var(--text-light)', lineHeight: 1.8 }}>
                  {p.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(p)}>
                  {p.isActive ? 'Deactivate' : 'Activate'}
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Plan' : 'New Plan'}</h2>
      </div>

      {notice && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
          background: notice.includes('!') ? '#d1fae5' : '#fee2e2',
          color:      notice.includes('!') ? '#065f46' : '#991b1b' }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="content-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Plan Name *</label>
            <input className="form-input" placeholder="e.g. Starter, Pro, Business" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input className="form-input" placeholder="Short tagline for the plan" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" className="form-input" placeholder="499" value={form.price} min="0" step="1"
                onChange={e => set('price', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration (days) *</label>
              <input type="number" className="form-input" placeholder="30" value={form.durationDays} min="1"
                onChange={e => set('durationDays', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Max Promotions *</label>
              <input type="number" className="form-input" placeholder="3" value={form.maxPromotions} min="1"
                onChange={e => set('maxPromotions', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Display Order</label>
              <input type="number" className="form-input" value={form.order} min="0"
                onChange={e => set('order', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Features <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(one per line)</span></label>
            <textarea className="form-input" rows={5}
              placeholder={'Homepage banner placement\nPriority listing in search\n24/7 support'}
              value={form.features} onChange={e => set('features', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              Active (visible to vendors)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.isPopular} onChange={e => set('isPopular', e.target.checked)} />
              Mark as Popular
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
            </button>
            <button className="btn btn-outline" onClick={() => setView('list')}>Cancel</button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="content-card" style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            {form.isPopular && (
              <div style={{ position: 'absolute', top: 0, right: 16, background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>
                POPULAR
              </div>
            )}
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Plan Preview</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{form.name || 'Plan Name'}</div>
            {form.description && <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>{form.description}</div>}
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
              ₹{parseFloat(form.price || '0').toLocaleString('en-IN')}
              <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}> / {form.durationDays || 30} days</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.2)' }}>
                🎯 {form.maxPromotions || 1} promo{parseInt(form.maxPromotions || '1') > 1 ? 's' : ''}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.2)' }}>
                📅 {form.durationDays || 30} days
              </span>
            </div>
            {form.features.trim() && (
              <ul style={{ margin: '0 0 16px', paddingLeft: 16, fontSize: 13, opacity: 0.9, lineHeight: 1.8 }}>
                {form.features.split('\n').filter(Boolean).map((f, i) => <li key={i}>✓ {f}</li>)}
              </ul>
            )}
            <button style={{ background: '#fff', color: '#16a34a', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Subscribe Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
