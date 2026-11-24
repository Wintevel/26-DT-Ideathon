// 전투 규칙. 화면과 분리된 순수 로직(상태를 복제해 새 상태를 반환).
import { activeRelics } from './relicGrid';
import { CARDS, ENEMIES, MIMIC_DEF, depthDef, ABSORB_OF } from './data';
import type { CardDef, CardInst, CombatState, Ctx, EnemyInst, FxEvent, Intent, RunState, Step, ArchiveEntry } from './types';

const clone = <T,>(x: T): T => structuredClone(x);
const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── 침식 ──────────────────────────────────────────────
export const TIER_NAMES = ['안정', '동요', '잠식', '붕괴 직전'];
export function tierOf(erosion: number, meta: string[]): number {
  const b = meta.includes('buffer') ? 10 : 0;
  if (erosion >= 90 + b) return 3;
  if (erosion >= 60 + b) return 2;
  if (erosion >= 30 + b) return 1;
  return 0;
}
export function tierBounds(meta: string[]) {
  const b = meta.includes('buffer') ? 10 : 0;
  return [30 + b, 60 + b, 90 + b];
}
const TIER_BONUS = [0, 0.15, 0.3, 0.5];

export function erosionGain(amt: number, depth: number) {
  if (amt <= 0) return amt;
  if (depth >= 3) return Math.ceil(amt * 1.5);
  if (depth < 0) return Math.max(1, Math.round(amt / 2));
  return amt;
}

function addErosion(s: CombatState, amt: number, ev: FxEvent[]) {
  if (amt > 0 && s.player.anchor) {
    ev.push({ k: 'text', to: 'player', msg: '닻: 침식 차단' });
    return;
  }
  amt = erosionGain(amt, s.ctx.depth);
  const before = s.erosion;
  s.erosion = Math.max(0, Math.min(100, s.erosion + amt));
  if (s.erosion !== before) ev.push({ k: 'erosion', amt: s.erosion - before });
  if (s.erosion >= 100) s.over = 'eroded';
}

// ─── 카드 정보 ─────────────────────────────────────────
export function defOf(c: CardInst): CardDef {
  if (c.mimic) {
    const it = c.mimic.intent;
    const needsTarget = !!(it.dmg || it.weak || it.vuln);
    return { ...MIMIC_DEF, name: `모사: ${it.label}`, target: needsTarget ? 'enemy' : 'self', text: mimicText(c) };
  }
  return CARDS[c.id];
}
function mimicText(c: CardInst) {
  const it = c.mimic!.intent;
  const parts: string[] = [];
  if (it.dmg) parts.push(`피해 ${it.dmg}${(it.hits ?? 1) > 1 ? ` × ${it.hits}` : ''}`);
  if (it.block) parts.push(`차폐 ${it.block}`);
  if (it.str) parts.push(`강화 +${it.str}`);
  if (it.weak) parts.push(`약화 ${it.weak}`);
  if (it.vuln) parts.push(`취약 ${it.vuln}`);
  if (it.kind === 'summon') parts.push('분신 1기 소환');
  if (!parts.length) parts.push('차폐 5');
  return `${c.mimic!.fromName}에게서 베낀 기술. ${parts.join('. ')}. 소멸`;
}
export function cardCost(s: CombatState, c: CardInst) {
  const d = defOf(c);
  if (c.id === 'symmetry' && s.ctx.meta.includes('infinite')) return Math.max(0, d.cost - 1);
  return d.cost;
}

/** 적이 카드를 따라 쓸 때 쓰는 요약치 */
export function summarize(c: CardInst | string): { dmg?: number; hits: number; block?: number; name: string } {
  const inst: CardInst = typeof c === 'string' ? { uid: -1, id: c } : c;
  if (inst.mimic) {
    const it = inst.mimic.intent;
    return { dmg: it.dmg, hits: it.hits ?? 1, block: it.block, name: `모사: ${it.label}` };
  }
  const d = CARDS[inst.id];
  let dmg = d.dmg;
  if (inst.id === 'mimicSlash') dmg = 8;
  if (inst.id === 'twin') dmg = 7;
  const hits = inst.id === 'twin' ? 2 : d.hits ?? 1;
  return { dmg, hits, block: d.block, name: d.name };
}

export function mimicPreview(s: CombatState): number {
  return erosionGain(s.ctx.relics.includes('focuser') ? 1 : 3, s.ctx.depth);
}
export function cardErosionPreview(s: CombatState, c: CardInst): number {
  if (c.id === 'compose') return -6;
  if (c.id === 'mimicSlash') return s.player.anchor ? 0 : erosionGain(1, s.ctx.depth);
  return 0;
}

// ─── 피해 계산 ─────────────────────────────────────────
function alive(s: CombatState) {
  return s.enemies.filter((e) => e.hp > 0);
}
export function playerDmg(s: CombatState, def: CardDef, base: number, isClone = false) {
  let d = base + s.player.str;
  if (def.cat === '전술' && s.ctx.meta.includes('edge')) d += 1;
  if (def.cat === '거울' || def.cat === '흡수') d = Math.floor(d * (1 + TIER_BONUS[tierOf(s.erosion, s.ctx.meta)]));
  if (isClone && s.ctx.relics.includes('capacitor')) d = Math.floor(d * 1.3);
  if (s.player.weak > 0) d = Math.floor(d * 0.75);
  return Math.max(0, d);
}
function hitEnemy(s: CombatState, e: EnemyInst, raw: number, ev: FxEvent[]) {
  if (e.hp <= 0) return;
  let d = raw;
  if (e.vuln > 0) d = Math.floor(d * 1.5);
  const blk = Math.min(e.block, d);
  e.block -= blk;
  e.hp = Math.max(0, e.hp - (d - blk));
  ev.push({ k: 'dmg', to: `e${e.uid}`, amt: d - blk, blocked: blk });
  if (e.hp <= 0) ev.push({ k: 'die', to: `e${e.uid}` });
  else if (e.defId === 'phantom' && !e.split && e.hp <= e.maxHp / 2) {
    e.split = true;
    e.intent = { kind: 'summon', label: '분열' };
    e.mimicked = false;
    ev.push({ k: 'text', to: `e${e.uid}`, msg: '분열 징후' });
  }
}
export function enemyHitValue(s: CombatState, e: EnemyInst, base: number) {
  let d = base + e.str;
  if (e.weak > 0) d = Math.floor(d * 0.75);
  if (e.mimicked) d = Math.floor(d * (s.ctx.relics.includes('plate') ? 0.5 : 0.75));
  if (s.player.vuln > 0) d = Math.floor(d * 1.5);
  if (s.ctx.meta.includes('dr')) d = Math.floor(d * 0.95);
  return Math.max(0, d);
}
function hitPlayer(s: CombatState, e: EnemyInst, base: number, ev: FxEvent[]) {
  const d = enemyHitValue(s, e, base);
  if (s.player.reflect && d > 0) {
    ev.push({ k: 'text', to: 'player', msg: '반사' });
    hitEnemy(s, e, d, ev);
  }
  const blk = Math.min(s.player.block, d);
  s.player.block -= blk;
  s.player.hp = Math.max(0, s.player.hp - (d - blk));
  ev.push({ k: 'dmg', to: 'player', amt: d - blk, blocked: blk });
  if (s.player.hp <= 0) s.over = 'lose';
}
function gainBlock(s: CombatState, amt: number, ev: FxEvent[]) {
  s.player.block += amt;
  ev.push({ k: 'block', to: 'player', amt });
}

// ─── 드로우 ────────────────────────────────────────────
function drawN(s: CombatState, n: number) {
  for (let i = 0; i < n; i++) {
    if (!s.draw.length) {
      if (!s.discard.length) return;
      s.draw = shuffle(s.discard);
      s.discard = [];
    }
    const c = s.draw.pop()!;
    if (s.hand.length >= 10) s.discard.push(c);
    else s.hand.push(c);
  }
}
const newUid = (s: CombatState) => ++s.uidSeq;

// ─── 카드 효과 ─────────────────────────────────────────
function pickTarget(s: CombatState, uid: number | null): EnemyInst | undefined {
  const a = alive(s);
  return a.find((e) => e.uid === uid) ?? a[0];
}

function applyCard(s: CombatState, card: CardInst, targetUid: number | null, ev: FxEvent[], isClone = false, depthGuard = 0) {
  const def = defOf(card);
  const tgt = () => pickTarget(s, targetUid);
  const strike = (base: number, hits = 1) => {
    for (let i = 0; i < hits; i++) {
      const t = tgt();
      if (!t) return;
      hitEnemy(s, t, playerDmg(s, def, base, isClone), ev);
    }
  };
  const strikeAll = (base: number) => alive(s).forEach((e) => hitEnemy(s, e, playerDmg(s, def, base, isClone), ev));

  if (card.mimic) {
    const it = card.mimic.intent;
    const lens = s.ctx.relics.includes('lens') ? 3 : 0;
    if (it.dmg) strike(it.dmg + lens, it.hits ?? 1);
    if (it.block) gainBlock(s, it.block, ev);
    if (it.str) { s.player.str += it.str; ev.push({ k: 'status', to: 'player', good: true, msg: `강화 +${it.str}` }); }
    const t = tgt();
    if (t && it.weak) { t.weak += it.weak; ev.push({ k: 'status', to: `e${t.uid}`, good: false, msg: `약화 ${it.weak}` }); }
    if (t && it.vuln) { t.vuln += it.vuln; ev.push({ k: 'status', to: `e${t.uid}`, good: false, msg: `취약 ${it.vuln}` }); }
    if (it.kind === 'summon') summonClone(s, ev);
    if (!it.dmg && !it.block && !it.str && !it.weak && !it.vuln && it.kind !== 'summon') gainBlock(s, 5, ev);
    return;
  }

  switch (card.id) {
    case 'observe': drawN(s, 1); gainBlock(s, 2, ev); return;
    case 'focus': s.player.energy += 1; return;
    case 'pierce': { strike(10); const t = tgt(); if (t) { t.vuln += 2; ev.push({ k: 'status', to: `e${t.uid}`, good: false, msg: '취약 2' }); } return; }
    case 'feint': { const t = tgt(); if (t) { t.weak += 2; ev.push({ k: 'status', to: `e${t.uid}`, good: false, msg: '약화 2' }); } drawN(s, 1); return; }
    case 'mimicSlash': {
      const t = tgt();
      const it = t?.intent;
      if (it && it.dmg) strike(it.dmg, it.hits ?? 1);
      else strike(5);
      if (!isClone) addErosion(s, 1, ev);
      return;
    }
    case 'compose': addErosion(s, -6, ev); gainBlock(s, 3, ev); return;
    case 'afterimage': summonClone(s, ev); if (!isClone) s.imprintNext = true; return;
    case 'twin': strike(7, s.clones.length > 0 ? 2 : 1); return;
    case 'symmetry': gainBlock(s, 3, ev); s.player.reflect = true; return;
    case 'anchor': gainBlock(s, 6, ev); s.player.anchor = true; return;
    case 'crack': strike(4 + 2 * Math.floor(s.erosion / 10)); return;
    case 'invert': gainBlock(s, 5 + Math.floor(s.erosion / 10), ev); return;
    case 'wildStrike': strike(rint(3, 12)); return;
    case 'silence': { strike(4); const t = tgt(); if (t) { t.weak += 2; t.vuln += 1; ev.push({ k: 'status', to: `e${t.uid}`, good: false, msg: '약화 2 · 취약 1' }); } return; }
    case 'devour': s.player.str += 2; ev.push({ k: 'status', to: 'player', good: true, msg: '강화 +2' }); return;
    case 'phantomEcho': {
      const prev = s.lastPlayed;
      if (prev && prev.id !== 'phantomEcho' && depthGuard < 1) applyCard(s, prev, targetUid, ev, isClone, depthGuard + 1);
      else ev.push({ k: 'text', to: 'player', msg: '잔향 없음' });
      return;
    }
  }
  // 일반 처리
  if (def.dmg) {
    if (def.target === 'all') strikeAll(def.dmg);
    else strike(def.dmg, def.hits ?? 1);
  }
  if (def.block) gainBlock(s, def.block, ev);
}

function summonClone(s: CombatState, ev: FxEvent[]) {
  if (s.clones.length >= 2) {
    s.clones[0].dur = 2;
  } else {
    s.clones.push({ uid: newUid(s), dur: 2, imprint: null });
  }
  ev.push({ k: 'text', to: 'player', msg: '분신 소환' });
}

// ─── 적 의도 ───────────────────────────────────────────
function dmgMult(depth: number) {
  return 1 + (depthDef(depth).mult - 1) * 0.6;
}
function scaleIntent(it: Intent, depth: number): Intent {
  const m = dmgMult(depth);
  const out = { ...it };
  if (out.dmg) out.dmg = Math.round(out.dmg * m);
  if (out.block) out.block = Math.round(out.block * m);
  return out;
}

function bossPhase2(s: CombatState, e: EnemyInst) {
  return s.ctx.depth >= 4 || e.hp <= e.maxHp / 2;
}
function bossCardIntent(s: CombatState, e: EnemyInst): Intent {
  const n = s.scanned.length;
  const idx = (e.turn - 1) % (n + 1);
  if (idx === n) return scaleIntent({ kind: 'attack', label: '반향 공명', dmg: 5, hits: 3 }, s.ctx.depth);
  const sum = summarize(s.scanned[idx]);
  if (sum.dmg) return scaleIntent({ kind: 'attack', label: `복제: ${sum.name}`, dmg: Math.round(sum.dmg * 1.5 + 2), hits: sum.hits, cardId: s.scanned[idx], block: sum.block ? Math.round(sum.block * 1.5) : undefined }, s.ctx.depth);
  if (sum.block) return scaleIntent({ kind: 'attack', label: `복제: ${sum.name}`, block: Math.round(sum.block * 1.5 + 3), dmg: 6, cardId: s.scanned[idx] }, s.ctx.depth);
  return { kind: 'buff', label: `복제: ${sum.name}`, str: 2, cardId: s.scanned[idx] };
}

function decideIntent(s: CombatState, e: EnemyInst) {
  e.turn += 1;
  e.mimicked = false;
  if (e.defId === 'ark') {
    e.intent = bossPhase2(s, e) ? { kind: 'seal', label: '역상 준비' } : bossCardIntent(s, e);
    return;
  }
  const def = ENEMIES[e.defId];
  let it = def.pattern(e, s);
  if (s.ctx.depth >= 1 && def.tier === 'normal' && e.turn % 3 === 0) it = { kind: 'echo', label: '반향' };
  e.intent = scaleIntent(it, s.ctx.depth);
}

/** 화면 표시용: 반향 의도는 지금 마지막으로 낸 카드에 따라 실시간으로 바뀐다 */
export function displayIntent(s: CombatState, e: EnemyInst): Intent {
  if (e.intent.kind === 'echo') {
    const c = s.lastPlayed;
    if (!c) return { kind: 'echo', label: '반향: 대기', block: 5 };
    const sum = summarize(c);
    const hits = sum.hits * (s.ctx.depth >= 2 ? 2 : 1);
    return { kind: 'echo', label: `반향: ${sum.name}`, dmg: sum.dmg, hits, block: sum.block, cardId: c.id };
  }
  return e.intent;
}

// ─── 전투 시작 ─────────────────────────────────────────
export function makeCtx(run: RunState, meta: string[]): Ctx {
  return { relics: activeRelics(run), meta, depth: run.depth, squad: run.squad };
}

export function startCombat(run: RunState, encounter: string[], kind: CombatState['kind'], meta: string[], archive: ArchiveEntry[]): Step {
  const ctx = makeCtx(run, meta);
  let uid = run.uidSeq + 1000;
  const deck: CardInst[] = run.deck.map((c) => ({ ...c }));
  const t = tierOf(run.erosion, meta);
  const blanks = t >= 2 ? 2 : t >= 1 ? 1 : 0;
  for (let i = 0; i < blanks; i++) deck.push({ uid: ++uid, id: 'blank', temp: true });
  const hpMult = depthDef(run.depth).mult;

  let scanned: string[] = [];
  let archLabel: string | undefined;
  if (encounter.includes('ark')) {
    const n = run.depth >= 4 ? 5 : 3;
    const past = archive.length && Math.random() < 0.35 ? archive[Math.floor(Math.random() * archive.length)] : null;
    if (past) {
      scanned = past.cards.slice(0, n);
      archLabel = `과거의 원형 · ${past.at}`;
    } else {
      scanned = Object.entries(run.stats.playCounts)
        .filter(([id]) => CARDS[id] && id !== 'blank')
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([id]) => id);
      const abs = [...new Set(run.stats.absorbed)].filter((id) => !scanned.includes(id)).slice(0, 2);
      scanned.push(...abs);
    }
    if (!scanned.length) scanned = ['cut', 'guard', 'double'];
  }

  const enemies: EnemyInst[] = encounter.map((id) => {
    const d = ENEMIES[id];
    let hp = Math.round(rint(d.hp[0], d.hp[1]) * hpMult);
    if (id === 'ark') hp = Math.round(hp * (1 + 0.05 * Math.floor(run.erosion / 10)));
    return { uid: ++uid, defId: id, name: d.name, hp, maxHp: hp, block: 0, str: 0, weak: 0, vuln: 0, intent: { kind: 'attack', label: '' }, mimicked: false, turn: 0 };
  });

  const s: CombatState = {
    ctx,
    kind,
    player: { hp: run.hp, maxHp: run.maxHp, block: 0, str: 0, weak: 0, vuln: 0, energy: 3, maxEnergy: 3, reflect: false, anchor: false },
    enemies,
    clones: [],
    draw: shuffle(deck),
    hand: [],
    discard: [],
    exhaust: [],
    turn: 0,
    lastPlayed: null,
    echo: null,
    mimicUsed: false,
    mimicsThisCombat: 0,
    imprintNext: false,
    erosion: run.erosion,
    mimickedFrom: [],
    playCounts: {},
    sealed: null,
    scanned,
    archLabel,
    over: null,
    uidSeq: uid,
    log: [],
  };
  s.enemies.forEach((e) => decideIntent(s, e));
  const ev: FxEvent[] = [];
  startPlayerTurn(s, ev);
  return { state: s, events: ev };
}

function startPlayerTurn(s: CombatState, ev: FxEvent[]) {
  s.turn += 1;
  const first = s.turn === 1;
  const p = s.player;
  p.block = 0;
  if (s.ctx.relics.includes('coil')) gainBlock(s, 2, ev);
  p.energy = p.maxEnergy + (first && s.ctx.meta.includes('critical') ? 1 : 0);
  p.reflect = false;
  s.mimicUsed = false;
  let n = 5;
  if (first && s.ctx.meta.includes('opening')) n += 1;
  if (first && s.ctx.relics.includes('antenna')) n += 1;
  drawN(s, n);

  // 붕괴 직전: 손패 1장이 흡수 카드로 덮어써짐
  if (tierOf(s.erosion, s.ctx.meta) >= 3) {
    const cands = s.hand.filter((c) => CARDS[c.id]?.cat !== '상태' && !c.mimic);
    if (cands.length) {
      const victim = cands[Math.floor(Math.random() * cands.length)];
      const pool = Object.values(ABSORB_OF);
      victim.id = pool[Math.floor(Math.random() * pool.length)];
      victim.temp = true;
      ev.push({ k: 'text', to: 'player', msg: '자아 덮어쓰기' });
    }
  }

  // 아크 역상: 손패 1장을 봉인해 대신 사용
  for (const e of alive(s)) {
    if (e.defId !== 'ark' || e.intent.kind !== 'seal') continue;
    const cands = s.hand.filter((c) => CARDS[c.id]?.cat !== '상태' && !c.mimic);
    if (!cands.length) {
      e.intent = bossCardIntent(s, e);
      continue;
    }
    const c = cands[Math.floor(Math.random() * cands.length)];
    s.hand = s.hand.filter((h) => h.uid !== c.uid);
    s.sealed = c;
    const sum = summarize(c);
    e.intent = scaleIntent(
      { kind: 'seal', label: `역상: ${sum.name}`, cardId: c.id, dmg: sum.dmg ? Math.round(sum.dmg * 1.5 + 2) : 6, hits: sum.hits, block: sum.block ? Math.round(sum.block * 1.5) : undefined },
      s.ctx.depth,
    );
    ev.push({ k: 'seal', cardId: c.id });
  }
}

// ─── 플레이어 행동 ─────────────────────────────────────
export function needsTarget(s: CombatState, c: CardInst) {
  const d = defOf(c);
  return d.target === 'enemy' && alive(s).length > 1;
}
export function canPlay(s: CombatState, c: CardInst) {
  const d = defOf(c);
  return !s.over && !d.unplayable && cardCost(s, c) <= s.player.energy;
}

export function playCard(state: CombatState, handUid: number, targetUid: number | null): Step {
  const s = clone(state);
  const ev: FxEvent[] = [];
  const idx = s.hand.findIndex((c) => c.uid === handUid);
  if (idx < 0) return { state, events: [] };
  const card = s.hand[idx];
  if (!canPlay(s, card)) return { state, events: [] };
  const def = defOf(card);
  s.player.energy -= cardCost(s, card);
  s.hand.splice(idx, 1);
  if (!card.mimic && def.cat !== '상태') s.playCounts[card.id] = (s.playCounts[card.id] ?? 0) + 1;

  const wasImprint = s.imprintNext && card.id !== 'afterimage';
  applyCard(s, card, targetUid, ev);
  if (wasImprint) {
    const cl = [...s.clones].reverse().find((c) => !c.imprint) ?? s.clones[s.clones.length - 1];
    if (cl) {
      cl.imprint = { ...card };
      ev.push({ k: 'clone', to: `c${cl.uid}`, cardId: card.id });
    }
    s.imprintNext = false;
  }
  s.lastPlayed = card;
  if (def.exhaust || card.mimic) s.exhaust.push(card);
  else s.discard.push(card);
  if (!s.over && alive(s).length === 0) s.over = 'win';
  return { state: s, events: ev };
}

export function mimicCost(s: CombatState) {
  return s.ctx.meta.includes('freeMimic') && s.mimicsThisCombat === 0 ? 0 : 1;
}
export function canMimic(s: CombatState, e: EnemyInst) {
  return !s.over && !s.mimicUsed && e.hp > 0 && !e.mimicked && s.player.energy >= mimicCost(s) && s.hand.length < 10;
}

export function mimic(state: CombatState, enemyUid: number): Step {
  const s = clone(state);
  const ev: FxEvent[] = [];
  const e = s.enemies.find((x) => x.uid === enemyUid);
  if (!e || !canMimic(s, e)) return { state, events: [] };
  s.player.energy -= mimicCost(s);
  s.mimicUsed = true;
  s.mimicsThisCombat += 1;
  const it = { ...displayIntent(s, e) };
  if (it.kind === 'seal') it.label = it.label.replace('역상: ', '');
  const card: CardInst = { uid: newUid(s), id: 'mimic', mimic: { from: e.defId, fromName: e.name, intent: it } };
  s.hand.push(card);
  e.mimicked = true;
  if (!s.mimickedFrom.includes(e.defId)) s.mimickedFrom.push(e.defId);
  ev.push({ k: 'mimic', from: `e${e.uid}`, cardUid: card.uid });
  addErosion(s, s.ctx.relics.includes('focuser') ? 1 : 3, ev);
  return { state: s, events: ev };
}

// ─── 턴 종료 ───────────────────────────────────────────
export function endTurn(state: CombatState): Step[] {
  let s = clone(state);
  const steps: Step[] = [];
  const push = (ev: FxEvent[]) => {
    steps.push({ state: clone(s), events: ev });
  };

  // 1) 잔상 단계: 분신이 각인 카드를 재시전
  for (const cl of s.clones) {
    if (!cl.imprint || s.over) continue;
    const ev: FxEvent[] = [{ k: 'clone', to: `c${cl.uid}`, cardId: cl.imprint.id }];
    const t = alive(s)[Math.floor(Math.random() * Math.max(1, alive(s).length))];
    applyCard(s, cl.imprint, t ? t.uid : null, ev, true);
    if (s.ctx.meta.includes('sync')) gainBlock(s, 2, ev);
    if (!s.over && alive(s).length === 0) s.over = 'win';
    push(ev);
  }
  if (s.over) return steps.length ? steps : [{ state: s, events: [] }];

  // 2) 손패 정리, 잔향 확정
  const ev0: FxEvent[] = [];
  const blanks = s.hand.filter((c) => c.id === 'blank').length;
  if (blanks) addErosion(s, blanks, ev0);
  s.discard.push(...s.hand);
  s.hand = [];
  s.echo = s.lastPlayed;
  s.imprintNext = false;
  if (s.player.weak > 0) s.player.weak -= 1;
  if (s.player.vuln > 0) s.player.vuln -= 1;
  push(ev0);
  if (s.over) return steps;

  // 3) 적 단계
  for (const e of [...s.enemies]) {
    if (e.hp <= 0 || s.over) continue;
    const ev: FxEvent[] = [];
    e.block = 0;
    enemyAct(s, e, ev);
    if (e.weak > 0) e.weak -= 1;
    if (e.vuln > 0) e.vuln -= 1;
    push(ev);
  }
  if (s.over) return steps;

  // 4) 정리 & 다음 턴
  const ev1: FxEvent[] = [];
  s.clones.forEach((c) => (c.dur -= 1));
  s.clones = s.clones.filter((c) => c.dur > 0);
  s.enemies = s.enemies.filter((e) => e.hp > 0);
  s.enemies.forEach((e) => decideIntent(s, e));
  startPlayerTurn(s, ev1);
  push(ev1);
  return steps;
}

function enemyAct(s: CombatState, e: EnemyInst, ev: FxEvent[]) {
  const it = e.intent;
  const doHits = (dmg?: number, hits = 1) => {
    if (!dmg) return;
    for (let i = 0; i < hits && !s.over; i++) hitPlayer(s, e, dmg, ev);
  };
  const eBlock = (b?: number) => {
    if (!b) return;
    e.block += b;
    ev.push({ k: 'block', to: `e${e.uid}`, amt: b });
  };
  switch (it.kind) {
    case 'attack':
    case 'debuff':
    case 'buff':
      doHits(it.dmg, it.hits ?? 1);
      eBlock(it.block);
      if (it.str) { e.str += it.str; ev.push({ k: 'status', to: `e${e.uid}`, good: true, msg: `강화 +${it.str}` }); }
      if (it.weak) { s.player.weak += it.weak; ev.push({ k: 'status', to: 'player', good: false, msg: `약화 ${it.weak}` }); }
      if (it.vuln) { s.player.vuln += it.vuln; ev.push({ k: 'status', to: 'player', good: false, msg: `취약 ${it.vuln}` }); }
      return;
    case 'defend':
      eBlock(it.block);
      return;
    case 'echo': {
      const c = s.echo;
      if (!c) { eBlock(5); return; }
      const sum = summarize(c);
      ev.push({ k: 'echo', from: `e${e.uid}`, cardId: c.id });
      doHits(sum.dmg, sum.hits * (s.ctx.depth >= 2 ? 2 : 1));
      eBlock(sum.block);
      if (!sum.dmg && !sum.block) { e.str += 1; ev.push({ k: 'status', to: `e${e.uid}`, good: true, msg: '강화 +1' }); }
      return;
    }
    case 'summon': {
      const d = ENEMIES.shard;
      const hp = Math.round(d.hp[0] * depthDef(s.ctx.depth).mult);
      const m: EnemyInst = { uid: newUid(s), defId: 'shard', name: d.name, hp, maxHp: hp, block: 0, str: 0, weak: 0, vuln: 0, intent: { kind: 'attack', label: '' }, mimicked: false, turn: 0 };
      s.enemies.push(m);
      ev.push({ k: 'summon', uid: m.uid });
      return;
    }
    case 'seal':
      doHits(it.dmg, it.hits ?? 1);
      eBlock(it.block);
      if (s.sealed) { s.discard.push(s.sealed); s.sealed = null; }
      return;
  }
}
