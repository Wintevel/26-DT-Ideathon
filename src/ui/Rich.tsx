// 설명 문장 속 키워드를 색으로 구분해 보여준다. [카드명]은 굵게.
import type { ReactNode } from 'react';

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
  ['연산', 'nrg'], ['뽑기', 'nrg'], ['드로우', 'nrg'],
  ['소멸', 'exh'],
  ['체력', 'hp'], ['피해', 'dmg'],
];

const RE = new RegExp(`(\\[[^\\]]+\\]|${KEYWORDS.map((k) => k[0]).join('|')})`, 'g');
const MAP = Object.fromEntries(KEYWORDS);

export function Rich({ text }: { text: string }): ReactNode {
  const parts = text.split(RE);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('[') && p.endsWith(']')) return <b key={i} className="kw-ref">{p}</b>;
    const k = MAP[p];
    return k ? <span key={i} className={`kw kw-${k}`}>{p}</span> : p;
  });
}
