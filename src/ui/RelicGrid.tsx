// 소장품 3x3 격자 편집 서랍. 고른 블럭을 격자에 놓아야 효과가 발동한다.
import { useEffect, useState } from 'react';
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
  const occ = occupied(grid);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.key === 'r' || e.key === 'R') && held) setRot((v) => (v + 1) % 4); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [held]);

  const pick = (id: string) => {
    if (!editable) return;
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
    if (!editable) return;
    if (held) {
      const p = { r, c, rot };
      if (canPlace(grid, held, p)) { onChange({ ...grid, [held]: p }); setHeld(null); }
      return;
    }
    const id = occ.get(`${r},${c}`);
    if (id) pick(id);
  };

  const active = relics.filter((id) => id in grid);
  return (
    <div className="modal drawer" onClick={onClose}>
      <div className="box rg" onClick={(e) => e.stopPropagation()}>
        <div className="head" style={{ padding: 0, border: 0 }}>
          <div><div className="kicker">RELIC MATRIX · 3×3</div><h2>소장품</h2></div>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>닫기</button>
        </div>
        <p className="mute rg-help">
          격자에 들어간 소장품만 효과가 발동합니다.{' '}
          {editable ? <>목록이나 격자에서 블럭을 집고, 칸을 눌러 놓으세요. <kbd>R</kbd> 회전.</> : '전투 중에는 배치를 바꿀 수 없습니다.'}
        </p>
        <div className="rg-board">
          <div className="rg-grid" onMouseLeave={() => setHover(null)}>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const r = Math.floor(i / GRID), c = i % GRID;
              const key = `${r},${c}`;
              const id = occ.get(key);
              const pv = prevCells.has(key);
              return (
                <button
                  key={key}
                  className={`rg-cell ${id ? 'full' : ''} ${pv ? (ok ? 'pv ok' : 'pv bad') : ''}`}
                  style={id ? { ['--t' as string]: toneOf(relics, id) } : undefined}
                  onMouseEnter={() => setHover([r, c])}
                  onClick={() => clickCell(r, c)}
                  title={id ? RELICS[id].name : undefined}
                  disabled={!editable && !id}
                >
                  {id && <span>{RELICS[id].name.slice(0, 2)}</span>}
                </button>
              );
            })}
          </div>
          <div className="rg-side">
            <div className="mono" style={{ fontSize: 12 }}>발동 {active.length} / 보유 {relics.length}</div>
            {held && (
              <div className="rg-held">
                <Shape id={held} rot={rot} tone={toneOf(relics, held)} size={16} />
                <div><b>{RELICS[held].name}</b><div className="mute" style={{ fontSize: 11 }}>놓을 칸을 누르세요</div></div>
                <button className="btn ghost icon-btn" onClick={() => setRot((rot + 1) % 4)}><Icon name="recall" size={14} /> 회전</button>
              </div>
            )}
          </div>
        </div>
        <div className="rg-list">
          {relics.map((id) => {
            const on = id in grid;
            return (
              <button key={id} className={`rg-item ${on ? 'on' : ''} ${held === id ? 'held' : ''}`} onClick={() => pick(id)} disabled={!editable}>
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
    </div>
  );
}
