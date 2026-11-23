// 캐릭터·적 프로필. 흑백 기반에 위험 신호만 붉은 점으로. 보스 아크는 "내 분대의 거울상".
const FG = 'var(--fg)';
const BG = 'var(--bg)';
const G1 = '#8b8b86';
const G2 = '#3d3d3a';
const RED = 'var(--danger)';

function Scout() {
  return (
    <g>
      <path d="M18 120 C20 92 38 82 60 82 C82 82 100 92 102 120 Z" fill={FG} />
      <path d="M42 90 L60 104 L78 90" stroke={BG} strokeWidth="3" fill="none" />
      <rect x="52" y="70" width="16" height="14" fill={G1} />
      <circle cx="60" cy="50" r="23" fill={FG} />
      <rect x="37" y="42" width="46" height="13" fill={BG} />
      <rect className="pt-scan" x="40" y="45" width="10" height="7" fill={FG} />
      <path d="M78 32 L94 10" stroke={FG} strokeWidth="3" />
      <path d="M86 6 A10 10 0 0 1 102 14" stroke={G1} strokeWidth="2" fill="none" />
      <circle className="pt-blink" cx="94" cy="10" r="4" fill={RED} />
    </g>
  );
}

function Resonance() {
  return (
    <g>
      <g className="pt-drift" opacity=".75">
        <path d="M30 120 C32 92 50 82 72 82 C94 82 110 92 112 120" fill="none" stroke={FG} strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="72" cy="50" r="22" fill="none" stroke={FG} strokeWidth="2" strokeDasharray="4 3" />
      </g>
      <path d="M8 120 C10 92 28 82 50 82 C72 82 88 92 90 120 Z" fill={FG} />
      <circle cx="50" cy="52" r="22" fill={FG} />
      <rect x="49" y="32" width="2" height="40" fill={BG} />
      <rect x="38" y="48" width="7" height="4" fill={BG} />
      <rect x="55" y="48" width="7" height="4" fill={G2} />
      <path d="M50 92 L44 104 L50 116 L56 104 Z" fill={BG} />
    </g>
  );
}

function Bulwark() {
  return (
    <g>
      <path d="M26 120 L30 92 H90 L94 120 Z" fill={FG} />
      <rect x="10" y="84" width="30" height="22" fill={G1} />
      <rect x="80" y="84" width="30" height="22" fill={G1} />
      <path d="M10 92 H40 M80 92 H110" stroke={BG} strokeWidth="2" />
      <path d="M38 26 H82 V66 L60 80 L38 66 Z" fill={FG} />
      <rect x="44" y="44" width="32" height="5" fill={BG} />
      <rect x="57" y="44" width="6" height="22" fill={BG} />
      <path d="M60 96 L70 106 L60 116 L50 106 Z" fill={BG} />
      <path d="M60 100 L66 106 L60 112 L54 106 Z" fill={FG} />
    </g>
  );
}

const SQUAD_ART: Record<string, () => JSX.Element> = { scout: Scout, resonance: Resonance, bulwark: Bulwark };

function Patrol() {
  return (
    <g>
      <path d="M22 120 L28 88 H92 L98 120 Z" fill={FG} />
      <path d="M36 58 A24 24 0 0 1 84 58 V64 H36 Z" fill={FG} />
      <rect x="40" y="52" width="40" height="6" fill={BG} />
      <circle className="pt-scanred" cx="46" cy="55" r="2.5" fill={RED} />
      <rect x="44" y="64" width="32" height="20" fill={G1} />
      <circle cx="52" cy="74" r="5" fill="none" stroke={BG} strokeWidth="2" />
      <circle cx="68" cy="74" r="5" fill="none" stroke={BG} strokeWidth="2" />
      <path d="M14 112 L104 72" stroke={G2} strokeWidth="9" />
      <path d="M14 112 L104 72" stroke={FG} strokeWidth="2" />
      <path d="M100 66 L110 70" stroke={FG} strokeWidth="3" />
    </g>
  );
}

function Mimicer() {
  return (
    <g>
      <defs>
        <linearGradient id="mimgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={FG} />
          <stop offset="1" stopColor={G2} />
        </linearGradient>
      </defs>
      <path className="pt-wobble" d="M60 12 C88 10 104 34 98 60 C94 80 106 96 96 112 C84 122 36 122 24 112 C14 96 26 80 22 60 C16 34 32 14 60 12 Z" fill="none" stroke={FG} strokeWidth="2" />
      <ellipse cx="60" cy="54" rx="22" ry="30" fill="url(#mimgrad)" />
      <path d="M44 34 L56 26 M42 46 L64 30" stroke={BG} strokeWidth="2" />
      <circle cx="60" cy="56" r="6" fill={BG} />
      <path d="M50 76 C50 66 70 66 70 76 Z" fill={BG} />
      <path d="M30 100 C40 92 50 104 60 96 C70 104 80 92 90 100" fill="none" stroke={G1} strokeWidth="2" />
    </g>
  );
}

function Watcher() {
  return (
    <g>
      <path d="M44 120 L50 70 H70 L76 120 Z" fill={FG} />
      <path d="M50 70 L42 120 M70 70 L78 120" stroke={G2} strokeWidth="2" />
      <path d="M14 44 A50 50 0 0 1 22 20 M106 44 A50 50 0 0 0 98 20" stroke={G1} strokeWidth="2" fill="none" strokeDasharray="3 4" />
      <path d="M24 44 Q60 4 96 44 Q60 84 24 44 Z" fill={BG} stroke={FG} strokeWidth="3" />
      <circle cx="60" cy="44" r="14" fill={FG} />
      <circle className="pt-look" cx="60" cy="44" r="5" fill={RED} />
      <path className="pt-lid" d="M24 44 Q60 4 96 44 Q60 4 24 44 Z" fill={FG} />
    </g>
  );
}

function Devourer() {
  return (
    <g>
      <path d="M12 120 C8 70 26 24 64 22 C98 20 114 60 108 120 Z" fill={FG} />
      <g className="pt-chomp">
        <ellipse cx="60" cy="72" rx="34" ry="20" fill={BG} />
        <path d="M28 66 L34 76 L40 64 L46 76 L52 62 L58 76 L64 62 L70 76 L76 62 L82 76 L88 64 L92 70" fill={FG} />
        <path d="M30 80 L36 72 L42 84 L48 72 L54 86 L60 72 L66 86 L72 72 L78 84 L84 72 L90 80" fill={G1} />
      </g>
      <circle cx="44" cy="40" r="3" fill={RED} />
      <circle cx="60" cy="34" r="3.5" fill={RED} />
      <circle cx="76" cy="40" r="3" fill={RED} />
      <path d="M60 108 C52 108 52 100 60 100 C70 100 70 114 58 114" fill="none" stroke={BG} strokeWidth="2" />
    </g>
  );
}

function Phantom() {
  return (
    <g>
      <path d="M60 10 C32 10 24 42 26 70 L16 120 H104 L94 70 C96 42 88 10 60 10 Z" fill={FG} />
      <path d="M16 120 L24 110 L32 120 L40 108 L48 120 L56 110 L64 120 L72 108 L80 120 L88 110 L96 120 L104 112" fill={BG} />
      <ellipse cx="60" cy="50" rx="20" ry="24" fill={BG} />
      <g className="pt-f1"><ellipse cx="60" cy="50" rx="12" ry="16" fill={FG} /><path d="M53 46 H58 M62 46 H67" stroke={BG} strokeWidth="2.5" /><path d="M55 58 Q60 62 65 58" stroke={BG} strokeWidth="2" fill="none" /></g>
      <g className="pt-f2"><ellipse cx="52" cy="48" rx="11" ry="15" fill="none" stroke={FG} strokeWidth="2" /><path d="M46 44 H50 M54 44 H58" stroke={FG} strokeWidth="2" /></g>
      <g className="pt-f3"><ellipse cx="68" cy="52" rx="11" ry="15" fill="none" stroke={G1} strokeWidth="2" /><circle cx="68" cy="48" r="2" fill={RED} /></g>
    </g>
  );
}

function Shard() {
  return (
    <g>
      <g className="pt-spin" style={{ transformOrigin: '60px 60px' }}>
        <path d="M60 14 L74 52 L52 46 Z" fill={FG} />
        <path d="M100 54 L68 66 L76 46 Z" fill={G1} />
        <path d="M70 104 L58 68 L80 74 Z" fill={FG} />
        <path d="M22 76 L52 62 L46 84 Z" fill={G1} />
        <path d="M28 30 L54 56 L36 54 Z" fill={G2} stroke={FG} />
      </g>
      <circle className="pt-blink" cx="60" cy="60" r="4" fill={RED} />
    </g>
  );
}

function Ark({ squad }: { squad: string }) {
  const Art = SQUAD_ART[squad] ?? Scout;
  return (
    <g>
      <rect x="0" y="0" width="120" height="120" fill={FG} />
      <g transform="translate(120 0) scale(-1 1)" style={{ filter: 'invert(1)' }}>
        <Art />
      </g>
      <g className="pt-spin-slow" style={{ transformOrigin: '60px 50px' }}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} transform={`rotate(${a} 60 50)`} d="M60 0 L64 10 L56 10 Z" fill={BG} />
        ))}
      </g>
      <path d="M74 0 L66 30 L76 44 L62 70 L70 92 L64 120" fill="none" stroke={RED} strokeWidth="2" />
    </g>
  );
}

const ENEMY_ART: Record<string, () => JSX.Element> = {
  patrol: Patrol, mimicer: Mimicer, watcher: Watcher, devourer: Devourer, phantom: Phantom, shard: Shard,
};

export function Portrait({ kind, squad = 'scout', size = 96 }: { kind: string; squad?: string; size?: number }) {
  let body: JSX.Element;
  if (kind === 'ark') body = <Ark squad={squad} />;
  else if (SQUAD_ART[kind]) { const A = SQUAD_ART[kind]; body = <A />; }
  else { const A = ENEMY_ART[kind] ?? Mimicer; body = <A />; }
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      {body}
    </svg>
  );
}
