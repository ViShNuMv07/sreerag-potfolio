import React, { useEffect, useState } from 'react';

const SOURCE_WORD = 'SREERAG E P';
const TARGET_WORD = 'PORTFOLIO';
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function OpeningSequence({ onMorphToPortfolio, onComplete }) {
  const [stage, setStage] = useState(0);
  const [displayWord, setDisplayWord] = useState(SOURCE_WORD);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 450),  // Dot -> ? hook draws
      setTimeout(() => setStage(2), 1120), // ? converts to S -> SREERAG E P reveals
      setTimeout(() => setStage(3), 2350), // SREERAG E P morphs -> PORTFOLIO
      setTimeout(() => {
        setStage(4);
        onMorphToPortfolio?.();
      }, 3350), // Hand off to particle portrait explosion
      setTimeout(() => onComplete?.(), 4050)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onMorphToPortfolio, onComplete]);

  useEffect(() => {
    if (stage !== 3) return;
    const totalFrames = 22;
    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      const currentLen = Math.round(
        SOURCE_WORD.length + (TARGET_WORD.length - SOURCE_WORD.length) * Math.min(1, progress * 1.2)
      );
      let next = '';
      for (let i = 0; i < currentLen; i++) {
        const settleAt = i / TARGET_WORD.length;
        if (progress >= settleAt + 0.14) {
          next += TARGET_WORD[i] || '';
        } else if (progress < 0.22 && i < SOURCE_WORD.length) {
          next += SOURCE_WORD[i];
        } else {
          next += SCRAMBLE_CHARS[(frame * 3 + i * 7) % SCRAMBLE_CHARS.length];
        }
      }
      setDisplayWord(next);
      if (frame >= totalFrames) {
        setDisplayWord(TARGET_WORD);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className={`intro-overlay stage-${stage}`} aria-label="Portfolio intro animation">
      <div className="intro-glow" />
      <div className="intro-stage-box">
        {stage < 3 ? (
          <div className={`intro-build ${stage >= 2 ? 'is-name' : ''}`}>
            <span className={`intro-pivot ${stage === 1 ? 'is-question' : ''} ${stage >= 2 ? 'is-letter-s' : ''}`}>
              <svg
                className="intro-q-svg"
                viewBox="0 0 100 124"
                aria-hidden="true"
              >
                <path
                  className="intro-q-hook"
                  pathLength="100"
                  d="M 27 38 C 27 14, 73 14, 73 38 C 73 56, 50 58, 50 76"
                />
                <circle className="intro-q-dot" cx="50" cy="100" r="8.5" />
              </svg>
              <span className="intro-s-glyph">S</span>
            </span>
            <span className="intro-side intro-side-right">REERAG&nbsp;E&nbsp;P</span>
          </div>
        ) : (
          <div className={`intro-wordmark ${stage === 3 ? 'is-morphing' : ''} ${stage >= 4 ? 'is-settled' : ''}`}>
            {displayWord}
          </div>
        )}
      </div>
      <button
        type="button"
        className="intro-skip"
        onClick={() => {
          onMorphToPortfolio?.();
          onComplete?.();
        }}
      >
        SKIP INTRO →
      </button>
    </div>
  );
}
