'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CategoryManager from '@/components/admin/CategoryManager';

const SECTIONS = ['home','users','providers','services','categories','reports','settings'] as const;
type Section = typeof SECTIONS[number];

export default function AdminDashboard() {
  const [active, setActive] = useState<Section>('home');
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) ?? 'SA';

  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar" style={{ background: 'linear-gradient(180deg,#0f172a,#1e293b)' }}>
        <div className="dash-brand"><div className="logo-icon" style={{background:'#ef4444'}}>S</div><span>Admin</span></div>
        <nav className="dash-nav">
          {[['home','📊 Overview'],['users','👥 Users'],['providers','🛠️ Providers'],['services','📋 Services'],['categories','📂 Categories'],['reports','📈 Analytics'],['settings','⚙️ Settings']].map(([id,label]) => (
            <button key={id} className={`dash-nav-item${active===id?' active':''}`} onClick={() => setActive(id as Section)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="dash-user" style={{ cursor: 'default' }}>
          <div className="du-avatar" style={{background:'#ef4444'}}>{initials}</div>
          <div className="du-info"><strong>{user?.name ?? 'Admin'}</strong><span>{user?.email ?? ''}</span></div>
          <button className="du-logout" title="Logout" onClick={logout}>↩</button>
        </div>
      </aside>

      <main className="dash-main" style={{background:'#f1f5f9'}}>
        <div className="dash-topbar">
          <div><h2>{active==='home'?'Admin Overview 📊':active==='users'?'User Management':active==='providers'?'Provider Management':active==='services'?'Services Overview':active==='categories'?'Category Management':active==='reports'?'Analytics & Reports':'Platform Settings'}</h2><p>Platform performance at a glance.</p></div>
          <div style={{display:'flex',gap:8}}><button className="btn btn-ghost">Export</button><button className="btn btn-primary">+ Announce</button></div>
        </div>

        {(active === 'home' || active === 'reports') && (
          <div className="dash-stats" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
            {[['👥','#dbeafe','52,340','Total Users'],['🛠️','#dcfce7','12,890','Providers'],['📋','#fef3c7','98,400','Services'],['💰','#fce7f3','$2.4M','Monthly GMV']].map(([icon,bg,val,label]) => (
              <div key={label} className="dstat"><span className="dstat-icon" style={{background:bg}}>{icon}</span><div><strong>{val}</strong><small>{label}</small></div></div>
            ))}
          </div>
        )}

        {active === 'home' && (
          <div className="content-card" style={{marginTop:20}}>
            <h3>Pending Approvals <span className="badge-count" style={{background:'#ef4444',marginLeft:8}}>7</span></h3>
            <div className="booking-table-header"><div>Provider</div><div>Category</div><div>Joined</div><div>Documents</div><div>Action</div></div>
            {[{init:'LS',color:'#6366f1',name:'Lisa Sun',cat:'Cleaning',date:'Apr 30',docs:'Submitted'},{init:'MP',color:'#8b5cf6',name:'Mark P.',cat:'Tech Support',date:'Apr 29',docs:'Pending'}].map((p) => (
              <div key={p.name} className="booking-row">
                <div className="br-provider"><div className="bi-avatar" style={{background:p.color,width:36,height:36,fontSize:12}}>{p.init}</div><span>{p.name}</span></div>
                <div>{p.cat}</div><div>{p.date}</div>
                <div><span className={`bi-status ${p.docs==='Submitted'?'status-confirmed':'status-pending'}`}>{p.docs}</span></div>
                <div style={{display:'flex',gap:6}}><button className="btn btn-sm btn-primary">Approve</button><button className="btn btn-sm btn-danger">Reject</button></div>
              </div>
            ))}
          </div>
        )}

        {active === 'users' && (
          <div className="content-card">
            <div className="booking-table-header"><div>User</div><div>Email</div><div>Role</div><div>Status</div><div>Actions</div></div>
            {[{init:'JD',color:'#6366f1',name:'John Davidson',email:'john@mail.com',role:'Provider',active:true},{init:'AM',color:'#3b82f6',name:'Alice M.',email:'alice@mail.com',role:'Customer',active:true},{init:'XX',color:'#ef4444',name:'Bad Actor',email:'bad@mail.com',role:'Customer',active:false}].map((u) => (
              <div key={u.name} className="booking-row">
                <div className="br-provider"><div className="bi-avatar" style={{background:u.color,width:36,height:36,fontSize:12}}>{u.init}</div><span>{u.name}</span></div>
                <div>{u.email}</div>
                <div><span className="ptag">{u.role}</span></div>
                <div><span className={`bi-status ${u.active?'status-confirmed':''}`} style={!u.active?{background:'#fee2e2',color:'#ef4444'}:{}}>{u.active?'Active':'Suspended'}</span></div>
                <div style={{display:'flex',gap:6}}><button className="btn btn-sm btn-ghost">View</button><button className={`btn btn-sm ${u.active?'btn-danger':'btn-primary'}`}>{u.active?'Suspend':'Restore'}</button></div>
              </div>
            ))}
          </div>
        )}

        {active === 'settings' && (
          <div className="content-card">
            <h3>General Settings</h3>
            <div className="settings-form">
              <div className="form-group"><label>Platform Name</label><input className="form-input" defaultValue="ServeHub" /></div>
              <div className="form-group"><label>Support Email</label><input className="form-input" defaultValue="support@servehub.com" /></div>
              <div className="form-group"><label>Commission Rate (%)</label><input className="form-input" defaultValue="8" /></div>
              <div className="form-group"><label>Provider Verification</label><div className="toggle-row"><span>Require ID verification for all providers</span><div className="toggle active" /></div></div>
              <button className="btn btn-primary">Save Settings</button>
            </div>
          </div>
        )}

        {active === 'categories' && <CategoryManager />}

        {(active === 'providers' || active === 'services') && (
          <div className="content-card">
            <h3>{active === 'providers' ? 'Verification Queue' : 'All Services'}</h3>
            <p style={{color:'var(--text-light)',marginTop:8}}>Full management table with approve, reject, and filter controls.</p>
          </div>
        )}
      </main>
    </div>
  );
}
