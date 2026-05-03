'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const GRADIENTS = [
  'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
  'linear-gradient(135deg,#134e5e,#71b280)',
  'linear-gradient(135deg,#373b44,#4286f4)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#11998e,#38ef7d)',
  'linear-gradient(135deg,#642b73,#c6426e)',
];

interface Vendor {
  _id: string;
  shopName: string;
  ownerName: string;
  city: string;
  description: string;
  logo: string;
  photos: string[];
  categories: string[];
  rating: number;
  reviewCount: number;
}

function ShopCard({ v, i }: { v: Vendor; i: number }) {
  const initials = v.shopName.slice(0, 2).toUpperCase();
  const cover    = v.photos?.[0] ?? null;

  return (
    <Link href={`/shops/${v._id}`} className="fv-card-link">
      <div className="fv-card" style={{ animationDelay: `${i * 0.07}s` }}>

        {/* Cover */}
        <div className="fv-cover">
          {cover
            ? <img src={cover} alt={v.shopName} className="fv-cover-img" />
            : <div className="fv-cover-grad" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
          }
          <div className="fv-cover-overlay" />

          {/* Rating pill on cover */}
          {v.rating > 0 && (
            <div className="fv-rating-pill">
              ⭐ {v.rating.toFixed(1)}
            </div>
          )}

          {/* Category chips on cover */}
          {v.categories[0] && (
            <div className="fv-cat-pill">{v.categories[0]}</div>
          )}
        </div>

        {/* Logo */}
        <div className="fv-logo-wrap">
          {v.logo
            ? <img src={v.logo} alt={v.shopName} className="fv-logo-img" />
            : <div className="fv-logo-placeholder" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>{initials}</div>
          }
          <span className="fv-online-dot" />
        </div>

        {/* Body */}
        <div className="fv-body">
          <div className="fv-name-row">
            <h3 className="fv-name">{v.shopName}</h3>
            <span className="fv-verified">✓</span>
          </div>

          <p className="fv-meta">
            {v.ownerName && <span>👤 {v.ownerName}</span>}
            {v.city && <span>📍 {v.city}</span>}
          </p>

          {v.description && (
            <p className="fv-desc">{v.description}</p>
          )}

          {v.categories.length > 1 && (
            <div className="fv-tags">
              {v.categories.slice(0, 3).map(c => (
                <span key={c} className="fv-tag">{c}</span>
              ))}
            </div>
          )}

          <div className="fv-footer">
            <span className="fv-reviews">
              {v.reviewCount > 0 ? `${v.reviewCount} review${v.reviewCount !== 1 ? 's' : ''}` : 'New shop'}
            </span>
            <span className="fv-cta">Visit Shop →</span>
          </div>
        </div>

      </div>
    </Link>
  );
}

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    fetch('/api/vendors?limit=6')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setVendors(d.vendors ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="fv-section">
      <div className="container">

        {/* Header */}
        <div className="fv-header reveal">
          <div className="fv-header-left">
            <span className="fv-section-badge">🏪 Local Shops</span>
            <h2 className="fv-section-title">Featured Shops</h2>
            <p className="fv-section-sub">Top-rated local vendors ready to serve you</p>
          </div>
          <Link href="/products" className="fv-view-all">
            Browse all shops <span>→</span>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="fv-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="fv-card fv-skeleton">
                <div className="fv-cover" style={{ background: '#e2e8f0' }} />
                <div className="fv-body">
                  <div style={{ height: 16, background: '#e2e8f0', borderRadius: 6, marginBottom: 8, width: '70%' }} />
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="fv-empty">
            ⚠️ Could not load shops.{' '}
            <Link href="/products" style={{ color: '#16a34a' }}>Browse products →</Link>
          </div>
        ) : vendors.length === 0 ? (
          <div className="fv-empty-state">
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏪</div>
            <h3>No shops yet</h3>
            <p>Be the first to list your shop on ServeHub!</p>
            <Link href="/signup"><button className="btn btn-primary" style={{ marginTop: 16 }}>Register Your Shop</button></Link>
          </div>
        ) : (
          <div className="fv-grid">
            {vendors.map((v, i) => <ShopCard key={v._id} v={v} i={i} />)}
          </div>
        )}

        {/* Bottom CTA */}
        {vendors.length > 0 && (
          <div className="fv-cta-strip reveal">
            <div>
              <strong>Own a shop?</strong>
              <span>List your products and reach thousands of local customers — it&apos;s free.</span>
            </div>
            <Link href="/signup"><button className="btn btn-primary">Register Your Shop →</button></Link>
          </div>
        )}

      </div>
    </section>
  );
}
