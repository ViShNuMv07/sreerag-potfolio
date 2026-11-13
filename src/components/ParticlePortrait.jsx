import React, { useEffect, useRef } from 'react';

const TONE_BUCKETS = 16;
const TONE_STYLES = Array.from({ length: TONE_BUCKETS }, (_, i) => {
  const v = Math.round(38 + (i / (TONE_BUCKETS - 1)) * 217);
  return `rgb(${v},${v},${v})`;
});

/**
 * Samples a real portrait image at high density into organic, tonal-graded
 * B&W halftone dots so facial features and lighting match the source photo.
 */
function sampleImagePoints(img, width, height) {
  const off = document.createElement('canvas');
  const w = 270;
  const h = Math.round(w * (img.naturalHeight / img.naturalWidth)) || 276;
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.12)';
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';

  const data = ctx.getImageData(0, 0, w, h).data;
  const lumGrid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    lumGrid[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const points = [];
  const portraitScale = Math.min(width * 0.7, height * 0.96);
  const scaleX = portraitScale / w;
  const scaleY = (portraitScale * (h / w)) / h;
  const offsetX = width * 0.5 - (w * scaleX) / 2;
  const offsetY = height * 0.43 - (h * scaleY) / 2;

  for (let y = 1; y < h - 1; y += 1) {
    const ny = y / h;
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const lum = lumGrid[i];
      if (lum < 12) continue;

      const gx = Math.abs(lumGrid[i + 1] - lumGrid[i - 1]);
      const gy = Math.abs(lumGrid[i + w] - lumGrid[i - w]);
      const edge = Math.min(255, (gx + gy) * 0.75);

      // Wide, gentle radial vignette so both sides of face & hair stay clearly lit
      const dx = (x / w - 0.52) / 0.62;
      const dy = (ny - 0.44) / 0.68;
      const radial = Math.max(0.15, 1 - Math.pow(dx * dx + dy * dy, 1.5) * 0.28);
      const bottomFade = ny > 0.76 ? Math.max(0, 1 - (ny - 0.76) / 0.24) : 1;

      const toneRaw = Math.min(1, (lum * 0.96 + edge * 0.22) / 255);
      // Lift midtones gently so right cheek, neck and hair curls read like a B&W photo
      const tone = Math.min(1, Math.pow(toneRaw, 0.88) * radial * bottomFade);

      const keepProb = tone > 0.16 ? 0.96 : tone * 5.2;
      if (tone > 0.045 && Math.random() < keepProb) {
        const bucket = Math.min(TONE_BUCKETS - 1, Math.max(0, Math.floor(tone * TONE_BUCKETS)));
        points.push({
          tx: offsetX + x * scaleX + (Math.random() - 0.5) * scaleX * 1.1,
          ty: offsetY + y * scaleY + (Math.random() - 0.5) * scaleY * 1.1,
          bucket,
          size: 1.0 + tone * 0.95,
          isAmbient: false
        });
      }
    }
  }

  // Subtle ambient stardust around the portrait
  const ambientCount = Math.min(260, Math.floor((width * height) / 4800));
  for (let i = 0; i < ambientCount; i++) {
    points.push({
      tx: Math.random() * width,
      ty: Math.random() * height,
      bucket: Math.floor(2 + Math.random() * 7),
      size: Math.random() > 0.7 ? 1.4 : 0.95,
      isAmbient: true
    });
  }

  return points;
}

/**
 * Fallback procedural points while portrait image loads.
 */
function sampleFallbackPoints(width, height) {
  const points = [];
  const ambientCount = Math.min(320, Math.floor((width * height) / 4000));
  for (let i = 0; i < ambientCount; i++) {
    points.push({
      tx: Math.random() * width,
      ty: Math.random() * height,
      bucket: Math.floor(3 + Math.random() * 8),
      size: Math.random() > 0.7 ? 1.5 : 1.0,
      isAmbient: true
    });
  }
  return points;
}

export default function ParticlePortrait({ assembled, scrollProgress }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ assembled, scrollProgress });
  stateRef.current = { assembled, scrollProgress };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let buckets = Array.from({ length: TONE_BUCKETS }, () => []);
    let rafId = 0;
    let loadedImg = null;
    const mouse = { x: -9999, y: -9999, active: false };

    const buildParticles = (targets) => {
      buckets = Array.from({ length: TONE_BUCKETS }, () => []);
      for (let i = 0; i < targets.length; i++) {
        const pt = targets[i];
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.15 + Math.random() * 0.65) * Math.max(width, height);
        const sx = width * 0.5 + Math.cos(angle) * radius;
        const sy = height * 0.48 + Math.sin(angle) * radius;
        const scatterAngle =
          Math.atan2(pt.ty - height * 0.45, pt.tx - width * 0.5) + (Math.random() - 0.5) * 0.9;
        const scatterDist = 180 + Math.random() * 540;
        buckets[pt.bucket].push({
          ...pt,
          x: reduced ? pt.tx : sx,
          y: reduced ? pt.ty : sy,
          vx: 0,
          vy: 0,
          dx: Math.cos(scatterAngle) * scatterDist,
          dy: Math.sin(scatterAngle) * scatterDist - Math.random() * 180,
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targets = loadedImg
        ? sampleImagePoints(loadedImg, width, height)
        : sampleFallbackPoints(width, height);
      buildParticles(targets);
    };

    init();

    const img = new Image();
    img.src = '/portrait.png';
    img.onload = () => {
      loadedImg = img;
      init();
    };

    const onResize = () => init();
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    let tick = 0;
    const render = () => {
      tick += 0.016;
      const { assembled: isAssembled, scrollProgress: sp } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Subtle ambient radial halo behind head
      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        10,
        width * 0.5,
        height * 0.44,
        Math.max(width, height) * 0.46
      );
      glow.addColorStop(0, `rgba(255,255,255,${(0.05 * (1 - sp * 0.7)).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(5,5,5,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const portraitAlpha = Math.max(0.04, 1 - sp * 0.82);

      for (let b = 0; b < TONE_BUCKETS; b++) {
        const list = buckets[b];
        if (!list.length) continue;

        ctx.fillStyle = TONE_STYLES[b];
        ctx.globalAlpha = portraitAlpha;

        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          let goalX = p.tx;
          let goalY = p.ty;

          if (!isAssembled && !reduced) {
            goalX = width * 0.5 + Math.cos(p.phase + tick * 0.6) * width * 0.45;
            goalY = height * 0.5 + Math.sin(p.phase * 1.3 + tick * 0.5) * height * 0.42;
          } else if (sp > 0.01) {
            goalX = p.tx + p.dx * sp;
            goalY = p.ty + p.dy * sp;
          }

          if (!reduced) {
            const driftX = Math.sin(tick * 1.05 + p.phase) * (p.isAmbient ? 7 : 0.45);
            const driftY = Math.cos(tick * 0.9 + p.phase) * (p.isAmbient ? 7 : 0.45);
            const ease = isAssembled ? (p.isAmbient ? 0.03 : 0.11) : 0.04;

            p.vx = (p.vx + (goalX + driftX - p.x) * ease) * 0.78;
            p.vy = (p.vy + (goalY + driftY - p.y) * ease) * 0.78;

            if (mouse.active && isAssembled) {
              const mdx = p.x - mouse.x;
              const mdy = p.y - mouse.y;
              const distSq = mdx * mdx + mdy * mdy;
              const maxR = 95;
              if (distSq < maxR * maxR && distSq > 0.1) {
                const dist = Math.sqrt(distSq);
                const force = ((maxR - dist) / maxR) * 4.8;
                p.vx += (mdx / dist) * force;
                p.vy += (mdy / dist) * force;
              }
            }

            p.x += p.vx;
            p.y += p.vy;
          } else {
            p.x = goalX;
            p.y = goalY;
          }

          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      ctx.globalAlpha = 1;
      if (!reduced) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
