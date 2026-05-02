'use client';
import { useEffect } from 'react';

export function useRipple() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.btn') as HTMLElement | null;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const rip = document.createElement('span');
      rip.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      Object.assign(rip.style, {
        width: `${size}px`, height: `${size}px`,
        left: `${e.clientX - rect.left - size / 2}px`,
        top: `${e.clientY - rect.top - size / 2}px`,
      });
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}
