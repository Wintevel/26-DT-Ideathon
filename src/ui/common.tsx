import { CARDS, depthLabel, ENEMIES, RELICS, SQUADS } from '../game/data';
import { defOf, tierOf, TIER_NAMES } from '../game/engine';
import type { CardInst, RunState } from '../game/types';
import { nodeById, STAGES } from '../game/run';
import { Icon } from './Icons';
import { Rich } from './Rich';

const GLYPH: Record<string, JSX.Element> = {
  전술: <svg width="22" height="14" viewBox="0 0 22 14"><path d="M2 12 L20 2" stroke="currentColor" strokeWidth="2" /></svg>,
  거울: <svg width="22" height="14" viewBox="0 0 22 14"><path d="M11 0 V14 M3 3 L8 7 L3 11 M19 3 L14 7 L19 11" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>,
  흡수: <svg width="22" height="14" viewBox="0 0 22 14"><circle cx="8" cy="7" r="5" stroke="currentColor" fill="none" /><circle cx="14" cy="7" r="5" stroke="currentColor" fill="currentColor" fillOpacity=".3" /></svg>,
  상태: <svg width="22" height="14" viewBox="0 0 22 14"><path d="M4 7 H18" stroke="currentColor" strokeDasharray="2 3" /></svg>,
};

export function CardView({ card, id, cost, disabled, selected, onClick, onHover, mini, eroPreview, dataFx }: {
  card?: CardInst; id?: string; cost?: number; disabled?: boolean; selected?: boolean; onClick?: () => void;
  onHover?: (on: boolean) => void; mini?: boolean; eroPreview?: number; dataFx?: string;
}) {
  const inst: CardInst = card ?? { uid: -1, id: id! };
  const d = defOf(inst);
  const src = inst.mimic ? `모사 · ${inst.mimic.fromName}` : d.source ? `출처 · ${srcName(d.source)}` : '';
  return (
    <button
      className={`card c-${d.cat} ${inst.mimic ? 'mimiccard' : ''} ${selected ? 'sel' : ''} ${mini ? 'mini' : ''}`}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      data-fx={dataFx}
    >
      {!d.unplayable && <span className="cost">{cost ?? d.cost}</span>}
      {eroPreview ? <span className="ero">{eroPreview > 0 ? `+${eroPreview}%` : `${eroPreview}%`}</span> : null}
      <span className="nm">{d.name}</span>
      <span className="tx"><Rich text={d.text} /></span>
      {src && <span className="src">{src}</span>}
      <span className="glyph">{GLYPH[d.cat]}</span>
      <span className="cat">{inst.mimic ? '모사' : d.cat}</span>
    </button>
  );
}
const srcName = (id: string) => ENEMIES[id]?.name ?? id;

export function TopBar({ run, meta, onDeck, onRelics, onMenu, onMap }: { run: RunState; meta: string[]; onDeck: () => void; onRelics: () => void; onMenu: () => void; onMap: boolean }) {
  const stage = run.pos ? nodeById(run, run.pos).stage : 0;
  const t = tierOf(run.erosion, meta);
  return (
    <div className="topbar">
      <div className="where">
        SECTOR 01 / 침묵 회랑
        <small>{stage === STAGES - 1 ? 'BOSS' : `STAGE ${String(stage + 1).padStart(2, '0')}`} · DEPTH {depthLabel(run.depth)}</small>
      </div>
      <div className="stat"><Icon name="heart" size={15} /> HP <span className="bar"><i style={{ width: `${(run.hp / run.maxHp) * 100}%` }} /></span><b>{run.hp}/{run.maxHp}</b></div>
      <div className="stat" data-fx="erosion-top"><Icon name="erosion" size={15} /> 침식 <span className={`bar ero ${t >= 2 ? 'hot' : ''}`}><i style={{ width: `${run.erosion}%` }} /></span><b>{run.erosion}%</b> <span className="mute">{TIER_NAMES[t]}</span></div>
      <div className="stat"><Icon name="kakpul" size={15} /> 각뿔 <b>{run.kakpul}</b></div>
      <div className="stat"><Icon name="mirror" size={15} /> 거울 모사 <b>{run.mirrorCharges}회</b></div>
      <span className="spacer" />
      {!onMap && <button className="chip icon-btn" onClick={onDeck}><Icon name="deck" size={14} /> 덱 ({run.deck.length})</button>}
      {!onMap && <button className="chip icon-btn" onClick={onRelics}><Icon name="relic" size={14} /> 소장품 ({run.relics.length})</button>}
      {onMap && <button className="chip icon-btn menu-btn" onClick={onMenu}><Icon name="archive" size={14} /> 메뉴 <kbd>ESC</kbd></button>}
    </div>
  );
}

export function DeckModal({ cards, title, onClose, onPick }: { cards: CardInst[]; title: string; onClose: () => void; onPick?: (c: CardInst) => void }) {
  const sorted = [...cards].sort((a, b) => (CARDS[a.id].cat + a.id).localeCompare(CARDS[b.id].cat + b.id));
  return (
    <div className="modal" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="head" style={{ padding: 0, border: 0 }}>
          <div><div className="kicker">DECK</div><h2>{title}</h2></div>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>닫기</button>
        </div>
        <div className="grid">
          {sorted.map((c) => <CardView key={c.uid} card={c} mini onClick={onPick ? () => onPick(c) : undefined} />)}
        </div>
      </div>
    </div>
  );
}

export function RelicModal({ relics, onClose }: { relics: string[]; onClose: () => void }) {
  return (
    <div className="modal drawer" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="head" style={{ padding: 0, border: 0 }}>
          <div><div className="kicker">RELICS</div><h2>소장품</h2></div>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>닫기</button>
        </div>
        {relics.map((id) => (
          <div className="relic" key={id}><div className="ico"><span><Icon name="relic" size={20} /></span></div><div><b>{RELICS[id].name}</b><div className="mute"><Rich text={RELICS[id].text} /></div></div></div>
        ))}
      </div>
    </div>
  );
}

export const squadName = (id: string) => SQUADS.find((s) => s.id === id)?.name ?? id;

export function Silhouette({ boss }: { boss?: boolean }) {
  return (
    <svg className="silhouette" viewBox="0 0 70 90" aria-hidden>
      {boss ? (
        <path d="M35 4 L46 16 L44 30 L60 40 L64 70 L52 86 L18 86 L6 70 L10 40 L26 30 L24 16 Z M35 40 L40 52 L35 64 L30 52 Z" />
      ) : (
        <path d="M35 6 C44 6 48 14 48 22 C48 30 42 36 35 36 C28 36 22 30 22 22 C22 14 26 6 35 6 Z M14 86 C14 58 22 44 35 44 C48 44 56 58 56 86 Z" />
      )}
    </svg>
  );
}
