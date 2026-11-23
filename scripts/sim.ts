// 자동 플레이로 전투 엔진이 멈추거나 터지지 않는지, 대략의 난이도를 확인
import { newRun, applyCombatResult } from '../src/game/run';
import { startCombat, playCard, endTurn, canPlay, canMimic, mimic, defOf } from '../src/game/engine';
import type { CombatState } from '../src/game/types';

function auto(s: CombatState): CombatState {
  let guard = 0;
  while (!s.over && guard++ < 200) {
    const e = s.enemies.find((x) => x.hp > 0 && canMimic(s, x));
    if (e && Math.random() < 0.6) s = mimic(s, e.uid).state;
    let played = true;
    while (played && !s.over) {
      played = false;
      const c = s.hand.find((h) => canPlay(s, h));
      if (c) {
        const t = s.enemies.find((x) => x.hp > 0);
        s = playCard(s, c.uid, t ? t.uid : null).state;
        played = true;
      }
    }
    if (s.over) break;
    const steps = endTurn(s);
    s = steps[steps.length - 1].state;
  }
  return s;
}

const results: Record<string, number> = {};
for (const squad of ['scout', 'resonance', 'bulwark']) {
  for (let i = 0; i < 200; i++) {
    let run = newRun(squad, 0, []);
    const encs: [string[], 'normal' | 'elite' | 'boss'][] = [[['patrol'], 'normal'], [['phantom'], 'elite'], [['patrol', 'mimicer'], 'normal'], [['devourer'], 'normal'], [['watcher', 'mimicer'], 'normal'], [['ark'], 'boss']];
    let out = 'win';
    for (const [enc, kind] of encs) {
      const s = auto(startCombat(run, enc, kind, [], []).state);
      run = applyCombatResult(run, s);
      if (s.over !== 'win') { out = `${s.over}@${enc.join('+')}`; break; }
    }
    const key = `${squad}:${out}`;
    results[key] = (results[key] ?? 0) + 1;
  }
}
console.log(results);
