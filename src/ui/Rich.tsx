// 설명 문장 속 키워드를 색으로 구분해 보여준다. [카드명]은 굵게.
import type { ReactNode } from 'react';
import { Icon } from './Icons';

export const KEYWORDS: [string, string][] = [
  ['침식', 'ero'],
  ['모사', 'mim'], ['모방', 'mim'], ['베껴', 'mim'], ['복제', 'mim'],
  ['흡수', 'abs'],
  ['분신', 'cln'], ['잔상', 'cln'], ['각인', 'cln'],
  ['반향', 'ech'], ['잔향', 'ech'], ['반사', 'ech'],
  ['차폐', 'blk'],
  ['각뿔', 'gld'],
  ['약화', 'deb'], ['취약', 'deb'], ['봉인', 'deb'], ['역상', 'deb'],
  ['강화', 'buf'], ['힘', 'buf'],
  ['행동 횟수', 'nrg'], ['뽑기', 'drw'], ['뽑는다', 'drw'], ['드로우', 'drw'],
  ['소멸', 'exh'],
  ['체력', 'hp'], ['피해', 'dmg'],
];

/** 키워드에 마우스를 올려 두면 뜨는 짧은 설명 */
export const KW_INFO: Record<string, [string, string]> = {
  ero: ['침식', '런 내내 쌓이는 게이지. 30·60·90%마다 거울·흡수 카드가 강해지지만 이름 없는 기억이 덱에 섞인다. 100%면 패배.'],
  mim: ['모사', '적의 이번 턴 의도를 손패로 복제한다. 턴당 1회, 행동 횟수 1, 침식 +3%. 모사당한 적은 그 행동의 위력이 25% 줄어든다.'],
  abs: ['흡수', '전투 후 이번 전투에서 모사한 기술 하나를 덱에 영구히 넣는다. 거울 모사 횟수를 1 쓰고 침식 +8%.'],
  cln: ['분신', '각인된 카드를 턴 끝에 한 번 더 시전하는 거울상. 내구가 있어 적 공격을 대신 받기도 한다.'],
  ech: ['반향', '반향 의도의 적은 내가 이번 턴 마지막으로 낸 카드를 그대로 따라 쓴다. 약한 카드를 마지막에 내 미끼로 쓰자.'],
  ref: ['반사', '이번 턴 받은 피해만큼 공격자에게 되돌려준다.'],
  blk: ['차폐', '받는 피해를 먼저 막는다. 내 턴이 시작되면 사라진다.'],
  gld: ['각뿔', '상점에서 쓰는 화폐. 카드·소장품 구매, 카드 소거, 침식 정화에 쓴다.'],
  weak: ['약화', '주는 공격 피해가 25% 줄어든다. 턴마다 1씩 감소.'],
  vuln: ['취약', '받는 공격 피해가 50% 늘어난다. 턴마다 1씩 감소.'],
  seal: ['봉인 · 역상', '아크가 체력 절반 아래에서 쓰는 패턴. 내 손패 1장을 봉인하고 그 카드를 자기가 강화해 사용한다.'],
  buf: ['강화', '공격 카드의 피해가 수치만큼 늘어난다.'],
  nrg: ['행동 횟수', '카드와 모사에 쓰는 자원. 매 턴 3으로 회복된다.'],
  drw: ['뽑기', '남은 덱 맨 위에서 카드를 손패로 가져온다. 남은 덱이 비면 버린 카드를 섞어 채운다.'],
  dmg: ['피해', '대상의 차폐를 먼저 깎고, 남은 만큼 체력을 깎는다.'],
  hp: ['체력', '0이 되면 작전이 끝난다.'],
  exh: ['소멸', '사용하면 이번 전투 동안 덱에서 빠진다.'],
};
const INFO_KEY: Record<string, string> = {
  침식: 'ero', 모사: 'mim', 모방: 'mim', 베껴: 'mim', 복제: 'mim', 흡수: 'abs', 분신: 'cln', 잔상: 'cln', 각인: 'cln',
  반향: 'ech', 잔향: 'ech', 반사: 'ref', 차폐: 'blk', 각뿔: 'gld', 약화: 'weak', 취약: 'vuln', 봉인: 'seal', 역상: 'seal',
  강화: 'buf', 힘: 'buf', '행동 횟수': 'nrg', 뽑기: 'drw', 뽑는다: 'drw', 드로우: 'drw', 소멸: 'exh', 피해: 'dmg', 체력: 'hp',
};

/** 키워드 앞에 붙는 작은 아이콘 */
const KW_ICON: Record<string, string> = {
  ero: 'erosion', mim: 'mirror', abs: 'absorb', cln: 'twin', ech: 'echo', blk: 'shield', gld: 'kakpul',
  deb: 'debuff', buf: 'buff', nrg: 'energy', drw: 'draw', exh: 'exhaust', hp: 'heart', dmg: 'sword',
};

const RE = new RegExp(`(\\[[^\\]]+\\]|${KEYWORDS.map((k) => k[0]).join('|')})`, 'g');
const MAP = Object.fromEntries(KEYWORDS);

export function Rich({ text }: { text: string }): ReactNode {
  // 숫자% 바로 뒤 조사에서 줄이 끊기지 않게 단어 결합자를 넣는다
  const parts = text.replace(/%(?=[가-힣])/g, '%\u2060').split(RE);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('[') && p.endsWith(']')) return <b key={i} className="kw-ref">{p}</b>;
    const k = MAP[p];
    return k ? <span key={i} className={`kw kw-${k}`} data-kw={INFO_KEY[p] ?? undefined}>{KW_ICON[k] && <Icon name={KW_ICON[k]} size={11} stroke={2} className="kw-ic" />}{p}</span> : p;
  });
}
