// 자동 플레이로 전투 엔진이 멈추거나 터지지 않는지, 대략의 난이도를 확인
import { newRun, applyCombatResult, nextChapter, addCard } from '../src/game/run';
import { CARD_LIST } from '../src/game/data';
import { startCombat, playCard, endTurn, canPlay, canMimic, mimic, defOf } from '../src/game/engine';
import type { CombatState } from '../src/game/types';

function auto(s: CombatState): CombatState {
  let guard = 0;
  while (!s.over && guard++ < 200) {
    const e = s.enemies.find((x) => x.hp > 0 && canMimic(s, x));
    if (e && s.erosion < 70 && Math.random() < 0.5) s = mimic(s, e.uid).state;
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
    let out = 'win';
    for (let ch = 0; ch < 3 && out === 'win'; ch++) {
      if (ch > 0) run = nextChapter(run);
      const boss: [string[], 'midboss' | 'boss'] = ch < 2 ? [['veiled'], 'midboss'] : [['ark'], 'boss'];
      const encs: [string[], 'normal' | 'elite' | 'midboss' | 'boss'][] = [[ch ? ['patrol', 'mimicer'] : ['patrol'], 'normal'], [['phantom'], 'elite'], [['devourer'], 'normal'], boss];
      for (const [enc, kind] of encs) {
        const s = auto(startCombat(run, enc, kind, [], []).state);
        run = applyCombatResult(run, s);
        if (s.over !== 'win') { out = `${s.over}@ch${ch + 1}:${enc.join('+')}`; break; }
        // 보상 카드 1장, 엘리트 뒤 휴식(체력 30% 또는 침식 -10 중 급한 쪽)
        const pool = CARD_LIST.filter((c) => !c.noReward);
        run = addCard(run, pool[Math.floor(Math.random() * pool.length)].id);
        if (kind === 'elite') { if (run.erosion > 55) run.erosion -= 10; else run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * 0.3)); }
      }
    }
    const key = `${squad}:${out}`;
    results[key] = (results[key] ?? 0) + 1;
  }
}
console.log(results);
