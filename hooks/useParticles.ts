'use client';
import { useEffect } from 'react';

export function useParticles(canvasId: string) {
  useEffect(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let animId: number;

    interface Particle {
      x: number; y: number; r: number;
      vx: number; vy: number;
      life: number; maxLife: number; hue: number;
      reset(): void; update(): void; draw(): void;
    }

    function resize() {
      const hero = canvas!.closest('.hero') as HTMLElement | null;
      if (!hero) return;
      W = canvas!.width = hero.offsetWidth;
      H = canvas!.height = hero.offsetHeight;
    }

    function makeParticle(): Particle {
      return {
        x: 0, y: 0, r: 0, vx: 0, vy: 0, life: 0, maxLife: 0, hue: 240,
        reset() {
          this.x = Math.random() * W;
          this.y = H + 10;
          this.r = Math.random() * 3 + 1;
          this.vx = (Math.random() - 0.5) * 0.8;
          this.vy = -(Math.random() * 1.2 + 0.4);
          this.life = 0;
          this.maxLife = Math.random() * 180 + 80;
          this.hue = Math.random() < 0.5 ? 240 : 280;
        },
        update() {
          this.x += this.vx; this.y += this.vy; this.life++;
          if (this.life > this.maxLife || this.y < -10) this.reset();
        },
        draw() {
          const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.35;
          ctx!.beginPath();
          ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${this.hue},70%,65%,${alpha})`;
          ctx!.fill();
        },
      };
    }

    resize();
    const particles = Array.from({ length: 55 }, () => {
      const p = makeParticle();
      p.reset();
      p.y = Math.random() * H;
      p.life = Math.floor(Math.random() * p.maxLife);
      return p;
    });

    function loop() {
      ctx!.clearRect(0, 0, W, H);
      particles.forEach((p) => { p.update(); p.draw(); });
      animId = requestAnimationFrame(loop);
    }
    loop();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, [canvasId]);
}
