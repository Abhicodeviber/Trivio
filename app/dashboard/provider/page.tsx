'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ServiceManager from '@/components/provider/ServiceManager';

const SECTIONS = ['home','services','leads','profile','experience','contact','messages','earnings'] as const;
type Section = typeof SECTIONS[number];

interface Lead {
  _id: string;
  contactType: 'mobile' | 'whatsapp';
  createdAt: string;
  service?: { _id: string; title: string };
  customer?: { _id: string; name: string; email: string; phone?: string };
  visitorId?: string;
}

function LeadsSection() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="dash-topbar">
        <div><h2>📲 Leads</h2><p>Customers who revealed your contact number.</p></div>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 14, padding: '6px 16px', borderRadius: 20 }}>
          {leads.length} total
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>Loading leads…</div>
      ) : leads.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>No leads yet</h3>
          <p style={{ color: 'var(--text-light)' }}>When someone reveals your contact number on a service page, they'll appear here.</p>
        </div>
      ) : (
        <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr', gap: 12, padding: '12px 20px', background: 'var(--bg)', borderBottom: '1.5px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Customer</div>
            <div>Service</div>
            <div>Contact</div>
            <div>Date</div>
            <div>Actions</div>
          </div>

          {leads.map(lead => {
            const initials = lead.customer?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
            return (
              <div
                key={lead._id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Customer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: lead.customer ? 'linear-gradient(135deg,var(--primary),var(--secondary))' : '#e2e8f0', display: 'grid', placeItems: 'center', color: lead.customer ? 'white' : 'var(--text-light)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {lead.customer ? initials : '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)' }}>
                      {lead.customer?.name ?? <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Anonymous</span>}
                    </div>
                    {lead.customer?.email && (
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{lead.customer.email}</div>
                    )}
                  </div>
                </div>

                {/* Service */}
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.service?.title ?? '—'}
                </div>

                {/* Contact type */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                    padding: '3px 10px', borderRadius: 20,
                    background: lead.contactType === 'whatsapp' ? '#f0fdf4' : '#eff6ff',
                    color: lead.contactType === 'whatsapp' ? '#16a34a' : '#2563eb',
                  }}>
                    {lead.contactType === 'whatsapp' ? '💬 WhatsApp' : '📞 Mobile'}
                  </span>
                </div>

                {/* Date */}
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{fmt(lead.createdAt)}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {lead.customer?.phone && (
                    <a href={`tel:${lead.customer.phone}`} style={{ textDecoration: 'none' }}>
                      <button className="btn btn-sm btn-ghost" style={{ color: '#16a34a' }}>📞 Call</button>
                    </a>
                  )}
                  {lead.customer?.email && (
                    <a href={`mailto:${lead.customer.email}`} style={{ textDecoration: 'none' }}>
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--primary)' }}>✉️ Email</button>
                    </a>
                  )}
                  {!lead.customer && (
                    <span style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>Not logged in</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProviderDashboard() {
  const [active, setActive] = useState<Section>('home');
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) ?? 'PR';

  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar" style={{ background: 'linear-gradient(180deg,#1e1b4b,#312e81)' }}>
        <div className="dash-brand"><div className="logo-icon">S</div><span>ServeHub</span></div>
        <nav className="dash-nav">
          {([
            ['home',       '📊 Dashboard'],
            ['services',   '🛠️ My Services'],
            ['leads',      '📲 Leads'],
            ['profile',    '👤 Edit Profile'],
            ['experience', '📜 Experience'],
            ['contact',    '📞 Contact Info'],
            ['messages',   '💬 Messages'],
            ['earnings',   '💰 Earnings'],
          ] as [Section, string][]).map(([id, label]) => (
            <button key={id} className={`dash-nav-item${active===id?' active':''}`} onClick={() => setActive(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="dash-user" style={{ cursor: 'default' }}>
          <div className="du-avatar" style={{background:'#8b5cf6'}}>{initials}</div>
          <div className="du-info"><strong>{user?.name ?? 'Provider'}</strong><span>{user?.email ?? 'Provider'}</span></div>
          <button className="du-logout" title="Logout" onClick={logout}>↩</button>
        </div>
      </aside>

      <main className="dash-main">
        {active === 'home' && (
          <>
            <div className="dash-topbar">
              <div><h2>Provider Dashboard 🛠️</h2><p>Manage your services and grow your business.</p></div>
              <button className="btn btn-primary" onClick={() => setActive('services')}>+ Add Service</button>
            </div>
            <div className="dash-stats">
              {[['💼','#ede9fe','8','Active Services'],['✅','#dcfce7','200+','Jobs Completed'],['💰','#fef3c7','$3,240','This Month'],['⭐','#fce7f3','4.9','Avg Rating']].map(([icon,bg,val,label]) => (
                <div key={label} className="dstat"><span className="dstat-icon" style={{background:bg}}>{icon}</span><div><strong>{val}</strong><small>{label}</small></div></div>
              ))}
            </div>
            <div className="content-card">
              <h3>Earnings Overview</h3>
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {[['Jan','60%'],['Feb','75%'],['Mar','55%'],['Apr','90%'],['May','80%','var(--primary)']].map(([m,h,color]) => (
                    <div key={m} className="chart-col"><div className="chart-bar" style={{height:h,background:color||undefined}} /><span>{m}</span></div>
                  ))}
                </div>
              </div>
              <div className="chart-legend">📈 Revenue up 23% from last month</div>
            </div>
          </>
        )}

        {active === 'services' && <ServiceManager />}
        {active === 'leads'    && <LeadsSection />}

        {active === 'earnings' && (
          <>
            <div className="dash-topbar"><div><h2>Earnings</h2><p>Track your revenue and payments.</p></div></div>
            <div className="dash-stats">
              {[['💰','#dcfce7','$3,240','This Month'],['📅','#ede9fe','$1,860','Last Month'],['🏆','#fef3c7','$28,400','All Time'],['⏳','#fce7f3','$420','Pending']].map(([icon,bg,val,label]) => (
                <div key={label} className="dstat"><span className="dstat-icon" style={{background:bg}}>{icon}</span><div><strong>{val}</strong><small>{label}</small></div></div>
              ))}
            </div>
            <div className="content-card">
              <h3>Payment History</h3>
              <div className="booking-table-header"><div>Client</div><div>Service</div><div>Date</div><div>Amount</div><div>Status</div></div>
              {[['Alice M.','Pipe Repair','Apr 30','$195','Paid'],['Bob K.','Heater Install','Apr 28','$320','Paid'],['Carol W.','Drain Clean','Apr 25','$90','Pending']].map(([c,s,d,a,st]) => (
                <div key={c} className="booking-row"><div>{c}</div><div>{s}</div><div>{d}</div><div><strong>{a}</strong></div><div><span className={`bi-status ${st==='Paid'?'status-done':'status-pending'}`}>{st}</span></div></div>
              ))}
            </div>
          </>
        )}

        {(['profile','experience','contact','messages'] as Section[]).includes(active) && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>
              {active==='profile'?'👤':active==='experience'?'📜':active==='contact'?'📞':'💬'}
            </div>
            <h3 style={{fontSize:20,fontWeight:700,color:'var(--dark)',marginBottom:8}}>
              {active==='profile'?'Edit Profile':active==='experience'?'Experience':active==='contact'?'Contact Info':'Messages'}
            </h3>
            <p style={{color:'var(--text-light)'}}>This section is fully designed in the desktop view.</p>
          </div>
        )}
      </main>
    </div>
  );
}
