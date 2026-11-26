// 심도마다 깔리는 배경 장면. 흑백의 거대한 폐허 산업 공간, 위에서 떨어지는 빛줄기, 안개와 먼지.
// 전부 SVG로 그려 외부 이미지 없이 돈다. 심도마다 구조물이 다르다.
import { useId } from 'react';

const W = 1600;
const H = 900;
const D0 = '#060606';
const D1 = '#0e0e0d';
const D2 = '#181817';
const D3 = '#262624';
const L1 = '#cfcfc8';

/** 위에서 떨어지는 빛줄기 */
function Ray({ x, w, spread, tilt = 0, o = 0.22, top = -20, bottom = H, f }: { x: number; w: number; spread: number; tilt?: number; o?: number; top?: number; bottom?: number; f: string }) {
  const bx = x + tilt;
  return <path d={`M${x - w / 2} ${top} L${x + w / 2} ${top} L${bx + spread / 2} ${bottom} L${bx - spread / 2} ${bottom} Z`} fill={`url(#${f}-ray)`} opacity={o} filter={`url(#${f}-soft)`} />;
}

/** 늘어진 케이블 */
function Cable({ x1, y1, x2, y2, sag, w = 2, c = D0, sway }: { x1: number; y1: number; x2: number; y2: number; sag: number; w?: number; c?: string; sway?: boolean }) {
  const mx = (x1 + x2) / 2;
  const my = Math.max(y1, y2) + sag;
  return <path className={sway ? 'ds-sway' : undefined} d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke={c} strokeWidth={w} />;
}

/** 위에서 곧게 늘어진 줄 */
const Hang = ({ x, y2, w = 1.5, c = D0 }: { x: number; y2: number; w?: number; c?: string }) => <line x1={x} y1={-10} x2={x + 2} y2={y2} stroke={c} strokeWidth={w} />;

/** 양옆을 막는 거대한 벽면: 원근으로 안쪽을 향해 좁아진다 */
function Walls({ f, dense = 1 }: { f: string; dense?: number }) {
  const side = (flip: boolean) => (
    <g transform={flip ? `translate(${W} 0) scale(-1 1)` : undefined}>
      <path d={`M0 0 H230 L170 ${H} H0 Z`} fill={`url(#${f}-wallL)`} />
      {[40, 96, 150].slice(0, 1 + dense).map((x, i) => <path key={x} d={`M${x} 0 L${x + 16} 0 L${x + 16 - (i + 1) * 14} ${H} L${x - (i + 1) * 14} ${H} Z`} fill={D1} stroke={D2} strokeWidth="1" />)}
      {[150, 330, 520].map((y) => (
        <g key={y} opacity=".8">
          <path d={`M0 ${y} L${226 - y * 0.06} ${y + 6} L${226 - y * 0.06} ${y + 14} L0 ${y + 10} Z`} fill={D2} />
          <line x1={0} y1={y - 22} x2={222 - y * 0.06} y2={y - 18} stroke={D2} strokeWidth="1.2" />
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1={i * 28 + 6} y1={y - 22 + i * 0.5} x2={i * 28 + 6} y2={y + i * 0.8} stroke={D2} strokeWidth="1" />)}
        </g>
      ))}
      <path d={`M226 0 L232 0 L172 ${H} L166 ${H} Z`} fill={L1} opacity=".04" />
    </g>
  );
  return <>{side(false)}{side(true)}</>;
}

/** 젖은 바닥: 빛줄기가 반사된다 */
function Floor({ f, glow = 800 }: { f: string; glow?: number }) {
  return (
    <g>
      <rect x={0} y={640} width={W} height={260} fill={`url(#${f}-floor)`} />
      <ellipse cx={glow} cy={760} rx={360} ry={46} fill={L1} opacity=".07" filter={`url(#${f}-soft)`} />
      <path d={`M${glow - 30} 720 L${glow + 30} 720 L${glow + 90} ${H} L${glow - 90} ${H} Z`} fill={L1} opacity=".05" filter={`url(#${f}-soft)`} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={W / 2 + (i - 3) * 60} y1={700} x2={W / 2 + (i - 3) * 420} y2={H} stroke={L1} strokeOpacity=".035" />)}
    </g>
  );
}

// ─── 심도별 장면 ───────────────────────────────────────
/** −01 훈련 관측: 정돈된 격납고, 천장 조명 줄 */
function Hangar({ f }: { f: string }) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const y = 40 + i * 52;
        const inset = i * 70;
        return (
          <g key={i} opacity={1 - i * 0.1}>
            <path d={`M${inset} ${y} L${W - inset} ${y}`} stroke={D3} strokeWidth={8 - i} />
            {Array.from({ length: 6 }, (_, k) => <rect key={k} x={inset + 80 + k * ((W - 2 * inset - 160) / 5) - 30} y={y + 6} width={60 - i * 5} height={4} fill={L1} opacity={0.35 - i * 0.04} />)}
          </g>
        );
      })}
      {[-1, 1].map((s) =>
        Array.from({ length: 5 }, (_, i) => {
          const x = W / 2 + s * (680 - i * 110);
          return <rect key={`${s}${i}`} x={x - (28 - i * 4)} y={60 + i * 40} width={56 - i * 8} height={H} fill={i % 2 ? D1 : D2} />;
        }),
      )}
      <rect x={W / 2 - 220} y={380} width={440} height={300} fill={D0} stroke={D3} />
      <rect x={W / 2 - 200} y={400} width={400} height={8} fill={L1} opacity=".12" />
      <Ray x={W / 2} w={500} spread={900} o={0.1} f={f} />
    </g>
  );
}

/** −00 표준 관측: 거대한 환기 팬과 위로 뚫린 수직갱 */
function Fan({ f }: { f: string }) {
  const cx = W / 2, cy = 450, R = 330;
  return (
    <g>
      {/* 수직갱 트러스 */}
      <rect x={cx - 150} y={-10} width={300} height={170} fill={D2} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={cx - 150} y1={i * 42} x2={cx + 150} y2={i * 42} stroke={D3} strokeWidth="3" />
          <line x1={cx - 150} y1={i * 42} x2={cx + 150} y2={i * 42 + 42} stroke={D3} strokeWidth="1.5" />
          <line x1={cx + 150} y1={i * 42} x2={cx - 150} y2={i * 42 + 42} stroke={D3} strokeWidth="1.5" />
        </g>
      ))}
      <rect x={cx - 120} y={-10} width={240} height={60} fill={L1} opacity=".25" filter={`url(#${f}-soft)`} />
      {/* 팬 외곽 링 */}
      <circle cx={cx} cy={cy} r={R + 40} fill={D1} />
      <circle cx={cx} cy={cy} r={R + 40} fill="none" stroke={D3} strokeWidth="6" />
      <circle cx={cx} cy={cy} r={R} fill={D0} />
      <path d={`M${cx - R - 30} ${cy + 60} A${R + 30} ${R + 30} 0 0 0 ${cx + R + 30} ${cy + 60}`} fill="none" stroke={L1} strokeOpacity=".35" strokeWidth="5" filter={`url(#${f}-soft)`} />
      <path d={`M${cx - R - 30} ${cy + 60} A${R + 30} ${R + 30} 0 0 0 ${cx + R + 30} ${cy + 60}`} fill="none" stroke={L1} strokeOpacity=".25" strokeWidth="1.5" />
      {/* 날개: 천천히 돈다 */}
      <g className="ds-spin" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a} ${cx} ${cy})`}>
            <path d={`M${cx - 24} ${cy - 30} L${cx - 70} ${cy - R + 18} L${cx + 50} ${cy - R + 10} L${cx + 26} ${cy - 30} Z`} fill={D2} stroke={D3} strokeWidth="1.5" />
            <path d={`M${cx + 26} ${cy - 30} L${cx + 50} ${cy - R + 10}`} stroke={L1} strokeOpacity=".22" strokeWidth="2" />
          </g>
        ))}
      </g>
      <polygon points={Array.from({ length: 8 }, (_, i) => `${cx + 48 * Math.cos((i * Math.PI) / 4 + Math.PI / 8)},${cy + 48 * Math.sin((i * Math.PI) / 4 + Math.PI / 8)}`).join(' ')} fill={D1} stroke={L1} strokeOpacity=".4" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={16} fill={D3} stroke={L1} strokeOpacity=".3" />
      <Ray x={cx} w={220} spread={520} o={0.3} f={f} />
      <Ray x={cx - 40} w={60} spread={260} tilt={-60} o={0.25} f={f} />
      {/* 늘어진 줄 */}
      {[420, 470, 1090, 1150, 1200].map((x, i) => <Hang key={x} x={x} y2={600 + i * 30} />)}
    </g>
  );
}

/** −01 왜곡 반사: 줄에 매달린 거대한 거울 판들, 빛이 비스듬히 꺾인다 */
function Shards({ f }: { f: string }) {
  const slabs: [number, number, number, number, number][] = [
    [520, 120, 120, 420, -8], [700, 60, 150, 520, 4], [900, 90, 130, 470, -3], [1080, 140, 110, 400, 9], [360, 200, 90, 330, 12], [1240, 210, 90, 320, -12],
  ];
  return (
    <g>
      <path d={`M${W / 2 - 520} 0 Q${W / 2} -80 ${W / 2 + 520} 0`} stroke={D3} strokeWidth="10" fill="none" />
      <g transform="translate(800 60) scale(.62) translate(-800 0)" opacity=".8">
      {slabs.map(([x, y, w, h, r], i) => (
        <g key={i} className={i % 2 ? 'ds-sway' : 'ds-sway2'} style={{ transformOrigin: `${x + w / 2}px 0px` }}>
          <line x1={x + w / 2} y1={-10} x2={x + w / 2} y2={y} stroke={D3} strokeWidth="1.2" />
          <g transform={`rotate(${r} ${x + w / 2} ${y})`}>
            <rect x={x} y={y} width={w} height={h} fill={`url(#${f}-glass)`} stroke={L1} strokeOpacity=".28" />
            <path d={`M${x + w * 0.2} ${y + h * 0.1} L${x + w * 0.6} ${y + h * 0.5} L${x + w * 0.3} ${y + h * 0.9}`} stroke={L1} strokeOpacity=".2" fill="none" />
          </g>
        </g>
      ))}
      </g>
      <Ray x={300} w={80} spread={300} tilt={520} o={0.28} f={f} />
      <Ray x={1300} w={70} spread={260} tilt={-560} o={0.2} f={f} />
      <Ray x={W / 2} w={140} spread={420} o={0.14} f={f} />
    </g>
  );
}

/** −02 거울 역행: 무너진 돔, 늘어진 케이블과 잔해 */
function Dome({ f }: { f: string }) {
  return (
    <g>
      {/* 돔 갈비뼈와 깨진 창 */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${200 + i * 90} ${H} L${220 + i * 90} 300 Q${W / 2} ${-260 + i * 70} ${W - 220 - i * 90} 300 L${W - 200 - i * 90} ${H}`} fill="none" stroke={i === 0 ? D2 : D3} strokeWidth={22 - i * 6} />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 520 + i * 70;
        const y = 90 + Math.abs(i - 4) * 16;
        return <rect key={i} x={x} y={y} width={44} height={26} fill={L1} opacity={i === 2 || i === 6 ? 0 : 0.32 - Math.abs(i - 4) * 0.03} filter={`url(#${f}-soft)`} />;
      })}
      <path d="M640 130 L760 60 L820 170 L700 230 Z" fill={D0} />
      <path d="M980 120 L1060 90 L1080 210 L1010 200 Z" fill={D0} />
      <Ray x={700} w={90} spread={380} tilt={-160} o={0.3} f={f} />
      <Ray x={880} w={60} spread={300} tilt={-120} o={0.24} f={f} />
      <Ray x={1010} w={40} spread={220} tilt={-90} o={0.18} f={f} />
      {/* 케이블 */}
      <Cable x1={120} y1={160} x2={1500} y2={300} sag={360} w={4} sway />
      <Cable x1={300} y1={-10} x2={1250} y2={120} sag={420} w={2.5} c={D1} sway />
      <Cable x1={560} y1={-10} x2={1600} y2={420} sag={180} w={2} />
      {[380, 430, 610, 1120, 1180, 1330].map((x, i) => <Hang key={x} x={x} y2={420 + (i % 3) * 120} w={i % 2 ? 2 : 1.2} />)}
      {/* 잔해 더미 */}
      <path d="M0 900 L0 760 L140 720 L260 780 L420 740 L520 800 L700 790 L860 820 L1040 770 L1200 800 L1360 740 L1600 780 L1600 900 Z" fill={D0} />
      <path d="M280 770 L520 700 L540 712 L300 784 Z" fill={D2} stroke={L1} strokeOpacity=".15" />
      <path d="M1120 760 L1300 690 L1316 702 L1140 776 Z" fill={D2} stroke={L1} strokeOpacity=".12" />
    </g>
  );
}

/** −03 자아 침식: 비계와 배관이 빽빽한 수직 공간, 김이 피어오른다 */
function Scaffold({ f }: { f: string }) {
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const x = 220 + i * 90;
        return <line key={i} x1={x} y1={0} x2={x} y2={H} stroke={i % 3 ? D2 : D3} strokeWidth={i % 3 ? 3 : 6} />;
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 40 + i * 70;
        return (
          <g key={i}>
            <line x1={200} y1={y} x2={W - 200} y2={y} stroke={D3} strokeWidth="3" />
            {i % 2 === 0 && <line x1={200 + (i * 37) % 300} y1={y} x2={500 + (i * 37) % 300} y2={y + 70} stroke={D2} strokeWidth="2" />}
          </g>
        );
      })}
      {[300, 380, 1220, 1300].map((x, i) => (
        <g key={x}>
          <rect x={x} y={0} width={38} height={H} fill={D1} stroke={D3} />
          <rect x={x + 6} y={0} width={4} height={H} fill={L1} opacity=".06" />
          {[200, 420, 640].map((y) => <rect key={y} x={x - 6} y={y + i * 20} width={50} height={14} fill={D2} />)}
        </g>
      ))}
      <path d="M380 520 C520 520 560 440 780 440 L1220 440" fill="none" stroke={D2} strokeWidth="26" />
      <path d="M380 520 C520 520 560 440 780 440 L1220 440" fill="none" stroke={L1} strokeOpacity=".08" strokeWidth="2" />
      <ellipse cx={720} cy={430} rx={200} ry={70} fill={L1} opacity=".035" filter={`url(#${f}-fog)`} className="ds-steam" />
      <ellipse cx={1000} cy={600} rx={260} ry={80} fill={L1} opacity=".03" filter={`url(#${f}-fog)`} className="ds-steam d2" />
      <Ray x={W / 2 + 80} w={120} spread={340} tilt={-40} o={0.2} f={f} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${f}-bands)`} className="ds-glitch" />
    </g>
  );
}

/** −04 원형 붕괴: 금 간 거대한 고리, 떠 있는 파편, 붉은 핵 */
function Core({ f }: { f: string }) {
  const cx = W / 2, cy = 420;
  const arc = (r: number, a0: number, a1: number) => {
    const p = (a: number) => `${cx + r * Math.cos((a * Math.PI) / 180)} ${cy + r * Math.sin((a * Math.PI) / 180)}`;
    return `M${p(a0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
  };
  return (
    <g>
      <circle cx={cx} cy={cy} r={60} fill="#ff4a3a" opacity=".22" filter={`url(#${f}-fog)`} className="ds-pulse" />
      <circle cx={cx} cy={cy} r={10} fill="#ff4a3a" opacity=".7" />
      {[[-80, 40], [55, 150], [170, 250], [262, 270]].map(([a0, a1], i) => (
        <g key={i}>
          <path d={arc(320, a0, a1)} fill="none" stroke={D2} strokeWidth="58" />
          <path d={arc(350, a0, a1)} fill="none" stroke={L1} strokeOpacity=".16" strokeWidth="2" />
        </g>
      ))}
      {[[-60, 20], [80, 200], [215, 280]].map(([a0, a1], i) => <path key={i} d={arc(230, a0, a1)} fill="none" stroke={D3} strokeWidth="16" />)}
      <g className="ds-float">
        {[[560, 200, 40, 18], [1040, 260, 56, 22], [700, 640, 34, 14], [980, 610, 48, 20], [480, 470, 26, 12], [1150, 470, 30, 14]].map(([x, y, w, h], i) => (
          <path key={i} d={`M${x} ${y} l${w} ${-h * 0.4} l${w * 0.2} ${h} l${-w} ${h * 0.5} Z`} fill={D2} stroke={L1} strokeOpacity=".2" />
        ))}
      </g>
      <Ray x={cx} w={160} spread={380} o={0.16} f={f} />
      <path d="M800 0 L760 140 L820 230 L770 420" stroke="#ff4a3a" strokeOpacity=".25" strokeWidth="2" fill="none" />
    </g>
  );
}

const SCENES: Record<number, (p: { f: string }) => JSX.Element> = { [-1]: Hangar, 0: Fan, 1: Shards, 2: Dome, 3: Scaffold, 4: Core };

export function DepthScene({ depth, className = '' }: { depth: number; className?: string }) {
  const f = 'ds' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const Scene = SCENES[depth] ?? Fan;
  return (
    <div className={`depth-scene ${className}`} data-depth={depth} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${f}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141413" />
            <stop offset=".55" stopColor="#0a0a0a" />
            <stop offset="1" stopColor="#030303" />
          </linearGradient>
          <linearGradient id={`${f}-ray`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f2ee" stopOpacity="1" />
            <stop offset=".6" stopColor="#f2f2ee" stopOpacity=".35" />
            <stop offset="1" stopColor="#f2f2ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${f}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0a0a" stopOpacity="0" />
            <stop offset=".35" stopColor="#0b0b0a" stopOpacity=".9" />
            <stop offset="1" stopColor="#020202" />
          </linearGradient>
          <linearGradient id={`${f}-wallL`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#020202" />
            <stop offset="1" stopColor="#0c0c0b" />
          </linearGradient>
          <linearGradient id={`${f}-glass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a3a38" />
            <stop offset=".5" stopColor="#0c0c0c" />
            <stop offset="1" stopColor="#262624" />
          </linearGradient>
          <pattern id={`${f}-bands`} width="8" height="140" patternUnits="userSpaceOnUse">
            <rect y="40" width="8" height="2" fill="#f2f2ee" opacity=".05" />
            <rect y="96" width="8" height="1" fill="#f2f2ee" opacity=".04" />
          </pattern>
          <linearGradient id={`${f}-haze`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8d8d0" stopOpacity="0" />
            <stop offset=".6" stopColor="#d8d8d0" stopOpacity=".045" />
            <stop offset="1" stopColor="#d8d8d0" stopOpacity="0" />
          </linearGradient>
          <filter id={`${f}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id={`${f}-fog`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40" /></filter>
          <radialGradient id={`${f}-vig`} cx=".5" cy=".45" r=".75">
            <stop offset=".45" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".85" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${f}-bg)`} />
        <Scene f={f} />
        <rect x={0} y={300} width={W} height={420} fill={`url(#${f}-haze)`} />
        <Walls f={f} dense={depth >= 2 ? 2 : 1} />
        <Floor f={f} />
        <rect width={W} height={H} fill={`url(#${f}-vig)`} />
      </svg>
      <div className="ds-dust" />
      <div className="ds-dust b" />
    </div>
  );
}

