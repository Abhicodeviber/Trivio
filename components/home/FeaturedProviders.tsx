'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const COVER_COLORS = [
  { from: '#6366f1', to: '#818cf8' },
  { from: '#ec4899', to: '#f472b6' },
  { from: '#0ea5e9', to: '#38bdf8' },
  { from: '#10b981', to: '#34d399' },
  { from: '#f59e0b', to: '#fbbf24' },
  { from: '#8b5cf6', to: '#a78bfa' },
];

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

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="fp-stars">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  );
}

function ServiceCard({ s, i }: { s: Service; i: number }) {
  const initials   = s.provider?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'PR';
  const col        = COVER_COLORS[i % COVER_COLORS.length];
  const priceLabel = s.priceType === 'hourly' ? '/hr' : s.priceType === 'daily' ? '/day' : '';

  return (
    <Link href={`/services/${s._id}`} className="fp-card-link">
      <div className="fp-card" style={{ animationDelay: `${i * 0.07}s` }}>

        {/* Coloured cover */}
        <div className="fp-cover" style={{ background: `linear-gradient(135deg,${col.from},${col.to})` }}>
          <span className="fp-cover-icon">{s.category?.icon ?? '🛠️'}</span>
          <div className="fp-cover-glow" style={{ background: col.to }} />

          {/* Category badge */}
          <div className="fp-cat-badge" style={{ background: `${col.from}33`, color: '#fff', border: `1px solid ${col.to}66` }}>
            {s.category?.name ?? 'Service'}
          </div>
        </div>

        {/* Provider avatar */}
        <div className="fp-avatar-wrap">
          <div className="fp-avatar" style={{ background: `linear-gradient(135deg,${col.from},${col.to})` }}>
            {initials}
          </div>
        </div>

        {/* Body */}
        <div className="fp-body">
          <h3 className="fp-title">{s.title}</h3>
          <p className="fp-provider">
            {s.provider?.name}
            {s.provider?.location && <span className="fp-location"> · 📍 {s.provider.location}</span>}
          </p>

          {/* Rating row */}
          <div className="fp-rating-row">
            {s.rating > 0 ? (
              <>
                <StarRating rating={s.rating} />
                <span className="fp-rating-num">{s.rating.toFixed(1)}</span>
                <span className="fp-review-count">({s.reviewCount})</span>
              </>
            ) : (
              <span className="fp-new-badge">✨ New</span>
            )}
          </div>

          {/* Tags */}
          {s.tags?.length > 0 && (
            <div className="fp-tags">
              {s.tags.slice(0, 3).map(t => <span key={t} className="fp-tag">{t}</span>)}
            </div>
          )}

          {/* Footer */}
          <div className="fp-footer">
            <div className="fp-price">
              <span className="fp-from">from</span>
              <strong>₹{s.price}</strong>
              {priceLabel && <span className="fp-unit">{priceLabel}</span>}
            </div>
            <span className="fp-cta" style={{ background: `linear-gradient(135deg,${col.from},${col.to})` }}>
              View →
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}

export default function FeaturedProviders() {
  const [services,  setServices]  = useState<Service[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError,setFetchError]= useState(false);

  useEffect(() => {
    fetch('/api/services?limit=6&sort=rating')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setServices(d.services ?? []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="fp-section">
      <div className="container">

        {/* Header */}
        <div className="fp-header reveal">
          <div className="fp-header-left">
            <span className="fp-section-badge">⚡ Top Picks</span>
            <h2 className="fp-section-title">Featured Services</h2>
            <p className="fp-section-sub">Handpicked top-rated professionals near you</p>
          </div>
          <Link href="/browse" className="fp-view-all">
            Browse all services <span>→</span>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="fp-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="fp-card fp-skeleton">
                <div className="fp-cover" style={{ background: '#e2e8f0' }} />
                <div className="fp-body" style={{ paddingTop: 48 }}>
                  <div style={{ height: 16, background: '#e2e8f0', borderRadius: 6, marginBottom: 8, width: '70%' }} />
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="fp-empty">
            ⚠️ Could not load services.{' '}
            <Link href="/browse" style={{ color: 'var(--primary)' }}>Browse all →</Link>
          </div>
        ) : services.length === 0 ? (
          <div className="fp-empty-state">
            <div style={{ fontSize: 52, marginBottom: 12 }}>🛠️</div>
            <h3>No services yet</h3>
            <p>Providers haven&apos;t added services yet. Check back soon!</p>
            <Link href="/signup"><button className="btn btn-primary" style={{ marginTop: 16 }}>Become a Provider</button></Link>
          </div>
        ) : (
          <div className="fp-grid">
            {services.map((s, i) => <ServiceCard key={s._id} s={s} i={i} />)}
          </div>
        )}

      </div>
    </section>
  );
}
