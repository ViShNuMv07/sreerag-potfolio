import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Play } from 'lucide-react';

const FONT_5X7 = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  ' ': ['00', '00', '00', '00', '00', '00', '00']
};

function buildTextBricks(width, height) {
  const lines = ['AI THAT', 'SHIPS'];
  const maxCols = 40; // "AI THAT" = 6*5 + 4 + 2 = 36 cols
  const cell = Math.min(Math.floor((width * 0.78) / maxCols), Math.floor((height * 0.44) / 17));
  const gap = Math.max(2, Math.round(cell * 0.22));
  const step = cell + gap;
  const bricks = [];

  lines.forEach((line, lineIdx) => {
    const lineCols = [...line].reduce((acc, ch, i) => {
      const glyph = FONT_5X7[ch] || FONT_5X7[' '];
      return acc + glyph[0].length + (i < line.length - 1 ? 1.4 : 0);
    }, 0);

    let cursorX = width / 2 - (lineCols * step) / 2;
    const baseY = height * (lineIdx === 0 ? 0.17 : 0.41);

    [...line].forEach((ch) => {
      const glyph = FONT_5X7[ch] || FONT_5X7[' '];
      const cols = glyph[0].length;
      for (let r = 0; r < glyph.length; r++) {
        for (let c = 0; c < cols; c++) {
          if (glyph[r][c] === '1') {
            bricks.push({
              x: cursorX + c * step,
              y: baseY + r * step,
              w: cell,
              h: cell,
              alive: true
            });
          }
        }
      }
      cursorX += (cols + 1.4) * step;
    });
  });

  return bricks;
}

export default function BreakoutGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [stats, setStats] = useState({ remaining: 0, total: 0, running: false, won: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let rafId = 0;

    const state = {
      bricks: [],
      sparks: [],
      paddle: { x: 0, y: 0, w: 112, h: 10 },
      ball: { x: 0, y: 0, vx: 3.4, vy: -4.4, r: 5.5 },
      running: false,
      won: false,
      total: 0,
      remaining: 0
    };
    gameRef.current = state;

    const resetGame = (autoLaunch = false) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || 760;
      height = canvas.clientHeight || 420;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      state.bricks = buildTextBricks(width, height);
      state.total = state.bricks.length;
      state.remaining = state.total;
      state.sparks = [];
      state.paddle.w = Math.max(82, Math.min(130, width * 0.15));
      state.paddle.x = width / 2 - state.paddle.w / 2;
      state.paddle.y = height - 36;
      state.ball.x = width / 2;
      state.ball.y = state.paddle.y - state.ball.r - 2;
      state.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3.4;
      state.ball.vy = -4.6;
      state.running = autoLaunch;
      state.won = false;
      setStats({ remaining: state.remaining, total: state.total, running: autoLaunch, won: false });
    };

    state.reset = resetGame;
    resetGame(false);

    const launchBall = () => {
      if (state.won) {
        resetGame(true);
        return;
      }
      if (!state.running) {
        state.running = true;
        setStats((s) => ({ ...s, running: true }));
      }
    };
    state.launch = launchBall;

    const setPaddleCenter = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const relX = clientX - rect.left;
      state.paddle.x = Math.max(12, Math.min(width - state.paddle.w - 12, relX - state.paddle.w / 2));
      if (!state.running && !state.won) {
        state.ball.x = state.paddle.x + state.paddle.w / 2;
      }
    };

    const onPointerMove = (e) => setPaddleCenter(e.clientX);
    const onTouchMove = (e) => {
      if (e.touches[0]) setPaddleCenter(e.touches[0].clientX);
    };
    const onResize = () => resetGame(false);

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('click', launchBall);
    window.addEventListener('resize', onResize);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle grid backdrop inside arena
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // Draw bricks
      for (let i = 0; i < state.bricks.length; i++) {
        const b = state.bricks[i];
        if (!b.alive) continue;
        ctx.fillStyle = '#f2f3f5';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }

      // Update & draw sparks
      for (let i = state.sparks.length - 1; i >= 0; i--) {
        const sp = state.sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.14;
        sp.life -= 0.04;
        if (sp.life <= 0) {
          state.sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = sp.red
          ? `rgba(239,59,45,${sp.life.toFixed(2)})`
          : `rgba(255,255,255,${sp.life.toFixed(2)})`;
        ctx.fillRect(sp.x, sp.y, 3, 3);
      }

      // Physics update when running
      if (state.running && !state.won) {
        const b = state.ball;
        b.x += b.vx;
        b.y += b.vy;

        // Walls
        if (b.x - b.r < 8) {
          b.x = 8 + b.r;
          b.vx = Math.abs(b.vx);
        } else if (b.x + b.r > width - 8) {
          b.x = width - 8 - b.r;
          b.vx = -Math.abs(b.vx);
        }
        if (b.y - b.r < 8) {
          b.y = 8 + b.r;
          b.vy = Math.abs(b.vy);
        }

        // Paddle collision
        const p = state.paddle;
        if (
          b.vy > 0 &&
          b.y + b.r >= p.y &&
          b.y - b.r <= p.y + p.h &&
          b.x >= p.x - 4 &&
          b.x <= p.x + p.w + 4
        ) {
          const hitRatio = (b.x - (p.x + p.w / 2)) / (p.w / 2);
          const speed = Math.min(7.4, Math.hypot(b.vx, b.vy) * 1.01);
          const angle = hitRatio * (Math.PI / 3);
          b.vx = Math.sin(angle) * speed;
          b.vy = -Math.cos(angle) * speed;
          b.y = p.y - b.r - 1;
        }

        // Brick collisions
        for (let i = 0; i < state.bricks.length; i++) {
          const br = state.bricks[i];
          if (!br.alive) continue;
          if (
            b.x + b.r > br.x &&
            b.x - b.r < br.x + br.w &&
            b.y + b.r > br.y &&
            b.y - b.r < br.y + br.h
          ) {
            br.alive = false;
            state.remaining -= 1;
            const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
            const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
            if (overlapX < overlapY) b.vx *= -1;
            else b.vy *= -1;

            for (let s = 0; s < 5; s++) {
              state.sparks.push({
                x: br.x + br.w / 2,
                y: br.y + br.h / 2,
                vx: (Math.random() - 0.5) * 4.5,
                vy: (Math.random() - 0.5) * 4.5,
                life: 1,
                red: s % 2 === 0
              });
            }

            const isWon = state.remaining <= 0;
            if (isWon) state.won = true;
            setStats({
              remaining: state.remaining,
              total: state.total,
              running: !isWon,
              won: isWon
            });
            break;
          }
        }

        // Bottom miss -> re-dock cleanly on paddle
        if (b.y - b.r > height + 10) {
          state.running = false;
          b.x = state.paddle.x + state.paddle.w / 2;
          b.y = state.paddle.y - b.r - 2;
          b.vx = (Math.random() > 0.5 ? 1 : -1) * 3.4;
          b.vy = -4.6;
          setStats((s) => ({ ...s, running: false }));
        }
      }

      // Draw glowing red paddle
      const p = state.paddle;
      ctx.save();
      ctx.shadowColor = '#ef3b2d';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ef3b2d';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 5);
      ctx.fill();
      ctx.restore();

      // Draw ball
      if (!state.won) {
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('click', launchBall);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const cleared = Math.max(0, stats.total - stats.remaining);

  return (
    <div className="breakout-shell">
      <div className="breakout-hud">
        <span className="breakout-tag">DESTRUCTIBLE DOT-MATRIX PLAYGROUND</span>
        <div className="breakout-controls">
          <span className="breakout-score">
            {cleared} / {stats.total}
          </span>
          <button
            type="button"
            className="breakout-btn"
            onClick={() => gameRef.current?.launch()}
            aria-label={stats.won ? 'Play again' : 'Launch ball'}
          >
            <Play size={12} />
            <span>{stats.won ? 'PLAY AGAIN' : stats.running ? 'ACTIVE' : 'PLAY'}</span>
          </button>
          <button
            type="button"
            className="breakout-icon-btn"
            onClick={() => gameRef.current?.reset(false)}
            aria-label="Reset bricks"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div className="breakout-canvas-wrap">
        <canvas ref={canvasRef} className="breakout-canvas" />
        {stats.won && (
          <div className="breakout-win">
            <strong>ALL PIXELS SHIPPED.</strong>
            <span>Click Play Again to rebuild the matrix.</span>
          </div>
        )}
      </div>

      <div className="breakout-footer">
        <span>MOVE CURSOR OR DRAG TO STEER PADDLE</span>
        <span>CLICK ARENA TO LAUNCH</span>
      </div>
    </div>
  );
}

