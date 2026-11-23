import { useEffect, useRef, useState } from 'react';
import { CARDS, ENEMIES } from '../game/data';
import {
  canMimic, canPlay, cardCost, cardErosionPreview, defOf, displayIntent, endTurn, enemyHitValue, mimic, mimicCost,
  mimicPreview, needsTarget, playCard, summarize, tierBounds, tierOf, TIER_NAMES,
} from '../game/engine';
import type { CombatState, EnemyInst, FxEvent, Intent } from '../game/types';
import { CardView } from './common';
import { Icon } from './Icons';
import { Portrait } from './Portraits';
import { Emblem } from './Emblem';
import { fly, floatText, pulse, shake, sleep } from './fx';

function playFx(events: FxEvent[], s: CombatState) {
  let blockStack = 0;
  for (const e of events) {
    switch (e.k) {
      case 'dmg':
        if (e.amt > 0) { floatText(e.to, `-${e.amt}`, e.to === 'player' ? 'red' : ''); shake(e.to, e.amt >= 10); }
        else if (e.blocked > 0) floatText(e.to, '차폐', 'small');
        break;
      case 'block':
        floatText(e.to, `+${e.amt} 차폐`, 'small', -20 - blockStack * 18);
        blockStack++;
        break;
      case 'erosion':
        floatText('erosion', `침식 ${e.amt > 0 ? '+' : ''}${e.amt}%`, 'small');
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

export function Combat({ initial, introEvents, onEnd, onTick }: { initial: CombatState; introEvents: FxEvent[]; onEnd: (s: CombatState) => void; onTick?: (v: { hp: number; erosion: number }) => void }) {
  const [s, setS] = useState(initial);
  const [sel, setSel] = useState<number | null>(null);
  const [mimicMode, setMimicMode] = useState(false);
  const [busy, setBusy] = useState(true);
  const [intro, setIntro] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hoverMimic, setHoverMimic] = useState(false);
  const ended = useRef(false);
  const isBoss = s.kind === 'boss';

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntro(false);
      setBanner('YOUR TURN');
      setBusy(false);
      playFx(introEvents, s);
    }, isBoss ? 3300 : 1500);
    const t2 = setTimeout(() => setBanner(null), isBoss ? 4300 : 2500);
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
    for (let i = 0; i < steps.length; i++) {
      apply(steps[i]);
      if (i === 1) setBanner('ENEMY PHASE');
      await sleep(steps[i].events.length ? 620 : 260);
      if (steps[i].state.over) return;
    }
    setBanner('YOUR TURN');
    setTimeout(() => setBanner(null), 1000);
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
    <div className="combat">
      <div className="field">
        <div className="turnno">T{String(s.turn).padStart(2, '0')}</div>
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
            <div className="pt-frame"><Portrait kind={s.ctx.squad} size={92} /></div>
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
            <Emblem size={120} erosion={s.erosion} />
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
                className={`unit enemy ${def.tier === 'boss' ? 'boss' : ''} ${targetable ? 'target' : ''} ${mimicable ? 'mimicsel' : ''} ${e.hp <= 0 ? 'dead' : ''}`}
                data-fx={`e${e.uid}`}
                onClick={() => clickEnemy(e)}
              >
                {e.block > 0 && <span className="blk">{e.block}</span>}
                <div className={`intent ${atk ? 'atk' : ''} ${e.mimicked ? 'mim' : ''} ${it.kind === 'echo' ? 'echo' : ''} ${intro ? 'hide' : ''}`}>
                  <Icon name={INTENT_ICON[it.kind]} size={15} />
                  <span>{it.label}</span>
                  <span className="v"><IntentBits s={s} e={e} it={it} /></span>
                </div>
                <div className="pt-frame"><Portrait kind={e.defId} squad={s.ctx.squad} size={92} /></div>
                <div className="nm">{e.name}</div>
                <div className="sub">{e.mimicked ? '모사됨 · 위력 감소' : def.tier === 'elite' ? '정예 복제체' : def.tier === 'boss' ? '구역 보스' : '복제체'}</div>
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
          <div className={`scan ${isBoss ? 'boss' : ''}`}>
            <div className="line" />
            <div className="msg">
              <b>{isBoss ? 'SCANNING YOU' : 'SCANNING'}</b>
              {isBoss ? (
                <>
                  {s.archLabel ? `${s.archLabel}을(를) 재현합니다` : '아크가 당신의 런 기록을 읽고 있습니다'}
                  <ul>
                    {s.scanned.map((id, i) => (
                      <li key={id + i} style={{ animationDelay: `${0.4 + i * 0.35}s` }}>▸ 복제 {String(i + 1).padStart(2, '0')} · {CARDS[id]?.name}</li>
                    ))}
                    <li style={{ animationDelay: `${0.4 + s.scanned.length * 0.35}s` }}>▸ 침식 {s.erosion}% → 체력 보정 +{5 * Math.floor(s.erosion / 10)}%</li>
                  </ul>
                </>
              ) : (
                <>복제체 신호 {alive.length}개 감지 · 의도 해독 중</>
              )}
            </div>
          </div>
        )}
        {banner && <div className="banner" key={banner + s.turn}>{banner}</div>}
        {!busy && sel != null && selCard && <div className="hint">대상을 선택하세요 · {defOf(selCard).name}</div>}
        {!busy && mimicMode && <div className="hint">모사할 복제체를 선택하세요 · 의도가 손패로 복제됩니다</div>}
      </div>

      <div className="dock">
        <div className="energy" data-fx="energy">{s.player.energy}/{s.player.maxEnergy}<small>연산</small></div>
        <div className="pile">{s.draw.length}<small>뽑을 더미</small></div>
        <div className="hand" data-fx="hand">
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
          <button
            className={`mimicbtn ${mimicMode ? 'on' : ''}`}
            disabled={busy || !anyMimic}
            onClick={() => { setSel(null); setMimicMode(!mimicMode); }}
            onMouseEnter={() => setHoverMimic(true)}
            onMouseLeave={() => setHoverMimic(false)}
          >
            ◐ 모사 · 연산 {mimicCost(s)}
            <small>{s.mimicUsed ? '이번 턴 사용함' : `턴당 1회 · 침식 +${mimicPreview(s)}%`}</small>
          </button>
          <div className="pile" style={{ width: '100%', height: 34, fontSize: 12 }}>버림 {s.discard.length} · 소멸 {s.exhaust.length}</div>
        </div>
        <button className="endbtn" disabled={busy} onClick={doEnd}>턴 종료</button>

        <div className="erobar" data-fx="erosion">
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
