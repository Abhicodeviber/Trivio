'use client';
import { useEffect, useRef } from 'react';

const PHRASES = ['plumber near me...','web designer...','house cleaning...','math tutor...','electrician...','logo designer...','garden maintenance...'];

export function useTypewriter(inputId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;
    let pi = 0, ci = 0, deleting = false;

    const type = () => {
      const phrase = PHRASES[pi];
      if (deleting) {
        input.placeholder = 'Try ' + phrase.slice(0, ci--);
        if (ci < 0) { deleting = false; pi = (pi + 1) % PHRASES.length; ci = 0; }
        timerRef.current = setTimeout(type, 40);
      } else {
        input.placeholder = 'Try ' + phrase.slice(0, ci++);
        if (ci > phrase.length) { deleting = true; timerRef.current = setTimeout(type, 1600); }
        else timerRef.current = setTimeout(type, 80);
      }
    };
    type();
    return () => clearTimeout(timerRef.current);
  }, [inputId]);
}
