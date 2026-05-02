'use client';
import { useState, useEffect, useCallback, FormEvent } from 'react';

/* ─── Types ─────────────────────────────────────────────── */
type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'tags';

interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder: string;
  unit: string;
  required: boolean;
  options: string[];
}

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  fields: FieldDef[];
  isActive?: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',     label: 'Text' },
  { value: 'number',   label: 'Number' },
  { value: 'select',   label: 'Dropdown (select)' },
  { value: 'radio',    label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkbox (yes/no)' },
  { value: 'textarea', label: 'Long text' },
  { value: 'tags',     label: 'Tags / list' },
];

const ICONS = ['🧹','🔧','⚡','🎨','💻','📚','📷','🚚','🏋️','🐾','🌿','🍳','🎵','🔬','💅','🩺','🏠','🚗','📦','🎓'];

const emptyField = (): FieldDef => ({
  name: '', label: '', type: 'text',
  placeholder: '', unit: '', required: false, options: [],
});

/* ─── Slug helper ────────────────────────────────────────── */
const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ─── Inline options editor ─────────────────────────────── */
function OptionsEditor({
  options, onChange,
}: { options: string[]; onChange: (opts: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || options.includes(v)) return;
    onChange([...options, v]);
    setDraft('');
  };

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: 12, background: '#f9fafb', marginTop: 8 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Options</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {options.length === 0 && <span style={{ fontSize: 12, color: '#9ca3af' }}>No options yet.</span>}
        {options.map((o, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--primary-light)', color: 'var(--primary)',
            border: '1px solid var(--primary)', borderRadius: 100,
            padding: '2px 10px', fontSize: 12, fontWeight: 500,
          }}>
            {o}
            <button type="button" onClick={() => onChange(options.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', lineHeight: 1, padding: 0, fontSize: 14, fontWeight: 700 }}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text" className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
          placeholder="Type an option and press Enter or +"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={add}>+</button>
      </div>
    </div>
  );
}

/* ─── Single field row editor ───────────────────────────── */
function FieldRow({
  field, index, onChange, onRemove, onMove, total,
}: {
  field: FieldDef; index: number;
  onChange: (i: number, f: FieldDef) => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = field.type === 'select' || field.type === 'radio';
  const needsUnit    = field.type === 'number';

  const upd = (patch: Partial<FieldDef>) => onChange(index, { ...field, ...patch });

  return (
    <div style={{
      border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden',
      background: 'white', marginBottom: 10,
    }}>
      {/* ── Collapsed header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        {/* Reorder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <button type="button" disabled={index === 0} onClick={e => { e.stopPropagation(); onMove(index, -1); }}
            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, lineHeight: 1, fontSize: 12, padding: 0 }}>▲</button>
          <button type="button" disabled={index === total - 1} onClick={e => { e.stopPropagation(); onMove(index, 1); }}
            style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, lineHeight: 1, fontSize: 12, padding: 0 }}>▼</button>
        </div>

        <span style={{ minWidth: 22, fontSize: 14, color: '#6b7280', fontWeight: 700 }}>#{index + 1}</span>

        <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 14, color: field.label ? 'var(--dark)' : '#9ca3af' }}>
            {field.label || '(unnamed field)'}
          </strong>
          {field.name && <code style={{ fontSize: 11, background: '#e0e7ff', color: '#4338ca', padding: '1px 6px', borderRadius: 4 }}>{field.name}</code>}
          <span style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
            {FIELD_TYPES.find(t => t.value === field.type)?.label ?? field.type}
          </span>
          {field.required && <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Required</span>}
          {needsOptions && <span style={{ fontSize: 11, color: '#6b7280' }}>{field.options.length} option{field.options.length !== 1 ? 's' : ''}</span>}
        </div>

        <button type="button" onClick={e => { e.stopPropagation(); onRemove(index); }}
          style={{ background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          ✕
        </button>
        <span style={{ fontSize: 12, color: '#9ca3af', userSelect: 'none' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded editor ── */}
      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label>Label <span className="req">*</span></label>
              <input type="text" className="form-input" placeholder="e.g. Cleaning Type"
                value={field.label}
                onChange={e => {
                  const label = e.target.value;
                  upd({ label, name: field.name || toSlug(label) });
                }}
              />
            </div>
            <div className="form-group">
              <label>Field Key <span style={{ color: '#6b7280', fontWeight: 400 }}>(auto-filled)</span></label>
              <input type="text" className="form-input" placeholder="cleaningType"
                value={field.name}
                onChange={e => upd({ name: toSlug(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Field Type <span className="req">*</span></label>
              <select className="form-input" value={field.type}
                onChange={e => upd({ type: e.target.value as FieldType, options: [] })}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {(field.type === 'text' || field.type === 'number' || field.type === 'textarea' || field.type === 'tags') && (
              <div className="form-group">
                <label>Placeholder</label>
                <input type="text" className="form-input" placeholder="Hint text shown in empty input"
                  value={field.placeholder}
                  onChange={e => upd({ placeholder: e.target.value })}
                />
              </div>
            )}
            {needsUnit && (
              <div className="form-group">
                <label>Unit <span style={{ color: '#6b7280', fontWeight: 400 }}>(e.g. km, hrs, %)</span></label>
                <input type="text" className="form-input" placeholder="km"
                  value={field.unit}
                  onChange={e => upd({ unit: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="form-check" style={{ marginTop: 4 }}>
            <input type="checkbox" id={`req-${index}`} checked={field.required}
              onChange={e => upd({ required: e.target.checked })} />
            <label htmlFor={`req-${index}`} style={{ cursor: 'pointer', fontSize: 13 }}>
              This field is required
            </label>
          </div>

          {needsOptions && (
            <OptionsEditor
              options={field.options}
              onChange={opts => upd({ options: opts })}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Category form (add / edit) ────────────────────────── */
function CategoryForm({
  initial, onSave, onCancel,
}: {
  initial?: Category;
  onSave: (cat: Category) => Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = !!initial?._id;
  const [name, setName]           = useState(initial?.name ?? '');
  const [slug, setSlug]           = useState(initial?.slug ?? '');
  const [icon, setIcon]           = useState(initial?.icon ?? '🛠️');
  const [customIcon, setCustomIcon] = useState('');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fields, setFields]       = useState<FieldDef[]>(
    initial?.fields?.map(f => ({ ...f, options: f.options ?? [], placeholder: f.placeholder ?? '', unit: f.unit ?? '' })) ?? []
  );
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit) setSlug(toSlug(v));
  };

  const addField = () => setFields(prev => [...prev, emptyField()]);

  const updateField = (i: number, f: FieldDef) =>
    setFields(prev => prev.map((old, idx) => idx === i ? f : old));

  const removeField = (i: number) =>
    setFields(prev => prev.filter((_, idx) => idx !== i));

  const moveField = (i: number, dir: -1 | 1) => {
    setFields(prev => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const validate = () => {
    if (!name.trim()) { setError('Category name is required'); return false; }
    if (!slug.trim()) { setError('Slug is required'); return false; }
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) { setError(`Field #${i + 1} needs a label`); return false; }
      if (!fields[i].name.trim())  { setError(`Field #${i + 1} needs a key`); return false; }
      const needsOptions = fields[i].type === 'select' || fields[i].type === 'radio';
      if (needsOptions && fields[i].options.length === 0) {
        setError(`Field "${fields[i].label}" (${fields[i].type}) needs at least one option`); return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        _id: initial?._id,
        name: name.trim(),
        slug: slug.trim(),
        icon: (customIcon.trim() || icon),
        description: description.trim(),
        fields,
      });
    } catch (err: unknown) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="dash-topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>{isEdit ? `Edit: ${initial?.name}` : 'Add New Category'}</h2>
          <p>Set the category details and define what form fields providers see.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>← Back</button>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginTop: 16 }}>⚠ {error}</div>}

      {/* ── Basic info ── */}
      <div className="content-card" style={{ marginTop: 20, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Category Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <div className="form-group">
            <label>Name <span className="req">*</span></label>
            <input type="text" className="form-input" placeholder="e.g. Home Cleaning"
              value={name} onChange={e => handleNameChange(e.target.value)} disabled={saving} />
          </div>
          <div className="form-group">
            <label>Slug <span style={{ color: '#6b7280', fontWeight: 400 }}>(URL key)</span></label>
            <input type="text" className="form-input" placeholder="home-cleaning"
              value={slug} onChange={e => setSlug(toSlug(e.target.value))} disabled={saving} />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" className="form-input" placeholder="Short description shown to providers and customers"
            value={description} onChange={e => setDescription(e.target.value)} disabled={saving} />
        </div>

        {/* Icon picker */}
        <div className="form-group">
          <label>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {ICONS.map(ic => (
              <button key={ic} type="button"
                onClick={() => { setIcon(ic); setCustomIcon(''); }}
                style={{
                  width: 44, height: 44, fontSize: 22, borderRadius: 8, cursor: 'pointer',
                  border: icon === ic && !customIcon ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: icon === ic && !customIcon ? 'var(--primary-light)' : 'white',
                }}>
                {ic}
              </button>
            ))}
          </div>
          <input type="text" className="form-input" placeholder="Or type any emoji, e.g. 🎯"
            value={customIcon}
            onChange={e => { setCustomIcon(e.target.value); if (e.target.value.trim()) setIcon(e.target.value.trim()); }}
            style={{ width: 200 }}
          />
        </div>

        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 12, border: '1.5px solid var(--border)' }}>
          <span style={{ fontSize: 32 }}>{customIcon.trim() || icon}</span>
          <div>
            <strong>{name || 'Category Name'}</strong>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{slug || 'slug'}</p>
          </div>
        </div>
      </div>

      {/* ── Dynamic fields ── */}
      <div className="content-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>Form Fields</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              These fields appear in the service creation form when a provider selects this category.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={addField} disabled={saving}>
            + Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', border: '2px dashed var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p style={{ margin: 0 }}>No fields yet. Click <strong>+ Add Field</strong> to start.</p>
          </div>
        ) : (
          fields.map((field, i) => (
            <FieldRow key={i} field={field} index={i} total={fields.length}
              onChange={updateField} onRemove={removeField} onMove={moveField} />
          ))
        )}
      </div>

      {/* ── Submit ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}
          style={{ opacity: saving ? 0.75 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '✅ Create Category'}
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Main CategoryManager ───────────────────────────────── */
export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<'list' | 'form'>('list');
  const [editTarget, setEditTarget] = useState<Category | undefined>();
  const [successMsg, setSuccessMsg] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) { const d = await res.json(); setCategories(d.categories); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleSave = async (cat: Category) => {
    const isEdit = !!cat._id;
    const url    = isEdit ? `/api/categories/${cat._id}` : '/api/categories';
    const method = isEdit ? 'PATCH' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Save failed');

    setSuccessMsg(isEdit ? `"${cat.name}" updated!` : `"${cat.name}" created!`);
    await loadCategories();
    setView('list');
    setEditTarget(undefined);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const deactivate = async (cat: Category) => {
    if (!confirm(`Deactivate "${cat.name}"? Existing services using this category won't be affected.`)) return;
    await fetch(`/api/categories/${cat._id}`, { method: 'DELETE' });
    loadCategories();
  };

  if (view === 'form') {
    return (
      <CategoryForm
        initial={editTarget}
        onSave={handleSave}
        onCancel={() => { setView('list'); setEditTarget(undefined); }}
      />
    );
  }

  /* ── List view ── */
  return (
    <div>
      <div className="dash-topbar">
        <div><h2>Category Management</h2><p>Control which service categories exist and what fields they show providers.</p></div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(undefined); setView('form'); }}>
          + New Category
        </button>
      </div>

      {successMsg && <div className="form-alert form-alert-success" style={{ marginBottom: 16 }}>✓ {successMsg}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <h3>No categories yet</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setView('form')}>
            + Create First Category
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {categories.map(cat => (
            <div key={cat._id} className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,var(--primary-light),#ede9fe)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 36 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{cat.name}</h3>
                  <code style={{ fontSize: 11, color: '#6b7280' }}>{cat.slug}</code>
                </div>
                <span style={{ fontSize: 12, background: 'white', color: 'var(--primary)', borderRadius: 100, padding: '2px 10px', fontWeight: 600, border: '1px solid var(--primary)' }}>
                  {cat.fields.length} field{cat.fields.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Fields preview */}
              <div style={{ padding: '12px 20px' }}>
                {cat.description && (
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>{cat.description}</p>
                )}
                {cat.fields.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {cat.fields.map(f => (
                      <span key={f.name} style={{
                        fontSize: 11, background: '#f3f4f6', color: '#374151',
                        padding: '2px 8px', borderRadius: 100, fontWeight: 500,
                        border: f.required ? '1px solid #fca5a5' : '1px solid transparent',
                      }}>
                        {f.type === 'checkbox' ? '☑ ' : ''}{f.label}
                        {f.required && <span style={{ color: '#ef4444' }}> *</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px' }}>No fields defined.</p>
                )}
                <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-sm btn-primary" style={{ flex: 1 }}
                    onClick={() => { setEditTarget(cat); setView('form'); }}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-sm btn-danger"
                    onClick={() => deactivate(cat)}>
                    🗑 Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
