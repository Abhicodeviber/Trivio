'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

/* ── Types ── */
interface DbPromo {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  link: string;
  linkText: string;
}

interface Slide {
  id: string;
  title: string;
  sub: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  cta: string;
  ctaHref: string;
  bg: string;
  accent: string;
}

/* ── Fallback static slides (shown when DB returns empty) ── */
const FALLBACK: Slide[] = [
  {
    id: 'f1', mediaType: 'image', mediaUrl: '',
    title: 'Fresh Products from Local Vendors',
    sub:   'Discover groceries, handmade goods & daily essentials sourced directly from verified shops near you.',
    cta: 'Browse Products →', ctaHref: '/products',
    bg: 'linear-gradient(135deg,#064e3b 0%,#065f46 35%,#059669 70%,#34d399 100%)', accent: '#6ee7b7',
  },
  {
    id: 'f2', mediaType: 'image', mediaUrl: '',
    title: 'Expert Services at Your Doorstep',
    sub:   'From home repairs to beauty services — connect with verified local professionals in minutes.',
    cta: 'Find Services →', ctaHref: '/browse',
    bg: 'linear-gradient(135deg,#312e81 0%,#4338ca 40%,#6366f1 75%,#818cf8 100%)', accent: '#c7d2fe',
  },
  {
    id: 'f3', mediaType: 'image', mediaUrl: '',
    title: 'Open Your Online Shop — For Free!',
    sub:   'List your products, reach thousands of customers, and start getting inquiries today.',
    cta: 'Start Selling →', ctaHref: '/signup',
    bg: 'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#ea580c 75%,#fb923c 100%)', accent: '#fed7aa',
  },
];

const SLIDE_BGS = [
  'linear-gradient(135deg,#064e3b 0%,#065f46 35%,#059669 70%,#34d399 100%)',
  'linear-gradient(135deg,#312e81 0%,#4338ca 40%,#6366f1 75%,#818cf8 100%)',
  'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#ea580c 75%,#fb923c 100%)',
  'linear-gradient(135deg,#1e1b4b 0%,#4c1d95 40%,#7c3aed 75%,#a78bfa 100%)',
  'linear-gradient(135deg,#0c4a6e 0%,#0369a1 40%,#0ea5e9 75%,#38bdf8 100%)',
  'linear-gradient(135deg,#831843 0%,#be185d 40%,#ec4899 75%,#f9a8d4 100%)',
];
const SLIDE_ACCENTS = ['#6ee7b7','#c7d2fe','#fed7aa','#ddd6fe','#bae6fd','#fbcfe8'];

function dbToSlide(p: DbPromo, i: number): Slide {
  return {
    id:        p._id,
    title:     p.title,
    sub:       p.description,
    mediaType: p.mediaType,
    mediaUrl:  p.mediaUrl,
    cta:       p.linkText,
    ctaHref:   p.link,
    bg:        SLIDE_BGS[i % SLIDE_BGS.length],
    accent:    SLIDE_ACCENTS[i % SLIDE_ACCENTS.length],
  };
}

/* ── Media background ── */
function SlideBg({ mediaType, mediaUrl, bg }: { mediaType: string; mediaUrl: string; bg: string }) {
  if (!mediaUrl) return <div style={{ position: 'absolute', inset: 0, background: bg }} />;

  if (mediaType === 'video') {
    const isYt = mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');
    if (isYt) {
      const ytId = mediaUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      if (ytId) return (
        <>
          <div style={{ position: 'absolute', inset: 0, background: bg }} />
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0`}
            style={{ position: 'absolute', inset: '-60px', width: 'calc(100% + 120px)', height: 'calc(100% + 120px)', border: 'none', opacity: 0.35, pointerEvents: 'none' }}
            allow="autoplay; encrypted-media"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        </>
      );
    }
    return (
      <>
        <video src={mediaUrl} autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: bg, opacity: 0.7 }} />
      </>
    );
  }

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: bg }} />
      <img src={mediaUrl} alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, pointerEvents: 'none' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
    </>
  );
}

/* ── Main component ── */
export default function PromoSlider() {
  const [slides,   setSlides]   = useState<Slide[]>([]);
  const [current,  setCurrent]  = useState(0);
  const [prev,     setPrev]     = useState<number | null>(null);
  const [dir,      setDir]      = useState<'next' | 'prev'>('next');
  const [paused,   setPaused]   = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout>   | undefined>(undefined);
  const progressRef = useRef<ReturnType<typeof setInterval>  | undefined>(undefined);
  const INTERVAL = 5500;

  /* Fetch from DB, fall back to static */
  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.json())
      .then(d => {
        const dbSlides: Slide[] = (d.promotions ?? []).map((p: DbPromo, i: number) => dbToSlide(p, i));
        setSlides(dbSlides.length > 0 ? dbSlides : FALLBACK);
      })
      .catch(() => setSlides(FALLBACK));
  }, []);

  const total = slides.length;

  const go = useCallback((idx: number, direction: 'next' | 'prev') => {
    setPrev(current);
    setDir(direction);
    setCurrent(idx);
    setProgress(0);
  }, [current]);

  const next  = useCallback(() => go((current + 1) % total, 'next'),             [current, total, go]);
  const prev_ = useCallback(() => go((current - 1 + total) % total, 'prev'),     [current, total, go]);

  /* Auto-advance */
  useEffect(() => {
    if (paused || total === 0) return;
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (100 / (INTERVAL / 60)), 100));
    }, 60);
    timerRef.current = setTimeout(next, INTERVAL);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [current, paused, total, next]);

  if (total === 0) return null;

  const slide = slides[current];

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
          {slides.map((s, i) => {
            const isActive = i === current;
            const isPrev   = i === prev;
            let cls = 'promo-slide';
            if (isActive)    cls += ` promo-slide-enter-${dir}`;
            else if (isPrev) cls += ` promo-slide-exit-${dir}`;
            else              cls += ' promo-slide-hidden';

            return (
              <div key={s.id} className={cls}>
                {/* Background layer */}
                <SlideBg mediaType={s.mediaType} mediaUrl={s.mediaUrl} bg={s.bg} />

                {/* Decorative blobs (only when no image) */}
                {!s.mediaUrl && (
                  <>
                    <div className="pslide-blob pslide-blob-1" style={{ background: s.accent }} />
                    <div className="pslide-blob pslide-blob-2" style={{ background: s.accent }} />
                  </>
                )}

                {/* Content */}
                <div className="container pslide-content" style={{ position: 'relative', zIndex: 5 }}>
                  <h2 className="pslide-title">{s.title}</h2>
                  {s.sub && <p className="pslide-sub">{s.sub}</p>}
                  <div className="pslide-actions">
                    <Link href={s.ctaHref}>
                      <button className="pslide-btn-primary" style={{ background: 'white', color: '#1e293b' }}>
                        {s.cta || 'Learn More →'}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button className="promo-arrow promo-arrow-left"  onClick={prev_} aria-label="Previous">‹</button>
            <button className="promo-arrow promo-arrow-right" onClick={next}  aria-label="Next">›</button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="promo-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={`promo-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i, i > current ? 'next' : 'prev')}
                aria-label={`Slide ${i + 1}`}
                style={i === current ? { background: slide.accent, transform: 'scale(1.3)' } : {}}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {total > 1 && (
          <div className="promo-counter">
            <span className="promo-counter-cur">{String(current + 1).padStart(2, '0')}</span>
            <span className="promo-counter-div">/</span>
            <span className="promo-counter-tot">{String(total).padStart(2, '0')}</span>
          </div>
        )}

        {paused && <div className="promo-paused-badge">⏸ Paused</div>}
      </div>
    </section>
  );
}
