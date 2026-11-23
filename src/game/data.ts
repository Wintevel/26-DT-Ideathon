import type { CardDef, Intent, EnemyInst, CombatState } from './types';

// ─── 카드 ──────────────────────────────────────────────
const list: CardDef[] = [
  // 전술
  { id: 'cut', name: '절단', cat: '전술', cost: 1, target: 'enemy', dmg: 6, text: '피해 6' },
  { id: 'guard', name: '차폐 전개', cat: '전술', cost: 1, target: 'self', block: 5, text: '차폐 5' },
  { id: 'observe', name: '관측', cat: '전술', cost: 0, target: 'self', block: 2, text: '카드 1장 뽑기. 차폐 2' },
  { id: 'double', name: '이중 절개', cat: '전술', cost: 1, target: 'enemy', dmg: 4, hits: 2, text: '피해 4 × 2' },
  { id: 'wave', name: '충격 파동', cat: '전술', cost: 2, target: 'all', dmg: 8, text: '모든 적에게 피해 8' },
  { id: 'focus', name: '집중 연산', cat: '전술', cost: 0, target: 'self', exhaust: true, text: '연산 +1. 소멸' },
  { id: 'pierce', name: '관통 사격', cat: '전술', cost: 2, target: 'enemy', dmg: 10, text: '피해 10. 취약 2' },
  { id: 'feint', name: '교란', cat: '전술', cost: 1, target: 'enemy', text: '약화 2. 카드 1장 뽑기' },
  // 거울
  { id: 'mimicSlash', name: '모방 참격', cat: '거울', cost: 1, target: 'enemy', text: '대상의 공격 의도를 그대로 베껴 즉시 가한다(없으면 피해 5). 침식 +1' },
  { id: 'compose', name: '자아 정돈', cat: '거울', cost: 1, target: 'self', block: 3, exhaust: true, text: '침식 −6%. 차폐 3. 소멸' },
  { id: 'afterimage', name: '잔상 복제', cat: '거울', cost: 1, target: 'self', text: '분신 1기 소환(내구 2). 다음에 쓰는 카드를 분신에 각인' },
  { id: 'twin', name: '쌍둥이 베기', cat: '거울', cost: 2, target: 'enemy', dmg: 7, text: '피해 7. 분신이 있으면 2회' },
  { id: 'symmetry', name: '대칭 반격', cat: '거울', cost: 1, target: 'self', block: 3, text: '차폐 3. 이번 턴 받는 피해를 공격자에게 그대로 반사' },
  { id: 'anchor', name: '원형의 닻', cat: '거울', cost: 2, target: 'self', block: 6, exhaust: true, text: '차폐 6. 이번 전투 동안 침식 증가 무효. 소멸' },
  { id: 'crack', name: '거울 균열', cat: '거울', cost: 1, target: 'enemy', dmg: 4, text: '피해 4. 침식 10%당 피해 +2' },
  { id: 'invert', name: '반전 장벽', cat: '거울', cost: 1, target: 'self', block: 5, text: '차폐 5. 침식 10%당 차폐 +1' },
  // 흡수 (적에게서만 획득)
  { id: 'patrolShot', name: '순찰 사격', cat: '흡수', cost: 1, target: 'enemy', dmg: 5, block: 3, source: 'patrol', noReward: true, text: '피해 5. 차폐 3' },
  { id: 'wildStrike', name: '불확정 일격', cat: '흡수', cost: 1, target: 'enemy', dmg: 7, source: 'mimicer', noReward: true, text: '피해 3~12 (무작위)' },
  { id: 'silence', name: '침묵 신호', cat: '흡수', cost: 1, target: 'enemy', dmg: 4, source: 'watcher', noReward: true, text: '피해 4. 약화 2, 취약 1' },
  { id: 'devour', name: '굴절 포식', cat: '흡수', cost: 1, target: 'self', exhaust: true, source: 'devourer', noReward: true, text: '강화 +2. 소멸' },
  { id: 'phantomEcho', name: '팬텀 잔향', cat: '흡수', cost: 1, target: 'enemy', source: 'phantom', noReward: true, text: '직전에 쓴 카드를 한 번 더 시전' },
  { id: 'shardRain', name: '잔상 낙하', cat: '흡수', cost: 0, target: 'all', dmg: 3, source: 'shard', noReward: true, text: '모든 적에게 피해 3' },
  // 상태
  { id: 'blank', name: '이름 없는 기억', cat: '상태', cost: 0, target: 'none', unplayable: true, noReward: true, text: '사용 불가. 턴 종료 시 손에 있으면 침식 +1%' },
];
export const CARDS: Record<string, CardDef> = Object.fromEntries(list.map((c) => [c.id, c]));
export const CARD_LIST = list;
export const MIMIC_DEF: CardDef = { id: 'mimic', name: '모사', cat: '거울', cost: 0, target: 'enemy', exhaust: true, noReward: true, text: '' };

// ─── 소장품 ────────────────────────────────────────────
export interface RelicDef { id: string; name: string; text: string; pool: 'squad' | 'elite' }
const relicList: RelicDef[] = [
  { id: 'focuser', name: '각뿔 집속기', pool: 'squad', text: '모사할 때 침식 증가량이 +3%에서 +1%로 줄어든다' },
  { id: 'capacitor', name: '거울 축전기', pool: 'squad', text: '분신이 각인 카드를 시전할 때 피해 +30%' },
  { id: 'plate', name: '전술 방탄판', pool: 'squad', text: '모사당한 적의 공격 위력이 25%가 아니라 50% 감소' },
  { id: 'lens', name: '균열 렌즈', pool: 'elite', text: '모사 카드의 피해 +3' },
  { id: 'coil', name: '반사 코일', pool: 'elite', text: '매 턴 시작 시 차폐 2' },
  { id: 'antenna', name: '탐색 안테나', pool: 'elite', text: '전투 첫 턴에 카드 1장 추가로 뽑음' },
];
export const RELICS: Record<string, RelicDef> = Object.fromEntries(relicList.map((r) => [r.id, r]));
export const RELIC_LIST = relicList;

// ─── 적 ────────────────────────────────────────────────
export interface EnemyDef {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss' | 'minion';
  hp: [number, number];
  desc: string;
  pattern: (e: EnemyInst, s: CombatState) => Intent;
}
const enemyList: EnemyDef[] = [
  {
    id: 'patrol', name: '외곽 격벽 순찰대', tier: 'normal', hp: [30, 34],
    desc: '공격과 방어를 번갈아 한다. 모사 입문용 복제체.',
    pattern: (e) => (e.turn % 2 === 1 ? { kind: 'attack', label: '사격', dmg: 8 } : { kind: 'attack', label: '엄폐 사격', dmg: 4, block: 6 }),
  },
  {
    id: 'mimicer', name: '공허 모방체', tier: 'normal', hp: [24, 28],
    desc: '의도가 불안정하다. 큰 한 방과 연타 중 하나를 고른다.',
    pattern: () => (Math.random() < 0.5 ? { kind: 'attack', label: '불확정 일격', dmg: 11 } : { kind: 'attack', label: '떨리는 손톱', dmg: 4, hits: 2 }),
  },
  {
    id: 'watcher', name: '침묵 감시자', tier: 'normal', hp: [34, 38],
    desc: '신호를 끊어 약화시킨 뒤 공격한다.',
    pattern: (e) => (e.turn % 2 === 1 ? { kind: 'debuff', label: '침묵 신호', dmg: 5, weak: 2 } : { kind: 'attack', label: '감시 사격', dmg: 9 }),
  },
  {
    id: 'devourer', name: '굴절 포식체', tier: 'normal', hp: [40, 44],
    desc: '빛을 삼켜 점점 강해진다.',
    pattern: (e) => ((e.turn - 1) % 3 === 0 ? { kind: 'buff', label: '굴절 포식', str: 3 } : { kind: 'attack', label: '포식', dmg: 6 }),
  },
  {
    id: 'phantom', name: '정예 팬텀', tier: 'elite', hp: [68, 74],
    desc: '당신이 마지막에 낸 카드를 반향해 그대로 따라 쓴다. 체력이 절반이 되면 잔상을 낳는다.',
    pattern: (e) => {
      const p = (e.turn - 1) % 4;
      if (p === 0 || p === 2) return { kind: 'echo', label: '반향' };
      if (p === 1) return { kind: 'attack', label: '팬텀 베기', dmg: 13 };
      return { kind: 'attack', label: '잔향 장막', dmg: 6, block: 10 };
    },
  },
  {
    id: 'shard', name: '팬텀 잔상', tier: 'minion', hp: [16, 16],
    desc: '팬텀이 분열하며 남긴 조각.',
    pattern: () => ({ kind: 'attack', label: '파편', dmg: 5 }),
  },
  {
    id: 'ark', name: '거울 파수꾼 · 아크', tier: 'boss', hp: [120, 120],
    desc: '당신의 런 기록을 스캔해 당신의 덱으로 싸운다. 체력이 절반이 되면 역상: 손패를 봉인해 대신 사용한다.',
    pattern: () => ({ kind: 'attack', label: '-', dmg: 1 }), // 엔진에서 직접 처리
  },
];
export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(enemyList.map((e) => [e.id, e]));
export const ENEMY_LIST = enemyList;
export const ABSORB_OF: Record<string, string> = Object.fromEntries(
  list.filter((c) => c.source).map((c) => [c.source as string, c.id]),
);

export const ENCOUNTERS_EARLY: string[][] = [['patrol'], ['mimicer'], ['watcher']];
export const ENCOUNTERS: string[][] = [
  ['patrol', 'mimicer'], ['watcher', 'patrol'], ['devourer'], ['mimicer', 'mimicer'], ['devourer', 'mimicer'], ['watcher', 'mimicer'],
];

// ─── 분대 ──────────────────────────────────────────────
export interface SquadDef { id: string; code: string; name: string; tag: string; desc: string; cards: string[]; relic: string; maxHp: number; kakpul: number; erosion: number; perks: string[] }
export const SQUADS: SquadDef[] = [
  {
    id: 'scout', code: 'SQUAD-01', name: '기동 관측 분대', tag: '관찰자 · 정밀 모사', desc: '적게, 정확하게 베낀다. 침식을 낮게 유지하며 오래 버틴다.',
    cards: ['mimicSlash', 'compose'], relic: 'focuser', maxHp: 75, kakpul: 45, erosion: 0,
    perks: ['시작 각뿔 +45', '시작 덱에 [모방 참격], [자아 정돈]', '소장품 [각뿔 집속기]'],
  },
  {
    id: 'resonance', code: 'SQUAD-02', name: '거울 공명 분대', tag: '분신술사 · 침식 연료', desc: '분신이 카드를 한 번 더 시전한다. 침식을 연료 삼아 폭발한다.',
    cards: ['afterimage', 'twin'], relic: 'capacitor', maxHp: 75, kakpul: 0, erosion: 20,
    perks: ['시작 덱에 [잔상 복제], [쌍둥이 베기]', '소장품 [거울 축전기]', '초기 침식 +20%'],
  },
  {
    id: 'bulwark', code: 'SQUAD-03', name: '중장 대칭 분대', tag: '거울 방패 · 반사', desc: '적의 행동을 그대로 되돌려준다. 침식을 묶어 두고 버틴다.',
    cards: ['symmetry', 'anchor'], relic: 'plate', maxHp: 92, kakpul: 0, erosion: 0,
    perks: ['최대 체력 92', '시작 덱에 [대칭 반격], [원형의 닻]', '소장품 [전술 방탄판]'],
  },
];
export const BASE_DECK = ['cut', 'cut', 'cut', 'cut', 'guard', 'guard', 'guard', 'guard', 'observe'];

// ─── 심도 ──────────────────────────────────────────────
export const DEPTHS = [
  { lv: 0, name: '표준 관측', mult: 1, frag: 1, rule: '기본 규칙. 거울 프로토콜의 모사와 침식을 익힙니다.' },
  { lv: 1, name: '왜곡 반사', mult: 1.2, frag: 1.25, rule: '일반 적도 3턴마다 당신의 마지막 카드를 반향합니다.' },
  { lv: 2, name: '거울 역행', mult: 1.38, frag: 1.5, rule: '반향이 카드를 두 번 따라 씁니다.' },
  { lv: 3, name: '자아 침식', mult: 1.58, frag: 1.75, rule: '모든 침식 증가량 ×1.5.' },
  { lv: 4, name: '원형 붕괴', mult: 1.8, frag: 2, rule: '아크가 카드 5장을 스캔하고 처음부터 역상 상태입니다.' },
];

// ─── 우위 트리 ─────────────────────────────────────────
export interface MetaNode { id: string; name: string; cost: number; req: string[]; x: number; y: number; core?: boolean; text: string }
export const META_TREE: MetaNode[] = [
  { id: 'awaken', name: '프로토콜 각성', cost: 15, req: [], x: 8, y: 50, core: true, text: '모든 작전 시작 시 최대 체력 +8, 각뿔 +15' },
  { id: 'edge', name: '검격 출력 보정', cost: 10, req: ['awaken'], x: 27, y: 20, text: '전술 카드 피해 +1' },
  { id: 'dr', name: '피해 감면', cost: 10, req: ['awaken'], x: 27, y: 50, text: '받는 피해 5% 감소' },
  { id: 'recall', name: '기억 회수 효율', cost: 10, req: ['awaken'], x: 27, y: 80, text: '기억 파편 획득 +15%' },
  { id: 'opening', name: '선제 기동 패', cost: 15, req: ['edge'], x: 46, y: 20, text: '전투 첫 턴 카드 1장 추가 드로우' },
  { id: 'freeMimic', name: '무상 거울 모사', cost: 25, req: ['dr'], x: 46, y: 50, core: true, text: '전투마다 첫 모사의 연산 비용 0' },
  { id: 'skin', name: '생체 외피 강화', cost: 15, req: ['recall'], x: 46, y: 80, text: '최대 체력 +10' },
  { id: 'sync', name: '분신 동조화', cost: 20, req: ['opening', 'freeMimic'], x: 66, y: 28, text: '분신이 각인 카드를 시전할 때마다 차폐 +2' },
  { id: 'buffer', name: '자아 완충 회로', cost: 20, req: ['freeMimic'], x: 66, y: 50, text: '침식 구간 경계가 10%씩 늦춰짐 (동요 40%부터)' },
  { id: 'market', name: '암시장 우대권', cost: 15, req: ['freeMimic', 'skin'], x: 66, y: 72, text: '상점 가격 25% 할인' },
  { id: 'critical', name: '임계 연산', cost: 20, req: ['sync'], x: 86, y: 22, text: '전투 첫 턴 연산 +1' },
  { id: 'infinite', name: '무한 대칭 프로토콜', cost: 40, req: ['sync', 'buffer', 'market'], x: 86, y: 50, core: true, text: '거울 모사(흡수) 횟수 +1, 대칭 반격 비용 −1' },
  { id: 'archive', name: '원형 데이터 수집', cost: 20, req: ['market'], x: 86, y: 78, text: '아크 처치 시 기억 파편 +10' },
];
export const META: Record<string, MetaNode> = Object.fromEntries(META_TREE.map((n) => [n.id, n]));

// ─── 우연한 만남 ───────────────────────────────────────
export interface EventDef { id: string; name: string; text: string; options: { label: string; desc: string }[] }
export const EVENTS: EventDef[] = [
  {
    id: 'mirrorSelf', name: '거울 속의 나', text: '깨진 거울 너머의 내가 손을 내민다. "네 카드 하나와 내 것 하나를 바꾸자."',
    options: [
      { label: '교환한다', desc: '덱의 무작위 카드 1장이 무작위 흡수 카드로 바뀜. 침식 +5%' },
      { label: '거울을 덮는다', desc: '아무 일도 일어나지 않음' },
    ],
  },
  {
    id: 'antenna', name: '버려진 안테나', text: '녹슨 안테나가 아직 미약한 신호를 잡고 있다.',
    options: [
      { label: '주파수를 맞춘다', desc: '이번 구역 지도 전체 공개. 각뿔 +15' },
      { label: '부품을 뜯는다', desc: '각뿔 +40. 침식 +5%' },
    ],
  },
  {
    id: 'broken', name: '깨진 원형', text: '바닥에 흩어진 거울 조각마다 다른 얼굴이 비친다. 하나를 고르면 나머지는 사라질 것이다.',
    options: [
      { label: '조각을 줍는다', desc: '체력 −8. 침식 −12%' },
      { label: '지나친다', desc: '아무 일도 일어나지 않음' },
    ],
  },
  {
    id: 'whisper', name: '잔상의 속삭임', text: '누군가 내 목소리로 속삭인다. "더 많이 베껴. 그게 너잖아."',
    options: [
      { label: '받아들인다', desc: '거울 모사 횟수 +1. 침식 +6%' },
      { label: '귀를 막는다', desc: '체력 6 회복' },
    ],
  },
  {
    id: 'nameless', name: '이름 없는 방', text: '문패가 지워진 방. 여기에 무언가를 두고 가면 다시는 찾을 수 없다.',
    options: [
      { label: '카드를 두고 간다', desc: '덱에서 카드 1장 제거' },
      { label: '이름을 새긴다', desc: '침식 −5%' },
    ],
  },
];
export const EVENT_MAP: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
