// 맵 메뉴(Esc)와 마우스 위치 안테나 파동
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { KW_INFO } from './Rich';

export function MapMenu({ onClose, onSave, onAbandon }: { onClose: () => void; onSave: () => void; onAbandon: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="modal map-menu" onClick={onClose}>
      <div className="mm-box" onClick={(e) => e.stopPropagation()}>
        <div className="kicker">OPERATION MENU</div>
        <h2>작전 일시 정지</h2>
        <button className="btn solid icon-btn" onClick={onClose}><Icon name="launch" size={16} /> 작전 계속하기</button>
        <button className="btn icon-btn" onClick={onSave}><Icon name="archive" size={16} /> 저장하고 메인으로</button>
        <button className={`btn ghost icon-btn danger ${armed ? 'armed' : ''}`} onClick={() => (armed ? onAbandon() : setArmed(true))}>
          <Icon name="debuff" size={16} /> {armed ? '한 번 더 누르면 출격 취소 (보상 없음)' : '출격 취소하기'}
        </button>
        <div className="mono mute" style={{ fontSize: 11 }}>ESC · 닫기 / 맵에 있을 때마다 진행 상황이 자동 저장됩니다</div>
      </div>
    </div>
  );
}

/** 마우스를 따라다니는 작은 안테나 파동. 클릭하면 한 번 크게 퍼진다. */
export function CursorPing() {
  const el = useRef<HTMLDivElement>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (window.matchMedia?.('(pointer: coarse)').matches) return;
    let x = -100, y = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (el.current) { el.current.style.transform = `translate(${x}px, ${y}px)`; el.current.style.opacity = '1'; } });
    };
    const down = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setBursts((b) => [...b.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 700);
    };
    const leave = () => { if (el.current) el.current.style.opacity = '0'; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); document.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={el} className="cursor-ping" aria-hidden><i /><i /></div>
      {bursts.map((b) => <div key={b.id} className="cursor-burst" style={{ left: b.x, top: b.y }} aria-hidden><i /><i /></div>)}
    </>
  );
}

/** 키워드 위에 마우스를 잠시 올려 두면 작은 설명 팝업을 띄운다 */
const KW_DELAY = 2500;
export function KeywordTip() {
  const [tip, setTip] = useState<{ k: string; x: number; y: number } | null>(null);
  useEffect(() => {
    let timer = 0;
    let cur: Element | null = null;
    const over = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.('[data-kw]') ?? null;
      if (t === cur) return;
      cur = t;
      clearTimeout(timer);
      setTip(null);
      if (!t) return;
      timer = window.setTimeout(() => {
        const r = t.getBoundingClientRect();
        setTip({ k: t.getAttribute('data-kw')!, x: Math.min(window.innerWidth - 250, Math.max(10, r.left)), y: r.bottom + 8 > window.innerHeight - 110 ? r.top - 8 : r.bottom + 8 });
      }, KW_DELAY);
    };
    const hide = () => { clearTimeout(timer); cur = null; setTip(null); };
    document.addEventListener('mouseover', over);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => { clearTimeout(timer); document.removeEventListener('mouseover', over); document.removeEventListener('pointerdown', hide); window.removeEventListener('scroll', hide, true); };
  }, []);
  if (!tip || !KW_INFO[tip.k]) return null;
  const [name, text] = KW_INFO[tip.k];
  const above = tip.y < 0 || tip.y > window.innerHeight - 110;
  return (
    <div className={`kw-tip kw-${tip.k}`} style={{ left: tip.x, top: tip.y, transform: above ? 'translateY(-100%)' : undefined }} role="tooltip">
      <b>{name}</b>
      <span>{text}</span>
    </div>
  );
}
