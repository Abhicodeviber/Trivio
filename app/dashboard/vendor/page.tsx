'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProductManager from '@/components/vendor/ProductManager';
import PromotionManager from '@/components/promotions/PromotionManager';
import MultiFileUpload from '@/components/ui/MultiFileUpload';
import FileUpload from '@/components/ui/FileUpload';
import ChatInbox from '@/components/chat/ChatInbox';

type Section = 'overview' | 'products' | 'promotions' | 'leads' | 'messages' | 'profile';

const SECTIONS: { key: Section; icon: string; label: string }[] = [
  { key: 'overview',   icon: '🏪', label: 'Overview' },
  { key: 'products',   icon: '📦', label: 'My Products' },
  { key: 'promotions', icon: '🎯', label: 'Promotions' },
  { key: 'leads',      icon: '📋', label: 'Leads' },
  { key: 'messages',   icon: '💬', label: 'Messages' },
  { key: 'profile',    icon: '⚙️',  label: 'Shop Settings' },
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

type VendorUser = Record<string, unknown>;

function ProfileSection() {
  const { user } = useAuth();
  const u = user as unknown as VendorUser | null;
  const [form, setForm] = useState({
    shopName: '', ownerName: '', phone: '', whatsapp: '', city: '', address: '',
    description: '', logo: '', photos: [] as string[], youtube: '', instagram: '',
    lat: '', lng: '',
  });
  const [saving, setSaving]       = useState(false);
  const [notice, setNotice]       = useState('');
  const [gettingLoc, setGettingLoc] = useState(false);
  const [locError, setLocError]   = useState('');

  useEffect(() => {
    if (!u) return;
    const loc = u.location as { coordinates?: [number, number] } | undefined;
    setForm({
      shopName:    String(u.shopName    ?? ''),
      ownerName:   String(u.ownerName   ?? ''),
      phone:       String(u.phone       ?? ''),
      whatsapp:    String(u.whatsapp    ?? ''),
      city:        String(u.city        ?? ''),
      address:     String(u.address     ?? ''),
      description: String(u.description ?? ''),
      logo:        String(u.logo        ?? ''),
      photos:      Array.isArray(u.photos) ? (u.photos as string[]) : [],
      youtube:     String(u.youtube     ?? ''),
      instagram:   String(u.instagram   ?? ''),
      lat:         loc?.coordinates ? String(loc.coordinates[1]) : '',
      lng:         loc?.coordinates ? String(loc.coordinates[0]) : '',
    });
  }, [user]);

  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));

  function handleGetLocation() {
    if (!navigator.geolocation) { setLocError('Geolocation is not supported by your browser.'); return; }
    setGettingLoc(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: String(pos.coords.latitude.toFixed(6)), lng: String(pos.coords.longitude.toFixed(6)) }));
        setGettingLoc(false);
      },
      err => {
        setLocError(err.code === 1 ? 'Location permission denied. Please allow access and try again.' : 'Could not get location. Try again.');
        setGettingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Basic Info */}
        <div className="content-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--dark)' }}>🏪 Basic Info</h3>
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
            <textarea className="form-input form-textarea" value={form.description}
              onChange={e => set('description', e.target.value)} disabled={saving} style={{ minHeight: 80 }} />
          </div>
        </div>

        {/* Logo & Photos */}
        <div className="content-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--dark)' }}>🖼️ Logo &amp; Shop Photos</h3>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <FileUpload
              label="Shop Logo"
              fileType="image"
              value={form.logo}
              onUpload={r => set('logo', r.url)}
              onRemove={() => set('logo', '')}
              hint="Square image recommended · JPG, PNG, WebP"
            />
          </div>
          <MultiFileUpload
            label="Shop Photos (shown in gallery on your shop page)"
            values={form.photos}
            onChange={urls => set('photos', urls)}
            max={10}
          />
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
            Add up to 10 photos of your shop, products or workspace. These appear in the gallery on your shop page.
          </p>
        </div>

        {/* Social Links */}
        <div className="content-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--dark)' }}>🔗 Social &amp; Channel Links</h3>
          <div className="form-row">
            <div className="form-group">
              <label>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#ff0000', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>▶ YouTube</span>
                  Channel URL
                </span>
              </label>
              <input type="url" className="form-input" placeholder="https://youtube.com/@yourchannel"
                value={form.youtube} onChange={e => set('youtube', e.target.value)} disabled={saving} />
            </div>
            <div className="form-group">
              <label>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>📷 Instagram</span>
                  Profile URL
                </span>
              </label>
              <input type="url" className="form-input" placeholder="https://instagram.com/yourshop"
                value={form.instagram} onChange={e => set('instagram', e.target.value)} disabled={saving} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="content-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--dark)' }}>📍 Shop Location</h3>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
            Save your shop's GPS location so customers can find nearby shops easily.
          </p>

          {/* Use Current Location button */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLoc || saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: gettingLoc ? '#e2e8f0' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
              color: gettingLoc ? 'var(--text-light)' : '#fff',
              border: 'none', borderRadius: 8, padding: '9px 18px',
              fontSize: 14, fontWeight: 600, cursor: gettingLoc ? 'not-allowed' : 'pointer',
              marginBottom: 16, transition: 'opacity .2s',
            }}>
            {gettingLoc
              ? <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid #94a3b8', borderTopColor:'#475569', borderRadius:'50%', animation:'spin .7s linear infinite' }} /> Detecting…</>
              : <>📍 Use Current Location</>}
          </button>

          {locError && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 12px', color:'#dc2626', fontSize:13, marginBottom:14 }}>
              {locError}
            </div>
          )}

          {/* Manual lat/lng inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" className="form-input" placeholder="e.g. 28.6139"
                value={form.lat} onChange={e => set('lat', e.target.value)} disabled={saving} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" className="form-input" placeholder="e.g. 77.2090"
                value={form.lng} onChange={e => set('lng', e.target.value)} disabled={saving} />
            </div>
          </div>

          {/* Map preview when coords are set */}
          {form.lat && form.lng && (
            <a
              href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#0ea5e9', textDecoration:'none', fontWeight:600, marginTop:4 }}>
              🗺️ Preview on Google Maps ↗
            </a>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, background: 'linear-gradient(135deg,#16a34a,#15803d)', alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : 'Save All Settings'}
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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/chat/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {});
    const t = setInterval(() => {
      fetch('/api/chat/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

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
              onClick={() => { setSection(s.key); setMenuOpen(false); if (s.key === 'messages') setUnread(0); }}>
              <span>{s.icon}</span> {s.label}
              {s.key === 'messages' && unread > 0 && <span className="badge-count">{unread}</span>}
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
            <Link href={`/shops/${user._id}`} target="_blank">
              <button className="btn btn-sm" style={{ background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', border:'none' }}>
                🏪 View My Shop
              </button>
            </Link>
          </div>
        </div>

        {section === 'overview'   && <OverviewSection vendorId={user._id} />}
        {section === 'products'   && <ProductManager />}
        {section === 'promotions' && <PromotionManager role="vendor" />}
        {section === 'leads'      && <LeadsSection />}
        {section === 'messages'   && (
          <div>
            <div className="dash-topbar" style={{ borderBottom: 'none', marginBottom: 16, paddingBottom: 0 }}>
              <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>💬 Messages</h2><p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: 14 }}>Chat with your customers.</p></div>
            </div>
            <ChatInbox />
          </div>
        )}
        {section === 'profile'    && <ProfileSection />}
      </main>
    </div>
  );
}
