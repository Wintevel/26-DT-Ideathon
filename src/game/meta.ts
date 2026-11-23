import type { MetaSave } from './types';
import { META } from './data';

const KEY = 'mirror-protocol-save-v1';

export function emptySave(): MetaSave {
  return {
    fragments: 30,
    unlocked: [],
    codex: { cards: [], relics: [], enemiesSeen: [], enemiesMimicked: [], events: [] },
    archive: [],
    runs: 0,
    clears: 0,
  };
}

export function loadSave(): MetaSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as MetaSave;
    const base = emptySave();
    return { ...base, ...parsed, codex: { ...base.codex, ...parsed.codex } };
  } catch {
    return emptySave();
  }
}

export function writeSave(m: MetaSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* 저장 불가 환경에서는 메모리로만 진행 */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

type CodexKey = keyof MetaSave['codex'];
/** 새로 기록된 항목 수를 돌려준다 */
export function record(m: MetaSave, key: CodexKey, ids: string[]): { save: MetaSave; added: string[] } {
  const cur = new Set(m.codex[key]);
  const added = ids.filter((id) => !cur.has(id));
  added.forEach((id) => cur.add(id));
  return { save: { ...m, codex: { ...m.codex, [key]: [...cur] } }, added };
}

export function canUnlock(m: MetaSave, id: string) {
  const n = META[id];
  if (m.unlocked.includes(id)) return false;
  const reqOk = n.req.length === 0 || n.req.some((r) => m.unlocked.includes(r));
  return reqOk && m.fragments >= n.cost;
}
export function reqMet(m: MetaSave, id: string) {
  const n = META[id];
  return n.req.length === 0 || n.req.some((r) => m.unlocked.includes(r));
}
export function refundAll(m: MetaSave): MetaSave {
  const back = m.unlocked.reduce((a, id) => a + META[id].cost, 0);
  return { ...m, unlocked: [], fragments: m.fragments + back };
}
