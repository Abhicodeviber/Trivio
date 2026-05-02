'use client';
import { useEffect } from 'react';

export function useTiltCards(selector = '.tilt-card') {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector);
    const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

    cards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${cy * -12}deg) rotateY(${cx * 14}deg) scale(1.04) translateY(-6px)`;
        card.style.boxShadow = `${-cx * 1.5 * 14}px ${cy * -1.5 * 12 + 20}px 50px rgba(0,0,0,0.18)`;
      };
      const leave = () => { card.style.transform = ''; card.style.boxShadow = ''; };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.push({ el: card, move, leave });
    });

    return () => handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    });
  }, [selector]);
}
