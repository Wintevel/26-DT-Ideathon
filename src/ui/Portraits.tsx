// 캐릭터·적 프로필: 좌우 대칭 문장(紋章)형 선화. 흑백 + 빗금, 위험 신호만 붉게.
// 중간 보스는 천을 뒤집어쓴 내 탐사, 최종 보스 아크는 얼굴 없는 관측자.
import { useId, type ReactNode } from 'react';

const FG = 'var(--fg)';
const BG = 'var(--bg)';
const G1 = '#8b8b86';
const G2 = '#3d3d3a';
const RED = 'var(--danger)';

type P = { h: string; d: string };

/** 왼쪽 반을 그리면 오른쪽에 거울로 복제한다 */
const Sym = ({ children }: { children: ReactNode }) => (
  <>
    <g>{children}</g>
    <g transform="translate(120 0) scale(-1 1)">{children}</g>
  </>
);

function Frame() {
  return (
    <g>
      <circle cx="60" cy="58" r="50" fill="none" stroke={G2} strokeDasharray="1.5 3" />
      <path d="M3 13 V3 H13 M107 3 H117 V13 M117 107 V117 H107 M13 117 H3 V107" fill="none" stroke={G1} strokeWidth="1" />
      <path d="M60 1 V6 M1 58 H6 M114 58 H119" stroke={G1} strokeWidth="1" />
    </g>
  );
}

function Label({ code }: { code: string }) {
  if (!code) return null;
  const w = code.length * 3.9 + 5;
  return (
    <g>
      <rect x="4" y="107.5" width={w} height="9" fill={BG} stroke={G2} strokeWidth=".6" />
      <text x="6.5" y="114" fontFamily="IBM Plex Mono, monospace" fontSize="6" letterSpacing=".4" fill={G1}>{code}</text>
    </g>
  );
}

// ─── 분대 ────────────────────────────────────────────
function Scout({ h }: P) {
  return (
    <g>
      <path d="M12 120 C16 100 32 92 48 90 L60 98 L72 90 C88 92 104 100 108 120 Z" fill={h} stroke={FG} strokeWidth="1.2" />
      <path d="M46 90 L60 106 L74 90" fill="none" stroke={FG} strokeWidth="1.6" />
      <rect x="52" y="78" width="16" height="13" fill={BG} stroke={FG} strokeWidth="1.2" />
      <Sym>
        <path d="M74 26 L90 6" stroke={FG} strokeWidth="1.6" />
        <path d="M80 18 L86 20" stroke={FG} strokeWidth="1.2" />
        <rect x="86" y="44" width="5" height="14" fill={FG} />
        <path d="M80 58 L87 56 L85 72 L74 79 Z" fill={h} stroke={FG} strokeWidth="1" />
      </Sym>
      <circle cx="90" cy="6" r="2.6" fill={RED} className="pt-blink" />
      <circle cx="30" cy="6" r="2.2" fill={FG} />
      <path d="M60 20 C80 20 88 36 88 52 C88 70 76 82 60 82 C44 82 32 70 32 52 C32 36 40 20 60 20 Z" fill={BG} stroke={FG} strokeWidth="2" />
      <path d="M35 42 C39 24 81 24 85 42 L78 42 C74 31 46 31 42 42 Z" fill={FG} />
      <circle cx="60" cy="55" r="15" fill={FG} />
      <circle cx="60" cy="55" r="11" fill={BG} />
      <circle cx="60" cy="55" r="7" fill="none" stroke={G1} strokeWidth=".8" />
      <g className="pt-spin" style={{ transformOrigin: '60px 55px' }}>
        <path d="M60 55 L60 44 A11 11 0 0 1 69.5 49.5 Z" fill={RED} opacity=".75" />
      </g>
      <circle cx="60" cy="55" r="2" fill={FG} />
      <path d="M54 110 L60 104 L66 110 L60 116 Z" fill="none" stroke={BG} strokeWidth="1.4" />
    </g>
  );
}

function Resonance({ h }: P) {
  return (
    <g>
      <path d="M60 8 V118" stroke={FG} strokeWidth=".8" />
      <path d="M56 12 H64 M57 30 H63 M57 88 H63" stroke={FG} strokeWidth=".8" />
      <path d="M10 120 C14 100 30 92 48 90 L60 96 V120 Z" fill={FG} />
      <path d="M60 96 L72 90 C90 92 106 100 110 120 H60 Z" fill={h} stroke={FG} strokeWidth="1" strokeDasharray="3 2" />
      <g className="pt-drift" opacity=".45">
        <path d="M68 22 C86 22 96 36 96 52 C96 70 84 82 68 82" fill="none" stroke={FG} strokeWidth="1" strokeDasharray="2 2" />
      </g>
      <path d="M60 22 C42 22 32 36 32 52 C32 70 44 82 60 82 Z" fill={FG} />
      <path d="M60 22 C78 22 88 36 88 52 C88 70 76 82 60 82 Z" fill={BG} stroke={FG} strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M60 30 C72 30 80 40 80 52" fill="none" stroke={G1} strokeWidth=".8" />
      <rect x="39" y="50" width="13" height="3.2" fill={BG} />
      <rect x="68" y="50" width="13" height="3.2" fill={RED} className="pt-blink" />
      <path d="M44 68 H56" stroke={BG} strokeWidth="1.4" />
      <path d="M64 68 H76" stroke={FG} strokeWidth="1" strokeDasharray="2 2" />
      <path d="M60 4 L63 8 L60 12 L57 8 Z" fill={FG} />
    </g>
  );
}

function Bulwark({ h }: P) {
  return (
    <g>
      <Sym>
        <path d="M62 92 L96 86 L113 100 L109 120 H62 Z" fill={h} stroke={FG} strokeWidth="1.4" />
        <circle cx="98" cy="96" r="1.6" fill={FG} />
        <circle cx="104" cy="106" r="1.6" fill={FG} />
        <path d="M84 26 V62 C84 74 72 84 60 88" fill="none" stroke={FG} strokeWidth="2" />
      </Sym>
      <path d="M44 92 H76 L72 120 H48 Z" fill={FG} />
      <path d="M60 97 L68 106 L60 115 L52 106 Z" fill={BG} />
      <path d="M60 101 L64 106 L60 111 L56 106 Z" fill={FG} />
      <path d="M60 16 L84 26 V62 C84 74 72 84 60 88 C48 84 36 74 36 62 V26 Z" fill={h} />
      <path d="M60 16 L84 26 M60 16 L36 26" stroke={FG} strokeWidth="2" />
      <path d="M60 24 L77 32 V60 C77 70 69 77 60 81 C51 77 43 70 43 60 V32 Z" fill={FG} />
      <rect x="46" y="44" width="28" height="4" fill={BG} />
      <rect x="58" y="44" width="4" height="22" fill={BG} />
      <rect x="46" y="44" width="5" height="4" fill={RED} className="pt-scan" />
      <path d="M60 4 L63.5 16 H56.5 Z" fill={FG} />
    </g>
  );
}

const SQUAD_ART: Record<string, (p: P) => JSX.Element> = { scout: Scout, resonance: Resonance, bulwark: Bulwark };
const SQUAD_CODE: Record<string, string> = { scout: 'SQ-01 OBS', resonance: 'SQ-02 RES', bulwark: 'SQ-03 BLW' };

// ─── 적 ──────────────────────────────────────────────
function Patrol({ h }: P) {
  return (
    <g>
      <path d="M16 120 L22 96 L48 90 H72 L98 96 L104 120 Z" fill={h} stroke={FG} strokeWidth="1.2" />
      <rect x="49" y="91" width="22" height="10" fill={FG} />
      <text x="60" y="98.5" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" fontWeight="700" fill={BG}>P-07</text>
      <path d="M36 60 C36 36 46 24 60 24 C74 24 84 36 84 60 V70 L76 80 H44 L36 70 Z" fill={FG} />
      <path d="M60 24 V38" stroke={BG} strokeWidth="1.4" />
      <rect x="38" y="50" width="44" height="9" fill={BG} />
      <circle className="pt-scanred" cx="45" cy="54.5" r="2.5" fill={RED} />
      <path d="M48 66 V75 M54 66 V75 M60 66 V75 M66 66 V75 M72 66 V75" stroke={BG} strokeWidth="1.6" />
      <Sym><path d="M84 54 H90 V64 H84" fill="none" stroke={FG} strokeWidth="1.4" /></Sym>
      <path d="M14 120 L110 90" stroke={G2} strokeWidth="6" />
      <path d="M14 120 L110 90" stroke={FG} strokeWidth="1.4" />
    </g>
  );
}

function Mimicer({ h, d }: P) {
  return (
    <g>
      <defs>
        <linearGradient id={`${d}-m`} x1="0" y1="0" x2=".6" y2="1">
          <stop offset="0" stopColor={FG} />
          <stop offset=".55" stopColor={G1} />
          <stop offset="1" stopColor={G2} />
        </linearGradient>
      </defs>
      <path className="pt-wobble" d="M60 10 C90 8 106 34 100 60 C96 80 108 96 98 112 C86 122 34 122 22 112 C12 96 24 80 20 60 C14 34 30 12 60 10 Z" fill="none" stroke={G1} strokeWidth="1" strokeDasharray="2 3" />
      <ellipse cx="60" cy="56" rx="25" ry="32" fill={`url(#${d}-m)`} />
      <ellipse cx="60" cy="56" rx="25" ry="32" fill={h} opacity=".5" />
      <ellipse cx="60" cy="56" rx="25" ry="32" fill="none" stroke={FG} strokeWidth="1.6" />
      <path d="M44 34 Q50 26 60 25" fill="none" stroke={BG} strokeWidth="2" strokeLinecap="round" />
      <path d="M60 26 V86" stroke={BG} strokeWidth=".7" opacity=".6" />
      <Sym><path d="M43 52 Q50 45 56 52 Q50 57 43 52 Z" fill={BG} /></Sym>
      <circle cx="67" cy="52" r="1.8" fill={RED} className="pt-look" />
      <g stroke={FG} strokeWidth="2" strokeLinecap="round">
        <path d="M50 86 V96" /><path d="M60 88 V104" /><path d="M70 86 V93" />
      </g>
      <circle cx="50" cy="98.5" r="2" fill={FG} />
      <circle cx="60" cy="107" r="2.5" fill={FG} />
      <circle cx="70" cy="95.5" r="1.7" fill={FG} />
    </g>
  );
}

function Watcher({ h }: P) {
  return (
    <g>
      <circle cx="60" cy="56" r="46" fill="none" stroke={G1} strokeDasharray="2 3" />
      <circle cx="60" cy="56" r="40" fill={BG} stroke={FG} strokeWidth="1.6" />
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} transform={`rotate(${i * 15} 60 56)`} d={i % 2 ? 'M60 16 V19' : 'M60 16 V22'} stroke={FG} strokeWidth="1" />
      ))}
      <g className="pt-spin-slow" style={{ transformOrigin: '60px 56px' }}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} transform={`rotate(${a} 60 56)`} d="M60 24 L82 36 L62 42 Z" fill={h} stroke={FG} strokeWidth=".9" />
        ))}
      </g>
      <circle cx="60" cy="56" r="14" fill={BG} stroke={FG} strokeWidth="2" />
      <g className="pt-look">
        <circle cx="60" cy="56" r="8" fill={RED} />
        <circle cx="60" cy="56" r="3.2" fill={BG} />
        <circle cx="57.5" cy="53.5" r="1.4" fill={FG} />
      </g>
      <path d="M52 100 L60 114 L68 100" fill="none" stroke={FG} strokeWidth="1.2" />
    </g>
  );
}

function Devourer({ h }: P) {
  return (
    <g>
      <circle cx="60" cy="58" r="50" fill="none" stroke={FG} strokeWidth=".8" strokeDasharray="1 3" />
      <circle cx="60" cy="58" r="44" fill={FG} />
      <circle cx="60" cy="58" r="44" fill={h} opacity=".35" />
      {[-60, -30, 0, 30, 60].map((a) => (
        <circle key={a} transform={`rotate(${a} 60 58)`} cx="60" cy="19" r={a === 0 ? 2.8 : 2.2} fill={RED} />
      ))}
      <g className="pt-chomp" style={{ transformOrigin: '60px 60px' }}>
        <circle cx="60" cy="60" r="30" fill={BG} />
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} transform={`rotate(${i * 22.5} 60 60)`} d="M60 30 L64.5 43 L55.5 43 Z" fill={FG} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={'i' + i} transform={`rotate(${i * 30 + 15} 60 60)`} d="M60 44 L62.6 51 L57.4 51 Z" fill={G1} />
        ))}
        <circle cx="60" cy="60" r="4.5" fill={RED} opacity=".85" />
      </g>
    </g>
  );
}

function Phantom({ h }: P) {
  return (
    <g>
      <path d="M60 10 C34 10 26 40 28 66 L18 116 H102 L92 66 C94 40 86 10 60 10 Z" fill={h} stroke={FG} strokeWidth="1.6" />
      <path d="M60 10 C48 22 44 40 46 58 M60 10 C72 22 76 40 74 58" fill="none" stroke={FG} strokeWidth=".8" />
      <path d="M18 116 L26 106 L34 116 L42 104 L50 116 L58 106 L66 116 L74 104 L82 116 L90 106 L98 116 L102 110 V120 H18 Z" fill={BG} />
      <ellipse cx="60" cy="52" rx="18" ry="22" fill={BG} stroke={FG} strokeWidth="1" />
      <g className="pt-f1"><ellipse cx="60" cy="52" rx="11" ry="15" fill={FG} /><path d="M53 48 H58 M62 48 H67" stroke={BG} strokeWidth="2.2" /><path d="M55 60 Q60 63 65 60" stroke={BG} strokeWidth="1.6" fill="none" /></g>
      <g className="pt-f2"><ellipse cx="54" cy="50" rx="10" ry="14" fill="none" stroke={FG} strokeWidth="1.6" /><path d="M48 46 H52 M56 46 H60" stroke={FG} strokeWidth="1.6" /></g>
      <g className="pt-f3"><ellipse cx="66" cy="54" rx="10" ry="14" fill="none" stroke={G1} strokeWidth="1.6" /><circle cx="66" cy="50" r="2.2" fill={RED} /></g>
    </g>
  );
}

function Shard({ h }: P) {
  return (
    <g>
      <ellipse cx="60" cy="60" rx="48" ry="14" fill="none" stroke={G1} strokeDasharray="2 3" transform="rotate(-20 60 60)" />
      <g className="pt-spin" style={{ transformOrigin: '60px 60px' }}>
        <path d="M60 12 L74 50 L52 46 Z" fill={FG} />
        <path d="M60 12 L52 46 L48 30 Z" fill={h} stroke={FG} strokeWidth=".8" />
        <path d="M104 54 L70 66 L78 44 Z" fill={h} stroke={FG} strokeWidth=".8" />
        <path d="M70 106 L58 70 L82 76 Z" fill={FG} />
        <path d="M18 78 L50 62 L44 86 Z" fill={h} stroke={FG} strokeWidth=".8" />
        <path d="M26 28 L54 56 L34 54 Z" fill={BG} stroke={FG} strokeWidth="1" />
      </g>
      <circle cx="60" cy="60" r="7" fill="none" stroke={FG} strokeWidth="1" />
      <circle className="pt-blink" cx="60" cy="60" r="3.5" fill={RED} />
    </g>
  );
}

/** 중간 보스: 머리에 천을 뒤집어쓴 주인공 */
function Veiled({ squad, h, d }: P & { squad: string }) {
  const Art = SQUAD_ART[squad] ?? Scout;
  return (
    <g>
      <Art h={h} d={d} />
      {/* 천: 머리를 덮고 목에서 묶인 뒤 어깨 위로 퍼진다 */}
      <path d="M38 70 C26 78 16 92 10 108 C22 104 28 110 38 104 C46 110 54 104 60 108 C66 104 74 110 82 104 C92 110 98 104 110 108 C104 92 94 78 82 70 Z" fill={`url(#${d}-cloth)`} stroke={FG} strokeWidth="1.4" />
      <path d="M60 8 C82 8 92 24 92 42 C92 58 84 68 74 72 L46 72 C36 68 28 58 28 42 C28 24 38 8 60 8 Z" fill={`url(#${d}-cloth)`} stroke={FG} strokeWidth="1.8" />
      <Sym>
        <path d="M40 18 C34 32 34 52 42 68" fill="none" stroke={G1} strokeWidth=".9" />
        <path d="M50 12 C46 30 46 52 52 70" fill="none" stroke={G2} strokeWidth="1.3" />
        <path d="M40 74 C34 84 30 94 28 106" fill="none" stroke={G1} strokeWidth=".9" />
        <path d="M50 74 C48 86 48 96 48 106" fill="none" stroke={G2} strokeWidth="1.2" />
      </Sym>
      {/* 목을 조인 끈과 늘어진 매듭 */}
      <path d="M40 72 C50 76 70 76 80 72" fill="none" stroke={FG} strokeWidth="2.6" />
      <path d="M62 75 L58 92 M62 75 L70 90" stroke={FG} strokeWidth="1.5" />
      <circle cx="62" cy="75" r="2.4" fill={FG} />
      {/* 얼굴 자리: 천 너머로 비치는 붉은 봉제선 */}
      <path d="M60 20 V62" stroke={RED} strokeWidth="1.4" strokeDasharray="4 3" className="pt-blink" />
      <path d="M54 26 L66 32 M54 38 L66 44 M54 50 L66 56" stroke={RED} strokeWidth="1" opacity=".75" />
    </g>
  );
}

/** 최종 보스 아크: 얼굴 없는 거대한 관측자. 뾰족한 각뿔 광배와 높은 깃 */
function Ark({ d }: P & { squad: string }) {
  const spikes = [-72, -54, -36, -18, 0, 18, 36, 54, 72];
  return (
    <g>
      {/* 머리 뒤로 솟은 각뿔 왕관 */}
      <g>
        {spikes.map((a, i) => (
          <path key={a} transform={`rotate(${a} 60 46)`} d={`M60 ${i % 2 ? 4 : -6} L65 30 L55 30 Z`} fill={i % 2 ? `url(#${d}-robe)` : FG} stroke={FG} strokeWidth=".7" className={i === 4 ? 'pt-blink' : undefined} />
        ))}
      </g>
      <path d="M30 46 A30 30 0 0 1 90 46" fill="none" stroke={G1} strokeWidth=".8" strokeDasharray="1 2.5" />
      {/* 망토와 높은 깃 */}
      <path d="M4 120 C8 96 24 84 38 80 L44 62 L60 76 L76 62 L82 80 C96 84 112 96 116 120 Z" fill={`url(#${d}-robe)`} stroke={FG} strokeWidth="1.4" />
      <Sym>
        <path d="M44 62 L32 44 L38 86 Z" fill={FG} />
        <path d="M38 80 L28 120" stroke={G1} strokeWidth=".9" />
        <path d="M50 90 L46 120" stroke={G2} strokeWidth="1.2" />
      </Sym>
      {/* 가슴의 역삼각 문장 */}
      <path d="M47 90 L73 90 L60 112 Z" fill="none" stroke={FG} strokeWidth="1.4" />
      <path d="M54 94 L66 94 L60 104 Z" fill={RED} className="pt-blink" />
      {/* 길쭉하고 매끈한, 얼굴 없는 머리 */}
      <path d="M60 14 C71 14 74 28 74 44 C74 60 68 72 60 78 C52 72 46 60 46 44 C46 28 49 14 60 14 Z" fill={`url(#${d}-face)`} stroke={FG} strokeWidth="1.6" />
      <path d="M60 22 V70" stroke={RED} strokeWidth="1.2" />
      <path d="M60 34 L56 40 M60 50 L64 56" stroke={RED} strokeWidth=".8" />
    </g>
  );
}

const ENEMY_ART: Record<string, (p: P) => JSX.Element> = {
  patrol: Patrol, mimicer: Mimicer, watcher: Watcher, devourer: Devourer, phantom: Phantom, shard: Shard,
};
const ENEMY_CODE: Record<string, string> = {
  patrol: 'CL-PTR', mimicer: 'CL-MIM', watcher: 'CL-WTC', devourer: 'CL-DVR', phantom: 'EL-PHM', shard: 'RS-SHD', ark: 'BOSS ARK', veiled: 'BOSS VEIL',
};

export function Portrait({ kind, squad = 'scout', size = 96, bare = false }: { kind: string; squad?: string; size?: number; bare?: boolean }) {
  const d = 'pt' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const h = `url(#${d}-h)`;
  let body: JSX.Element;
  if (kind === 'ark') body = <Ark squad={squad} h={h} d={d} />;
  else if (kind === 'veiled') body = <Veiled squad={squad} h={h} d={d} />;
  else if (SQUAD_ART[kind]) { const A = SQUAD_ART[kind]; body = <A h={h} d={d} />; }
  else { const A = ENEMY_ART[kind] ?? Mimicer; body = <A h={h} d={d} />; }
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <defs>
        <pattern id={`${d}-h`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" fill={BG} />
          <path d="M0 0 V3" stroke={FG} strokeWidth="1" opacity=".55" />
        </pattern>
        <pattern id={`${d}-cloth`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <rect width="4" height="4" fill="#1a1a19" />
          <path d="M0 0 V4" stroke="#8b8b86" strokeWidth=".7" opacity=".6" />
        </pattern>
        <linearGradient id={`${d}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8e8e2" />
          <stop offset=".55" stopColor="#8b8b86" />
          <stop offset="1" stopColor="#2a2a28" />
        </linearGradient>
        <linearGradient id={`${d}-robe`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a28" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <pattern id={`${d}-hi`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" fill="#f2f2ee" />
          <path d="M0 0 V3" stroke="#050505" strokeWidth="1" opacity=".55" />
        </pattern>
      </defs>
      {!bare && <Frame />}
      {body}
      {!bare && <Label code={SQUAD_CODE[kind] ?? ENEMY_CODE[kind] ?? ''} />}
    </svg>
  );
}
