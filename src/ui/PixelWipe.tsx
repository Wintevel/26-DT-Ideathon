// 화면 전환: 마지막으로 누른 지점에서 안테나 빔처럼 잘게 쪼갠 사각형이 퍼지며 화면을 덮고, 다시 걷힌다.
import { useEffect, useRef } from 'react';
import { playSound } from './audio';

let lastPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('pointerdown', (e) => (lastPoint = { x: e.clientX, y: e.clientY }), true);
export const getLastPoint = () => lastPoint;

const CELL = 18;
const COVER_MS = 420;
const REVEAL_MS = 520;
const BAND = 0.07;

export function PixelWipe({ origin, onCovered, onDone }: { origin: { x: number; y: number }; onCovered: () => void; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onCovered();
      onDone();
      return;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const fg = css.getPropertyValue('--fg').trim() || '#f2f2ee';
    const bg = css.getPropertyValue('--bg').trim() || '#050505';
    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    const maxD = Math.hypot(Math.max(origin.x, W - origin.x), Math.max(origin.y, H - origin.y));
    const delays = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const d = Math.hypot(c * CELL + CELL / 2 - origin.x, r * CELL + CELL / 2 - origin.y) / maxD;
        delays[r * cols + c] = d * 0.78 + Math.random() * 0.22;
      }
    playSound('wipeIn');
    let raf = 0;
    let phase: 'cover' | 'reveal' = 'cover';
    let start = performance.now();
    const draw = (now: number) => {
      const dur = phase === 'cover' ? COVER_MS : REVEAL_MS;
      const t = Math.min(1.0001, (now - start) / dur);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < delays.length; i++) {
        const d = delays[i];
        const x = (i % cols) * CELL;
        const y = Math.floor(i / cols) * CELL;
        if (phase === 'cover') {
          if (d > t) continue;
          const edge = t - d < BAND;
          ctx.fillStyle = edge ? fg : bg;
          ctx.fillRect(x, y, edge ? CELL - 2 : CELL, edge ? CELL - 2 : CELL);
        } else {
          if (d < t - BAND) continue;
          const edge = d <= t;
          ctx.fillStyle = edge ? fg : bg;
          ctx.fillRect(x, y, edge ? CELL - 2 : CELL, edge ? CELL - 2 : CELL);
        }
      }
      if (t >= 1) {
        if (phase === 'cover') {
          phase = 'reveal';
          onCovered();
          playSound('wipeOut', .06);
          start = performance.now() + 60;
        } else {
          onDone();
          return;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="pixelwipe" />;
}
