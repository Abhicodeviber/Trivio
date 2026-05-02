'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#fd7043,#ff8a65)',
  'linear-gradient(135deg,#26c6da,#00acc1)',
];

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  serviceCount?: number;
}

const FALLBACK_CATS: Category[] = [
  { _id: '1', name: 'Home Repair', slug: 'home-repair', icon: '🏠' },
  { _id: '2', name: 'Tech Help',   slug: 'tech-help',   icon: '💻' },
  { _id: '3', name: 'Design',      slug: 'design',      icon: '🎨' },
  { _id: '4', name: 'Cleaning',    slug: 'cleaning',    icon: '🧹' },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setCategories(data.categories ?? []))
      .catch(() => { setError(true); setCategories(FALLBACK_CATS); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header reveal">
          <h2>Browse by Category</h2>
          <p>Find the right professional for every need</p>
        </div>
        <div className="categories-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="category-card" style={{ opacity: 0.35 }}>
                  <div className="cat-icon" style={{ background: '#e2e8f0' }} />
                  <span className="cat-name" style={{ background: '#e2e8f0', borderRadius: 4, color: 'transparent', minWidth: 80 }}>Loading</span>
                  <span className="cat-count" style={{ background: '#f1f5f9', color: 'transparent', borderRadius: 4 }}>0 services</span>
                </div>
              ))
            : categories.length === 0 && !error ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                  No categories yet. <a href="/signup" style={{ color: 'var(--primary)' }}>Become a provider</a> to add the first!
                </div>
              )
            : categories.map((c, i) => (
                <Link key={c._id} href={`/browse?category=${c._id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="category-card"
                    style={{ animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="cat-icon" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>{c.icon}</div>
                    <span className="cat-name">{c.name}</span>
                    <span className="cat-count">{c.serviceCount ?? 0} services</span>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </section>
  );
}
