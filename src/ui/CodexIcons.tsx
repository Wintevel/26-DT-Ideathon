// 데이터 뱅크 홈의 큰 아이콘 5종. 각각 모양이 다르다.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Cards() {
  return (
    <g>
      <g className="ci-back"><rect x="44" y="26" width="52" height="76" {...S} strokeDasharray="5 4" transform="rotate(10 70 64)" /></g>
      <rect x="30" y="30" width="52" height="76" fill="var(--fg)" />
      <path d="M56 46 L68 68 L56 90 L44 68 Z" fill="var(--bg)" />
      <path d="M56 54 L63 68 L56 82 L49 68 Z" fill="var(--fg)" />
      <rect x="30" y="30" width="12" height="14" fill="var(--bg)" />
      <text x="36" y="41" fontSize="10" fill="var(--fg)" textAnchor="middle" fontFamily="Anton, sans-serif">1</text>
    </g>
  );
}
function Relics() {
  return (
    <g>
      <path d="M64 20 L100 56 L64 108 L28 56 Z" fill="var(--fg)" />
      <path d="M28 56 H100 M46 56 L64 108 L82 56 M46 56 L64 20 L82 56" stroke="var(--bg)" strokeWidth="2.5" fill="none" />
      <path d="M64 20 L46 38 M64 20 L82 38" stroke="var(--bg)" strokeWidth="1.5" />
      <circle className="ci-spark" cx="96" cy="26" r="3" fill="var(--fg)" />
      <circle className="ci-spark d2" cx="30" cy="96" r="2" fill="var(--fg)" />
    </g>
  );
}
function Targets() {
  return (
    <g>
      <path d="M64 14 L110 48 L92 104 H36 L18 48 Z" {...S} />
      <circle cx="64" cy="62" r="30" {...S} strokeDasharray="3 5" className="ci-rot" style={{ transformOrigin: '64px 62px' }} />
      <path d="M64 24 V40 M64 84 V100 M26 62 H42 M86 62 H102" {...S} />
      <circle cx="64" cy="54" r="9" fill="var(--fg)" />
      <path d="M48 82 C48 68 80 68 80 82 Z" fill="var(--fg)" />
      <circle cx="64" cy="62" r="3" fill="var(--danger)" />
    </g>
  );
}
function Events() {
  return (
    <g>
      <path d="M44 14 H84 L114 44 V84 L84 114 H44 L14 84 V44 Z" {...S} />
      <path d="M64 100 V70" stroke="var(--fg)" strokeWidth="4" />
      <path d="M64 70 L40 44 M64 70 L88 44" stroke="var(--fg)" strokeWidth="4" />
      <path className="ci-path" d="M64 70 L88 44" stroke="var(--bg)" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="40" cy="40" r="7" fill="var(--fg)" />
      <circle cx="88" cy="40" r="7" fill="none" stroke="var(--fg)" strokeWidth="2.5" />
      <circle cx="64" cy="104" r="5" fill="var(--fg)" />
    </g>
  );
}
function Archive() {
  return (
    <g>
      <ellipse cx="64" cy="64" rx="38" ry="50" {...S} strokeWidth="4" />
      <ellipse cx="64" cy="64" rx="30" ry="42" fill="var(--fg)" />
      <circle cx="64" cy="52" r="11" fill="var(--bg)" />
      <path d="M44 98 C44 76 84 76 84 98" fill="var(--bg)" />
      <path d="M78 26 L68 52 L80 62 L62 84 L70 104" stroke="var(--bg)" strokeWidth="2.5" fill="none" />
      <path d="M68 52 L48 46" stroke="var(--bg)" strokeWidth="1.5" />
      <path className="ci-shard" d="M104 34 L112 30 L108 40 Z" fill="var(--fg)" />
    </g>
  );
}
const MAP: Record<string, () => JSX.Element> = { cards: Cards, relics: Relics, enemies: Targets, events: Events, archive: Archive };
export function CodexIcon({ kind, size = 128 }: { kind: string; size?: number }) {
  const C = MAP[kind];
  return <svg className="codex-icon" width={size} height={size} viewBox="0 0 128 128" aria-hidden><C /></svg>;
}
