'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTiltCards } from '@/hooks/useTiltCards';

const COVERS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];
const COLORS = ['#6366f1','#ec4899','#0ea5e9','#10b981','#f59e0b','#8b5cf6'];

interface Service {
  _id: string;
  title: string;
  price: number;
  priceType: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  category: { name: string; icon: string };
  provider: { _id: string; name: string; location?: string };
}

export default function FeaturedProviders() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useTiltCards('.tilt-card');

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/services?limit=6&sort=rating')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setServices(data.services ?? []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header reveal" style={{ flexDirection: 'row', justifyContent: 'space-between', textAlign: 'left' }}>
          <div><h2>Featured Services</h2><p style={{ color: 'var(--text-light)' }}>Handpicked top-rated services</p></div>
          <Link href="/browse"><button className="btn btn-ghost">View All →</button></Link>
        </div>

        {loading ? (
          <div className="providers-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="provider-card" style={{ opacity: 0.4 }}>
                <div className="provider-cover" style={{ background: '#e2e8f0' }} />
                <div className="provider-body">
                  <div className="provider-avatar" style={{ background: '#cbd5e1' }} />
                  <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, margin: '40px 0 8px' }} />
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)', fontSize: 14 }}>
            ⚠️ Could not load services right now. <a href="/browse" style={{ color: 'var(--primary)' }}>Browse all services →</a>
          </div>
        ) : services.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛠️</div>
            <h3 style={{ marginBottom: 8 }}>No services yet</h3>
            <p style={{ color: 'var(--text-light)' }}>Providers haven't added services yet. Check back soon!</p>
            <Link href="/signup">
              <button className="btn btn-primary" style={{ marginTop: 16 }}>Become a Provider</button>
            </Link>
          </div>
        ) : (
          <div className="providers-grid">
            {services.map((s, i) => {
              const initials = s.provider?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'PR';
              return (
                <Link key={s._id} href={`/services/${s._id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="provider-card tilt-card"
                    style={{ animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="provider-cover" style={{ background: COVERS[i % COVERS.length] }}>
                      <span style={{ fontSize: 32, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                        {s.category?.icon ?? '🛠️'}
                      </span>
                    </div>
                    <div className="provider-body">
                      <div className="provider-avatar" style={{ background: COLORS[i % COLORS.length] }}>{initials}</div>
                      <div className="provider-badge">{s.category?.name ?? 'Service'}</div>
                      <h3 style={{ fontSize: 15, lineHeight: 1.3 }}>{s.title}</h3>
                      <p className="provider-title">{s.provider?.name}{s.provider?.location ? ` · ${s.provider.location}` : ''}</p>
                      <div className="provider-rating">
                        ⭐ {s.rating > 0 ? s.rating.toFixed(1) : 'New'} <span>({s.reviewCount} reviews)</span>
                      </div>
                      <div className="provider-tags">
                        {(s.tags ?? []).slice(0, 3).map(t => <span key={t} className="ptag">{t}</span>)}
                      </div>
                      <div className="provider-footer">
                        <span className="price">From ${s.price}/{s.priceType === 'hourly' ? 'hr' : s.priceType === 'daily' ? 'day' : 'fixed'}</span>
                        <button className="btn btn-sm btn-primary">View Details</button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
