// 소장품 3x3 격자: 블럭 회전, 배치 가능 여부, 자동 배치, 발동 중인 소장품 목록
import { RELICS } from './data';
import type { RunState } from './types';

export const GRID = 3;
export type Placement = { r: number; c: number; rot: number };

/** 회전한 뒤 왼쪽 위가 (0,0)이 되게 맞춘 칸 목록 */
export function cellsOf(id: string, rot: number): [number, number][] {
  let cells = RELICS[id].shape.map(([r, c]) => [r, c] as [number, number]);
  for (let k = 0; k < ((rot % 4) + 4) % 4; k++) cells = cells.map(([r, c]) => [c, -r]);
  const mr = Math.min(...cells.map((x) => x[0]));
  const mc = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - mr, c - mc]);
}

export function occupied(grid: Record<string, Placement>, except?: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const [id, p] of Object.entries(grid)) {
    if (id === except) continue;
    for (const [r, c] of cellsOf(id, p.rot)) m.set(`${p.r + r},${p.c + c}`, id);
  }
  return m;
}

export function canPlace(grid: Record<string, Placement>, id: string, p: Placement): boolean {
  const occ = occupied(grid, id);
  return cellsOf(id, p.rot).every(([r, c]) => {
    const R = p.r + r, C = p.c + c;
    return R >= 0 && C >= 0 && R < GRID && C < GRID && !occ.has(`${R},${C}`);
  });
}

/** 빈 자리를 찾아 넣는다. 자리가 없으면 격자를 그대로 둔다. */
export function autoPlace(grid: Record<string, Placement>, id: string): Record<string, Placement> {
  for (let rot = 0; rot < 4; rot++)
    for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++)
        if (canPlace(grid, id, { r, c, rot })) return { ...grid, [id]: { r, c, rot } };
  return grid;
}

/** 격자에 놓여 효과가 발동 중인 소장품. 예전 저장 데이터(격자 없음)는 전부 발동으로 본다. */
export function activeRelics(run: Pick<RunState, 'relics' | 'relicGrid'>): string[] {
  if (!run.relicGrid) return run.relics;
  return run.relics.filter((id) => id in run.relicGrid!);
}
