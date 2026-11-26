// 소장품 3x3 격자 편집 서랍. 고른 블럭을 격자에 놓아야 효과가 발동한다.
import { useEffect, useRef, useState } from 'react';
import { useClosing } from './common';
import { RELICS } from '../game/data';
import { canPlace, cellsOf, GRID, occupied, type Placement } from '../game/relicGrid';
import { Icon } from './Icons';
import { Rich } from './Rich';

const TONES = ['#46e8c0', '#f2f2ee', '#8fb3ff', '#ffd54f', '#b98cff', '#ff9a8a'];
const toneOf = (relics: string[], id: string) => TONES[relics.indexOf(id) % TONES.length];

function Shape({ id, rot = 0, tone, size = 11 }: { id: string; rot?: number; tone: string; size?: number }) {
  const cells = cellsOf(id, rot);
  const h = Math.max(...cells.map((c) => c[0])) + 1;
  const w = Math.max(...cells.map((c) => c[1])) + 1;
  return (
    <span className="rg-shape" style={{ gridTemplateColumns: `repeat(${w}, ${size}px)`, gridTemplateRows: `repeat(${h}, ${size}px)` }}>
      {cells.map(([r, c]) => <i key={`${r}${c}`} style={{ gridRow: r + 1, gridColumn: c + 1, background: tone }} />)}
    </span>
  );
}

export function RelicDrawer({ relics, grid, editable, onChange, onClose }: {
  relics: string[]; grid: Record<string, Placement>; editable: boolean;
  onChange: (g: Record<string, Placement>) => void; onClose: () => void;
}) {
  const [held, setHeld] = useState<string | null>(null);
  const [rot, setRot] = useState(0);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [closing, close] = useClosing(onClose, 300);
  const occ = occupied(grid);
  // 끌어서 배치: 누른 채 5px 넘게 움직이면 끌기 시작, 칸 위에서 놓으면 배치
  const drag = useRef<{ id: string; x: number; y: number; on: boolean; fromGrid: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const cellAt = (x: number, y: number): [number, number] | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.rg-cell');
    return el ? [Number(el.dataset.r), Number(el.dataset.c)] : null;
  };
  const onDown = (id: string, fromGrid: boolean) => (e: React.PointerEvent) => {
    if (!editable || e.button !== 0) return;
    drag.current = { id, x: e.clientX, y: e.clientY, on: false, fromGrid };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.on) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return;
        d.on = true;
        const p = grid[d.id];
        if (p) { const g = { ...grid }; delete g[d.id]; onChange(g); setRot(p.rot); } else if (held !== d.id) setRot(0);
        setHeld(d.id);
      }
      setGhost({ x: e.clientX, y: e.clientY });
      setHover(cellAt(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d || !d.on) return;
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      setGhost(null);
      const c = cellAt(e.clientX, e.clientY);
      if (c) {
        const p = { r: c[0], c: c[1], rot };
        if (canPlace(gridRef.current, d.id, p)) { onChange({ ...gridRef.current, [d.id]: p }); setHeld(null); return; }
      }
      // 격자 밖이나 놓을 수 없는 칸이면 손에 든 상태로 남긴다
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  });
  const gridRef = useRef(grid);
  gridRef.current = grid;

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.key === 'r' || e.key === 'R') && held) setRot((v) => (v + 1) % 4); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [held]);

  const pick = (id: string) => {
    if (!editable || suppressClick.current) return;
    if (held === id) { setHeld(null); return; }
    const g = { ...grid };
    const p = g[id];
    if (p) { delete g[id]; onChange(g); setRot(p.rot); } else setRot(0);
    setHeld(id);
  };

  // 미리보기: 들고 있는 블럭을 hover 칸에 놓았을 때
  const prev = held && hover ? { r: hover[0], c: hover[1], rot } : null;
  const ok = held && prev ? canPlace(grid, held, prev) : false;
  const prevCells = held && prev ? new Set(cellsOf(held, rot).map(([r, c]) => `${prev.r + r},${prev.c + c}`)) : new Set<string>();

  const clickCell = (r: number, c: number) => {
    if (!editable || suppressClick.current) return;
    if (held) {
      const p = { r, c, rot };
      if (canPlace(grid, held, p)) { onChange({ ...grid, [held]: p }); setHeld(null); }
      return;
    }
    const id = occ.get(`${r},${c}`);
    if (id) pick(id);
  };

  return (
    <div className={`modal drawer rg-modal ${closing ? 'closing' : ''}`} onClick={(e) => { if (e.target === e.currentTarget && !suppressClick.current) close(); }}>
      {/* 왼쪽 빈 화면: 3×3 격자 */}
      <div className="rg-stage" onClick={(e) => { if (e.target === e.currentTarget && !suppressClick.current) close(); }}>
        <div className="rg-stage-in" onClick={(e) => e.stopPropagation()}>
          <div className="kicker">RELIC MATRIX · 3×3</div>
          <div className="rg-grid" onMouseLeave={() => setHover(null)}>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const r = Math.floor(i / GRID), c = i % GRID;
              const key = `${r},${c}`;
              const id = occ.get(key);
              const pv = prevCells.has(key);
              return (
                <button
                  key={key}
                  data-r={r}
                  data-c={c}
                  onPointerDown={id ? onDown(id, true) : undefined}
                  className={`rg-cell ${id ? 'full' : ''} ${pv ? (ok ? 'pv ok' : 'pv bad') : ''}`}
                  style={id ? { ['--t' as string]: toneOf(relics, id) } : undefined}
                  onMouseEnter={() => setHover([r, c])}
                  onClick={() => clickCell(r, c)}
                  title={id ? RELICS[id].name : undefined}
                  disabled={!editable && !id}
                >
                  {id && <span>{RELICS[id].name}</span>}
                </button>
              );
            })}
          </div>
          <p className="mute rg-help">
            격자에 들어간 소장품만 효과가 발동합니다.{' '}
            {editable ? <>오른쪽 목록이나 격자에서 블럭을 끌어다 칸에 놓으세요. <kbd>R</kbd> 회전.</> : '전투 중에는 배치를 바꿀 수 없습니다.'}
          </p>
          {held && (
            <div className="rg-held">
              <Shape id={held} rot={rot} tone={toneOf(relics, held)} size={16} />
              <div><b>{RELICS[held].name}</b><div className="mute" style={{ fontSize: 11 }}>놓을 칸을 누르세요</div></div>
              <button className="btn ghost icon-btn" onClick={() => setRot((rot + 1) % 4)}><Icon name="recall" size={14} /> 회전</button>
            </div>
          )}
        </div>
      </div>
      <div className="box rg" onClick={(e) => e.stopPropagation()}>
        <div className="head" style={{ padding: 0, border: 0 }}>
          <div><div className="kicker">RELICS</div><h2>보유 소장품</h2></div>
          <span className="spacer" />
          <button className="btn ghost" onClick={close}>닫기</button>
        </div>
        <div className="rg-list">
          {relics.map((id) => {
            const on = id in grid;
            return (
              <button key={id} className={`rg-item ${on ? 'on' : ''} ${held === id ? 'held' : ''}`} onClick={() => pick(id)} onPointerDown={onDown(id, false)} disabled={!editable}>
                <Shape id={id} rot={grid[id]?.rot ?? 0} tone={toneOf(relics, id)} />
                <div>
                  <b>{RELICS[id].name}</b> <span className="st">{held === id ? '들고 있음' : on ? '발동 중' : '미배치 · 효과 없음'}</span>
                  <div className="mute"><Rich text={RELICS[id].text} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {ghost && held && (
        <div className="rg-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <Shape id={held} rot={rot} tone={toneOf(relics, held)} size={30} />
        </div>
      )}
    </div>
  );
}
