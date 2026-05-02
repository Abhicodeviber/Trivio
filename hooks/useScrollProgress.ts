'use client';
import { useEffect } from 'react';

export function useScrollProgress() {
  useEffect(() => {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      bar.style.width = Math.min(pct, 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); bar.remove(); };
  }, []);
}
