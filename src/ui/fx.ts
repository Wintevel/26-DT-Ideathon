// 화면 위에 떠오르는 숫자, 축을 건너 날아가는 카드 등 연출
function rectOf(key: string): DOMRect | null {
  const el = document.querySelector(`[data-fx="${key}"]`);
  return el ? el.getBoundingClientRect() : null;
}
function layer(): HTMLElement {
  let l = document.getElementById('fx-layer');
  if (!l) {
    l = document.createElement('div');
    l.id = 'fx-layer';
    l.className = 'fx-layer';
    document.body.appendChild(l);
  }
  return l;
}

export function floatText(key: string, text: string, cls = '', dy = 0) {
  const r = rectOf(key);
  if (!r) return;
  const d = document.createElement('div');
  d.className = `float ${cls}`;
  d.textContent = text;
  d.style.left = `${r.left + r.width / 2 + (Math.random() * 30 - 15)}px`;
  d.style.top = `${r.top + r.height / 3 + dy}px`;
  layer().appendChild(d);
  d.animate(
    [
      { opacity: 0, transform: 'translate(-50%,-30%) scale(.5)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1.35)', offset: 0.15 },
      { opacity: 1, transform: 'translate(-50%,-70%) scale(1)', offset: 0.3 },
      { opacity: 1, transform: 'translate(-50%,-120%) scale(1)', offset: 0.78 },
      { opacity: 0, transform: 'translate(-50%,-160%) scale(1)' },
    ],
    { duration: 1400, easing: 'ease-out' },
  ).onfinish = () => d.remove();
}

export function shake(key: string, strong = false) {
  const el = document.querySelector(`[data-fx="${key}"]`) as HTMLElement | null;
  if (!el) return;
  const a = strong ? 10 : 6;
  el.animate(
    [
      { transform: 'translateX(0)', filter: 'invert(0)' },
      { transform: `translateX(-${a}px)`, filter: 'invert(1)' },
      { transform: `translateX(${a}px)`, filter: 'invert(0)' },
      { transform: `translateX(-${a / 2}px)` },
      { transform: 'translateX(0)' },
    ],
    { duration: 320 },
  );
}

export function pulse(key: string) {
  const el = document.querySelector(`[data-fx="${key}"]`) as HTMLElement | null;
  el?.animate([{ filter: 'invert(1)' }, { filter: 'invert(0)' }], { duration: 420 });
}

/** from → to 로 카드 유령이 날아간다. 거울 축을 지나며 흑백이 반전된다. */
export function fly(from: string, to: string, label: string, startInverted = false) {
  const a = rectOf(from);
  const b = rectOf(to);
  if (!a || !b) return;
  const d = document.createElement('div');
  d.className = `flyghost ${startInverted ? 'inv' : ''}`;
  d.textContent = label;
  const sx = a.left + a.width / 2 - 48;
  const sy = a.top + a.height / 2 - 64;
  const ex = b.left + b.width / 2 - 48;
  const ey = b.top + b.height / 2 - 64;
  d.style.left = '0px';
  d.style.top = '0px';
  layer().appendChild(d);
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#f2f2ee';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#050505';
  const c1 = startInverted ? [fg, bg] : [bg, fg];
  d.animate(
    [
      { transform: `translate(${sx}px,${sy}px) scale(.6) rotateY(0deg)`, opacity: 0, background: c1[0], color: c1[1] },
      { transform: `translate(${sx}px,${sy - 30}px) scale(1) rotateY(0deg)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 80}px) scale(1.1) rotateY(90deg)`, offset: 0.5, background: c1[0], color: c1[1] },
      { transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 80}px) scale(1.1) rotateY(90deg)`, offset: 0.51, background: c1[1], color: c1[0] },
      { transform: `translate(${ex}px,${ey}px) scale(.8) rotateY(180deg)`, opacity: 1, offset: 0.9, background: c1[1], color: c1[0] },
      { transform: `translate(${ex}px,${ey}px) scale(.5) rotateY(180deg)`, opacity: 0, background: c1[1], color: c1[0] },
    ],
    { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' },
  ).onfinish = () => d.remove();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function spawnAt(key: string, cls: string): [HTMLElement, DOMRect] | null {
  const r = rectOf(key);
  if (!r) return null;
  const d = document.createElement('div');
  d.className = `fxo ${cls}`;
  d.style.left = `${r.left}px`;
  d.style.top = `${r.top}px`;
  d.style.width = `${r.width}px`;
  d.style.height = `${r.height}px`;
  layer().appendChild(d);
  return [d, r];
}

/** 피해: 대상 위로 베기 궤적이 촤악 지나간다. 큰 피해는 교차 두 줄 + 파편. */
export function slash(key: string, big = false, hurtMe = false) {
  const s = spawnAt(key, `slash ${hurtMe ? 'me' : ''}`);
  if (!s) return;
  const [box] = s;
  const lines = big ? [-28, 24] : [-28];
  lines.forEach((deg, i) => {
    const l = document.createElement('i');
    l.className = 'sl';
    l.style.transform = `translate(-50%,-50%) rotate(${deg}deg)`;
    box.appendChild(l);
    l.animate(
      [
        { clipPath: 'inset(0 100% 0 0)', opacity: 1, height: '7px' },
        { clipPath: 'inset(0 0 0 0)', opacity: 1, height: '7px', offset: 0.22 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1, height: '5px', offset: 0.55 },
        { clipPath: 'inset(0 0 0 0)', opacity: 0, height: '1px' },
      ],
      { duration: 760, delay: i * 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' },
    );
  });
  const n = big ? 16 : 9;
  for (let k = 0; k < n; k++) {
    const p = document.createElement('b');
    p.className = 'spark';
    box.appendChild(p);
    const a = (-28 + (Math.random() * 60 - 30)) * (Math.PI / 180) + (Math.random() < 0.5 ? Math.PI : 0);
    const dist = 60 + Math.random() * 90;
    p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(.2)`, opacity: 0 },
      ],
      { duration: 420 + Math.random() * 200, delay: 80, easing: 'ease-out', fill: 'both' },
    );
  }
  box.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 900 }).onfinish = () => box.remove();
}

/** 차폐: 육각 방벽이 펼쳐졌다 사라진다. */
export function guard(key: string) {
  const s = spawnAt(key, 'guard');
  if (!s) return;
  const [box] = s;
  box.animate(
    [
      { transform: 'scale(.7)', opacity: 0 },
      { transform: 'scale(1.06)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.02)', opacity: 1, offset: 0.6 },
      { transform: 'scale(1.18)', opacity: 0 },
    ],
    { duration: 900, easing: 'ease-out' },
  ).onfinish = () => box.remove();
}

/** 버프는 위로 솟는 꺾쇠, 디버프는 아래로 흘러내리는 꺾쇠 + 붉은 잔떨림. */
export function statusFx(key: string, good: boolean) {
  const s = spawnAt(key, `stat ${good ? 'up' : 'down'}`);
  if (!s) return;
  const [box] = s;
  for (let k = 0; k < 3; k++) {
    const c = document.createElement('i');
    box.appendChild(c);
    c.style.left = `${30 + k * 20}%`;
    const from = good ? 30 : -30, to = good ? -60 : 60;
    c.animate(
      [
        { transform: `translate(-50%, ${from}px)`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: `translate(-50%, ${to}px)`, opacity: 0 },
      ],
      { duration: 800, delay: k * 110, easing: 'ease-out', fill: 'both' },
    );
  }
  const el = document.querySelector(`[data-fx="${key}"]`) as HTMLElement | null;
  if (el && !good) el.animate([{ filter: 'none' }, { filter: 'sepia(1) saturate(4) hue-rotate(-40deg) brightness(.8)' }, { filter: 'none' }], { duration: 520 });
  if (el && good) el.animate([{ filter: 'none' }, { filter: 'brightness(1.6)' }, { filter: 'none' }], { duration: 480 });
  box.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1150 }).onfinish = () => box.remove();
}

/** 화면 전체가 짧게 번쩍인다. hurt = 내가 맞음(붉은 테두리), hit = 큰 타격(흰 섬광) */
export function flash(kind: 'hurt' | 'hit') {
  const d = document.createElement('div');
  d.className = `fx-flash ${kind}`;
  layer().appendChild(d);
  d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: kind === 'hurt' ? 520 : 260, easing: 'ease-out' }).onfinish = () => d.remove();
  const root = document.querySelector('.field') as HTMLElement | null;
  root?.animate(
    [{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-3px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }],
    { duration: kind === 'hurt' ? 340 : 240 },
  );
}

/** 적이 행동할 때 본체 쪽(왼쪽)으로 한 번 달려들었다 돌아온다 */
export function lunge(key: string) {
  const el = document.querySelector(`[data-fx="${key}"]`) as HTMLElement | null;
  el?.animate(
    [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(14px) scale(.97)', offset: 0.3 }, { transform: 'translateX(-46px) scale(1.06)', offset: 0.55 }, { transform: 'translateX(0) scale(1)' }],
    { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' },
  );
}
