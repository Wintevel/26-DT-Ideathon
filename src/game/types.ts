export type Cat = '전술' | '거울' | '흡수' | '상태';
export type Target = 'enemy' | 'all' | 'self' | 'none';

export interface CardDef {
  id: string;
  name: string;
  cat: Cat;
  cost: number;
  target: Target;
  text: string;
  dmg?: number;
  hits?: number;
  block?: number;
  exhaust?: boolean;
  unplayable?: boolean;
  /** 흡수 카드의 원래 주인(적 id) */
  source?: string;
  /** 일반 보상 풀에서 제외 */
  noReward?: boolean;
}

export type IntentKind = 'attack' | 'defend' | 'buff' | 'debuff' | 'echo' | 'summon' | 'seal';

export interface Intent {
  kind: IntentKind;
  label: string;
  dmg?: number;
  hits?: number;
  block?: number;
  str?: number;
  weak?: number;
  vuln?: number;
  cardId?: string;
}

export interface MimicData {
  from: string;
  fromName: string;
  intent: Intent;
}

export interface CardInst {
  uid: number;
  id: string;
  mimic?: MimicData;
  temp?: boolean;
}

export interface Fighter {
  hp: number;
  maxHp: number;
  block: number;
  str: number;
  weak: number;
  vuln: number;
}

export interface EnemyInst extends Fighter {
  uid: number;
  defId: string;
  name: string;
  intent: Intent;
  mimicked: boolean;
  turn: number;
  split?: boolean;
}

export interface Clone {
  uid: number;
  dur: number;
  imprint: CardInst | null;
}

export interface Ctx {
  relics: string[];
  meta: string[];
  depth: number;
  squad: string;
}

export type CombatOver = null | 'win' | 'lose' | 'eroded';

export interface CombatState {
  ctx: Ctx;
  kind: 'normal' | 'elite' | 'boss';
  player: Fighter & { energy: number; maxEnergy: number; reflect: boolean; anchor: boolean };
  enemies: EnemyInst[];
  clones: Clone[];
  draw: CardInst[];
  hand: CardInst[];
  discard: CardInst[];
  exhaust: CardInst[];
  turn: number;
  lastPlayed: CardInst | null;
  echo: CardInst | null;
  mimicUsed: boolean;
  mimicsThisCombat: number;
  imprintNext: boolean;
  erosion: number;
  mimickedFrom: string[];
  playCounts: Record<string, number>;
  dealt?: number;
  taken?: number;
  sealed: CardInst | null;
  scanned: string[];
  archLabel?: string;
  over: CombatOver;
  uidSeq: number;
  log: string[];
}

export type FxEvent =
  | { k: 'dmg'; to: string; amt: number; blocked: number }
  | { k: 'block'; to: string; amt: number }
  | { k: 'erosion'; amt: number }
  | { k: 'mimic'; from: string; cardUid: number }
  | { k: 'echo'; from: string; cardId: string }
  | { k: 'clone'; to: string; cardId: string }
  | { k: 'seal'; cardId: string }
  | { k: 'summon'; uid: number }
  | { k: 'text'; to: string; msg: string }
  | { k: 'status'; to: string; good: boolean; msg: string }
  | { k: 'die'; to: string };

export interface Step {
  state: CombatState;
  events: FxEvent[];
  /** 이 단계에서 행동한 적 (data-fx 키) */
  actor?: string;
}

export type NodeType = 'combat' | 'elite' | 'event' | 'rest' | 'shop' | 'boss';

export interface MapNode {
  id: string;
  stage: number;
  idx: number;
  y: number;
  type: NodeType;
  next: string[];
  encounter?: string[];
  eventId?: string;
}

export interface RunStats {
  nodesCleared: number;
  elites: number;
  bossKilled: boolean;
  newMimics: string[];
  playCounts: Record<string, number>;
  absorbed: string[];
  combats: number;
  dealt?: number;
  taken?: number;
  mimics?: number;
  turns?: number;
  kakpulEarned?: number;
  peakErosion?: number;
}

export interface RunState {
  squad: string;
  depth: number;
  hp: number;
  maxHp: number;
  deck: CardInst[];
  relics: string[];
  /** 3x3 격자에 놓인 소장품: id → 왼쪽 위 칸과 회전(0~3) */
  relicGrid?: Record<string, { r: number; c: number; rot: number }>;
  kakpul: number;
  erosion: number;
  mirrorCharges: number;
  map: MapNode[][];
  pos: string | null;
  visited: string[];
  revealAll: boolean;
  stats: RunStats;
  uidSeq: number;
}

export interface ArchiveEntry {
  at: string;
  squad: string;
  depth: number;
  cards: string[];
}

export interface MetaSave {
  fragments: number;
  unlocked: string[];
  codex: {
    cards: string[];
    relics: string[];
    enemiesSeen: string[];
    enemiesMimicked: string[];
    events: string[];
  };
  archive: ArchiveEntry[];
  runs: number;
  clears: number;
}
