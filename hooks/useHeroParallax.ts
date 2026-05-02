'use client';
import { useEffect } from 'react';

export function useHeroParallax() {
  useEffect(() => {
    const hero = document.querySelector('.hero') as HTMLElement | null;
    if (!hero) return;

    let ticking = false;
    const onMove = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        const b1 = hero.querySelector('.blob-1') as HTMLElement | null;
        const b2 = hero.querySelector('.blob-2') as HTMLElement | null;
        const c1 = hero.querySelector('.card-1') as HTMLElement | null;
        const c2 = hero.querySelector('.card-2') as HTMLElement | null;
        const c3 = hero.querySelector('.card-3') as HTMLElement | null;
        if (b1) b1.style.transform = `translate(${cx * 28}px,${cy * 18}px)`;
        if (b2) b2.style.transform = `translate(${cx * -20}px,${cy * -14}px)`;
        if (c1) c1.style.transform = `translate(${cx * 14}px,${cy * 10}px)`;
        if (c2) c2.style.transform = `translate(${cx * -10}px,${cy * 14}px)`;
        if (c3) c3.style.transform = `translate(${cx * 18}px,${cy * -8}px)`;
        ticking = false;
      });
    };
    const onLeave = () => {
      ['.blob-1','.blob-2','.card-1','.card-2','.card-3'].forEach((s) => {
        const el = hero.querySelector(s) as HTMLElement | null;
        if (el) el.style.transform = '';
      });
    };
    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', onLeave);
    return () => { hero.removeEventListener('mousemove', onMove); hero.removeEventListener('mouseleave', onLeave); };
  }, []);
}
