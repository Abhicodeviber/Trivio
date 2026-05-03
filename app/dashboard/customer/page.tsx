'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatInbox from '@/components/chat/ChatInbox';

const SECTIONS = ['home','search','bookings','saved','messages','settings'] as const;
type Section = typeof SECTIONS[number];

export default function CustomerDashboard() {
  const [active, setActive] = useState<Section>('home');
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) ?? 'CU';
  const firstName = user?.name?.split(' ')[0] ?? 'Customer';

  useEffect(() => {
    fetch('/api/chat/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {});
    const t = setInterval(() => {
      fetch('/api/chat/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar" style={{ background: 'linear-gradient(180deg,#1e1b4b,#312e81)' }}>
        <div className="dash-brand"><div className="logo-icon">S</div><span>ServeHub</span></div>
        <nav className="dash-nav">
          {[['home','🏠 Dashboard'],['search','🔍 Find Services'],['bookings','📋 My Bookings'],['saved','🤍 Saved Providers'],['messages','💬 Messages'],['settings','⚙️ Settings']].map(([id, label]) => (
            <button key={id} className={`dash-nav-item${active === id ? ' active' : ''}`} onClick={() => { setActive(id as Section); if (id === 'messages') setUnread(0); }}>
              {label}{id === 'messages' && unread > 0 && <span className="badge-count">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="dash-user" style={{ cursor: 'default' }}>
          <div className="du-avatar" style={{ background: '#6366f1' }}>{initials}</div>
          <div className="du-info"><strong>{user?.name ?? 'Customer'}</strong><span>{user?.email ?? ''}</span></div>
          <button className="du-logout" title="Logout" onClick={logout}>↩</button>
        </div>
      </aside>

      <main className="dash-main">
        {active === 'home' && (
          <>
            <div className="dash-topbar"><div><h2>Welcome back, {firstName}! 👋</h2><p>Here&apos;s what&apos;s happening with your services.</p></div><Link href="/browse"><button className="btn btn-primary">+ Find Services</button></Link></div>
            <div className="dash-stats">
              {[['📋','#ede9fe','5','Active Bookings'],['✅','#dcfce7','23','Completed'],['🤍','#fce7f3','12','Saved Providers'],['⭐','#fef3c7','4.8','Avg Rating Given']].map(([icon,bg,val,label]) => (
                <div key={label} className="dstat"><span className="dstat-icon" style={{background:bg}}>{icon}</span><div><strong>{val}</strong><small>{label}</small></div></div>
              ))}
            </div>
            <div className="dash-two-col">
              <div className="content-card">
                <h3>Upcoming Bookings</h3>
                <div className="booking-list">
                  {[{init:'JD',color:'#6366f1',name:'John Davidson',service:'Plumbing Repair',date:'May 5 · 10:00 AM',status:'Confirmed',cls:'status-confirmed'},{init:'SR',color:'#ec4899',name:'Sarah Rivera',service:'Logo Design',date:'May 8 · 2:00 PM',status:'Pending',cls:'status-pending'}].map((b) => (
                    <div key={b.name} className="booking-item">
                      <div className="bi-avatar" style={{background:b.color}}>{b.init}</div>
                      <div className="bi-info"><strong>{b.name}</strong><span>{b.service}</span><div className="bi-date">📅 {b.date}</div></div>
                      <div className={`bi-status ${b.cls}`}>{b.status}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="content-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {[{icon:'⭐',title:'You rated Tom Martin',sub:'5 stars · Electrical Repair',time:'2h ago'},{icon:'💬',title:'New message from Sarah',sub:'"I\'ll send the first draft soon!"',time:'5h ago'},{icon:'✅',title:'Booking completed',sub:'Cleaning Service by Amy Lee',time:'1d ago'}].map((a) => (
                    <div key={a.title} className="activity-item">
                      <span className="act-icon">{a.icon}</span>
                      <div><strong>{a.title}</strong><small>{a.sub}</small></div>
                      <span className="act-time">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        {active === 'bookings' && (
          <>
            <div className="dash-topbar"><div><h2>My Bookings</h2><p>View and manage all your service bookings.</p></div></div>
            <div className="content-card">
              <div className="booking-table-header"><div>Provider</div><div>Service</div><div>Date</div><div>Status</div><div>Action</div></div>
              {[{init:'JD',color:'#6366f1',name:'John Davidson',service:'Plumbing Repair',date:'May 5',status:'Confirmed',cls:'status-confirmed'},{init:'SR',color:'#ec4899',name:'Sarah Rivera',service:'Logo Design',date:'May 8',status:'Pending',cls:'status-pending'},{init:'TM',color:'#f59e0b',name:'Tom Martin',service:'Electrical',date:'Apr 25',status:'Completed',cls:'status-done'}].map((b) => (
                <div key={b.name} className="booking-row">
                  <div className="br-provider"><div className="bi-avatar" style={{background:b.color,width:36,height:36,fontSize:12}}>{b.init}</div><span>{b.name}</span></div>
                  <div>{b.service}</div><div>{b.date}</div>
                  <div><span className={`bi-status ${b.cls}`}>{b.status}</span></div>
                  <div><button className="btn btn-sm btn-ghost">View</button></div>
                </div>
              ))}
            </div>
          </>
        )}
        {active === 'settings' && (
          <>
            <div className="dash-topbar"><div><h2>Account Settings</h2><p>Manage your profile and preferences.</p></div></div>
            <div className="content-card">
              <h3>Personal Information</h3>
              <div className="settings-form">
                <div className="form-row"><div className="form-group"><label>First Name</label><input className="form-input" defaultValue="Customer" /></div><div className="form-group"><label>Last Name</label><input className="form-input" defaultValue="User" /></div></div>
                <div className="form-group"><label>Email</label><input className="form-input" defaultValue="customer@mail.com" /></div>
                <div className="form-group"><label>Phone</label><input className="form-input" defaultValue="+1 (555) 000-0000" /></div>
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </>
        )}
        {(active === 'search' || active === 'saved') && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>{active === 'search' ? '🔍' : '🤍'}</div>
            <h3 style={{fontSize:20,fontWeight:700,color:'var(--dark)',marginBottom:8}}>{active === 'search' ? 'Find Services' : 'Saved Providers'}</h3>
            {active === 'search' && <Link href="/browse"><button className="btn btn-primary" style={{marginTop:16}}>Open Browse</button></Link>}
          </div>
        )}
        {active === 'messages' && (
          <div>
            <div className="dash-topbar"><div><h2>💬 Messages</h2><p>Chat with shops and service providers.</p></div></div>
            <ChatInbox />
          </div>
        )}
      </main>
    </div>
  );
}
