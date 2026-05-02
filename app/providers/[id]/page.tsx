'use client';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';
import { useState } from 'react';

const TABS = ['about','services','experience','reviews'] as const;
type Tab = typeof TABS[number];

export default function ProviderProfilePage() {
  const [tab, setTab] = useState<Tab>('about');

  return (
    <>
      <Navbar />
      <div className="profile-cover" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
        <div className="container">
          <Link href="/browse"><button className="back-btn">← Back to Browse</button></Link>
        </div>
      </div>

      <div className="container profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-lg">JD</div>
              <div className="profile-avail-dot" />
            </div>
            <h2 className="profile-name">John Davidson</h2>
            <p className="profile-tagline">Master Plumber & Pipe Specialist</p>
            <div className="profile-rating-big"><div className="stars">⭐⭐⭐⭐⭐</div><span>4.9 / 5.0 <em>(128 reviews)</em></span></div>
            <div className="profile-badges">
              <span className="badge-item badge-verified">✓ Verified</span>
              <span className="badge-item badge-top">🏆 Top Pro</span>
              <span className="badge-item badge-new">⚡ Fast Response</span>
            </div>
            <div className="profile-meta">
              <div className="meta-row"><span>📍</span><span>New York, NY</span></div>
              <div className="meta-row"><span>💼</span><span>12 years experience</span></div>
              <div className="meta-row"><span>✅</span><span>200+ jobs completed</span></div>
              <div className="meta-row"><span>⏱</span><span>Responds in ~1 hour</span></div>
            </div>
            <div className="profile-price">
              <span className="price-label">Starting from</span>
              <span className="price-big">$45<small>/hr</small></span>
            </div>
            <button className="btn btn-primary btn-full">Contact John</button>
            <button className="btn btn-outline btn-full" style={{ marginTop: 10 }}>Save Profile 🤍</button>
          </div>
        </aside>

        <div>
          <div className="profile-tabs">
            {TABS.map((t) => (
              <button key={t} className={`ptab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t === 'reviews' ? 'Reviews (128)' : t === 'services' ? 'Services (6)' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'about' && (
            <>
              <div className="content-card">
                <h3>About Me</h3>
                <p>With over 12 years of hands-on plumbing experience, I've helped hundreds of homeowners and businesses maintain and repair their plumbing systems.</p>
              </div>
              <div className="content-card">
                <h3>Skills & Expertise</h3>
                <div className="skills-grid">
                  {[['Pipe Repair','95%'],['Water Heaters','90%'],['Bathroom Install','85%'],['Drain Cleaning','100%']].map(([n, w]) => (
                    <div key={n} className="skill-item">
                      <span className="skill-name">{n}</span>
                      <div className="skill-bar"><div className="skill-fill" style={{ width: w }} /></div>
                      <span className="skill-pct">Expert</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="content-card">
                <h3>Portfolio</h3>
                <div className="portfolio-grid">
                  {[['#667eea,#764ba2','Bathroom Renovation'],['#4facfe,#00f2fe','Pipe Upgrade'],['#43e97b,#38f9d7','Kitchen Plumbing'],['#fa709a,#fee140','Heater Install']].map(([g, l]) => (
                    <div key={l} className="portfolio-img" style={{ background: `linear-gradient(135deg,${g})` }}>
                      <div className="portfolio-overlay">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'services' && (
            <div className="content-card">
              <h3>Services Offered</h3>
              <div className="services-list">
                {[{icon:'🔧',bg:'#ede9fe',name:'Emergency Pipe Repair',desc:'24/7 emergency service',tags:['Emergency','24/7'],price:'$65/hr'},{icon:'🚿',bg:'#fce7f3',name:'Bathroom Installation',desc:'Full bathroom plumbing',tags:['Installation'],price:'$55/hr'},{icon:'🌊',bg:'#dcfce7',name:'Drain Cleaning',desc:'Kitchen & bathroom drains',tags:['Maintenance'],price:'$45/hr'}].map((s) => (
                  <div key={s.name} className="service-item-card">
                    <div className="sic-icon" style={{ background: s.bg }}>{s.icon}</div>
                    <div className="sic-info"><h4>{s.name}</h4><p>{s.desc}</p><div className="sc-tags">{s.tags.map((t) => <span key={t} className="ptag">{t}</span>)}</div></div>
                    <div className="sic-price"><span className="price-amt">{s.price}</span><button className="btn btn-sm btn-primary">Contact</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'experience' && (
            <div className="content-card">
              <h3>Work Experience</h3>
              <div className="timeline">
                {[{title:'Master Plumber — Self Employed',date:'2018 — Present',desc:'Running my own plumbing business, serving 100+ clients annually.'},{title:'Senior Plumber — Metro Plumbing Co.',date:'2015 — 2018',desc:'Led a team of 4 plumbers on commercial projects.'},{title:'Apprentice — City Works NYC',date:'2012 — 2015',desc:'Completed 4-year apprenticeship program.'}].map((e) => (
                  <div key={e.title} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header"><h4>{e.title}</h4><span className="timeline-date">{e.date}</span></div>
                      <p>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <>
              <div className="content-card">
                <div className="reviews-summary">
                  <div className="rating-big-num">4.9</div>
                  <div className="rating-breakdown">
                    {[['5★','85%'],['4★','12%'],['3★','3%'],['2★','0%'],['1★','0%']].map(([s,w]) => (
                      <div key={s} className="rb-row"><span>{s}</span><div className="rb-bar"><div className="rb-fill" style={{width:w}} /></div><span>{w}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="reviews-list">
                {[{init:'AM',color:'#3b82f6',name:'Alice M.',text:'John fixed our burst pipe within an hour. Extremely professional!',service:'Emergency Pipe Repair',date:'April 2026'},{init:'BK',color:'#10b981',name:'Bob K.',text:'Installed a new water heater. Perfect work, no mess left behind.',service:'Bathroom Installation',date:'March 2026'}].map((r) => (
                  <div key={r.name} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar" style={{background:r.color}}>{r.init}</div>
                      <div><strong>{r.name}</strong><div>⭐⭐⭐⭐⭐</div></div>
                      <span className="review-date">{r.date}</span>
                    </div>
                    <p className="review-text">{r.text}</p>
                    <div className="review-service">Service: {r.service}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
