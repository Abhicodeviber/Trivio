'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    id: 1,
    badge:    '🔥 Trending Now',
    title:    'Fresh Products from\nLocal Vendors',
    sub:      'Discover groceries, handmade goods & daily essentials sourced directly from verified local shops near you.',
    cta:      'Browse Products',
    ctaHref:  '/products',
    cta2:     'Register Shop',
    cta2Href: '/signup',
    bg:       'linear-gradient(135deg,#064e3b 0%,#065f46 35%,#059669 70%,#34d399 100%)',
    accent:   '#6ee7b7',
    floats: [
      { icon:'🛒', top:'15%', right:'12%', size:72, anim:'floatA' },
      { icon:'🥦', top:'55%', right:'22%', size:48, anim:'floatB' },
      { icon:'🍎', top:'25%', right:'28%', size:40, anim:'floatC' },
      { icon:'🧴', bottom:'20%', right:'8%', size:56, anim:'floatA' },
    ],
  },
  {
    id: 2,
    badge:    '⭐ Top Rated',
    title:    'Expert Services\nat Your Doorstep',
    sub:      'From home repairs to beauty services — connect with verified local professionals in minutes.',
    cta:      'Find Services',
    ctaHref:  '/browse',
    cta2:     'Become Provider',
    cta2Href: '/signup',
    bg:       'linear-gradient(135deg,#312e81 0%,#4338ca 40%,#6366f1 75%,#818cf8 100%)',
    accent:   '#c7d2fe',
    floats: [
      { icon:'🔧', top:'18%', right:'10%', size:68, anim:'floatB' },
      { icon:'💈', top:'50%', right:'24%', size:50, anim:'floatA' },
      { icon:'🏠', top:'22%', right:'30%', size:44, anim:'floatC' },
      { icon:'✂️', bottom:'18%', right:'12%', size:54, anim:'floatB' },
    ],
  },
  {
    id: 3,
    badge:    '🚀 New Feature',
    title:    'Open Your Online\nShop — For Free!',
    sub:      'List your products, showcase your shop to thousands of customers, and start getting inquiries today.',
    cta:      'Start Selling',
    ctaHref:  '/signup',
    cta2:     'See Live Shops',
    cta2Href: '/products',
    bg:       'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#ea580c 75%,#fb923c 100%)',
    accent:   '#fed7aa',
    floats: [
      { icon:'🏪', top:'14%', right:'10%', size:76, anim:'floatC' },
      { icon:'📦', top:'52%', right:'20%', size:52, anim:'floatA' },
      { icon:'💰', top:'28%', right:'28%', size:46, anim:'floatB' },
      { icon:'📈', bottom:'22%', right:'9%', size:58, anim:'floatA' },
    ],
  },
  {
    id: 4,
    badge:    '💎 Premium Deals',
    title:    'New Arrivals\nDropped Daily',
    sub:      'Hundreds of new products added by local vendors every day. Be the first to discover what\'s fresh.',
    cta:      'Explore Now',
    ctaHref:  '/products',
    cta2:     'View Shops',
    cta2Href: '/products',
    bg:       'linear-gradient(135deg,#1e1b4b 0%,#4c1d95 40%,#7c3aed 75%,#a78bfa 100%)',
    accent:   '#ddd6fe',
    floats: [
      { icon:'✨', top:'16%', right:'11%', size:66, anim:'floatA' },
      { icon:'🎁', top:'54%', right:'22%', size:52, anim:'floatC' },
      { icon:'🌟', top:'24%', right:'29%', size:42, anim:'floatB' },
      { icon:'💫', bottom:'20%', right:'10%', size:50, anim:'floatA' },
    ],
  },
  {
    id: 5,
    badge:    '📍 Near You',
    title:    'Local Shops,\nReal Connections',
    sub:      'Skip the middleman. Talk directly to shop owners and service providers in your city.',
    cta:      'Find Near Me',
    ctaHref:  '/browse',
    cta2:     'Join Free',
    cta2Href: '/signup',
    bg:       'linear-gradient(135deg,#0c4a6e 0%,#0369a1 40%,#0ea5e9 75%,#38bdf8 100%)',
    accent:   '#bae6fd',
    floats: [
      { icon:'📍', top:'16%', right:'10%', size:70, anim:'floatB' },
      { icon:'🤝', top:'50%', right:'24%', size:54, anim:'floatA' },
      { icon:'🏙️', top:'26%', right:'30%', size:44, anim:'floatC' },
      { icon:'💬', bottom:'18%', right:'8%', size:56, anim:'floatB' },
    ],
  },
];

interface FloatEl {
  icon: string; top?: string; bottom?: string;
  right?: string; left?: string; size: number; anim: string;
}

export default function PromoSlider() {
  const [current, setCurrent]   = useState(0);
  const [prev,    setPrev]      = useState<number | null>(null);
  const [dir,     setDir]       = useState<'next' | 'prev'>('next');
  const [paused,  setPaused]    = useState(false);
  const [progress,setProgress]  = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const progressRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const INTERVAL = 5000;

  const go = useCallback((idx: number, direction: 'next' | 'prev') => {
    setPrev(current);
    setDir(direction);
    setCurrent(idx);
    setProgress(0);
  }, [current]);

  const next = useCallback(() => go((current + 1) % SLIDES.length, 'next'), [current, go]);
  const prev_ = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length, 'prev'), [current, go]);

  /* Auto-advance + progress bar */
  useEffect(() => {
    if (paused) return;
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (100 / (INTERVAL / 60)), 100));
    }, 60);
    timerRef.current = setTimeout(next, INTERVAL);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [current, paused, next]);

  const slide = SLIDES[current];

  return (
    <section className="promo-slider-section">
      <div
        className="promo-slider-wrap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress bar */}
        {!paused && (
          <div className="promo-progress-bar">
            <div className="promo-progress-fill" style={{ width: `${progress}%`, background: slide.accent }} />
          </div>
        )}

        {/* Slides */}
        <div className="promo-slides-container">
          {SLIDES.map((s, i) => {
            const isActive = i === current;
            const isPrev   = i === prev;
            let cls = 'promo-slide';
            if (isActive)      cls += ` promo-slide-enter-${dir}`;
            else if (isPrev)   cls += ` promo-slide-exit-${dir}`;
            else                cls += ' promo-slide-hidden';

            return (
              <div key={s.id} className={cls} style={{ background: s.bg }}>
                {/* Decorative blobs */}
                <div className="pslide-blob pslide-blob-1" style={{ background: s.accent }} />
                <div className="pslide-blob pslide-blob-2" style={{ background: s.accent }} />
                <div className="pslide-blob pslide-blob-3" style={{ background: s.accent }} />

                {/* Floating icons */}
                {s.floats.map((f: FloatEl, fi: number) => (
                  <div
                    key={fi}
                    className="pslide-float"
                    style={{
                      top: f.top, bottom: f.bottom, right: f.right, left: f.left,
                      fontSize: f.size, animationName: f.anim,
                    }}
                  >
                    {f.icon}
                  </div>
                ))}

                {/* Content */}
                <div className="container pslide-content">
                  <span className="pslide-badge" style={{ background: 'rgba(255,255,255,.15)', borderColor: s.accent }}>
                    {s.badge}
                  </span>
                  <h2 className="pslide-title">
                    {s.title.split('\n').map((line, li) => (
                      <span key={li}>{line}{li === 0 && <br />}</span>
                    ))}
                  </h2>
                  <p className="pslide-sub">{s.sub}</p>
                  <div className="pslide-actions">
                    <Link href={s.ctaHref}>
                      <button className="pslide-btn-primary" style={{ background: 'white', color: '#1e293b' }}>
                        {s.cta} →
                      </button>
                    </Link>
                    <Link href={s.cta2Href}>
                      <button className="pslide-btn-ghost" style={{ borderColor: s.accent, color: 'white' }}>
                        {s.cta2}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow buttons */}
        <button className="promo-arrow promo-arrow-left" onClick={prev_} aria-label="Previous">
          ‹
        </button>
        <button className="promo-arrow promo-arrow-right" onClick={next} aria-label="Next">
          ›
        </button>

        {/* Dots */}
        <div className="promo-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`promo-dot ${i === current ? 'active' : ''}`}
              onClick={() => go(i, i > current ? 'next' : 'prev')}
              aria-label={`Slide ${i + 1}`}
              style={i === current ? { background: slide.accent, transform: 'scale(1.3)' } : {}}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="promo-counter">
          <span className="promo-counter-cur">{String(current + 1).padStart(2, '0')}</span>
          <span className="promo-counter-div">/</span>
          <span className="promo-counter-tot">{String(SLIDES.length).padStart(2, '0')}</span>
        </div>

        {/* Pause indicator */}
        {paused && (
          <div className="promo-paused-badge">⏸ Paused</div>
        )}
      </div>
    </section>
  );
}
