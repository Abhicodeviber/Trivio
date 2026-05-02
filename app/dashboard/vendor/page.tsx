'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductManager from '@/components/vendor/ProductManager';

type Section = 'overview' | 'products' | 'leads' | 'profile';

const SECTIONS: { key: Section; icon: string; label: string }[] = [
  { key: 'overview',  icon: '🏪', label: 'Overview' },
  { key: 'products',  icon: '📦', label: 'My Products' },
  { key: 'leads',     icon: '📋', label: 'Leads' },
  { key: 'profile',   icon: '⚙️',  label: 'Shop Settings' },
];

interface Lead {
  _id: string; productId?: { title: string; category: string; price: number };
  customerInfo?: { name: string; email: string; phone?: string };
  contactType: string; createdAt: string;
}

interface Stats { totalProducts: number; totalLeads: number; inStockProducts: number; }

function OverviewSection({ vendorId }: { vendorId: string }) {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalLeads: 0, inStockProducts: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/products?vendorId=${vendorId}&limit=1`).then(r => r.json()),
      fetch(`/api/products?vendorId=${vendorId}&inStock=true&limit=1`).then(r => r.json()),
      fetch('/api/vendor-leads?limit=1').then(r => r.json()),
    ]).then(([all, inStock, leads]) => {
      setStats({
        totalProducts:   all.total  ?? 0,
        inStockProducts: inStock.total ?? 0,
        totalLeads:      leads.total ?? 0,
      });
    }).catch(() => {});
  }, [vendorId]);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Shop Overview</h2>
      <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📦', label: 'Total Products', value: stats.totalProducts, color: '#6366f1' },
          { icon: '✅', label: 'In Stock', value: stats.inStockProducts, color: '#16a34a' },
          { icon: '📋', label: 'Total Leads', value: stats.totalLeads, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="dstat content-card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="content-card" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac' }}>
        <h3 style={{ margin: '0 0 8px', color: '#166534' }}>💡 Tips to grow your shop</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#166534', fontSize: 14, lineHeight: 1.8 }}>
          <li>Add clear product images — listings with photos get 3× more inquiries</li>
          <li>Keep your stock status up to date</li>
          <li>Respond to customer leads quickly for better conversions</li>
          <li>Add competitive pricing and detailed descriptions</li>
        </ul>
      </div>
    </div>
  );
}

function LeadsSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor-leads?limit=50')
      .then(r => r.json())
      .then(data => setLeads(data.leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading leads…</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Customer Leads</h2>
      {leads.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--text-light)' }}>No leads yet. When customers reveal your contact info, they'll appear here.</p>
        </div>
      ) : (
        <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                {['Product', 'Customer', 'Contact Via', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{l.productId?.title ?? 'Unknown'}</div>
                    {l.productId?.category && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{l.productId.category}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.customerInfo ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{l.customerInfo.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{l.customerInfo.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>Anonymous</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: l.contactType === 'whatsapp' ? '#d1fae5' : '#ede9fe',
                      color: l.contactType === 'whatsapp' ? '#065f46' : '#5b21b6' }}>
                      {l.contactType === 'whatsapp' ? '💬 WhatsApp' : '📞 Mobile'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-light)', fontSize: 13 }}>
                    {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.customerInfo ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {l.customerInfo.phone && (
                          <a href={`tel:${l.customerInfo.phone}`} className="btn btn-sm btn-outline" style={{ fontSize: 12 }}>📞 Call</a>
                        )}
                        <a href={`mailto:${l.customerInfo.email}`} className="btn btn-sm btn-outline" style={{ fontSize: 12 }}>✉️ Email</a>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    shopName: '', ownerName: '', phone: '', whatsapp: '', city: '', address: '', description: '', logo: '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      shopName:    (user as unknown as Record<string, string>).shopName    ?? '',
      ownerName:   (user as unknown as Record<string, string>).ownerName   ?? '',
      phone:       user.phone        ?? '',
      whatsapp:    (user as unknown as Record<string, string>).whatsapp    ?? '',
      city:        user.city         ?? '',
      address:     (user as unknown as Record<string, string>).address     ?? '',
      description: user.description  ?? '',
      logo:        user.logo         ?? '',
    });
  }, [user]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${user._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setNotice('Settings saved!');
      setTimeout(() => setNotice(''), 3000);
    } catch {
      setNotice('Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Shop Settings</h2>
      {notice && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, background: '#d1fae5', color: '#065f46', fontSize: 14 }}>✓ {notice}</div>}
      <div className="content-card">
        <div className="form-row">
          <div className="form-group">
            <label>Shop Name</label>
            <input type="text" className="form-input" value={form.shopName} onChange={e => set('shopName', e.target.value)} disabled={saving} />
          </div>
          <div className="form-group">
            <label>Owner Name</label>
            <input type="text" className="form-input" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} disabled={saving} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} disabled={saving} />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input type="tel" className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} disabled={saving} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input type="text" className="form-input" value={form.city} onChange={e => set('city', e.target.value)} disabled={saving} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" className="form-input" value={form.address} onChange={e => set('address', e.target.value)} disabled={saving} />
          </div>
        </div>
        <div className="form-group">
          <label>Shop Description</label>
          <textarea className="form-input form-textarea" value={form.description} onChange={e => set('description', e.target.value)}
            disabled={saving} style={{ minHeight: 80 }} />
        </div>
        <div className="form-group">
          <label>Logo URL</label>
          <input type="url" className="form-input" placeholder="https://…" value={form.logo}
            onChange={e => set('logo', e.target.value)} disabled={saving} />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'vendor')) {
      router.push('/login?redirect=/dashboard/vendor');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
  }

  const displayName = (user as unknown as Record<string, string>).shopName ?? user.name ?? 'Vendor';
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar vendor-sidebar">
        <div className="dash-brand">
          <div className="logo-icon">S</div>
          <span className="logo-text">ServeHub</span>
        </div>

        <nav className="dash-nav">
          {SECTIONS.map(s => (
            <button key={s.key}
              className={`dash-nav-item${section === s.key ? ' active' : ''}`}
              onClick={() => { setSection(s.key); setMenuOpen(false); }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>

        <div className="dash-user">
          <div className="dash-user-av">{initials}</div>
          <div className="dash-user-info">
            <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{displayName}</strong>
            <span className="vendor-badge">Vendor</span>
          </div>
          <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginLeft: 'auto', opacity: 0.7 }}>🚪</button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Mobile top bar */}
        <div className="dash-topbar" style={{ borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {SECTIONS.find(s => s.key === section)?.icon} {SECTIONS.find(s => s.key === section)?.label}
          </h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Welcome, {displayName}</span>
          </div>
        </div>

        {section === 'overview' && <OverviewSection vendorId={user._id} />}
        {section === 'products' && <ProductManager />}
        {section === 'leads'    && <LeadsSection />}
        {section === 'profile'  && <ProfileSection />}
      </main>
    </div>
  );
}
