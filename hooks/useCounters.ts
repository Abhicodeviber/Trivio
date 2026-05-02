'use client';
import { useEffect } from 'react';

export function useCounters() {
  useEffect(() => {
    const stats = document.querySelectorAll<HTMLElement>('.stat-num[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseFloat(el.dataset.target || '0');
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        const isFloat = target % 1 !== 0;

        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const val = target * ease;
          if (isFloat) el.textContent = val.toFixed(1) + suffix;
          else if (target >= 1000) el.textContent = Math.floor(val / 1000) + 'K+';
          else el.textContent = Math.floor(val) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = isFloat ? target.toFixed(1) + suffix : target >= 1000 ? Math.floor(target / 1000) + 'K+' : target + suffix;
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    stats.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
