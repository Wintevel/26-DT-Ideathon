import { autoPlace } from '../game/relicGrid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ENEMIES } from '../game/data';
import { startCombat } from '../game/engine';
import { clearSave, emptySave, loadSave, record, refundAll, writeSave } from '../game/meta';
import {
  absorb, addCard, applyCombatResult, makeReward, newRun, nodeById, priceOf, removeCard, resolveEvent, settle, shopStock, topPlayed,
  type Reward, type Settlement,
} from '../game/run';
import type { CombatState, FxEvent, MetaSave, RunState } from '../game/types';
import { META } from '../game/data';
import { Combat } from './Combat';
import { DeckModal, TopBar } from './common';
import { CodexView, TreeView } from './MetaScreens';
import { GuideView } from './Guide';
import { CursorPing, GridDrop, KeywordTip, MapMenu } from './Overlays';
import { RelicDrawer } from './RelicGrid';
import { clearRun, loadRun, saveRun } from './runSave';
import { DepthSelect, EventView, Hub, MapView, RestView, ResultView, RewardView, ShopView, SquadSelect } from './screens';
import { getLastPoint, PixelWipe } from './PixelWipe';

export type Outcome = 'win' | 'lose' | 'eroded' | 'abort';
type Screen = 'hub' | 'depth' | 'squad' | 'map' | 'combat' | 'reward' | 'event' | 'rest' | 'shop' | 'result' | 'tree' | 'codex' | 'guide';

export function App() {
  const [meta, setMetaRaw] = useState<MetaSave>(() => loadSave());
  const [screen, setScreen] = useState<Screen>('hub');
  const [run, setRun] = useState<RunState | null>(null);
  const [combat, setCombat] = useState<{ s: CombatState; ev: FxEvent[]; key: number } | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [evState, setEvState] = useState<{ id: string; result: string | null; needRemove: boolean } | null>(null);
  const [stock, setStock] = useState<{ id: string; price: number; sold?: boolean }[]>([]);
  const [result, setResult] = useState<{ outcome: Outcome; settle: Settlement; archived: boolean; newCodex: number; run: RunState } | null>(null);
  const [modal, setModal] = useState<'deck' | 'relic' | null>(null);
  const [codexNew, setCodexNew] = useState(0);
  const [live, setLive] = useState<{ hp: number; erosion: number } | null>(null);
  const [depth, setDepth] = useState(0);
  const [wipe, setWipe] = useState<{ fn: () => void; key: number; origin: { x: number; y: number } } | null>(null);
  const [burst, setBurst] = useState(false);
  const wiping = useRef(false);
  const preRun = useRef<RunState | null>(null);
  /** 화면을 바꾸는 동작은 사각 전환이 화면을 다 덮은 순간에 실행한다 */
  const T = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => {
    if (wiping.current) return;
    wiping.current = true;
    setWipe({ fn: () => fn(...a), key: Date.now(), origin: getLastPoint() });
  };

  const setMeta = useCallback((m: MetaSave) => {
    setMetaRaw(m);
    writeSave(m);
  }, []);
  const rec = (m: MetaSave, key: keyof MetaSave['codex'], ids: string[]) => {
    const r = record(m, key, ids);
    if (r.added.length) setCodexNew((n) => n + r.added.length);
    return r;
  };

  // ── 출격 ──
  const launch = (squad: string) => {
    const r = newRun(squad, depth, meta.unlocked);
    let m = rec(meta, 'cards', r.deck.map((c) => c.id)).save;
    m = rec(m, 'relics', r.relics).save;
    setMeta(m);
    setCodexNew(0);
    setRun(r);
    setScreen('map');
  };

  const enterNode = (id: string) => {
    if (!run) return;
    const n = nodeById(run, id);
    preRun.current = run;
    const r: RunState = { ...run, pos: id, visited: [...run.visited, id] };
    setRun(r);
    if (n.type === 'combat' || n.type === 'elite' || n.type === 'boss') {
      const kind = n.type === 'elite' ? 'elite' : n.type === 'boss' ? 'boss' : 'normal';
      const st = startCombat(r, n.encounter!, kind, meta.unlocked, meta.archive);
      setMeta(rec(meta, 'enemiesSeen', n.encounter!).save);
      setCombat({ s: st.state, ev: st.events, key: Date.now() });
      setScreen('combat');
    } else if (n.type === 'event') {
      setMeta(rec(meta, 'events', [n.eventId!]).save);
      setEvState({ id: n.eventId!, result: null, needRemove: false });
      setScreen('event');
    } else if (n.type === 'rest') setScreen('rest');
    else if (n.type === 'shop') {
      setStock(shopStock());
      setScreen('shop');
    }
  };

  const clearNode = (r: RunState) => {
    const x = structuredClone(r);
    x.stats.nodesCleared += 1;
    setRun(x);
    setScreen('map');
  };

  const finish = (r0: RunState, outcome: Outcome) => {
    clearRun();
    const r = structuredClone(r0);
    r.stats.peakErosion = Math.max(r.stats.peakErosion ?? 0, r.erosion);
    let m = { ...meta };
    const st = settle(r, outcome, m);
    const archived = outcome === 'eroded';
    m = rec(m, 'cards', r.deck.map((c) => c.id)).save;
    if (archived) {
      const cards = topPlayed(r, 5);
      m.archive = [...m.archive, { at: new Date().toLocaleDateString('ko-KR'), squad: r.squad, depth: r.depth, cards: cards.length ? cards : ['cut', 'guard'] }].slice(-8);
    }
    const codexBonus = outcome === 'abort' ? 0 : codexNew;
    m.fragments += st.total + codexBonus;
    if (codexBonus) st.lines.push([`도감 신규 기록 ${codexBonus}건`, codexBonus]);
    st.total += codexBonus;
    m.runs += 1;
    if (outcome === 'win') m.clears += 1;
    setMeta(m);
    setResult({ outcome, settle: st, archived, newCodex: codexNew, run: r });
    setRun(null);
    setCombat(null);
    setScreen('result');
  };

  const combatEnd = (cs: CombatState) => {
    if (!run) return;
    let r = applyCombatResult(run, cs);
    // 도감: 모사한 적
    let m = meta;
    const rr = rec(m, 'enemiesMimicked', cs.mimickedFrom);
    m = rr.save;
    r.stats.newMimics.push(...rr.added);
    setMeta(m);
    if (cs.over === 'lose' || cs.over === 'eroded') return finish(r, cs.over);
    if (cs.kind === 'elite') r.stats.elites += 1;
    if (cs.kind === 'boss') {
      r.stats.bossKilled = true;
      r.stats.nodesCleared += 1;
      setRun(r);
      setReward({ ...makeReward(r, cs), kakpul: 0, absorbOptions: [], relic: null, boss: true });
      setScreen('reward');
      return;
    }
    const rw = makeReward(r, cs);
    r.kakpul += rw.kakpul;
    r.stats.kakpulEarned = (r.stats.kakpulEarned ?? 0) + rw.kakpul;
    if (rw.relic) {
      r.relics = [...r.relics, rw.relic];
      r.relicGrid = autoPlace(r.relicGrid ?? {}, rw.relic);
      setMeta(rec(m, 'relics', [rw.relic]).save);
    }
    setRun(r);
    setReward(rw);
    setScreen('reward');
  };

  const rewardDone = (card: string | null, abs: string | null) => {
    if (!run) return;
    let r = run;
    const ids: string[] = [];
    if (card) { r = addCard(r, card); ids.push(card); }
    if (abs) { r = absorb(r, abs); ids.push(abs); }
    if (ids.length) setMeta(rec(meta, 'cards', ids).save);
    if (r.erosion >= 100) return finish(r, 'eroded');
    if (reward?.boss) return finish(r, 'win');
    clearNode(r);
  };

  const chooseEvent = (i: number) => {
    if (!run || !evState) return;
    const before = run.deck.map((c) => c.id);
    const res = resolveEvent(run, evState.id, i);
    const changed = res.run.deck.map((c) => c.id).filter((id, k) => id !== before[k]);
    if (changed.length) setMeta(rec(meta, 'cards', changed).save);
    setRun(res.run);
    setEvState({ ...evState, result: res.msg, needRemove: !!res.needRemove });
    if (res.run.erosion >= 100) setTimeout(T(() => finish(res.run, 'eroded')), 1200);
  };

  const shopBuy = (i: number) => {
    if (!run) return;
    const it = stock[i];
    const p = priceOf(it.price, meta.unlocked);
    if (it.sold || run.kakpul < p) return;
    let r = addCard(run, it.id);
    r.kakpul -= p;
    setRun(r);
    setMeta(rec(meta, 'cards', [it.id]).save);
    setStock(stock.map((s, k) => (k === i ? { ...s, sold: true } : s)));
  };
  const shopService = (k: 'remove' | 'purge' | 'charge', uid?: number) => {
    if (!run) return;
    const cost = priceOf(k === 'remove' ? 50 : k === 'purge' ? 45 : 60, meta.unlocked);
    if (run.kakpul < cost) return;
    let r = k === 'remove' && uid != null ? removeCard(run, uid) : structuredClone(run);
    r.kakpul -= cost;
    if (k === 'purge') r.erosion = Math.max(0, r.erosion - 10);
    if (k === 'charge') r.mirrorCharges += 1;
    setRun(r);
  };

  const inRun = run && ['map', 'combat', 'reward', 'event', 'rest', 'shop'].includes(screen);
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState(() => !!loadRun());
  // 맵에 있을 때마다 진행 상황 자동 저장
  useEffect(() => { if (screen === 'map' && run) { saveRun(run); setSaved(true); } }, [screen, run]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (modal) { setModal(null); return; }
      if (screen === 'map') setMenu((v) => !v);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [screen, modal]);
  const saveAndExit = T(() => { if (run) saveRun(run); setMenu(false); setRun(null); setScreen('hub'); });
  const [drop, setDrop] = useState(false);
  const abandon = () => {
    if (!run) return;
    const r = run;
    setMenu(false);
    setDrop(true);
    setTimeout(() => { setSaved(false); finish(r, 'abort'); }, 950);
    setTimeout(() => setDrop(false), 1900);
  };
  const resume = T(() => { const r = loadRun(); if (r) { if (!r.relicGrid) r.relicGrid = r.relics.reduce((g, id) => autoPlace(g, id), {} as NonNullable<RunState['relicGrid']>); setRun(r); setCodexNew(0); setScreen('map'); } });

  return (
    <div className="app">
      {inRun && run && (
        <TopBar
          run={live && screen === 'combat' ? { ...run, hp: live.hp, erosion: live.erosion } : run}
          meta={meta.unlocked}
          onMap={screen === 'map'}
          onDeck={() => setModal('deck')}
          onRelics={() => setModal('relic')}
          onMenu={() => setMenu(true)}
        />
      )}
      {screen === 'hub' && (
        <Hub
          meta={meta}
          onStart={() => { setScreen('depth'); setBurst(true); setTimeout(() => setBurst(false), 700); }}
          onTree={T(() => setScreen('tree'))}
          onCodex={T(() => setScreen('codex'))}
          onGuide={T(() => setScreen('guide'))}
          onResume={saved ? resume : undefined}
          onReset={() => { if (confirmReset()) { clearSave(); setMeta(emptySave()); } }}
        />
      )}
      {screen === 'depth' && <DepthSelect depth={depth} setDepth={setDepth} onBack={T(() => setScreen('hub'))} onNext={T(() => setScreen('squad'))} />}
      {screen === 'squad' && <SquadSelect depth={depth} onBack={T(() => setScreen('depth'))} onLaunch={T(launch)} />}
      {screen === 'map' && run && <MapView key={run.pos ?? 'start'} run={run} onEnter={T(enterNode)} onDeck={() => setModal('deck')} onRelics={() => setModal('relic')} />}
      {screen === 'combat' && combat && <Combat key={combat.key} initial={combat.s} introEvents={combat.ev} onEnd={T(combatEnd)} onTick={setLive} onRetreat={T(() => { if (preRun.current) setRun(preRun.current); setCombat(null); setLive(null); setScreen('map'); })} />}
      {screen === 'reward' && run && reward && <RewardView run={run} reward={reward} meta={meta.unlocked} onDone={T(rewardDone)} />}
      {screen === 'event' && run && evState && (
        <EventView
          eventId={evState.id}
          run={run}
          result={evState.result}
          needRemove={evState.needRemove}
          onChoose={chooseEvent}
          onContinue={T(() => clearNode(run))}
          onRemove={(uid) => { const r = removeCard(run, uid); setEvState({ ...evState, needRemove: false, result: '카드를 두고 나왔다. 무엇이었는지 벌써 기억나지 않는다.' }); setRun(r); }}
        />
      )}
      {screen === 'rest' && run && (
        <RestView
          run={run}
          onRest={T((o: 'heal' | 'compose') => {
            const r = structuredClone(run);
            if (o === 'heal') r.hp = Math.min(r.maxHp, r.hp + Math.round(r.maxHp * 0.3));
            else r.erosion = Math.max(0, r.erosion - 15);
            clearNode(r);
          })}
        />
      )}
      {screen === 'shop' && run && <ShopView run={run} meta={meta.unlocked} stock={stock} onBuy={shopBuy} onService={shopService} onLeave={T(() => clearNode(run))} />}
      {screen === 'result' && result && <ResultView {...result} onHub={T(() => setScreen('hub'))} />}
      {screen === 'tree' && (
        <TreeView
          meta={meta}
          onBack={T(() => setScreen('hub'))}
          onUnlock={(id) => setMeta({ ...meta, fragments: meta.fragments - META[id].cost, unlocked: [...meta.unlocked, id] })}
          onRefund={() => setMeta(refundAll(meta))}
        />
      )}
      {screen === 'guide' && <GuideView onBack={T(() => setScreen('hub'))} />}
      {screen === 'codex' && <CodexView meta={meta} onBack={T(() => setScreen('hub'))} />}
      {modal === 'deck' && run && <DeckModal cards={run.deck} title={`현재 덱 ${run.deck.length}장`} onClose={() => setModal(null)} />}
      {modal === 'relic' && run && <RelicDrawer relics={run.relics} grid={run.relicGrid ?? Object.fromEntries(run.relics.map((id, i) => [id, { r: i, c: 0, rot: 0 }]))} editable={screen !== 'combat'} onChange={(g) => setRun({ ...run, relicGrid: g })} onClose={() => setModal(null)} />}
      {menu && screen === 'map' && run && <MapMenu onClose={() => setMenu(false)} onSave={saveAndExit} onAbandon={abandon} />}
      {drop && <GridDrop />}
      <CursorPing />
      <KeywordTip />
      {wipe && (
        <PixelWipe
          key={wipe.key}
          origin={wipe.origin}
          onCovered={() => { wipe.fn(); window.scrollTo(0, 0); }}
          onDone={() => { setWipe(null); wiping.current = false; }}
        />
      )}
      {burst && <div className="burst-out" />}
    </div>
  );
}

// 브라우저 확인창 대신, 두 번 눌러야 초기화되게 한다
let resetArmed = 0;
function confirmReset() {
  const now = Date.now();
  if (now - resetArmed < 2500) return true;
  resetArmed = now;
  const b = document.querySelector('.hub .btn.reset');
  if (b) b.textContent = '한 번 더 누르면 초기화';
  setTimeout(() => { if (b) b.textContent = '기록 초기화'; }, 2500);
  return false;
}

export const enemyName = (id: string) => ENEMIES[id]?.name;
