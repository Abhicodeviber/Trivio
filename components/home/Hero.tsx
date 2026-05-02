'use client';
import { useParticles } from '@/hooks/useParticles';
import { useHeroParallax } from '@/hooks/useHeroParallax';
import { useTypewriter } from '@/hooks/useTypewriter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Category { _id: string; name: string; icon?: string; slug: string; }

export default function Hero() {
  useParticles('particles-canvas');
  useHeroParallax();
  useTypewriter('heroSearchInput');

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('');

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
    if (selectedCat) params.set('category', selectedCat);
    router.push(`/browse${params.toString() ? '?' + params.toString() : ''}`);
  }

  return (
    <section className="hero">
      <canvas id="particles-canvas" />
      <div className="hero-bg">
        <div className="hero-blob blob-1" />
        <div className="hero-blob blob-2" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-orb hero-orb-4" />
      </div>

      <div className="container hero-content">
        <div className="badge-pill">
          <span className="badge-dot" />
          ✨ 10,000+ Services Available
        </div>

        <h1 className="hero-title">
          Find the Perfect<br />
          <span className="gradient-text">Service Provider</span><br />
          for Any Job
        </h1>

        <p className="hero-sub">
          Connect with skilled professionals in your area. From home repairs to digital services — get it done right.
        </p>

        <form className="hero-search" onSubmit={handleSearch}>
          <div className="search-box" id="heroSearchBox">
            <span className="search-icon">🔍</span>
            <input
              id="heroSearchInput"
              ref={inputRef}
              type="text"
              placeholder="What service do you need?"
              className="search-input"
            />
            <select
              className="search-select"
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.icon ? c.icon + ' ' : ''}{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary search-btn">Search</button>
          </div>
          <div className="search-tags">
            {categories.slice(0, 5).map(c => (
              <Link key={c._id} href={`/browse?category=${c._id}`}>
                <span className="tag">{c.icon ? c.icon + ' ' : ''}{c.name}</span>
              </Link>
            ))}
            {categories.length === 0 && (
              ['🏠 Home Repair','💻 Tech Help','🎨 Design','🚗 Auto','🌿 Gardening'].map(t => (
                <Link key={t} href="/browse"><span className="tag">{t}</span></Link>
              ))
            )}
          </div>
        </form>

        <div className="hero-stats">
          <div className="stat stat-anim">
            <span className="stat-num" data-target="50000" data-suffix="K+">50K+</span>
            <span className="stat-label">Providers</span>
          </div>
          <div className="stat-divider" />
          <div className="stat stat-anim">
            <span className="stat-num" data-target="200000" data-suffix="K+">200K+</span>
            <span className="stat-label">Jobs Done</span>
          </div>
          <div className="stat-divider" />
          <div className="stat stat-anim">
            <span className="stat-num" data-target="4.9" data-suffix="★">4.9★</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="floating-card card-1">
          <div className="fc-avatar" style={{ background: '#6366f1' }}>JD</div>
          <div className="fc-info"><strong>John D.</strong><span>Plumber · ⭐ 4.9</span></div>
          <div className="fc-badge">Available</div>
        </div>
        <div className="floating-card card-2">
          <div className="fc-icon">✅</div>
          <div className="fc-info"><strong>Job Completed!</strong><span>Electrical Repair</span></div>
        </div>
        <div className="floating-card card-3">
          <div className="fc-avatar" style={{ background: '#8b5cf6' }}>SR</div>
          <div className="fc-info"><strong>Sarah R.</strong><span>Designer · ⭐ 5.0</span></div>
          <div className="fc-badge">Top Rated</div>
        </div>
      </div>
    </section>
  );
}
