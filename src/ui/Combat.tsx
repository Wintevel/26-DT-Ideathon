import { useEffect, useRef, useState } from 'react';
import { CARDS, depthDef, depthLabel, ENEMIES } from '../game/data';
import {
  canMimic, canPlay, cardCost, cardErosionPreview, defOf, displayIntent, endTurn, enemyHitValue, mimic, mimicCost,
  mimicPreview, needsTarget, playCard, summarize, tierBounds, tierOf, TIER_NAMES,
} from '../game/engine';
import type { CombatState, EnemyInst, FxEvent, Intent } from '../game/types';
import { CardView } from './common';
import { Icon } from './Icons';
import { Portrait } from './Portraits';
import { Emblem } from './Emblem';
import { Rich } from './Rich';
import { flash, fly, floatText, guard, lunge, pulse, shake, slash, sleep, statusFx } from './fx';

function playFx(events: FxEvent[], s: CombatState) {
  let blockStack = 0;
  for (const e of events) {
    switch (e.k) {
      case 'dmg':
        if (e.amt > 0) {
          slash(e.to, e.amt >= 10, e.to === 'player');
          floatText(e.to, `-${e.amt}`, `dmgnum ${e.to === 'player' ? 'red' : ''} ${e.amt >= 10 ? 'big' : ''}`);
          shake(e.to, e.amt >= 10);
          if (e.to === 'player') flash('hurt');
          else if (e.amt >= 10) flash('hit');
        }
        if (e.blocked > 0) floatText(e.to, `차폐 −${e.blocked}`, 'small blk', 26);
        break;
      case 'block':
        if (!blockStack) guard(e.to);
        floatText(e.to, `+${e.amt} 차폐`, 'small blk', -20 - blockStack * 22);
        blockStack++;
        break;
      case 'erosion':
        floatText('erosion', `침식 ${e.amt > 0 ? '+' : ''}${e.amt}%`, 'small ero');
        pulse('emblem');
        break;
      case 'mimic': {
        const c = s.hand.find((h) => h.uid === e.cardUid);
        fly(e.from, 'hand', c ? defOf(c).name : '모사', true);
        break;
      }
      case 'echo':
        fly('player', e.from, `반향: ${CARDS[e.cardId]?.name ?? '모사'}`, false);
        break;
      case 'clone':
        pulse(e.to);
        floatText(e.to, `각인: ${CARDS[e.cardId]?.name ?? '모사'}`, 'small');
        break;
      case 'seal':
        {
          const b = s.enemies.find((x) => x.defId === 'ark');
          fly('hand', b ? `e${b.uid}` : 'player', `봉인: ${CARDS[e.cardId]?.name}`, false);
        }
        break;
      case 'text':
        floatText(e.to, e.msg, 'small', -30);
        break;
      case 'status':
        statusFx(e.to, e.good);
        floatText(e.to, e.msg, `small ${e.good ? 'up' : 'down'}`, -30);
        break;
      case 'summon':
        floatText(`e${e.uid}`, '분열', 'small');
        break;
    }
  }
}

const INTENT_ICON: Record<string, string> = { attack: 'sword', defend: 'shield', buff: 'buff', debuff: 'debuff', echo: 'echo', summon: 'summon', seal: 'seal' };
function IntentBits({ s, e, it }: { s: CombatState; e: EnemyInst; it: Intent }) {
  const bits: JSX.Element[] = [];
  if (it.dmg) {
    const v = enemyHitValue(s, e, it.dmg);
    bits.push(<span key="d" className="bit"><Icon name="sword" size={13} />{v}{(it.hits ?? 1) > 1 ? `×${it.hits}` : ''}</span>);
  }
  if (it.block) bits.push(<span key="b" className="bit"><Icon name="shield" size={13} />{it.block}</span>);
  if (it.str) bits.push(<span key="s" className="bit"><Icon name="buff" size={13} />{it.str}</span>);
  if (it.weak) bits.push(<span key="w" className="bit"><Icon name="debuff" size={13} />약화 {it.weak}</span>);
  if (it.vuln) bits.push(<span key="v" className="bit"><Icon name="debuff" size={13} />취약 {it.vuln}</span>);
  if (it.kind === 'summon') bits.push(<span key="m" className="bit"><Icon name="summon" size={13} />분열</span>);
  if (it.kind === 'seal' && !it.dmg) bits.push(<span key="l" className="bit"><Icon name="seal" size={13} />봉인</span>);
  return <>{bits}</>;
}

export interface CombatHud { kakpul: number; mirrorCharges: number; deckSize: number; relicsOn: number; relics: number; where: string }

/** 플레이 튜토리얼 단계: 상태가 조건을 만족하면 다음으로 넘어간다 */
const TUT: { id: string; title: string; text: string; cursor: string[]; done?: (s: CombatState, s0: CombatState) => boolean }[] = [
  { id: 'intent', title: '적의 의도', text: '적 머리 위의 표시는 적이 이번 턴에 할 행동입니다. 칼 아이콘은 공격, 숫자는 피해량이에요.', cursor: ['[data-tut="intent"]'] },
  { id: 'card', title: '카드 내기', text: '패에서 카드를 하나 내 보세요. 공격 카드는 누른 다음 적을 누르면 됩니다. 카드 왼쪽 위 숫자는 쓰는 행동 횟수예요.', cursor: ['.hand .card:not(:disabled)', '.enemy:not(.dead)'], done: (s, s0) => s.player.energy < s0.player.energy || s.discard.length > s0.discard.length },
  { id: 'mimic', title: '모사', text: '모사 버튼을 누르고 적을 골라 보세요. 적의 의도가 내 패로 복제되고, 그 적의 이번 행동은 25% 약해집니다.', cursor: ['[data-tut="mimic"]', '.enemy:not(.dead)'], done: (s) => s.mimicUsed },
  { id: 'erosion', title: '침식', text: '모사하면 화면 아래 보라색 침식 바가 올라갑니다. 베낄수록 강해지지만 100%가 되면 패배해요.', cursor: ['.erobar'] },
  { id: 'end', title: '턴 종료', text: '복제한 카드도 내 보세요. 낼 수 있는 카드를 모두 쓰면 턴 종료 버튼이 노랗게 켜져요. 그때 누르면 됩니다. 적 단계가 끝나면 다시 내 차례예요.', cursor: ['.hand .card:not(:disabled)', '.endbtn'], done: (s) => s.turn >= 2 },
  { id: 'free', title: '마무리', text: '이제 직접 해 보세요. 적을 쓰러뜨리면 튜토리얼이 끝납니다.', cursor: [] },
];

/** 튜토리얼에서 따라 할 곳을 보여 주는 가짜 마우스 */
function TutCursor({ targets, hidden }: { targets: string[]; hidden: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!targets.length || hidden) return;
    let alive = true;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight - 60 };
    const move = async (x: number, y: number, ms: number) => {
      const c = el.current;
      if (!c) return;
      await c.animate([{ transform: `translate(${pos.x}px, ${pos.y}px)` }, { transform: `translate(${x}px, ${y}px)` }], { duration: ms, easing: 'cubic-bezier(.5,0,.25,1)', fill: 'forwards' }).finished.catch(() => {});
      pos.x = x; pos.y = y;
    };
    const loop = async () => {
      while (alive) {
        const c = el.current;
        if (!c) return;
        pos.x = window.innerWidth / 2; pos.y = window.innerHeight - 40;
        c.style.opacity = '1';
        for (const sel of targets) {
          const t = document.querySelector(sel);
          if (!t || !alive) continue;
          const r = t.getBoundingClientRect();
          await move(r.left + r.width / 2, r.top + Math.min(r.height / 2, 40), 900);
          if (!alive) return;
          c.classList.remove('click'); void c.offsetWidth; c.classList.add('click');
          await sleep(650);
        }
        await sleep(700);
        if (el.current) el.current.style.opacity = '0';
        await sleep(500);
      }
    };
    loop();
    return () => { alive = false; };
  }, [targets, hidden]);
  if (!targets.length || hidden) return null;
  return (
    <div ref={el} className="tut-cursor" aria-hidden>
      <svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2 L3 24 L9 18.5 L13 27 L17 25 L13 16.8 L21 16.5 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      <i />
    </div>
  );
}


export function Combat({ initial, introEvents, onEnd, onTick, onRetreat, hud, onDeck, onRelics, tutorial }: {
  initial: CombatState; introEvents: FxEvent[]; onEnd: (s: CombatState) => void; onTick?: (v: { hp: number; erosion: number }) => void; onRetreat: () => void;
  hud?: CombatHud; onDeck?: () => void; onRelics?: () => void; tutorial?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const [s, setS] = useState(initial);
  const [sel, setSel] = useState<number | null>(null);
  const [mimicMode, setMimicMode] = useState(false);
  const [busy, setBusy] = useState(true);
  const [intro, setIntro] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hoverMimic, setHoverMimic] = useState(false);
  const [actor, setActor] = useState<string | null>(null);
  const ended = useRef(false);
  const [tut, setTut] = useState(tutorial ? 0 : -1);
  const tutBase = useRef(initial);
  const [tutReady, setTutReady] = useState(false);
  const tutStep = tut >= 0 && tut < TUT.length ? TUT[tut] : null;
  useEffect(() => {
    // 행동을 마쳐야 다음 버튼이 켜진다 (이미 지나온 단계는 바로 켜짐)
    if (!tutStep || tutReady) return;
    if (!tutStep.done || tut < tutMax.current || tutStep.done(s, tutBase.current)) setTutReady(true);
  }, [s, tutStep, tutReady]);
  const tutMax = useRef(0);
  const tutGo = (v: number) => { tutBase.current = s; setTutReady(false); tutMax.current = Math.max(tutMax.current, v); setTut(v >= TUT.length ? -1 : Math.max(0, v)); };
  const isBoss = s.kind === 'boss';
  const isElite = s.kind === 'elite' || s.kind === 'midboss';
  const isMid = s.kind === 'midboss';
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.modal.drawer, .modal .box, .deckview')) setPaused((v) => !v); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntro(false);
      setBanner('YOUR TURN');
      setBusy(false);
      playFx(introEvents, s);
    }, isBoss ? 3300 : isElite ? 2200 : 1500);
    const t2 = setTimeout(() => setBanner(null), isBoss ? 4300 : isElite ? 3200 : 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onTick?.({ hp: s.player.hp, erosion: s.erosion });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.player.hp, s.erosion]);

  useEffect(() => {
    if (s.over && !ended.current) {
      ended.current = true;
      setBusy(true);
      setBanner(s.over === 'win' ? 'CLEAR' : s.over === 'eroded' ? 'REPLACED' : 'SIGNAL LOST');
      setTimeout(() => onEnd(s), 1400);
    }
  }, [s, onEnd]);

  const apply = (step: { state: CombatState; events: FxEvent[] }) => {
    setS(step.state);
    requestAnimationFrame(() => playFx(step.events, step.state));
  };

  const clickCard = (uid: number) => {
    if (busy) return;
    setMimicMode(false);
    const c = s.hand.find((h) => h.uid === uid)!;
    if (!canPlay(s, c)) return;
    if (needsTarget(s, c)) {
      setSel(sel === uid ? null : uid);
      return;
    }
    const tgt = s.enemies.find((e) => e.hp > 0);
    apply(playCard(s, uid, tgt ? tgt.uid : null));
    setSel(null);
  };

  const clickEnemy = (e: EnemyInst) => {
    if (busy || e.hp <= 0) return;
    if (mimicMode) {
      if (!canMimic(s, e)) return;
      apply(mimic(s, e.uid));
      setMimicMode(false);
      return;
    }
    if (sel != null) {
      apply(playCard(s, sel, e.uid));
      setSel(null);
    }
  };

  const doEnd = async () => {
    if (busy) return;
    setBusy(true);
    setSel(null);
    setMimicMode(false);
    const steps = endTurn(s);
    let announced = false;
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      if (st.actor && !announced) {
        announced = true;
        setBanner('ENEMY PHASE');
        await sleep(1100);
        setBanner(null);
      }
      if (st.actor) {
        // 행동하는 적을 표시하고, 앞으로 달려드는 동작 뒤에 결과를 보여 준다
        setActor(st.actor);
        await sleep(380);
        lunge(st.actor);
        await sleep(200);
        apply(st);
        await sleep(st.events.length ? 1050 : 450);
        setActor(null);
        await sleep(160);
      } else {
        apply(st);
        await sleep(st.events.length ? 750 : 280);
      }
      if (st.state.over) return;
    }
    setBanner('YOUR TURN');
    setTimeout(() => setBanner(null), 1100);
    setBusy(false);
  };

  const meta = s.ctx.meta;
  const tier = tierOf(s.erosion, meta);
  const bounds = tierBounds(meta);
  const hoverCard = s.hand.find((h) => h.uid === hover);
  const preview = hoverMimic ? mimicPreview(s) : hoverCard ? cardErosionPreview(s, hoverCard) : 0;
  const anyMimic = s.enemies.some((e) => canMimic(s, e));
  const alive = s.enemies.filter((e) => e.hp > 0);
  const echoEnemy = s.enemies.some((e) => e.hp > 0 && e.intent.kind === 'echo');
  const selCard = s.hand.find((h) => h.uid === sel);
  const turnDone = !busy && !s.over && !s.hand.some((c) => canPlay(s, c));
  const allDone = !busy && !s.over && !anyMimic && !s.hand.some((c) => canPlay(s, c));

  // 침식 구간 바
  const segs = [
    [0, bounds[0]], [bounds[0], bounds[1]], [bounds[1], bounds[2]], [bounds[2], 100],
  ].map(([a, b], i) => {
    const fill = Math.max(0, Math.min(1, (s.erosion - a) / (b - a)));
    const after = s.erosion + preview;
    const pa = Math.max(0, Math.min(1, (Math.min(s.erosion, after) - a) / (b - a)));
    const pb = Math.max(0, Math.min(1, (Math.max(s.erosion, after) - a) / (b - a)));
    return { a, b, i, fill, pa, pb };
  });

  return (
    <div className="combat" data-tutstep={tutStep?.id} data-depth={s.ctx.depth} data-kind={s.kind}>
      <div className="field">
        <div className="depth-tag">DEPTH {depthLabel(s.ctx.depth)} · {depthDef(s.ctx.depth).name}</div>
        <div className="turnno">T{String(s.turn).padStart(2, '0')}</div>
        <div className="chud">
          {hud && <div className="ch-where">{hud.where}</div>}
          <div className="ch-stat hp"><Icon name="heart" size={16} /><span className="ch-bar"><i style={{ width: `${(s.player.hp / s.player.maxHp) * 100}%` }} /></span><b>{s.player.hp}<small>/{s.player.maxHp}</small></b></div>
          <div className="ch-stat ero" data-fx="erosion-top"><Icon name="erosion" size={16} /><span className="ch-bar ero"><i style={{ width: `${s.erosion}%` }} /></span><b>{s.erosion}%</b></div>
          {hud && <div className="ch-stat" title="각뿔"><Icon name="kakpul" size={16} /><b>{hud.kakpul}</b><small>각뿔</small></div>}
          {hud && <div className="ch-stat" title="거울 모사(흡수) 남은 횟수"><Icon name="mirror" size={16} /><b>{hud.mirrorCharges}</b><small>거울 모사</small></div>}
          {hud && onDeck && <button className="ch-btn" onClick={onDeck}><Icon name="deck" size={15} /> 덱 <b>{hud.deckSize}</b></button>}
          {hud && onRelics && <button className="ch-btn" onClick={onRelics}><Icon name="relic" size={15} /> 소장품 <b>{hud.relicsOn}/{hud.relics}</b></button>}
        </div>
        <button className="pausebtn" onClick={() => setPaused(true)} title="일시 정지 (Esc)"><i /><i /></button>
        {paused && (
          <div className="modal map-menu" onClick={() => setPaused(false)}>
            <div className="mm-box" onClick={(e) => e.stopPropagation()}>
              <div className="kicker">PAUSED</div>
              <h2>전투 일시 정지</h2>
              <button className="btn solid icon-btn" onClick={() => setPaused(false)}><Icon name="launch" size={16} /> 계속하기</button>
              <button className="btn icon-btn" onClick={() => { setPaused(false); onRetreat(); }}><Icon name="back" size={16} /> {tutorial ? '튜토리얼 그만두기' : '맵으로 돌아가기'}</button>
              <div className="mono mute" style={{ fontSize: 11 }}>{tutorial ? '튜토리얼을 마치지 않고 허브로 돌아갑니다.' : '맵으로 돌아가면 이 전투는 없던 일이 되고, 전투 전 상태로 노드를 다시 고를 수 있습니다.'}</div>
            </div>
          </div>
        )}
        {echoEnemy && (
          <div className="echoslot">잔향 슬롯<b>{s.lastPlayed ? summarize(s.lastPlayed).name : '— 비어 있음'}</b></div>
        )}
        {isBoss && <div className="archlbl">{s.archLabel ?? '스캔: 이번 런의 당신'} · {s.scanned.map((id) => CARDS[id]?.name).join(' / ')}</div>}

        <div className="side me">
          <div className="clones">
            {[0, 1].map((i) => {
              const c = s.clones[i];
              if (!c) return <div className="clone empty" key={`e${i}`}>분신 슬롯<b>—</b></div>;
              return (
                <div className="clone" key={c.uid} data-fx={`c${c.uid}`}>
                  분신 · 내구 {c.dur}
                  <b>{c.imprint ? `각인: ${defOf(c.imprint).name}` : s.imprintNext ? '각인 대기…' : '각인 없음'}</b>
                </div>
              );
            })}
          </div>
          <div className="unit player" data-fx="player">
            {s.player.block > 0 && <span className="blk">{s.player.block}</span>}
            <div className="figure"><Portrait kind={s.ctx.squad} size={170} bare /><i className="pedestal" /></div>
            <div className="nm">본체</div>
            <div className="sub">상태: {TIER_NAMES[tier]}</div>
            <div className="hp"><i style={{ width: `${(s.player.hp / s.player.maxHp) * 100}%` }} /></div>
            <div className="nums"><span>HP</span><span>{s.player.hp}/{s.player.maxHp}</span></div>
            <div className="buffs">
              {s.player.str > 0 && <span>강화 {s.player.str}</span>}
              {s.player.weak > 0 && <span>약화 {s.player.weak}</span>}
              {s.player.vuln > 0 && <span>취약 {s.player.vuln}</span>}
              {s.player.reflect && <span>반사</span>}
              {s.player.anchor && <span>닻</span>}
            </div>
          </div>
        </div>

        <div className="axis">
          <span className="lbl">MIRROR AXIS</span>
          <div data-fx="emblem" style={{ position: 'relative', zIndex: 1, background: 'var(--bg)', borderRadius: '50%' }}>
            {allDone ? (
              <button className="sunend" onClick={doEnd} title="턴 종료" data-tut="end">
                <SunIcon />
                <span>턴 종료</span>
              </button>
            ) : (
              <Emblem size={120} erosion={s.erosion} />
            )}
          </div>
        </div>

        <div className="side">
          {s.enemies.map((e) => {
            const it = displayIntent(s, e);
            const atk = !!it.dmg;
            const targetable = sel != null && e.hp > 0;
            const mimicable = mimicMode && canMimic(s, e);
            const def = ENEMIES[e.defId];
            return (
              <div
                key={e.uid}
                className={`unit enemy ${def.tier === 'boss' || def.tier === 'midboss' ? 'boss' : ''} ${targetable ? 'target' : ''} ${mimicable ? 'mimicsel' : ''} ${e.hp <= 0 ? 'dead' : ''} ${actor === `e${e.uid}` ? 'acting' : ''}`}
                data-fx={`e${e.uid}`}
                onClick={() => clickEnemy(e)}
              >
                {e.block > 0 && <span className="blk">{e.block}</span>}
                <div data-tut="intent" className={`intent ${atk ? 'atk' : ''} ${e.mimicked ? 'mim' : ''} ${it.kind === 'echo' ? 'echo' : ''} ${intro ? 'hide' : ''}`}>
                  <Icon name={INTENT_ICON[it.kind]} size={15} />
                  <span>{it.label}</span>
                  <span className="v"><IntentBits s={s} e={e} it={it} /></span>
                </div>
                <div className="figure"><Portrait kind={e.defId} squad={s.ctx.squad} size={def.tier === 'boss' || def.tier === 'midboss' ? 210 : def.tier === 'minion' ? 120 : 170} bare /><i className="pedestal" /></div>
                <div className="nm">{e.name}</div>
                <div className="sub">{e.mimicked ? '모사됨 · 위력 감소' : def.tier === 'elite' ? '정예 복제체' : def.tier === 'boss' ? '최종 보스' : def.tier === 'midboss' ? '구역 보스' : '복제체'}</div>
                <div className="hp"><i style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /></div>
                <div className="nums"><span>HP</span><span>{e.hp}/{e.maxHp}</span></div>
                <div className="buffs">
                  {e.str > 0 && <span>강화 {e.str}</span>}
                  {e.weak > 0 && <span>약화 {e.weak}</span>}
                  {e.vuln > 0 && <span>취약 {e.vuln}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {intro && (
          <div className={`scan ${isBoss ? 'boss' : isElite ? 'elite' : ''}`}>
            <div className="line" />
            <div className="msg">
              <b>{isBoss ? 'SCANNING YOU' : isMid ? '⚠ SECTOR BOSS' : isElite ? '⚠ EMERGENCY' : 'SCANNING'}</b>
              {isBoss ? (
                <>
                  {s.archLabel ? `${s.archLabel}을(를) 재현한다` : '아크가 당신의 런 기록을 읽고 있다'}
                  <ul>
                    {s.scanned.map((id, i) => (
                      <li key={id + i} style={{ animationDelay: `${0.4 + i * 0.35}s` }}>▸ 복제 {String(i + 1).padStart(2, '0')} · {CARDS[id]?.name}</li>
                    ))}
                    <li style={{ animationDelay: `${0.4 + s.scanned.length * 0.35}s` }}>▸ 침식 {s.erosion}% → 체력 보정 +{5 * Math.floor(s.erosion / 10)}%</li>
                  </ul>
                </>
              ) : isElite ? (
                isMid ? <>천을 쓴 신호 접근 · 당신과 같은 형태</> : <>긴급 작전 · 정예 복제체 접근 · 전 인원 교전 준비</>
              ) : (
                <>복제체 신호 {alive.length}개 감지 · 의도 해독 중</>
              )}
            </div>
          </div>
        )}
        {banner && <div className="banner" key={banner + s.turn}>{banner}</div>}
        {!busy && sel != null && selCard && <div className="hint">대상을 선택하세요 · {defOf(selCard).name}</div>}
        {!busy && mimicMode && <div className="hint">모사할 복제체를 선택하세요 · 의도가 패로 복제됩니다</div>}
        {tutStep && !intro && <TutCursor key={`cur-${tutStep.id}`} targets={tutStep.cursor} hidden={busy || paused} />}
        {tutStep && !intro && (
          <div className="tut-box" key={tutStep.id}>
            <div className="k">TUTORIAL · {tut + 1} / {TUT.length}</div>
            <b>{tutStep.title}</b>
            <p><Rich text={tutStep.text} /></p>
            <div className="tut-nav">
              <button className="btn ghost" disabled={tut === 0} onClick={() => tutGo(tut - 1)}>← 이전</button>
              {!tutReady && <span className="tut-wait">위 행동을 해 보세요</span>}
              <button className={`btn solid${tutReady && tutStep.done ? ' go' : ''}`} disabled={!tutReady} onClick={() => tutGo(tut + 1)}>{tut + 1 >= TUT.length ? '닫기' : '다음 →'}</button>
            </div>
          </div>
        )}
      </div>

      <div className="dock">
        <div className="energy" data-fx="energy">{s.player.energy}/{s.player.maxEnergy}<small>행동 횟수</small></div>
        <div className="pile"><Icon name="deck" size={14} />{s.draw.length}<small>남은 덱</small></div>
        <div className="hand" data-fx="hand" data-tut="card">
          {s.hand.map((c) => (
            <CardView
              key={c.uid}
              card={c}
              cost={cardCost(s, c)}
              disabled={busy || !canPlay(s, c)}
              selected={sel === c.uid}
              onClick={() => clickCard(c.uid)}
              onHover={(on) => setHover(on ? c.uid : null)}
              eroPreview={cardErosionPreview(s, c)}
            />
          ))}
          {s.sealed && (
            <div style={{ alignSelf: 'center', marginLeft: 16, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--mute)' }}>
              봉인됨: {defOf(s.sealed).name}
            </div>
          )}
        </div>
        <div className="actions">
          <button className={`endbtn${turnDone ? ' ready' : ''}`} disabled={!turnDone} title={turnDone ? '턴 종료' : '낼 수 있는 카드를 모두 쓰면 활성화됩니다'} onClick={doEnd} data-tut="end"><Icon name="launch" size={15} /> 턴 종료</button>
          <button
            data-tut="mimic"
            className={`mimicico ${mimicMode ? 'on' : ''} ${!anyMimic && !busy ? 'spent' : ''}`}
            disabled={busy || !anyMimic}
            onClick={() => { setSel(null); setMimicMode(!mimicMode); }}
            onMouseEnter={() => setHoverMimic(true)}
            onMouseLeave={() => setHoverMimic(false)}
            title="모사"
          >
            <MimicIcon />
            <b>모사 · 행동 횟수 {mimicCost(s)}</b>
            <small>{s.mimicUsed ? '이번 턴 사용함' : `턴당 1회 · 침식 +${mimicPreview(s)}%`}</small>
          </button>
          <div className="pilebar">버림 {s.discard.length} · 소멸 {s.exhaust.length}</div>
        </div>

        <div className="erobar" data-fx="erosion" data-tut="erosion">
          <span>침식 {s.erosion}%</span>
          <div className="track">
            {segs.map((g) => (
              <div key={g.i} className={`seg ${g.i >= 2 ? 'hot' : ''}`} style={{ flex: g.b - g.a }}>
                <i style={{ width: `${g.fill * 100}%` }} />
                {preview !== 0 && g.pb > g.pa && <em className={preview < 0 ? 'down' : ''} style={{ left: `${g.pa * 100}%`, width: `${(g.pb - g.pa) * 100}%` }} />}
              </div>
            ))}
          </div>
          <span className="mute">{TIER_NAMES[tier]}{preview ? ` → ${Math.max(0, Math.min(100, s.erosion + preview))}%` : ''}</span>
        </div>
      </div>
    </div>
  );
}

/** 할 수 있는 행동을 다 했을 때 가운데에 뜨는 턴 종료 태양 */
function SunIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle className="sun-wave" cx="60" cy="60" r="30" fill="none" stroke="var(--turn)" />
      <circle className="sun-wave w2" cx="60" cy="60" r="30" fill="none" stroke="var(--turn)" />
      <g className="sun-rays">
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} transform={`rotate(${i * 22.5} 60 60)`} d={i % 2 ? 'M60 14 V24' : 'M60 6 V24'} stroke="var(--turn)" strokeWidth={i % 2 ? 1.5 : 2.5} strokeLinecap="round" />
        ))}
      </g>
      <circle cx="60" cy="60" r="22" fill="var(--turn)" />
      <path d="M52 50 L68 60 L52 70 Z" fill="var(--bg)" />
    </svg>
  );
}

/** 모사 버튼: 마주 보는 두 반쪽이 맞물리고 바깥 고리가 도는 아이콘 */
function MimicIcon() {
  return (
    <svg className="mimic-svg" width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle className="mi-ring" cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4" />
      <g className="mi-l"><path d="M31 14 C21 16 16 24 16 32 C16 40 21 48 31 50 Z" fill="currentColor" /></g>
      <g className="mi-r"><path d="M33 14 C43 16 48 24 48 32 C48 40 43 48 33 50 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" /></g>
      <path d="M32 8 V56" stroke="var(--turn)" strokeWidth="1" />
      <circle className="mi-dot" cx="32" cy="32" r="2.5" fill="var(--accent)" />
    </svg>
  );
}
