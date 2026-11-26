// 진행 중인 작전(런)을 브라우저에 저장. 저장소가 막혀 있어도 게임은 계속 돌아가게 한다.
import type { RunState } from '../game/types';

const KEY = 'mirror-protocol-run-v1';

export function saveRun(r: RunState) {
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* 저장 불가 환경 */ }
}
export function loadRun(): RunState | null {
  try { const s = localStorage.getItem(KEY); const r = s ? (JSON.parse(s) as RunState) : null; return r && r.chapter !== undefined ? r : null; /* 챕터 도입 전 저장은 버린다 */ } catch { return null; }
}
export function clearRun() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
}
