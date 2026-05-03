'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const SHOP_GRADIENTS = [
  'linear-gradient(135deg,#14532d,#16a34a)',
  'linear-gradient(135deg,#166534,#4ade80)',
  'linear-gradient(135deg,#15803d,#86efac)',
  'linear-gradient(135deg,#065f46,#34d399)',
  'linear-gradient(135deg,#14532d,#22c55e)',
  'linear-gradient(135deg,#166534,#bbf7d0)',
];

const PROMO_BANNERS = [
  { label: 'New Arrivals', color: '#f59e0b', bg: '#fef3c7' },
  { label: 'Top Rated',    color: '#6366f1', bg: '#ede9fe' },
  { label: 'Hot Deal',     color: '#ef4444', bg: '#fee2e2' },
  { label: 'Featured',     color: '#10b981', bg: '#d1fae5' },
];

interface Vendor {
  _id: string;
  shopName: string;
  ownerName: string;
  city: string;
  description: string;
  logo: string;
  categories: string[];
  rating: number;
  reviewCount: number;
}

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/vendors?limit=6')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setVendors(d.vendors ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section section-alt">
      <div className="container">

        {/* Section header */}
        <div className="section-header reveal" style={{ flexDirection: 'row', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Featured Shops
              </span>
            </h2>
            <p style={{ color: 'var(--text-light)' }}>Top-rated local vendors ready to serve you</p>
          </div>
          <Link href="/products">
            <button className="btn btn-ghost" style={{ color: '#15803d', border: '1.5px solid #bbf7d0' }}>
              View All Shops →
            </button>
          </Link>
        </div>

        {/* Vendor cards */}
        {loading ? (
          <div className="vendor-cards-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="vendor-card-home skeleton-card">
                <div style={{ height: 90, background: '#e2e8f0', borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '48px 20px 20px' }}>
                  <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)', fontSize: 14 }}>
            ⚠️ Could not load shops right now.{' '}
            <a href="/products" style={{ color: '#16a34a' }}>Browse products →</a>
          </div>
        ) : vendors.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
            <h3 style={{ marginBottom: 8 }}>No shops yet</h3>
            <p style={{ color: 'var(--text-light)' }}>Be the first to list your shop on ServeHub!</p>
            <Link href="/signup">
              <button className="btn btn-primary" style={{ marginTop: 16 }}>Register Your Shop</button>
            </Link>
          </div>
        ) : (
          <div className="vendor-cards-grid">
            {vendors.map((v, i) => {
              const initials = v.shopName.slice(0, 2).toUpperCase();
              const promo = PROMO_BANNERS[i % PROMO_BANNERS.length];
              return (
                <Link key={v._id} href={`/shops/${v._id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="vendor-card-home"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {/* Cover */}
                    <div className="vendor-card-cover" style={{ background: SHOP_GRADIENTS[i % SHOP_GRADIENTS.length] }}>
                      <span className="vendor-card-cover-icon">🏪</span>
                      {/* Promo badge */}
                      <span className="vendor-promo-badge" style={{ background: promo.bg, color: promo.color }}>
                        {promo.label}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="vendor-card-avatar" style={{ background: SHOP_GRADIENTS[i % SHOP_GRADIENTS.length] }}>
                      {v.logo
                        ? <img src={v.logo} alt={v.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : initials}
                    </div>

                    <div className="vendor-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h3 className="vendor-card-name">{v.shopName}</h3>
                        <span className="vendor-badge">Vendor</span>
                      </div>

                      <p className="vendor-card-owner">
                        👤 {v.ownerName}
                        {v.city ? <span style={{ marginLeft: 8 }}>📍 {v.city}</span> : null}
                      </p>

                      {v.description && (
                        <p className="vendor-card-desc">{v.description}</p>
                      )}

                      {v.categories.length > 0 && (
                        <div className="vendor-card-tags">
                          {v.categories.slice(0, 3).map(c => (
                            <span key={c} className="ptag" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>{c}</span>
                          ))}
                        </div>
                      )}

                      <div className="vendor-card-footer">
                        <span className="vendor-card-rating">
                          ⭐ {v.rating > 0 ? v.rating.toFixed(1) : 'New'}
                          <span style={{ color: 'var(--text-light)', fontWeight: 400, marginLeft: 4 }}>
                            ({v.reviewCount})
                          </span>
                        </span>
                        <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', color: '#fff', border: 'none' }}>
                          View Shop →
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom promo strip — CTA */}
        {vendors.length > 0 && (
          <div className="vendor-cta-strip reveal">
            <div className="vendor-cta-text">
              <strong>Are you a shop owner?</strong>
              <span>List your products and reach thousands of customers for free.</span>
            </div>
            <Link href="/signup">
              <button className="btn btn-primary">Register Your Shop →</button>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
