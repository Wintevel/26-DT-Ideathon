import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CARDS, DEPTHS, depthDef, depthLabel, ENEMIES, EVENT_MAP, MAX_DEPTH, MIN_DEPTH, RELICS, SQUADS, type DepthDef } from '../game/data';
import { erosionGain, tierOf, TIER_NAMES } from '../game/engine';
import { currentStage, nodeById, priceOf, reachable, STAGES, type Reward, type Settlement } from '../game/run';
import type { CardInst, MapNode, MetaSave, RunState } from '../game/types';
import { CardView, DeckModal } from './common';
import { Emblem } from './Emblem';
import { DEPTH_ICON, Icon, SQUAD_ICON } from './Icons';
import { Portrait } from './Portraits';
import { Rich } from './Rich';
import { activeRelics, occupied } from '../game/relicGrid';

// ─── 허브 ──────────────────────────────────────────────
export function Hub({ meta, onStart, onTree, onCodex, onGuide, onReset, onResume }: { meta: MetaSave; onStart: () => void; onTree: () => void; onCodex: () => void; onGuide: () => void; onReset: () => void; onResume?: () => void }) {
  const [hover, setHover] = useState(false);
  const [launching, setLaunching] = useState(false);
  const start = () => {
    if (launching) return;
    setLaunching(true);
    setTimeout(onStart, 900);
  };
  return (
    <div className={`screen hub ${launching ? 'launching' : ''}`}>
      <div className="vtitle">MIRROR <span>PROTOCOL</span></div>
      <div className="center">
        <div className="hub-emblem">
          <Emblem size={260} className={hover ? 'dim' : ''} />
          <div className={`launch-diamond ${hover ? 'on' : ''} ${launching ? 'go' : ''}`}><span /></div>
        </div>
        <div>
          <h1>거울 프로토콜</h1>
          <div className="sub">DOPPELGANGER PROTOCOL · 침묵 회랑 침투 작전</div>
        </div>
        <div className="frag"><Icon name="fragment" size={16} /> 보유 기억 파편<b>{meta.fragments}</b></div>
        <div className="menu">
          {onResume && <button className="btn icon-btn resume" onClick={onResume}><Icon name="descend" size={18} /> 작전 이어하기</button>}
          <button className="btn solid icon-btn" onClick={start} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
            <Icon name="launch" size={18} /> 출격 준비
          </button>
          <button className="btn icon-btn" onClick={onTree}><Icon name="tree" size={18} /> 우위 선점</button>
          <button className="btn icon-btn" onClick={onCodex}><Icon name="codex" size={18} /> 데이터 뱅크 · 도감</button>
        </div>
        <div className="hub-sub">
          <button className="btn ghost icon-btn" onClick={onGuide}><Icon name="codex" size={13} /> 작전 교본 · 튜토리얼</button>
          <button className="btn ghost reset" onClick={onReset}>기록 초기화</button>
        </div>
      </div>
      <div className="right">
        <div>작전 {meta.runs}회 · 정화 {meta.clears}회</div>
        <div>선점한 우위 {meta.unlocked.length} / 13</div>
        <div>원형 기록 {meta.archive.length}건</div>
        <br />
        <div>// 적의 의도를 모사하라.</div>
        <div>// 베낀 만큼 당신은 강해지고,</div>
        <div>// 베낀 만큼 당신은 사라진다.</div>
        <div>// 구역의 끝에서 당신을 만난다.</div>
      </div>
      {launching && <div className="diamond-burst" />}
    </div>
  );
}

// ─── 출격 준비 1: 프로토콜 심도 ────────────────────────
const DEPTH_ICO = (lv: number) => (lv < 0 ? 'd0' : DEPTH_ICON[lv]);
export function DepthSelect({ depth, setDepth, onBack, onNext }: { depth: number; setDepth: (d: number) => void; onBack: () => void; onNext: () => void }) {
  const d = depthDef(depth);
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const [probeY, setProbeY] = useState(0);
  const clamp = (v: number) => Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, v));
  const pick = (clientY: number) => {
    const el = box.current;
    if (!el) return;
    let best = MIN_DEPTH;
    el.querySelectorAll<HTMLElement>('.slab').forEach((l) => { if (clientY >= l.getBoundingClientRect().top - 10) best = Number(l.dataset.lv); });
    if (best !== depth) setDepth(best);
  };
  // 탐침 위치: 선택된 층의 가운데
  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(`.slab[data-lv="${depth}"]`);
    if (el) setProbeY(el.offsetTop + el.offsetHeight / 2);
  }, [depth]);
  // 휠: 한 칸씩 (트랙패드는 누적)
  const depthRef = useRef(depth);
  depthRef.current = depth;
  useEffect(() => {
    const el = box.current?.parentElement;
    if (!el) return;
    let acc = 0, last = 0;
    const w = (e: WheelEvent) => {
      e.preventDefault();
      acc += e.deltaY;
      const now = performance.now();
      if (Math.abs(acc) < 40 || now - last < 110) return;
      last = now;
      const next = clamp(depthRef.current + (acc > 0 ? 1 : -1));
      acc = 0;
      if (next !== depthRef.current) setDepth(next);
    };
    el.addEventListener('wheel', w, { passive: false });
    return () => el.removeEventListener('wheel', w);
  }, [setDepth]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDepth(clamp(depth + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setDepth(clamp(depth - 1)); }
      else if (e.key === 'Enter') onNext();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [depth, setDepth, onNext]);
  const slab = (x: DepthDef, i: number) => (
    <button
      key={x.lv}
      data-lv={x.lv}
      className={`slab ${x.lv < 0 ? 'easy' : ''} ${x.lv === MAX_DEPTH ? 'last' : ''} ${depth === x.lv ? 'on' : ''} ${x.lv <= depth ? 'fill' : ''}`}
      style={{ ['--i' as string]: i, zIndex: 20 - i }}
    >
      <span className="t">
        <span className="dl">DEPTH <em>{depthLabel(x.lv)}</em>{x.tag && <small>{x.tag}</small>}</span>
        <span className="meta">적 체력 {Math.round(x.mult * 100)}% · 파편 ×{x.frag}</span>
      </span>
      <span className="ic"><Icon name={DEPTH_ICO(x.lv)} size={24} stroke={1.4} /></span>
    </button>
  );
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 허브로</button>
        <div><div className="kicker">PRE-LAUNCH · STEP 1 / 2</div><h2>프로토콜 심도 선택</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>끌어 내리거나 휠을 굴려 심도를 고르세요 · ↑↓ 키</span>
      </div>
      <div className="wrap strata-wrap">
        <div
          ref={box}
          className={`slabs ${drag ? 'dragging' : ''}`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); pick(e.clientY); }}
          onPointerMove={(e) => drag && pick(e.clientY)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
        >
          <div className="shaft"><span className="cable" style={{ height: probeY }} /><span className="probe" style={{ top: probeY }}><Icon name="antenna" size={16} /></span><span className="readout" style={{ top: probeY }}>{depthLabel(depth)}</span></div>
          {DEPTHS.filter((x) => x.lv < 0).map((x, i) => slab(x, i))}
          <div className="surface"><span>SURFACE</span><i /></div>
          {DEPTHS.filter((x) => x.lv >= 0).map((x) => slab(x, x.lv + 1))}
          <div className="bedrock">CORE · 아크</div>
        </div>
        <aside className="strata-detail" key={depth}>
          <div className="mono mute" style={{ fontSize: 11, letterSpacing: '.14em' }}>DEPTH {depthLabel(depth)}{d.tag ? ` · ${d.tag}` : ''}</div>
          <div className="big-ic"><Icon name={DEPTH_ICO(depth)} size={64} stroke={1.2} /></div>
          <b>{d.name}</b>
          <p className="mute">{d.rule}</p>
          <div className="gauge">{DEPTHS.map((x) => <i key={x.lv} className={x.lv <= depth ? 'on' : ''} />)}</div>
          <button className="btn solid icon-btn" onClick={onNext}>이 심도로 하강 <Icon name="descend" size={16} /></button>
        </aside>
      </div>
    </div>
  );
}

// ─── 출격 준비 2: 전술 분대 ────────────────────────────
export function SquadSelect({ depth, onBack, onLaunch }: { depth: number; onBack: () => void; onLaunch: (squad: string) => void }) {
  const [squad, setSquad] = useState<string | null>(null);
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 심도 선택</button>
        <div><div className="kicker">PRE-LAUNCH · STEP 2 / 2 · DEPTH {depthLabel(depth)} {depthDef(depth).name}</div><h2>전술 분대 선택</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>분대를 누르면 상세 정보가 펼쳐집니다</span>
      </div>
      <div className="wrap">
        <div className="squad-row">
          {SQUADS.map((s) => {
            const open = squad === s.id;
            return (
              <div key={s.id} className={`sq ${open ? 'open' : ''} ${squad && !open ? 'dim' : ''}`}>
                <button className="sq-face" onClick={() => setSquad(open ? null : s.id)}>
                  <span className="code">{s.code}</span>
                  <div className="sq-pt"><Portrait kind={s.id} size={150} /></div>
                  <h4>{s.name}</h4>
                  <p><Rich text={s.perks.join(', ')} /></p>
                  <span className="sq-more">{open ? '접기' : '상세 보기'} <Icon name="back" size={12} style={{ transform: open ? 'none' : 'rotate(180deg)' }} /></span>
                </button>
                <div className="sq-detail" aria-hidden={!open}>
                  <div className="sq-in">
                    <span className="tag"><Icon name={SQUAD_ICON[s.id]} size={14} /> {s.tag}</span>
                    <p className="desc"><Rich text={s.desc} /></p>
                    <div className="sq-stats">
                      <span><Icon name="heart" size={14} /> 체력 <b>{s.maxHp}</b></span>
                      <span><Icon name="kakpul" size={14} /> 각뿔 <b>{s.kakpul}</b></span>
                      <span><Icon name="erosion" size={14} /> 침식 <b>{s.erosion}%</b></span>
                    </div>
                    <div className="sq-sec">고유 카드</div>
                    <div className="sq-cards">{s.cards.map((c) => <CardView key={c} id={c} mini />)}</div>
                    <div className="sq-sec">시작 소장품</div>
                    <div className="sq-relic"><Icon name="relic" size={18} /><div><b>{RELICS[s.relic].name}</b><div className="mute"><Rich text={RELICS[s.relic].text} /></div></div></div>
                    <button className="btn solid icon-btn" tabIndex={open ? 0 : -1} onClick={() => onLaunch(s.id)}><Icon name="launch" size={16} /> 이 분대로 출격</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 노드 맵 ───────────────────────────────────────────
const NODE_INFO: Record<string, [string, string]> = {
  combat: ['전투 작전', '복제체와 교전'],
  elite: ['긴급 작전', '긴급: 정예 팬텀 습격'],
  event: ['우연한 만남', '거울 섹터 분기'],
  rest: ['정비 구역', '자아 정비'],
  shop: ['암시장', '각뿔 거래소'],
  boss: ['구역 보스', '거울 파수꾼 · 아크'],
};
function nodeTitle(n: MapNode) {
  if (n.type === 'combat' && n.encounter) return n.encounter.map((id) => ENEMIES[id].name).join(' + ');
  return NODE_INFO[n.type][1];
}
function nodeDesc(n: MapNode) {
  switch (n.type) {
    case 'combat': return '일반 전투 · 카드 보상 · 모사한 적의 기술 흡수 가능';
    case 'elite': return '긴급 교전 · 반향하는 정예 출현 · 확정 소장품';
    case 'event': return '거울 섹터의 분기 사건 · 선택에 따라 침식이 오르내림';
    case 'rest': return '체력 회복 또는 침식 감소';
    case 'shop': return '카드 구매 · 카드 소거 · 침식 정화 · 거울 모사 충전';
    case 'boss': return '당신의 런 기록을 스캔해 당신으로 싸우는 보스';
  }
  return '';
}

export function MapView({ run, onEnter, onDeck, onRelics }: { run: RunState; onEnter: (id: string) => void; onDeck: () => void; onRelics: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [scan, setScan] = useState(true);
  const reach = reachable(run);
  const choose = (id: string) => {
    if (reach.length < 2) return onEnter(id);
    setPicked(picked === id ? null : id);
  };
  const pk = picked ? nodeById(run, picked) : null;
  useEffect(() => {
    if (!picked) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); setPicked(null); }
      else if (e.key === 'Enter') onEnter(picked);
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [picked, onEnter]);
  const cur = currentStage(run);
  useEffect(() => {
    const t = setTimeout(() => setScan(false), 3300);
    return () => clearTimeout(t);
  }, [run.pos]);

  const X = (stage: number) => 8 + stage * 16.8;
  const Y = (y: number) => 12 + y * 82;
  const hidden = (n: MapNode) => !run.revealAll && n.stage > cur + 1 && n.type !== 'boss';
  const all = run.map.flat();
  const focus = sel ? nodeById(run, sel) : reach.length ? nodeById(run, reach[0]) : null;
  const curNode = run.pos ? nodeById(run, run.pos) : null;

  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="map-wrap">
        <div className="map-head">
          <div>
            <div className="k">SECTOR 01 · 제1구역 · DEPTH {depthLabel(run.depth)} {depthDef(run.depth).name}</div>
            <h2>침묵 회랑 — 다음 통로 선택</h2>
          </div>
          {run.revealAll && <div className="k">안테나 신호: 전 구역 개방</div>}
        </div>
        <div className="map-scroll" onClick={() => setPicked(null)}>
          <div className="map">
            {Array.from({ length: STAGES }, (_, i) => (
              <div key={i} className={`colhead ${i === cur + 1 ? 'next' : ''}`} style={{ left: `${X(i)}%` }}>
                {i === STAGES - 1 ? 'BOSS' : i === cur + 1 ? `NEXT · ${String(i + 1).padStart(2, '0')}` : `STAGE ${String(i + 1).padStart(2, '0')}`}
              </div>
            ))}
            <svg className="links" viewBox="0 0 100 100" preserveAspectRatio="none">
              {all.flatMap((n) =>
                n.next.map((m) => {
                  const t = nodeById(run, m);
                  const live = n.id === run.pos && reach.includes(m);
                  const done = run.visited.includes(n.id) && run.visited.includes(m);
                  const x1 = X(n.stage), y1 = Y(n.y), x2 = X(t.stage), y2 = Y(t.y);
                  const mx = (x1 + x2) / 2;
                  return <path key={n.id + m} className={live ? 'live' : done ? 'done' : ''} vectorEffect="non-scaling-stroke" d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} />;
                }),
              )}
            </svg>
            {curNode && (
              <div className="radar" style={{ left: `${X(curNode.stage)}%`, top: `${Y(curNode.y)}%` }}>
                {scan && <div className="sweep" />}
                {scan && run.pos && <><span className="wave" /><span className="wave w2" /></>}
                <i /><i /><i />
              </div>
            )}
            {all.map((n) => {
              const isHidden = hidden(n);
              const isReach = reach.includes(n.id);
              const isCur = n.id === run.pos;
              const past = run.visited.includes(n.id) && !isCur;
              const justRevealed = n.stage === cur + 1 && !isHidden;
              const wake = scan && isReach && !!curNode;
              const wd = curNode ? 0.85 + Math.hypot((X(n.stage) - X(curNode.stage)) * 1.6, Y(n.y) - Y(curNode.y)) * 0.016 : 0;
              return (
                <div
                  key={n.id}
                  className={`node ${isHidden ? '' : n.type} ${isHidden ? 'hidden' : ''} ${isReach ? 'reach' : ''} ${picked === n.id ? 'picked' : ''} ${isCur ? 'cur' : ''} ${past ? 'past' : ''} ${wake ? 'wake' : justRevealed && scan ? 'reveal' : ''}`}
                  style={{ left: `${X(n.stage)}%`, top: `${Y(n.y)}%`, animationDelay: !wake && justRevealed && scan ? `${0.5 + n.idx * 0.25}s` : undefined, ['--wd' as string]: `${wd}s` }}
                  onClick={(ev) => { ev.stopPropagation(); if (isReach) choose(n.id); }}
                  onMouseEnter={() => !isHidden && setSel(n.id)}
                >
                  {isHidden ? (
                    <><div className="ty"><span>미확인 구역</span><Icon name="unknown" size={15} /></div><b>[ ? 신호 미감지 ]</b></>
                  ) : (
                    <>
                      <div className="ty"><span>{NODE_INFO[n.type][0]}</span><Icon name={n.type} size={15} /></div>
                      <b>{nodeTitle(n)}</b>
                      <div className="go">{isCur ? '현재 위치' : picked === n.id ? '선택됨' : isReach ? (reach.length > 1 ? '눌러서 검토' : '진입 가능 →') : past ? '돌파' : ''}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {pk && (
        <aside className="route-panel" key={pk.id}>
          <div className="rp-head">
            <div className="mono mute" style={{ fontSize: 11, letterSpacing: '.14em' }}>ROUTE · {pk.type === 'boss' ? 'BOSS' : `STAGE ${String(pk.stage + 1).padStart(2, '0')}`} · 후보 {reach.indexOf(pk.id) + 1}/{reach.length}</div>
            <button className="btn ghost" onClick={() => setPicked(null)}>닫기</button>
          </div>
          <div className="rp-ico"><Icon name={pk.type} size={40} stroke={1.3} /></div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--mute)' }}>{NODE_INFO[pk.type][0]}</div>
          <h3>{nodeTitle(pk)}</h3>
          <p className="mute">{nodeDesc(pk)}</p>
          {pk.encounter && (
            <div className="rp-foes">
              {pk.encounter.map((id, i) => (
                <div key={id + i}><Portrait kind={id} squad={run.squad} size={56} /><div><b>{ENEMIES[id].name}</b><small>체력 약 {Math.round(ENEMIES[id].hp[0] * depthDef(run.depth).mult)}</small></div></div>
              ))}
            </div>
          )}
          <div className="rp-next mono mute">이후 연결 {pk.next.length}갈래 · 다른 후보는 이번 구역에서 닫힙니다</div>
          <button className="btn solid icon-btn rp-go" onClick={() => onEnter(pk.id)}>루트 확정 <Icon name="descend" size={16} /></button>
        </aside>
      )}
      <div className="mapfoot">
        {focus && (
          <>
            <div className="ico"><Icon name={focus.type} size={22} /></div>
            <div>
              <div className="mono mute" style={{ fontSize: 11 }}>{NODE_INFO[focus.type][0]} · {focus.type === 'boss' ? 'BOSS' : `STAGE ${String(focus.stage + 1).padStart(2, '0')}`}</div>
              <b>{nodeTitle(focus)}</b>
              <div className="mute" style={{ fontSize: 12 }}>{nodeDesc(focus)}</div>
            </div>
          </>
        )}
        <span className="spacer" />
        <button className="deck-fan" onClick={onDeck} title="덱 보기">
          {run.deck.slice(0, 5).map((c, i, a) => <i key={c.uid} style={{ ['--r' as string]: `${(i - (a.length - 1) / 2) * 9}deg`, ['--x' as string]: `${(i - (a.length - 1) / 2) * 12}px` }} />)}
          <span>덱 <b>{run.deck.length}</b></span>
        </button>
        <button className="relic-btn" onClick={onRelics} title="소장품 격자">
          <span className="rb-grid">{Array.from({ length: 9 }, (_, i) => <i key={i} className={occupied(run.relicGrid ?? {}).has(`${Math.floor(i / 3)},${i % 3}`) ? 'on' : ''} />)}</span>
          <span>소장품 <b>{activeRelics(run).length}/{run.relics.length}</b></span>
        </button>
        <span className="spacer" />
      </div>
    </div>
  );
}

// ─── 보상 ──────────────────────────────────────────────
export function RewardView({ run, reward, meta, onDone }: { run: RunState; reward: Reward; meta: string[]; onDone: (card: string | null, absorbId: string | null) => void }) {
  const [card, setCard] = useState<string | null>(null);
  const [abs, setAbs] = useState<string | null>(null);
  const after = Math.min(100, run.erosion + erosionGain(8, run.depth));
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <div className="big-title clear-rise">CLEAR</div>
        <div className="rw-body">
        <div className="mono mute">{reward.boss ? '보스 격파 · 마지막 카드 1장을 고르면 작전 결과로 넘어갑니다' : <>구역 확보 · 각뿔 +{reward.kakpul}{reward.relic ? ` · 소장품 [${RELICS[reward.relic].name}] 획득` : ''}</>}</div>

        {reward.absorbOptions.length > 0 && (
          <div className="panel" style={{ marginTop: 18 }}>
            <div className="k">ABSORB · 남은 거울 모사 {run.mirrorCharges}회</div>
            <h3>흡수</h3>
            <div className="mute" style={{ fontSize: 12 }}>흡수하면 침식 {run.erosion}% → {after}% ({TIER_NAMES[tierOf(after, meta)]}). 흡수 카드는 아크가 당신을 스캔할 때도 쓰입니다.</div>
            <div className="choices">
              {reward.absorbOptions.map((id) => (
                <div key={id} className={`choice ${abs === id ? 'picked' : abs ? 'faded' : ''}`}>
                  <CardView id={id} onClick={() => setAbs(abs === id ? null : id)} />
                  <small>{ENEMIES[CARDS[id].source!].name}의 기술</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 14 }}>
          <div className="k">REWARD</div>
          <h3>카드 1장 선택</h3>
          <div className="choices">
            {reward.cards.map((id) => (
              <div key={id} className={`choice ${card === id ? 'picked' : card ? 'faded' : ''}`}>
                <CardView id={id} onClick={() => setCard(card === id ? null : id)} />
              </div>
            ))}
          </div>
        </div>

        {reward.relic && (
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="k">RELIC</div>
            <div className="relic"><div className="ico"><span><Icon name="relic" size={20} /></span></div><div><b>{RELICS[reward.relic].name}</b><div className="mute"><Rich text={RELICS[reward.relic].text} /></div></div></div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button className="btn solid" onClick={() => onDone(card, abs)}>{reward.boss ? (card ? '확정하고 작전 완료 →' : '건너뛰고 작전 완료 →') : card || abs ? '확정하고 진행 →' : '건너뛰고 진행 →'}</button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── 우연한 만남 ───────────────────────────────────────
export function EventView({ eventId, run, onChoose, result, onContinue, needRemove, onRemove }: {
  eventId: string; run: RunState; onChoose: (i: number) => void; result: string | null; onContinue: () => void; needRemove: boolean; onRemove: (uid: number) => void;
}) {
  const ev = EVENT_MAP[eventId];
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <Emblem size={120} erosion={run.erosion} />
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="k">CHANCE ENCOUNTER · 거울 섹터 분기</div>
          <h3 style={{ fontSize: 22 }}>{ev.name}</h3>
          <p className="storytext"><Rich text={result ?? ev.text} /></p>
          {!result ? (
            <div className="ev-opts">
              {ev.options.map((o, i) => (
                <button className="ev-opt" key={o.label} onClick={() => onChoose(i)}><b>{o.label}</b><small><Rich text={o.desc} /></small></button>
              ))}
            </div>
          ) : (
            !needRemove && <div style={{ marginTop: 18 }}><button className="btn solid" onClick={onContinue}>계속 →</button></div>
          )}
        </div>
      </div>
      {needRemove && <DeckModal cards={run.deck} title="두고 갈 카드 선택" onClose={onContinue} onPick={(c) => onRemove(c.uid)} />}
    </div>
  );
}

// ─── 정비 구역 ─────────────────────────────────────────
export function RestView({ run, onRest }: { run: RunState; onRest: (opt: 'heal' | 'compose') => void }) {
  const heal = Math.round(run.maxHp * 0.3);
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <Emblem size={140} erosion={run.erosion} />
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="k">MAINTENANCE</div>
          <h3 style={{ fontSize: 22 }}>정비 구역</h3>
          <div className="ev-opts">
            <button className="ev-opt with-ic" onClick={() => onRest('heal')}><Icon name="heart" size={26} /><b>휴식</b><small>체력 {heal} 회복 ({run.hp} → {Math.min(run.maxHp, run.hp + heal)})</small></button>
            <button className="ev-opt with-ic" onClick={() => onRest('compose')}><Icon name="erosion" size={26} /><b>자아 정비</b><small>침식 −15% ({run.erosion}% → {Math.max(0, run.erosion - 15)}%)</small></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 암시장 ────────────────────────────────────────────
export function ShopView({ run, meta, stock, onBuy, onService, onLeave }: {
  run: RunState; meta: string[]; stock: { id: string; price: number; sold?: boolean }[]; onBuy: (i: number) => void;
  onService: (k: 'remove' | 'purge' | 'charge', uid?: number) => void; onLeave: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const P = (b: number) => priceOf(b, meta);
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <div className="panel">
          <div className="k">BLACK MARKET · 보유 각뿔 {run.kakpul}</div>
          <h3 style={{ fontSize: 22 }}>암시장 — 각뿔 거래소</h3>
          <div className="choices">
            {stock.map((s, i) => (
              <div key={i} className={`choice ${s.sold ? 'faded' : ''}`}>
                <CardView id={s.id} disabled={s.sold || run.kakpul < P(s.price)} onClick={() => onBuy(i)} />
                <small>{s.sold ? '판매 완료' : `각뿔 ${P(s.price)}`}</small>
              </div>
            ))}
          </div>
          <div className="ev-opts">
            <button className="ev-opt with-ic" disabled={run.kakpul < P(50) || run.deck.length <= 5} onClick={() => setRemoving(true)}><Icon name="deck" size={26} /><b>카드 소거 · 각뿔 {P(50)}</b><small>덱에서 카드 1장 제거</small></button>
            <button className="ev-opt with-ic" disabled={run.kakpul < P(45) || run.erosion <= 0} onClick={() => onService('purge')}><Icon name="erosion" size={26} /><b>침식 정화 · 각뿔 {P(45)}</b><small>침식 −10%</small></button>
            <button className="ev-opt with-ic" disabled={run.kakpul < P(60)} onClick={() => onService('charge')}><Icon name="mirror" size={26} /><b>거울 모사 충전 · 각뿔 {P(60)}</b><small>흡수 가능 횟수 +1</small></button>
          </div>
          <div style={{ marginTop: 18 }}><button className="btn solid" onClick={onLeave}>떠난다 →</button></div>
        </div>
      </div>
      {removing && <DeckModal cards={run.deck} title="소거할 카드 선택" onClose={() => setRemoving(false)} onPick={(c: CardInst) => { onService('remove', c.uid); setRemoving(false); }} />}
    </div>
  );
}

// ─── 결과 ──────────────────────────────────────────────
export function ResultView({ outcome, run, settle, archived, newCodex, onHub }: { outcome: 'win' | 'lose' | 'eroded' | 'abort'; run: RunState; settle: Settlement; archived: boolean; newCodex: number; onHub: () => void }) {
  const title = { win: 'SECTOR CLEARED', eroded: 'REPLACED', lose: 'SIGNAL LOST', abort: 'MISSION ABORTED' }[outcome];
  const sub = {
    win: '구역 정화 완료. 거울 속의 당신을 넘어섰습니다.',
    eroded: '침식 100%. 당신은 원형이 되었습니다.',
    lose: '신호 소실. 본체의 기록이 회수됩니다.',
    abort: '출격을 취소했습니다. 이번 작전의 보상은 없지만 기록은 남습니다.',
  }[outcome];
  const st = run.stats;
  const top = useMemo(() => Object.entries(st.playCounts).sort((a, b) => b[1] - a[1]).slice(0, 3), [st]);
  const plays = Object.values(st.playCounts).reduce((a, n) => a + n, 0);
  const sq = SQUADS.find((x) => x.id === run.squad);
  const cells: [string, string, string][] = [
    ['descend', '돌파 구역', `${st.nodesCleared} / ${STAGES}`],
    ['combat', '전투 · 정예', `${st.combats} · ${st.elites}`],
    ['recall', '진행 턴', `${st.turns ?? 0}`],
    ['deck', '사용 카드', `${plays}장`],
    ['sword', '가한 피해', `${st.dealt ?? 0}`],
    ['heart', '받은 피해', `${st.taken ?? 0}`],
    ['mirror', '모사 · 흡수', `${st.mimics ?? 0} · ${st.absorbed.length}`],
    ['erosion', '최고 침식', `${st.peakErosion ?? run.erosion}%`],
    ['kakpul', '획득 각뿔', `${st.kakpulEarned ?? 0}`],
    ['relic', '덱 · 소장품', `${run.deck.length} · ${run.relics.length}`],
  ];
  return (
    <div className="screen">
      <div className="center-wrap" style={{ justifyContent: 'center' }}>
        <Emblem size={150} erosion={outcome === 'eroded' ? 100 : run.erosion} />
        <div className={`big-title ${outcome !== 'win' ? 'out' : ''} ${outcome === 'abort' ? 'abort' : ''}`}>{title}</div>
        <div className="mute">{sub}</div>
        <div className="mono mute" style={{ fontSize: 11, letterSpacing: '.14em', marginTop: 4 }}>{sq?.name ?? run.squad} · DEPTH {depthLabel(run.depth)} {depthDef(run.depth).name} · 최종 체력 {run.hp}/{run.maxHp}</div>
        <div className="runstats">
          {cells.map(([ic, k, v], i) => (
            <div key={k} style={{ animationDelay: `${0.15 + i * 0.05}s` }}><Icon name={ic} size={16} /><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
        <div className="settle">
          {settle.lines.map(([k, v]) => <div key={k}><span>{k}</span><span>{v ? `+${v}` : ''}</span></div>)}
          <div className="tot"><span>획득 기억 파편</span><span>+{settle.total}</span></div>
        </div>
        <div className="mono mute" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.8 }}>
          가장 많이 쓴 카드: {top.map(([id, n]) => `${CARDS[id]?.name} ×${n}`).join(' · ') || '—'}<br />
          도감 신규 기록 {newCodex}건
          {archived && <><br />이 런의 덱이 원형 기록에 저장되었습니다. 다음 작전의 아크가 당신을 재현할 수 있습니다.</>}
        </div>
        <div style={{ marginTop: 20 }}><button className="btn solid" onClick={onHub}>허브로 →</button></div>
      </div>
    </div>
  );
}
