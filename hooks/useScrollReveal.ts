'use client';
import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-right, .section-header';
    const els = document.querySelectorAll<HTMLElement>(selectors);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => observer.observe(el));

    const footer = document.querySelector('.footer');
    const footerObs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          footer?.classList.add('visible');
          footerObs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (footer) footerObs.observe(footer);

    return () => { observer.disconnect(); footerObs.disconnect(); };
  }, []);
}
