import React, { useEffect, useRef } from 'react';

export default function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let stars = [];
    let rafId = 0;
    let shootingStar = null;
    let nextShootAt = performance.now() + 4500;

    const createStars = () => {
      const count = Math.min(240, Math.max(110, Math.floor((width * height) / 7200)));
      const tints = ['#ffffff', '#eef2ff', '#dbeafe', '#ffe8e5'];
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: depth > 0.9 ? 1.7 : depth > 0.55 ? 1.15 : 0.75,
          depth: 0.15 + depth * 0.65,
          baseAlpha: 0.22 + depth * 0.65,
          twinkleSpeed: 0.8 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * 0.08,
          driftY: -0.04 - Math.random() * 0.1,
          color: tints[Math.floor(Math.random() * tints.length)]
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
    };

    resize();
    window.addEventListener('resize', resize);

    const drawFrame = (now) => {
      const t = now * 0.001;
      const scrollY = window.scrollY || 0;

      ctx.clearRect(0, 0, width, height);

      // Subtle deep-space nebula glow
      const neb1 = ctx.createRadialGradient(width * 0.22, height * 0.28, 0, width * 0.22, height * 0.28, width * 0.55);
      neb1.addColorStop(0, 'rgba(65, 95, 175, 0.055)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(width * 0.82, height * 0.72, 0, width * 0.82, height * 0.72, width * 0.45);
      neb2.addColorStop(0, 'rgba(239, 59, 45, 0.03)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!reduced) {
          s.x = (s.x + s.driftX + width) % width;
          s.y = (s.y + s.driftY + height) % height;
        }

        const parallaxY = ((s.y - scrollY * s.depth * 0.14) % height + height) % height;
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.phase);
        const alpha = Math.max(0.08, Math.min(1, s.baseAlpha * twinkle));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, parallaxY, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.r > 1.5) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(s.x, parallaxY, s.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Occasional shooting star
      if (!reduced) {
        if (!shootingStar && now > nextShootAt) {
          shootingStar = {
            x: width * (0.2 + Math.random() * 0.65),
            y: height * (0.08 + Math.random() * 0.35),
            vx: -7.5 - Math.random() * 3.5,
            vy: 3.2 + Math.random() * 2.2,
            life: 1
          };
          nextShootAt = now + 6500 + Math.random() * 5500;
        }

        if (shootingStar) {
          const st = shootingStar;
          const grad = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * 9, st.y - st.vy * 9);
          grad.addColorStop(0, `rgba(255, 255, 255, ${st.life.toFixed(2)})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x - st.vx * 9, st.y - st.vy * 9);
          ctx.stroke();

          st.x += st.vx;
          st.y += st.vy;
          st.life -= 0.028;
          if (st.life <= 0) shootingStar = null;
        }
      }

      ctx.globalAlpha = 1;
      if (!reduced) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    if (reduced) {
      drawFrame(performance.now());
    } else {
      rafId = requestAnimationFrame(drawFrame);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="starfield-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="starfield-canvas" />
    </div>
  );
}

