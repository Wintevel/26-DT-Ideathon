// 흑백 선 아이콘 세트. 모두 24×24, currentColor 기준.
import type { CSSProperties } from 'react';

const P: Record<string, JSX.Element> = {
  // 스탯
  heart: <path d="M12 20 L4 12 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 20 12 Z" />,
  erosion: <><path d="M12 4 A8 8 0 0 0 12 20" /><path d="M12 4 A8 8 0 0 1 18.5 7.5" /><rect x="17" y="11" width="2.5" height="2.5" fill="currentColor" stroke="none" /><rect x="15" y="16" width="2" height="2" fill="currentColor" stroke="none" /><rect x="20" y="16" width="1.6" height="1.6" fill="currentColor" stroke="none" /><path d="M12 4 V20" strokeDasharray="1.5 2.5" /></>,
  kakpul: <><path d="M12 3 L3 17 L11 21 L21 16 Z" /><path d="M12 3 L11 21" /><path d="M3 17 L21 16" strokeDasharray="1.5 2" opacity=".6" /></>,
  mirror: <><ellipse cx="12" cy="9" rx="6" ry="7" /><path d="M12 16 V22 M9.5 22 H14.5" /><path d="M9 7 L11.5 4.8 M9 10.5 L14 6" /></>,
  deck: <><rect x="7" y="6" width="11" height="15" /><path d="M5 18 V4 H15" /></>,
  relic: <><path d="M12 3 L20 10 L12 21 L4 10 Z" /><path d="M4 10 H20 M9 10 L12 21 L15 10" /></>,
  // 의도
  sword: <><path d="M5 19 L17 7 L19 3 L15 5 L3 17" /><path d="M6 14 L10 18" /></>,
  shield: <path d="M12 3 L19 6 V12 C19 16 16 19 12 21 C8 19 5 16 5 12 V6 Z" />,
  buff: <><path d="M12 4 V20" /><path d="M6 10 L12 4 L18 10" /><path d="M6 16 L12 10 L18 16" /></>,
  debuff: <><circle cx="12" cy="12" r="8" /><path d="M7 7 L17 17" /></>,
  echo: <><path d="M9 5 C4 9 4 15 9 19" /><path d="M15 5 C20 9 20 15 15 19" /><path d="M12 3 V21" strokeDasharray="2 2" /></>,
  summon: <><circle cx="8" cy="10" r="4" /><circle cx="16" cy="10" r="4" strokeDasharray="2 2" /><path d="M4 21 C4 16 12 16 12 21 M12 21 C12 16 20 16 20 21" /></>,
  seal: <><rect x="5" y="10" width="14" height="10" /><path d="M8 10 V7 A4 4 0 0 1 16 7 V10" /><path d="M12 14 V16" /></>,
  // 노드
  combat: <><path d="M5 3 L17 15 M19 3 L7 15" /><path d="M14 18 L18 14 M10 18 L6 14" /><path d="M16 16 L20 20 M8 16 L4 20" /></>,
  elite: <><path d="M12 3 L22 20 H2 Z" /><path d="M12 9 V14 M12 17 V17.5" /></>,
  event: <><path d="M8 3 H16 L21 8 V16 L16 21 H8 L3 16 V8 Z" /><path d="M9.5 9.5 A2.5 2.5 0 1 1 12 12 V14 M12 17 V17.5" /></>,
  rest: <><path d="M15 4 A8 8 0 1 0 20 15 A6 6 0 0 1 15 4 Z" /></>,
  shop: <><path d="M4 9 H20 L18 20 H6 Z" /><path d="M8 9 L12 3 L16 9" /><path d="M10 14 H14" /></>,
  boss: <><path d="M3 18 L5 7 L9 12 L12 5 L15 12 L19 7 L21 18 Z" /><path d="M3 21 H21" /></>,
  unknown: <><circle cx="12" cy="12" r="9" strokeDasharray="2.5 2.5" /><path d="M9.5 9.5 A2.5 2.5 0 1 1 12 12 V13.5 M12 16.5 V17" /></>,
  antenna: <><path d="M12 10 V21 M8 21 H16" /><circle cx="12" cy="8" r="2" /><path d="M7 4 A7 7 0 0 0 7 12 M17 4 A7 7 0 0 1 17 12" /></>,
  twin: <><circle cx="9" cy="9" r="5" /><circle cx="15" cy="9" r="5" /><path d="M4 21 C5 16 19 16 20 21" /></>,
  bulwark: <><path d="M4 4 H20 V12 C20 17 16 20 12 22 C8 20 4 17 4 12 Z" /><path d="M12 4 V22 M4 11 H20" /></>,
  // 심도
  d0: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>,
  d1: <><path d="M3 14 C6 9 9 19 12 14 C15 9 18 19 21 14" /><path d="M3 8 C6 3 9 13 12 8 C15 3 18 13 21 8" opacity=".4" /></>,
  d2: <><path d="M20 12 A8 8 0 1 1 12 4" /><path d="M12 1 L15 4 L12 7" /><path d="M12 12 L8 9" /></>,
  d3: <><circle cx="12" cy="12" r="9" /><path d="M12 3 V21" /><path d="M8 9 V10 M16 9 L14 11" /><path d="M8 16 C10 14 12 17 16 15" /></>,
  d4: <><path d="M4 4 H10 V10 H4 Z M14 4 H20 V10 H14 Z M4 14 H10 V20 H4 Z" /><path d="M15 15 L20 20 M20 15 L15 20" /></>,
  // 메뉴·메타
  launch: <><path d="M12 2 L20 12 L12 22 L4 12 Z" /><path d="M12 7 L16 12 L12 17 L8 12 Z" /></>,
  tree: <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="13" cy="12" r="2" /><path d="M7 12 H11 M14.5 10.5 L17.5 6.5 M14.5 13.5 L17.5 17.5" /></>,
  codex: <><path d="M4 4 H11 V20 H4 Z M13 4 H20 V20 H13 Z" /><path d="M6 8 H9 M15 8 H18 M6 11 H9 M15 11 H18" /></>,
  awaken: <><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" /></>,
  edge: <><path d="M4 20 L20 4" /><path d="M14 4 H20 V10" /></>,
  dr: <><path d="M12 3 L19 6 V12 C19 16 16 19 12 21 C8 19 5 16 5 12 V6 Z" /><path d="M9 12 H15" /></>,
  recall: <><path d="M4 13 L9 4 L11 11 Z" /><path d="M13 20 L20 12 L14 10 Z" /><path d="M12 4 A8 8 0 0 1 20 9" strokeDasharray="2 2" /><path d="M18 6 L20 9 L17 10" /></>,
  opening: <><rect x="4" y="6" width="9" height="13" /><rect x="11" y="4" width="9" height="13" /></>,
  freeMimic: <><rect x="3" y="6" width="8" height="12" /><rect x="13" y="6" width="8" height="12" strokeDasharray="2 2" /><path d="M11 12 H13" /></>,
  skin: <><path d="M12 20 L4 12 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 20 12 Z" /><path d="M9 12 H15 M12 9 V15" /></>,
  sync: <><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /><path d="M12 9 V15" /></>,
  buffer: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" strokeDasharray="2 2" /></>,
  market: <><circle cx="12" cy="12" r="9" /><path d="M12 6.5 L7.5 15 L11.5 17.5 L16.5 14.5 Z M12 6.5 L11.5 17.5" /></>,
  critical: <><path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z" /></>,
  infinite: <><path d="M12 12 C9 7 3 7 3 12 C3 17 9 17 12 12 C15 7 21 7 21 12 C21 17 15 17 12 12 Z" /></>,
  archive: <><path d="M4 4 H20 V8 H4 Z M5 8 V20 H19 V8" /><path d="M10 12 H14" /></>,
  // 키워드
  draw: <><rect x="4" y="7" width="10" height="14" /><path d="M8 4 H18 V17" /><path d="M16 1.5 L18 4 L15.5 6" /></>,
  energy: <><path d="M12 3 L20 12 L12 21 L4 12 Z" /><path d="M12 8 L15 12 L12 16 L9 12 Z" fill="currentColor" stroke="none" /></>,
  exhaust: <><path d="M6 20 H18" /><path d="M8 16 L9 12 M12 16 V10 M16 16 L15 12" /><path d="M10 6 L12 3 L14 6" strokeDasharray="1.5 2" /></>,
  absorb: <><circle cx="12" cy="12" r="8" strokeDasharray="2.5 2" /><path d="M5 12 H11 M8 9 L11 12 L8 15" /><circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none" /></>,
  back: <path d="M15 5 L8 12 L15 19" />,
  fragment: <><path d="M5 4 L13 6 L9 13 Z" /><path d="M15 9 L20 15 L13 17 Z" /><path d="M6 16 L10 15 L9 21 Z" /></>,
  descend: <><path d="M4 5 H20 M6 10 H18 M8 15 H16" /><path d="M12 17 V22 M10 20 L12 22 L14 20" /></>,
};

export function Icon({ name, size = 18, stroke = 1.6, style, className }: { name: string; size?: number; stroke?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden>
      {P[name] ?? P.unknown}
    </svg>
  );
}

export const DEPTH_ICON = ['d0', 'd1', 'd2', 'd3', 'd4'];
export const SQUAD_ICON: Record<string, string> = { scout: 'antenna', resonance: 'twin', bulwark: 'bulwark' };
