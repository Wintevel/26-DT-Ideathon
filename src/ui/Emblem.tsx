// 좌우 대칭 거울 엠블럼. 침식이 오를수록 오른쪽 절반이 비틀리고 금이 간다.
import { useId } from 'react';

function Shape() {
  return (
    <g fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="92" strokeWidth="1" />
      <circle cx="100" cy="100" r="84" strokeWidth="6" strokeDasharray="2 6" className="spin" />
      <circle cx="100" cy="100" r="62" strokeWidth="1.5" />
      <g className="spin-r">
        <circle cx="76" cy="100" r="26" strokeWidth="5" />
        <circle cx="124" cy="100" r="26" strokeWidth="5" />
      </g>
      <path d="M100 52 L108 92 L148 100 L108 108 L100 148 L92 108 L52 100 L92 92 Z" fill="currentColor" stroke="none" />
      <path d="M100 70 L104 96 L130 100 L104 104 L100 130 L96 104 L70 100 L96 96 Z" fill="var(--bg)" stroke="none" />
      <line x1="100" y1="2" x2="100" y2="34" strokeWidth="10" />
      <line x1="100" y1="166" x2="100" y2="198" strokeWidth="10" />
      <line x1="30" y1="30" x2="46" y2="46" strokeWidth="2" />
      <line x1="170" y1="170" x2="154" y2="154" strokeWidth="2" />
    </g>
  );
}

export function Emblem({ size = 220, erosion = 0, className = '' }: { size?: number; erosion?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const skew = erosion * 0.12;
  const shift = erosion * 0.06;
  const crack = Math.min(1, erosion / 80);
  return (
    <svg className={`emblem ${erosion >= 60 ? 'glitch' : ''} ${className}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <clipPath id={`l${id}`}><rect x="0" y="0" width="100" height="200" /></clipPath>
        <clipPath id={`r${id}`}><rect x="100" y="0" width="100" height="200" /></clipPath>
      </defs>
      <g clipPath={`url(#l${id})`}><Shape /></g>
      <g className="half-r" style={{ transformOrigin: '100px 100px' }}>
        <g clipPath={`url(#r${id})`} transform={`translate(${shift} 0) skewY(${skew})`} style={{ transformOrigin: '100px 100px' }}>
          <Shape />
        </g>
      </g>
      <g stroke="currentColor" strokeWidth="1.2" fill="none" opacity={crack}>
        <path d="M118 40 L130 70 L122 86 L146 118 L138 150" />
        <path d="M130 70 L160 64" />
        <path d="M146 118 L178 128" />
      </g>
    </svg>
  );
}
