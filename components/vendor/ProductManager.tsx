'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const PRODUCT_CATEGORIES = [
  'Vegetables', 'Fruits', 'Dairy & Eggs', 'Meat & Fish',
  'Bakery', 'Beverages', 'Snacks', 'Electronics',
  'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Books',
  'Toys', 'Sports', 'Stationery', 'Other',
];

const UNITS = ['piece', 'kg', 'dozen', 'litre', 'pack', 'other'];

interface Product {
  _id: string; title: string; description: string; category: string;
  price: number; unit: string; images: string[]; tags: string[];
  inStock: boolean; customFields: Record<string, unknown>;
  createdAt: string;
}

interface FormState {
  title: string; description: string; category: string; price: string;
  unit: string; images: string; tags: string; inStock: boolean;
}

const EMPTY_FORM: FormState = {
  title: '', description: '', category: '', price: '', unit: 'piece',
  images: '', tags: '', inStock: true,
};

export default function ProductManager() {
  const { user } = useAuth();
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [notice, setNotice]         = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const notify = (type: 'ok' | 'err', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  };

  const load = (p = 1) => {
    if (!user?._id) return;
    setLoading(true);
    fetch(`/api/products?vendorId=${user._id}&page=${p}&limit=12`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? []);
        setTotalPages(data.pages ?? 1);
        setPage(p);
      })
      .catch(() => notify('err', 'Could not load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user?._id) load(); }, [user?._id]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      title:       p.title,
      description: p.description,
      category:    p.category,
      price:       String(p.price),
      unit:        p.unit,
      images:      p.images.join(', '),
      tags:        p.tags.join(', '),
      inStock:     p.inStock,
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

  const set = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) return notify('err', 'Title is required');
    if (!form.price || parseFloat(form.price) <= 0) return notify('err', 'Valid price is required');

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      category:    form.category,
      price:       parseFloat(form.price),
      unit:        form.unit,
      images:      form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags:        form.tags   ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      inStock:     form.inStock,
    };

    setSaving(true);
    try {
      const url    = editing ? `/api/products/${editing._id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      notify('ok', editing ? 'Product updated!' : 'Product added!');
      closeForm();
      load(page);
    } catch (e: unknown) {
      notify('err', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      notify('ok', 'Product deleted');
      load(page);
    } catch {
      notify('err', 'Could not delete product');
    } finally {
      setDeleting(null);
    }
  }

  async function toggleStock(p: Product) {
    try {
      await fetch(`/api/products/${p._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !p.inStock }),
      });
      load(page);
    } catch { notify('err', 'Could not update stock status'); }
  }

  return (
    <div>
      {/* Header */}
      <div className="dash-topbar">
        <h2 style={{ margin: 0 }}>My Products</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {/* Notice */}
      {notice && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 14, fontWeight: 500,
          background: notice.type === 'ok' ? '#d1fae5' : '#fee2e2',
          color: notice.type === 'ok' ? '#065f46' : '#991b1b', border: `1px solid ${notice.type === 'ok' ? '#6ee7b7' : '#fca5a5'}` }}>
          {notice.type === 'ok' ? '✓ ' : '⚠ '}{notice.msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="content-card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px' }}>{editing ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Product Title <span className="req">*</span></label>
              <input type="text" className="form-input" placeholder="e.g. Fresh Tomatoes" value={form.title}
                onChange={e => set('title', e.target.value)} disabled={saving} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)} disabled={saving}>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input form-textarea" placeholder="Describe your product…" value={form.description}
              onChange={e => set('description', e.target.value)} disabled={saving} style={{ minHeight: 80 }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) <span className="req">*</span></label>
              <input type="number" className="form-input" placeholder="0.00" value={form.price}
                onChange={e => set('price', e.target.value)} disabled={saving} min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select className="form-input" value={form.unit} onChange={e => set('unit', e.target.value)} disabled={saving}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Image URLs <span style={{ color: '#6b7280', fontWeight: 400 }}>(comma-separated)</span></label>
            <input type="text" className="form-input" placeholder="https://... , https://..." value={form.images}
              onChange={e => set('images', e.target.value)} disabled={saving} />
          </div>

          <div className="form-group">
            <label>Tags <span style={{ color: '#6b7280', fontWeight: 400 }}>(comma-separated)</span></label>
            <input type="text" className="form-input" placeholder="organic, fresh, local" value={form.tags}
              onChange={e => set('tags', e.target.value)} disabled={saving} />
          </div>

          <div className="form-check" style={{ marginBottom: 16 }}>
            <input type="checkbox" id="inStock" checked={form.inStock}
              onChange={e => set('inStock', e.target.checked)} disabled={saving} />
            <label htmlFor="inStock" style={{ cursor: 'pointer' }}>In Stock</label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : (editing ? 'Update Product' : 'Add Product')}
            </button>
            <button className="btn btn-outline" onClick={closeForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>Loading products…</div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && !showForm && (
        <div className="content-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <h3 style={{ margin: '0 0 8px' }}>No products yet</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>Add your first product to start selling.</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add First Product</button>
        </div>
      )}

      {/* Product list */}
      {!loading && products.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => (
            <div key={p._id} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
              {/* Thumbnail */}
              <div style={{ width: 52, height: 52, borderRadius: 8, background: 'linear-gradient(135deg,#14532d,#166534)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {p.images[0]
                  ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22, color: '#fff' }}>🛍️</span>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                  {p.category && <span className="ptag" style={{ fontSize: 11, marginRight: 6 }}>{p.category}</span>}
                  ₹{p.price} / {p.unit}
                </div>
              </div>

              {/* Stock badge */}
              <button onClick={() => toggleStock(p)} title="Toggle stock"
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: p.inStock ? '#d1fae5' : '#fee2e2', color: p.inStock ? '#065f46' : '#991b1b' }}>
                {p.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-sm" onClick={() => handleDelete(p._id)} disabled={deleting === p._id}
                  style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', opacity: deleting === p._id ? 0.6 : 1 }}>
                  {deleting === p._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: '32px' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
