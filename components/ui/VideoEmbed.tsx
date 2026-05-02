'use client';
import { useState, useEffect, useRef } from 'react';

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
    return u.searchParams.get('v') ?? u.pathname.match(/\/embed\/([^/?]+)/)?.[1] ?? null;
  } catch { return null; }
}

function getInstagramInfo(url: string): { type: string; id: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('instagram.com')) return null;
    const match = u.pathname.match(/\/(reel|p)\/([^/?]+)/);
    if (!match) return null;
    return { type: match[1], id: match[2] };
  } catch { return null; }
}

function YouTubeEmbed({ ytId }: { ytId: string }) {
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
        title="Service video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

declare global {
  interface Window {
    instgrm?: { Embeds: { process(): void } };
  }
}

function InstagramEmbed({ type, id, originalUrl }: { type: string; id: string; originalUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const permalink = `https://www.instagram.com/${type}/${id}/?utm_source=ig_embed&utm_campaign=loading`;

  useEffect(() => {
    const processEmbed = () => {
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
        setReady(true);
      }
    };

    if (window.instgrm?.Embeds) {
      processEmbed();
      return;
    }

    const existing = document.getElementById('instagram-embed-script');
    if (existing) {
      existing.addEventListener('load', processEmbed);
      return () => existing.removeEventListener('load', processEmbed);
    }

    const script = document.createElement('script');
    script.id = 'instagram-embed-script';
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = processEmbed;
    document.body.appendChild(script);

    return () => { script.onload = null; };
  }, [id, type]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div ref={containerRef} style={{ width: '100%', maxWidth: 540 }}>
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={permalink}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: '0',
            borderRadius: 12,
            boxShadow: '0 0 1px 0 rgba(0,0,0,.5),0 1px 10px 0 rgba(0,0,0,.15)',
            margin: '0 auto',
            maxWidth: 540,
            minWidth: 326,
            padding: 0,
            width: 'calc(100% - 2px)',
          }}
        />
      </div>
      <a
        href={originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, color: 'var(--text-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span>📷</span> Open in Instagram
      </a>
    </div>
  );
}

export default function VideoEmbed({ url }: { url: string }) {
  const ytId   = getYouTubeId(url);
  const igInfo = !ytId ? getInstagramInfo(url) : null;

  if (!ytId && !igInfo) {
    return (
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: 14 }}>
        Unsupported video link. Please use a YouTube or Instagram Reel URL.
      </div>
    );
  }

  if (ytId) return <YouTubeEmbed ytId={ytId} />;

  return <InstagramEmbed type={igInfo!.type} id={igInfo!.id} originalUrl={url} />;
}
