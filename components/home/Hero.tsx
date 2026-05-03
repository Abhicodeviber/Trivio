'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Category { _id: string; name: string; icon?: string; slug: string; }

export default function Hero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : data.categories ?? []))
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`/browse${params.toString() ? '?' + params.toString() : ''}`);
  }

  const tags = categories.slice(0, 5).length > 0
    ? categories.slice(0, 5)
    : null;

  return (
    <section className="hero-dark">
      {/* Background glow */}
      <div className="hd-glow hd-glow-1" />
      <div className="hd-glow hd-glow-2" />

      <div className="container hd-inner">

        {/* ── LEFT ── */}
        <div className="hd-left">
          <div className="hd-badge">
            <span className="hd-badge-dot" />
            Trusted Platform · 10,000+ Services
          </div>

          <h1 className="hd-title">
            Find the Perfect<br />
            <span className="hd-title-accent">Service</span> for<br />
            Any Job
          </h1>

          <p className="hd-sub">
            Connect with skilled professionals in your area. From home repairs to digital services — get it done right, fast.
          </p>

          {/* Search */}
          <form className="hd-search-wrap" onSubmit={handleSearch}>
            <div className="hd-search-box">
              <svg className="hd-search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="hd-search-input"
                placeholder="Try Plumber, Web Designer, Tutor…"
              />
              <button type="submit" className="hd-search-btn">Find Now</button>
            </div>
          </form>

          {/* Trust */}
          <div className="hd-trust">
            <div className="hd-stars">
              {[1,2,3,4,5].map(i => (
                <svg key={i} viewBox="0 0 20 20" width="16" height="16" fill={i <= 4 ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
                  <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L10 14.3l-4.8 2.5.9-5.3L2.2 7.7l5.4-.8z" />
                </svg>
              ))}
            </div>
            <span className="hd-trust-text"><strong>4.9/5</strong> from 14k+ reviews</span>
            <span className="hd-trust-sep">·</span>
            <span className="hd-trust-text">Trusted by <strong>50k+</strong> users</span>
          </div>

          {/* Quick tags */}
          <div className="hd-tags">
            {tags
              ? tags.map(c => (
                  <Link key={c._id} href={`/browse?category=${c._id}`}>
                    <span className="hd-tag">{c.icon ? c.icon + ' ' : ''}{c.name}</span>
                  </Link>
                ))
              : ['🏠 Home Repair','💻 Tech Help','🎨 Design','🚗 Auto','🌿 Garden'].map(t => (
                  <Link key={t} href="/browse"><span className="hd-tag">{t}</span></Link>
                ))
            }
          </div>
        </div>

        {/* ── RIGHT — profile connector visual ── */}
        <div className="hd-right" aria-hidden="true">
          {/* Connector line (SVG) */}
          <svg className="hd-connector" viewBox="0 0 260 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGrad" x1="200" y1="60" x2="60" y2="320" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path d="M200 60 L60 320" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Avatar 1 — top */}
          <div className="hd-avatar-wrap hd-avatar-top">
            <div className="hd-avatar hd-avatar-a">
              <div className="hd-avatar-inner" style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                <span>AK</span>
              </div>
            </div>
            <div className="hd-avatar-label">
              <strong>Amit K.</strong>
              <span>Electrician · ⭐ 4.9</span>
            </div>
          </div>

          {/* Avatar 2 — bottom */}
          <div className="hd-avatar-wrap hd-avatar-bottom">
            <div className="hd-avatar hd-avatar-b">
              <div className="hd-avatar-inner" style={{ background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' }}>
                <span>PR</span>
              </div>
            </div>
            <div className="hd-avatar-label">
              <strong>Priya R.</strong>
              <span>Web Designer · ⭐ 5.0</span>
            </div>
          </div>

          {/* Floating badge */}
          <div className="hd-float-badge hd-badge-avail">
            <span className="hd-badge-pulse" />
            Available Now
          </div>
          <div className="hd-float-badge hd-badge-done">
            <span style={{ fontSize: 14 }}>✅</span>
            Job Completed!
          </div>
        </div>

      </div>
    </section>
  );
}
