'use client';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

/* ─── Types ──────────────────────────────────────────────── */
interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'tags';
  placeholder?: string;
  options?: string[];
  unit?: string;
  required?: boolean;
}
interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  fields: FieldDef[];
}
interface Service {
  _id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  priceType: string;
  deliveryTime?: string;
  tags: string[];
  mobile: string;
  whatsapp: string;
  videoUrl?: string;
  customFields: Record<string, unknown>;
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

/* ─── Dynamic field renderer ─────────────────────────────── */
function DynamicField({
  field, value, onChange, disabled,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (name: string, val: unknown) => void;
  disabled: boolean;
}) {
  const base = 'form-input';
  const req  = field.required ? <span className="req">*</span> : null;

  switch (field.type) {
    case 'select':
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <select className={base} value={(value as string) ?? ''} onChange={e => onChange(field.name, e.target.value)} disabled={disabled}>
            <option value="">— Select —</option>
            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );

    case 'radio':
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            {field.options?.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input type="radio" name={field.name} value={o} checked={value === o} onChange={() => onChange(field.name, o)} disabled={disabled} />
                {o}
              </label>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="form-check" style={{ margin: '8px 0' }}>
          <input
            type="checkbox"
            id={`cf-${field.name}`}
            checked={Boolean(value)}
            onChange={e => onChange(field.name, e.target.checked)}
            disabled={disabled}
          />
          <label htmlFor={`cf-${field.name}`} style={{ cursor: 'pointer' }}>{field.label}</label>
        </div>
      );

    case 'textarea':
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <textarea
            className={`${base} form-textarea`}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={e => onChange(field.name, e.target.value)}
            disabled={disabled}
          />
        </div>
      );

    case 'number':
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              className={base}
              placeholder={field.placeholder}
              value={(value as string) ?? ''}
              onChange={e => onChange(field.name, e.target.value)}
              disabled={disabled}
              style={field.unit ? { paddingRight: 48 } : {}}
              min={0}
            />
            {field.unit && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6b7280', fontWeight: 600, pointerEvents: 'none' }}>
                {field.unit}
              </span>
            )}
          </div>
        </div>
      );

    case 'tags':
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <input
            type="text"
            className={base}
            placeholder={field.placeholder ?? 'Comma-separated values'}
            value={(value as string) ?? ''}
            onChange={e => onChange(field.name, e.target.value)}
            disabled={disabled}
          />
          <small style={{ color: '#6b7280', fontSize: 12 }}>Separate values with commas</small>
        </div>
      );

    default: // text
      return (
        <div className="form-group">
          <label>{field.label} {req}</label>
          <input
            type="text"
            className={base}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={e => onChange(field.name, e.target.value)}
            disabled={disabled}
          />
        </div>
      );
  }
}

/* ─── Main component ─────────────────────────────────────── */
export default function ServiceManager() {
  const { user } = useAuth();

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices]     = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [view, setView]               = useState<'list' | 'add' | 'edit'>('list');
  const [editTarget, setEditTarget]   = useState<Service | null>(null);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [priceType, setPriceType]     = useState('hourly');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [tags, setTags]               = useState('');
  const [mobile, setMobile]             = useState('');
  const [whatsapp, setWhatsapp]         = useState('');
  const [videoUrl, setVideoUrl]         = useState('');
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving]           = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');

  const selectedCategory = categories.find(c => c._id === selectedCatId);

  /* ── Fetch categories + my services ── */
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [catRes, svcRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/services?provider=${user._id}&limit=20`),
      ]);
      if (catRes.ok)  { const d = await catRes.json();  setCategories(d.categories); }
      if (svcRes.ok)  { const d = await svcRes.json();  setServices(d.services); }
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);


  /* ── Populate form when editing ── */
  const openEdit = (svc: Service) => {
    setEditTarget(svc);
    setSelectedCatId(svc.category._id);
    setTitle(svc.title);
    setDescription(svc.description);
    setPrice(String(svc.price));
    setPriceType(svc.priceType);
    setDeliveryTime(svc.deliveryTime ?? '');
    setTags(svc.tags.join(', '));
    setMobile(svc.mobile ?? '');
    setWhatsapp(svc.whatsapp ?? '');
    setVideoUrl(svc.videoUrl ?? '');
    setCustomFields(svc.customFields ?? {});
    setServerError('');
    setFieldErrors({});
    setView('edit');
  };

  const resetForm = () => {
    setEditTarget(null);
    setSelectedCatId('');
    setTitle(''); setDescription(''); setPrice('');
    setPriceType('hourly'); setDeliveryTime(''); setTags('');
    setMobile(''); setWhatsapp(''); setVideoUrl('');
    setCustomFields({}); setFieldErrors({}); setServerError('');
    setView('list');
  };

  const handleCustomChange = (name: string, val: unknown) => {
    setCustomFields(prev => ({ ...prev, [name]: val }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  /* ── Client-side validation ── */
  const validate = (): boolean => {
    const phoneRe = /^[+\d][\d\s\-().]{6,19}$/;
    const errs: Record<string, string> = {};
    if (!title.trim())       errs.title       = 'Service title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!selectedCatId)      errs.category    = 'Please select a category';
    if (!price || parseFloat(price) <= 0) errs.price = 'Enter a valid price';
    if (!mobile.trim())             errs.mobile   = 'Mobile number is required';
    else if (!phoneRe.test(mobile)) errs.mobile   = 'Enter a valid mobile number';
    if (!whatsapp.trim())             errs.whatsapp = 'WhatsApp number is required';
    else if (!phoneRe.test(whatsapp)) errs.whatsapp = 'Enter a valid WhatsApp number';

    // Validate required dynamic fields
    if (selectedCategory) {
      for (const field of selectedCategory.fields) {
        if (field.required) {
          const val = customFields[field.name];
          if (val === undefined || val === '' || val === null) {
            errs[`cf_${field.name}`] = `${field.label} is required`;
          }
        }
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit (create or update) ── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      categoryId: selectedCatId,
      price: parseFloat(price),
      priceType,
      deliveryTime: deliveryTime.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim(),
      videoUrl: videoUrl.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      customFields,
    };

    try {
      const isEdit = view === 'edit' && !!editTarget;
      const url    = isEdit ? `/api/services/${editTarget!._id}` : '/api/services';
      const method = isEdit ? 'PATCH' : 'POST';

      const editBody = {
        title:        payload.title,
        description:  payload.description,
        category:     selectedCatId,
        price:        payload.price,
        priceType:    payload.priceType,
        deliveryTime: payload.deliveryTime,
        mobile:       payload.mobile,
        whatsapp:     payload.whatsapp,
        videoUrl:     payload.videoUrl,
        tags:         payload.tags,
        customFields: payload.customFields,
      };

      const sendBody = isEdit ? editBody : payload;
      console.log('[ServiceManager] sending', method, url, JSON.stringify(sendBody));

      const res  = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendBody),
      });
      const data = await res.json();
      console.log('[ServiceManager] response', res.status, JSON.stringify(data));
      if (!res.ok) throw new Error(data.error ?? 'Failed to save service');

      setSuccessMsg(view === 'edit' ? 'Service updated!' : 'Service published!');
      await loadData();
      setTimeout(() => { setSuccessMsg(''); resetForm(); }, 1500);
    } catch (err: unknown) {
      setServerError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete / toggle ── */
  const toggleActive = async (svc: Service) => {
    await fetch(`/api/services/${svc._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    loadData();
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    loadData();
  };

  /* ── Render: service list ── */
  if (view === 'list') {
    return (
      <div>
        <div className="dash-topbar">
          <div><h2>My Services</h2><p>Manage your service offerings.</p></div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setView('add'); }}>+ Add New Service</button>
        </div>

        {loadingData ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading services…</div>
        ) : services.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛠️</div>
            <h3 style={{ marginBottom: 8 }}>No services yet</h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>Add your first service to start getting bookings.</p>
            <button className="btn btn-primary" onClick={() => setView('add')}>+ Add Your First Service</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {services.map(svc => (
              <div key={svc._id} className="content-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{svc.category?.icon}</span>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{svc.title}</h3>
                      <span className={`bi-status ${svc.isActive ? 'status-confirmed' : ''}`}
                        style={!svc.isActive ? { background: '#f3f4f6', color: '#6b7280' } : {}}>
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>
                      {svc.description.slice(0, 120)}{svc.description.length > 120 ? '…' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        ${svc.price}/{svc.priceType === 'hourly' ? 'hr' : svc.priceType}
                      </span>
                      <span style={{ color: '#6b7280' }}>📂 {svc.category?.name}</span>
                      {svc.rating > 0 && <span style={{ color: '#f59e0b' }}>⭐ {svc.rating} ({svc.reviewCount})</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(svc)}>✏️ Edit</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(svc)}
                      style={{ color: svc.isActive ? '#f59e0b' : '#10b981' }}>
                      {svc.isActive ? '⏸ Deactivate' : '▶ Activate'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteService(svc._id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Render: add / edit form ── */
  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h2>{view === 'edit' ? 'Edit Service' : 'Add New Service'}</h2>
          <p>Fill in the details. Fields change based on the selected category.</p>
        </div>
        <button className="btn btn-ghost" onClick={resetForm}>← Back to Services</button>
      </div>

      {successMsg && <div className="form-alert form-alert-success" style={{ marginBottom: 20 }}>✓ {successMsg}</div>}
      {serverError && <div className="form-alert form-alert-error" style={{ marginBottom: 20 }}>⚠ {serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Category picker ── */}
        <div className="content-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>1. Choose a Category <span className="req">*</span></h3>
          {fieldErrors.category && <span className="field-error" style={{ marginBottom: 12, display: 'block' }}>{fieldErrors.category}</span>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {categories.map(cat => (
              <button
                key={cat._id}
                type="button"
                onClick={() => {
                  if (cat._id !== selectedCatId) {
                    setSelectedCatId(cat._id);
                    setCustomFields({});
                    setFieldErrors(prev => { const n = { ...prev }; delete n.category; return n; });
                  }
                }}
                disabled={saving}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                  border: selectedCatId === cat._id ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: selectedCatId === cat._id ? 'var(--primary-light)' : 'white',
                  fontWeight: selectedCatId === cat._id ? 700 : 500,
                  color: selectedCatId === cat._id ? 'var(--primary)' : 'var(--dark)',
                }}
              >
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.3 }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Core service fields ── */}
        {selectedCatId && (
          <>
            <div className="content-card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>2. Service Details</h3>
              <div className="form-group">
                <label>Service Title <span className="req">*</span></label>
                <input type="text" className={`form-input${fieldErrors.title ? ' input-error' : ''}`}
                  placeholder="e.g., Professional Home Deep Cleaning"
                  value={title} onChange={e => { setTitle(e.target.value); delete fieldErrors.title; setFieldErrors({ ...fieldErrors }); }}
                  disabled={saving}
                />
                {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
              </div>
              <div className="form-group">
                <label>Description <span className="req">*</span></label>
                <textarea className={`form-input form-textarea${fieldErrors.description ? ' input-error' : ''}`}
                  placeholder="Describe what's included, your process, and why clients should choose you…"
                  value={description}
                  onChange={e => { setDescription(e.target.value); delete fieldErrors.description; setFieldErrors({ ...fieldErrors }); }}
                  disabled={saving}
                  style={{ minHeight: 110 }}
                />
                {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600 }}>$</span>
                    <input type="number" className={`form-input${fieldErrors.price ? ' input-error' : ''}`}
                      placeholder="0.00" value={price} min="0" step="0.01"
                      onChange={e => { setPrice(e.target.value); delete fieldErrors.price; setFieldErrors({ ...fieldErrors }); }}
                      disabled={saving} style={{ paddingLeft: 28 }}
                    />
                  </div>
                  {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
                </div>
                <div className="form-group">
                  <label>Price Type</label>
                  <select className="form-input" value={priceType} onChange={e => setPriceType(e.target.value)} disabled={saving}>
                    <option value="hourly">Per Hour</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Delivery / Turnaround Time</label>
                  <input type="text" className="form-input" placeholder="e.g., Same day, 1-2 days, 1 week"
                    value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} disabled={saving} />
                </div>
                <div className="form-group">
                  <label>Tags <span style={{ color: '#6b7280', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input type="text" className="form-input" placeholder="e.g. deep clean, eco-friendly, certified"
                    value={tags} onChange={e => setTags(e.target.value)} disabled={saving} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📞 Mobile Number <span className="req">*</span></label>
                  <input
                    type="tel"
                    className={`form-input${fieldErrors.mobile ? ' input-error' : ''}`}
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={e => { setMobile(e.target.value); setFieldErrors(p => { const n={...p}; delete n.mobile; return n; }); }}
                    disabled={saving}
                  />
                  {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                </div>
                <div className="form-group">
                  <label>💬 WhatsApp Number <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      className={`form-input${fieldErrors.whatsapp ? ' input-error' : ''}`}
                      placeholder="+91 98765 43210"
                      value={whatsapp}
                      onChange={e => { setWhatsapp(e.target.value); setFieldErrors(p => { const n={...p}; delete n.whatsapp; return n; }); }}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => { setWhatsapp(mobile); setFieldErrors(p => { const n={...p}; delete n.whatsapp; return n; }); }}
                    >
                      Same as mobile
                    </button>
                  </div>
                  {fieldErrors.whatsapp && <span className="field-error">{fieldErrors.whatsapp}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>🎬 Work Video <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="YouTube or Instagram Reel link — e.g. https://youtu.be/abc123"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  disabled={saving}
                />
                {videoUrl.trim() && !(/youtube\.com|youtu\.be|instagram\.com/i.test(videoUrl)) && (
                  <span className="field-error">Please enter a YouTube or Instagram link</span>
                )}
                <small style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Supported: YouTube (youtube.com/watch, youtu.be, youtube.com/shorts) · Instagram (instagram.com/reel, instagram.com/p)
                </small>
              </div>
            </div>

            {/* ── Dynamic category-specific fields ── */}
            {selectedCategory && selectedCategory.fields.length > 0 && (
              <div className="content-card" style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 4 }}>3. {selectedCategory.icon} {selectedCategory.name} — Specific Details</h3>
                <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
                  These fields help customers find exactly what they need.
                </p>

                {/* Group checkbox fields separately at the bottom */}
                {(() => {
                  const nonCheck = selectedCategory.fields.filter(f => f.type !== 'checkbox');
                  const checks   = selectedCategory.fields.filter(f => f.type === 'checkbox');
                  const half     = nonCheck.filter(f => f.type !== 'textarea');
                  const full     = nonCheck.filter(f => f.type === 'textarea');

                  return (
                    <>
                      {/* Two-column layout for non-textarea, non-checkbox fields */}
                      {half.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 16px' }}>
                          {half.map(field => (
                            <div key={field.name}>
                              <DynamicField
                                field={field}
                                value={customFields[field.name]}
                                onChange={handleCustomChange}
                                disabled={saving}
                              />
                              {fieldErrors[`cf_${field.name}`] && (
                                <span className="field-error" style={{ marginTop: -8, display: 'block', marginBottom: 12 }}>
                                  {fieldErrors[`cf_${field.name}`]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Full-width textareas */}
                      {full.map(field => (
                        <div key={field.name}>
                          <DynamicField field={field} value={customFields[field.name]} onChange={handleCustomChange} disabled={saving} />
                          {fieldErrors[`cf_${field.name}`] && <span className="field-error">{fieldErrors[`cf_${field.name}`]}</span>}
                        </div>
                      ))}

                      {/* Checkboxes in a row */}
                      {checks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 32px', marginTop: 8, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                          {checks.map(field => (
                            <DynamicField key={field.name} field={field} value={customFields[field.name]} onChange={handleCustomChange} disabled={saving} />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Submit ── */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}
                style={{ opacity: saving ? 0.75 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : view === 'edit' ? '💾 Save Changes' : '🚀 Publish Service'}
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={resetForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
