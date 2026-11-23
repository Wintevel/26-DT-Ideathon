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
      { opacity: 0, transform: 'translate(-50%,-30%) scale(.7)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1.15)', offset: 0.2 },
      { opacity: 1, transform: 'translate(-50%,-110%) scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'translate(-50%,-150%) scale(1)' },
    ],
    { duration: 1000, easing: 'ease-out' },
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
