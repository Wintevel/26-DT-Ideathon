// 런(한 판) 진행: 맵 생성, 보상, 이벤트, 상점, 정산
import { BASE_DECK, CARD_LIST, CARDS, depthDef, ENCOUNTERS, ENCOUNTERS_EARLY, EVENTS, RELIC_LIST, SQUADS, ABSORB_OF, ENEMIES } from './data';
import { shuffle, erosionGain } from './engine';
import type { CardInst, CombatState, MapNode, MetaSave, NodeType, RunState } from './types';

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export const STAGES = 6; // STAGE 01~05 + BOSS

export function newRun(squadId: string, depth: number, meta: string[]): RunState {
  const sq = SQUADS.find((s) => s.id === squadId)!;
  let uid = 0;
  const deck: CardInst[] = [...BASE_DECK, ...sq.cards].map((id) => ({ uid: ++uid, id }));
  let maxHp = sq.maxHp + (meta.includes('awaken') ? 8 : 0) + (meta.includes('skin') ? 10 : 0);
  return {
    squad: squadId,
    depth,
    hp: maxHp,
    maxHp,
    deck,
    relics: [sq.relic],
    relicGrid: { [sq.relic]: { r: 0, c: 0, rot: 0 } },
    kakpul: sq.kakpul + (meta.includes('awaken') ? 15 : 0),
    erosion: sq.erosion,
    mirrorCharges: 4 + (meta.includes('infinite') ? 1 : 0),
    map: genMap(),
    pos: null,
    visited: [],
    revealAll: false,
    stats: { nodesCleared: 0, elites: 0, bossKilled: false, newMimics: [], playCounts: {}, absorbed: [], combats: 0 },
    uidSeq: uid,
  };
}

function genMap(): MapNode[][] {
  const counts = [1, 2, rint(2, 3), rint(2, 3), rint(2, 3), 1];
  const map: MapNode[][] = counts.map((n, stage) =>
    Array.from({ length: n }, (_, idx) => ({
      id: `s${stage}n${idx}`,
      stage,
      idx,
      y: n === 1 ? 0.5 : 0.18 + (0.64 * idx) / (n - 1),
      type: 'combat' as NodeType,
      next: [],
    })),
  );
  map[0][0].type = 'combat';
  map[0][0].encounter = pick(ENCOUNTERS_EARLY);
  // STAGE 02: 긴급(정예) + 일반 전투
  map[1][0].type = 'elite';
  map[1][1].type = 'combat';
  const bag: NodeType[] = shuffle(['event', 'event', 'shop', 'rest', 'combat', 'combat', 'combat', 'event', 'combat']);
  for (let st = 2; st <= 4; st++) {
    for (const n of map[st]) n.type = bag.pop() ?? 'combat';
  }
  if (!map[4].some((n) => n.type === 'rest')) map[4][map[4].length - 1].type = 'rest';
  if (!map[2].concat(map[3]).some((n) => n.type === 'shop')) map[3][0].type = 'shop';
  map[5][0].type = 'boss';
  map[5][0].encounter = ['ark'];
  const events = shuffle(EVENTS.map((e) => e.id));
  for (const col of map)
    for (const n of col) {
      if (n.type === 'combat' && !n.encounter) n.encounter = pick(ENCOUNTERS);
      if (n.type === 'elite') n.encounter = ['phantom'];
      if (n.type === 'event') n.eventId = events.pop() ?? EVENTS[0].id;
    }
  // 연결: 가까운 y끼리 연결, 고립 노드 없게
  for (let st = 0; st < STAGES - 1; st++) {
    const a = map[st];
    const b = map[st + 1];
    for (const n of a) {
      const near = b.filter((m) => Math.abs(m.y - n.y) <= 0.36);
      const tgt = near.length ? near : [b.reduce((p, c) => (Math.abs(c.y - n.y) < Math.abs(p.y - n.y) ? c : p))];
      n.next = tgt.map((m) => m.id);
    }
    for (const m of b) {
      if (!a.some((n) => n.next.includes(m.id))) {
        const nearest = a.reduce((p, c) => (Math.abs(c.y - m.y) < Math.abs(p.y - m.y) ? c : p));
        nearest.next.push(m.id);
      }
    }
  }
  return map;
}

export function nodeById(run: RunState, id: string): MapNode {
  return run.map.flat().find((n) => n.id === id)!;
}
export function reachable(run: RunState): string[] {
  if (!run.pos) return run.map[0].map((n) => n.id);
  return nodeById(run, run.pos).next;
}
export function currentStage(run: RunState) {
  return run.pos ? nodeById(run, run.pos).stage : -1;
}

// ─── 전투 결과 반영 ────────────────────────────────────
export interface Reward {
  kakpul: number;
  cards: string[];
  absorbOptions: string[];
  relic: string | null;
  boss?: boolean;
}

export function applyCombatResult(run: RunState, cs: CombatState): RunState {
  const r = structuredClone(run);
  r.hp = cs.player.hp;
  r.erosion = cs.erosion;
  for (const [id, n] of Object.entries(cs.playCounts)) r.stats.playCounts[id] = (r.stats.playCounts[id] ?? 0) + n;
  r.stats.combats += 1;
  r.stats.dealt = (r.stats.dealt ?? 0) + (cs.dealt ?? 0);
  r.stats.taken = (r.stats.taken ?? 0) + (cs.taken ?? 0);
  r.stats.mimics = (r.stats.mimics ?? 0) + cs.mimicsThisCombat;
  r.stats.turns = (r.stats.turns ?? 0) + cs.turn;
  r.stats.peakErosion = Math.max(r.stats.peakErosion ?? 0, cs.erosion);
  return r;
}

export function makeReward(run: RunState, cs: CombatState): Reward {
  const pool = CARD_LIST.filter((c) => !c.noReward);
  const cards = shuffle(pool).slice(0, 3).map((c) => c.id);
  const absorbOptions = run.mirrorCharges > 0 ? cs.mimickedFrom.map((id) => ABSORB_OF[id]).filter(Boolean) : [];
  const owned = run.relics;
  const relicPool = RELIC_LIST.filter((x) => x.pool === 'elite' && !owned.includes(x.id));
  return {
    kakpul: cs.kind === 'elite' ? rint(30, 38) : rint(12, 18),
    cards,
    absorbOptions: [...new Set(absorbOptions)],
    relic: cs.kind === 'elite' && relicPool.length ? pick(relicPool).id : null,
  };
}

export function addCard(run: RunState, id: string): RunState {
  const r = structuredClone(run);
  r.deck.push({ uid: ++r.uidSeq, id });
  return r;
}
export function absorb(run: RunState, id: string): RunState {
  const r = addCard(run, id);
  r.mirrorCharges -= 1;
  r.erosion = Math.min(100, r.erosion + erosionGain(8, r.depth));
  r.stats.absorbed.push(id);
  return r;
}
export function removeCard(run: RunState, uid: number): RunState {
  const r = structuredClone(run);
  r.deck = r.deck.filter((c) => c.uid !== uid);
  return r;
}

// ─── 이벤트 ────────────────────────────────────────────
export function resolveEvent(run: RunState, eventId: string, opt: number): { run: RunState; msg: string; needRemove?: boolean } {
  const r = structuredClone(run);
  const ero = (n: number) => (r.erosion = Math.max(0, Math.min(100, r.erosion + (n > 0 ? erosionGain(n, r.depth) : n))));
  switch (eventId) {
    case 'mirrorSelf':
      if (opt === 2) { r.hp = Math.max(1, r.hp - 5); r.kakpul += 20; r.stats.kakpulEarned = (r.stats.kakpulEarned ?? 0) + 20; return { run: r, msg: '거울이 산산조각 났다. 조각 틈에 각뿔이 끼어 있었다. 손등에서 피가 흐른다.' }; }
      if (opt === 0) {
        const cands = r.deck.filter((c) => CARDS[c.id].cat !== '흡수');
        if (cands.length) {
          const c = pick(cands);
          const before = CARDS[c.id].name;
          c.id = pick(Object.values(ABSORB_OF));
          ero(5);
          return { run: r, msg: `[${before}]이(가) [${CARDS[c.id].name}](으)로 바뀌었다. 거울 속의 내가 웃는다.` };
        }
      }
      return { run: r, msg: '거울을 덮었다. 손바닥 아래로 체온이 느껴진다.' };
    case 'antenna':
      if (opt === 0) { r.revealAll = true; r.kakpul += 15; r.stats.kakpulEarned = (r.stats.kakpulEarned ?? 0) + 15; return { run: r, msg: '신호가 잡혔다. 이번 구역의 모든 통로가 보인다.' }; }
      if (opt === 2) { ero(-4); return { run: r, msg: '안테나가 조용해졌다. 머릿속 잡음도 함께 꺼졌다.' }; }
      r.kakpul += 40; r.stats.kakpulEarned = (r.stats.kakpulEarned ?? 0) + 40; ero(5);
      return { run: r, msg: '부품을 챙겼다. 잡음이 머릿속에 남는다.' };
    case 'broken':
      if (opt === 0) { r.hp = Math.max(1, r.hp - 8); ero(-12); return { run: r, msg: '손이 베였지만, 조각 속 얼굴이 내 것이라는 걸 확인했다.' }; }
      return { run: r, msg: '조각들을 밟지 않게 조심히 지나갔다.' };
    case 'whisper':
      if (opt === 0) { r.mirrorCharges += 1; ero(6); return { run: r, msg: '속삭임이 조용해졌다. 대신 더 많이 베낄 수 있을 것 같다.' }; }
      if (opt === 2) { r.kakpul += 25; r.stats.kakpulEarned = (r.stats.kakpulEarned ?? 0) + 25; ero(3); return { run: r, msg: '두 목소리가 겹쳤다. 어느 쪽이 먼저 말했는지 모르겠다. 발치에 각뿔이 떨어져 있다.' }; }
      r.hp = Math.min(r.maxHp, r.hp + 6);
      return { run: r, msg: '귀를 막고 숨을 골랐다.' };
    case 'nameless':
      if (opt === 0) return { run: r, msg: '두고 갈 카드를 고른다.', needRemove: true };
      ero(-5);
      return { run: r, msg: '벽에 내 이름을 새겼다. 조금 더 나다워졌다.' };
  }
  return { run: r, msg: '' };
}

// ─── 상점 ──────────────────────────────────────────────
export function shopStock(): { id: string; price: number }[] {
  const pool = CARD_LIST.filter((c) => !c.noReward);
  return shuffle(pool)
    .slice(0, 4)
    .map((c) => ({ id: c.id, price: c.cat === '거울' ? rint(55, 70) : rint(40, 55) }));
}
export const priceOf = (base: number, meta: string[]) => Math.round(base * (meta.includes('market') ? 0.75 : 1));

// ─── 정산 ──────────────────────────────────────────────
export interface Settlement { lines: [string, number][]; total: number }
export function settle(run: RunState, outcome: 'lose' | 'eroded' | 'win' | 'abort', meta: MetaSave): Settlement {
  if (outcome === 'abort') return { lines: [['출격 취소 · 보상 없음', 0]], total: 0 };
  const s = run.stats;
  const lines: [string, number][] = [
    ['돌파 노드', s.nodesCleared * 2],
    ['처치한 정예', s.elites * 3],
    ['아크 처치', s.bossKilled ? 10 : 0],
    ['처음 모사한 적', s.newMimics.length * 2],
  ];
  let base = lines.reduce((a, l) => a + l[1], 0);
  const mult = depthDef(run.depth).frag;
  let total = base * mult;
  if (meta.unlocked.includes('recall')) total *= 1.15;
  if (outcome === 'eroded') total *= 1.3;
  if (s.bossKilled && meta.unlocked.includes('archive')) total += 10;
  total = Math.round(total);
  lines.push([`심도 배율 ×${mult}`, 0]);
  if (outcome === 'eroded') lines.push(['침식 100% 보너스 ×1.3', 0]);
  return { lines, total: Math.max(total, 3) };
}

export function topPlayed(run: RunState, n = 5) {
  return Object.entries(run.stats.playCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}

export const enemyName = (id: string) => ENEMIES[id]?.name ?? id;
