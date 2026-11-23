import { useEffect, useMemo, useState } from 'react';
import { CARDS, DEPTHS, ENEMIES, EVENT_MAP, RELICS, SQUADS } from '../game/data';
import { erosionGain, tierOf, TIER_NAMES } from '../game/engine';
import { currentStage, nodeById, priceOf, reachable, STAGES, type Reward, type Settlement } from '../game/run';
import type { CardInst, MapNode, MetaSave, RunState } from '../game/types';
import { CardView, DeckModal } from './common';
import { Emblem } from './Emblem';
import { DEPTH_ICON, Icon, SQUAD_ICON } from './Icons';
import { Portrait } from './Portraits';

// ─── 허브 ──────────────────────────────────────────────
export function Hub({ meta, onStart, onTree, onCodex, onReset }: { meta: MetaSave; onStart: () => void; onTree: () => void; onCodex: () => void; onReset: () => void }) {
  const [hover, setHover] = useState(false);
  const [launching, setLaunching] = useState(false);
  const start = () => {
    if (launching) return;
    setLaunching(true);
    setTimeout(onStart, 900);
  };
  return (
    <div className={`screen hub ${launching ? 'launching' : ''}`}>
      <div className="vtitle">MIRROR <span>PROTOCOL</span></div>
      <div className="center">
        <div className="hub-emblem">
          <Emblem size={260} className={hover ? 'dim' : ''} />
          <div className={`launch-diamond ${hover ? 'on' : ''} ${launching ? 'go' : ''}`}><span /></div>
        </div>
        <div>
          <h1>거울 프로토콜</h1>
          <div className="sub">DOPPELGANGER PROTOCOL · 침묵 회랑 침투 작전</div>
        </div>
        <div className="frag"><Icon name="mirror" size={16} /> 보유 기억 파편<b>{meta.fragments}</b></div>
        <div className="menu">
          <button className="btn solid icon-btn" onClick={start} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
            <Icon name="launch" size={18} /> 출격 준비
          </button>
          <button className="btn icon-btn" onClick={onTree}><Icon name="tree" size={18} /> 우위 선점</button>
          <button className="btn icon-btn" onClick={onCodex}><Icon name="codex" size={18} /> 데이터 뱅크 · 도감</button>
        </div>
        <button className="btn ghost" style={{ fontSize: 11, padding: '6px 12px' }} onClick={onReset}>기록 초기화</button>
      </div>
      <div className="right">
        <div>작전 {meta.runs}회 · 정화 {meta.clears}회</div>
        <div>선점한 우위 {meta.unlocked.length} / 13</div>
        <div>원형 기록 {meta.archive.length}건</div>
        <br />
        <div>// 적의 의도를 모사하라.</div>
        <div>// 베낀 만큼 당신은 강해지고,</div>
        <div>// 베낀 만큼 당신은 사라진다.</div>
        <div>// 구역의 끝에서 당신을 만난다.</div>
      </div>
      {launching && <div className="diamond-burst" />}
    </div>
  );
}

// ─── 출격 준비 1: 프로토콜 심도 ────────────────────────
export function DepthSelect({ depth, setDepth, onBack, onNext }: { depth: number; setDepth: (d: number) => void; onBack: () => void; onNext: () => void }) {
  const d = DEPTHS[depth];
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 허브로</button>
        <div><div className="kicker">PRE-LAUNCH · STEP 1 / 2</div><h2>프로토콜 심도 선택</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>심도가 높을수록 기억 파편 획득 배율이 증가합니다</span>
      </div>
      <div className="wrap">
        <div className="depth-row">
          {DEPTHS.map((x) => (
            <button key={x.lv} className={`depth-big ${depth === x.lv ? 'on' : ''}`} onClick={() => setDepth(x.lv)}>
              <span className="lv">DEPTH {String(x.lv).padStart(2, '0')}</span>
              <span className="ic"><Icon name={DEPTH_ICON[x.lv]} size={54} stroke={1.3} /></span>
              <b>{x.name}</b>
              <span className="meta"><span>적 체력 {Math.round(x.mult * 100)}%</span><span>파편 ×{x.frag}</span></span>
              <span className="gauge">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i <= x.lv ? 'on' : ''} />)}</span>
            </button>
          ))}
        </div>
        <div className="depth-detail">
          <Icon name={DEPTH_ICON[depth]} size={28} />
          <div>
            <div className="mono mute" style={{ fontSize: 11 }}>DEPTH {String(depth).padStart(2, '0')} · 기억 파편 ×{d.frag}</div>
            <b>{d.name}</b>
            <div className="mute">{d.rule}</div>
          </div>
          <span className="spacer" />
          <button className="btn solid icon-btn" onClick={onNext}>분대 선택 <Icon name="launch" size={16} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── 출격 준비 2: 전술 분대 ────────────────────────────
export function SquadSelect({ depth, onBack, onLaunch }: { depth: number; onBack: () => void; onLaunch: (squad: string) => void }) {
  const [squad, setSquad] = useState('scout');
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 심도 선택</button>
        <div><div className="kicker">PRE-LAUNCH · STEP 2 / 2 · DEPTH {String(depth).padStart(2, '0')} {DEPTHS[depth].name}</div><h2>전술 분대 선택</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>기본 덱 9장 + 분대 고유 카드 2장 + 소장품</span>
      </div>
      <div className="wrap">
        <div className="squads">
          {SQUADS.map((s) => (
            <button key={s.id} className={`squad ${squad === s.id ? 'on' : ''}`} onClick={() => setSquad(s.id)}>
              <div className="squad-top">
                <div className="squad-pt"><Portrait kind={s.id} size={110} /></div>
                <div>
                  <span className="code">{s.code}</span>
                  <h4>{s.name}</h4>
                  <span className="tag"><Icon name={SQUAD_ICON[s.id]} size={14} /> {s.tag}</span>
                </div>
              </div>
              <p>{s.desc}</p>
              <ul>
                {s.cards.map((c) => <li key={c}><Icon name="deck" size={13} /> 시작 덱에 [{CARDS[c].name}]</li>)}
                <li><Icon name="relic" size={13} /> 소장품 [{RELICS[s.relic].name}]</li>
                {s.maxHp !== 75 && <li><Icon name="heart" size={13} /> 최대 체력 {s.maxHp}</li>}
                {s.kakpul > 0 && <li><Icon name="kakpul" size={13} /> 시작 각뿔 +{s.kakpul}</li>}
                {s.erosion > 0 && <li><Icon name="erosion" size={13} /> 초기 침식 +{s.erosion}%</li>}
              </ul>
            </button>
          ))}
        </div>
        <div className="launch"><button className="btn solid icon-btn" onClick={() => onLaunch(squad)}><Icon name="launch" size={16} /> 출격</button></div>
      </div>
    </div>
  );
}

// ─── 노드 맵 ───────────────────────────────────────────
const NODE_INFO: Record<string, [string, string]> = {
  combat: ['전투 작전', '복제체와 교전'],
  elite: ['긴급 작전', '긴급: 정예 팬텀 습격'],
  event: ['우연한 만남', '거울 섹터 분기'],
  rest: ['정비 구역', '자아 정비'],
  shop: ['암시장', '각뿔 거래소'],
  boss: ['구역 보스', '거울 파수꾼 · 아크'],
};
function nodeTitle(n: MapNode) {
  if (n.type === 'combat' && n.encounter) return n.encounter.map((id) => ENEMIES[id].name).join(' + ');
  return NODE_INFO[n.type][1];
}
function nodeDesc(n: MapNode) {
  switch (n.type) {
    case 'combat': return '일반 전투 · 카드 보상 · 모사한 적의 기술 흡수 가능';
    case 'elite': return '긴급 교전 · 반향하는 정예 출현 · 확정 소장품';
    case 'event': return '거울 섹터의 분기 사건 · 선택에 따라 침식이 오르내림';
    case 'rest': return '체력 회복 또는 침식 감소';
    case 'shop': return '카드 구매 · 카드 소거 · 침식 정화 · 거울 모사 충전';
    case 'boss': return '당신의 런 기록을 스캔해 당신으로 싸우는 보스';
  }
  return '';
}

export function MapView({ run, onEnter }: { run: RunState; onEnter: (id: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [scan, setScan] = useState(true);
  const reach = reachable(run);
  const cur = currentStage(run);
  useEffect(() => {
    const t = setTimeout(() => setScan(false), 1700);
    return () => clearTimeout(t);
  }, [run.pos]);

  const X = (stage: number) => 8 + stage * 16.8;
  const Y = (y: number) => 12 + y * 82;
  const hidden = (n: MapNode) => !run.revealAll && n.stage > cur + 1 && n.type !== 'boss';
  const all = run.map.flat();
  const focus = sel ? nodeById(run, sel) : reach.length ? nodeById(run, reach[0]) : null;
  const curNode = run.pos ? nodeById(run, run.pos) : null;

  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="map-wrap">
        <div className="map-head">
          <div>
            <div className="k">SECTOR 01 · 제1구역 · DEPTH {String(run.depth).padStart(2, '0')} {DEPTHS[run.depth].name}</div>
            <h2>침묵 회랑 — 다음 통로 선택</h2>
          </div>
          <div className="k">{run.revealAll ? '안테나 신호: 전 구역 개방' : '전방 미확인 통로는 진출 시 탐색됩니다'} · 보스 표적: 거울 파수꾼 · 아크</div>
        </div>
        <div className="map-scroll">
          <div className="map">
            {Array.from({ length: STAGES }, (_, i) => (
              <div key={i} className={`colhead ${i === cur + 1 ? 'next' : ''}`} style={{ left: `${X(i)}%` }}>
                {i === STAGES - 1 ? 'BOSS' : i === cur + 1 ? `NEXT · ${String(i + 1).padStart(2, '0')}` : `STAGE ${String(i + 1).padStart(2, '0')}`}
              </div>
            ))}
            <svg className="links" viewBox="0 0 100 100" preserveAspectRatio="none">
              {all.flatMap((n) =>
                n.next.map((m) => {
                  const t = nodeById(run, m);
                  const live = n.id === run.pos && reach.includes(m);
                  const done = run.visited.includes(n.id) && run.visited.includes(m);
                  const x1 = X(n.stage), y1 = Y(n.y), x2 = X(t.stage), y2 = Y(t.y);
                  const mx = (x1 + x2) / 2;
                  return <path key={n.id + m} className={live ? 'live' : done ? 'done' : ''} vectorEffect="non-scaling-stroke" d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} />;
                }),
              )}
            </svg>
            {curNode && (
              <div className="radar" style={{ left: `${X(curNode.stage)}%`, top: `${Y(curNode.y)}%` }}>
                {scan && <div className="sweep" />}
                <i /><i /><i />
              </div>
            )}
            {all.map((n) => {
              const isHidden = hidden(n);
              const isReach = reach.includes(n.id);
              const isCur = n.id === run.pos;
              const past = run.visited.includes(n.id) && !isCur;
              const justRevealed = n.stage === cur + 1 && !isHidden;
              return (
                <div
                  key={n.id}
                  className={`node ${isHidden ? '' : n.type} ${isHidden ? 'hidden' : ''} ${isReach ? 'reach' : ''} ${isCur ? 'cur' : ''} ${past ? 'past' : ''} ${justRevealed && scan ? 'reveal' : ''}`}
                  style={{ left: `${X(n.stage)}%`, top: `${Y(n.y)}%`, animationDelay: justRevealed && scan ? `${0.5 + n.idx * 0.25}s` : undefined }}
                  onClick={() => isReach && onEnter(n.id)}
                  onMouseEnter={() => !isHidden && setSel(n.id)}
                >
                  {isHidden ? (
                    <><div className="ty"><span>미확인 구역</span><Icon name="unknown" size={15} /></div><b>[ ? 신호 미감지 ]</b></>
                  ) : (
                    <>
                      <div className="ty"><span>{NODE_INFO[n.type][0]}</span><Icon name={n.type} size={15} /></div>
                      <b>{nodeTitle(n)}</b>
                      <div className="go">{isCur ? '현재 위치' : isReach ? '진입 가능 →' : past ? '돌파' : ''}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mapfoot">
        {focus && (
          <>
            <div className="ico"><Icon name={focus.type} size={22} /></div>
            <div>
              <div className="mono mute" style={{ fontSize: 11 }}>{NODE_INFO[focus.type][0]} · {focus.type === 'boss' ? 'BOSS' : `STAGE ${String(focus.stage + 1).padStart(2, '0')}`}</div>
              <b>{nodeTitle(focus)}</b>
              <div className="mute" style={{ fontSize: 12 }}>{nodeDesc(focus)}</div>
            </div>
          </>
        )}
        <span className="spacer" />
        <span className="facts">덱 {run.deck.length}장 · 돌파 노드 {run.stats.nodesCleared} · 거울 모사 {run.mirrorCharges}회</span>
      </div>
    </div>
  );
}

// ─── 보상 ──────────────────────────────────────────────
export function RewardView({ run, reward, meta, onDone }: { run: RunState; reward: Reward; meta: string[]; onDone: (card: string | null, absorbId: string | null) => void }) {
  const [card, setCard] = useState<string | null>(null);
  const [abs, setAbs] = useState<string | null>(null);
  const after = Math.min(100, run.erosion + erosionGain(8, run.depth));
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <div className="big-title">CLEAR</div>
        <div className="mono mute">작전 완료 · 각뿔 +{reward.kakpul}{reward.relic ? ` · 소장품 [${RELICS[reward.relic].name}] 획득` : ''}</div>

        {reward.absorbOptions.length > 0 && (
          <div className="panel" style={{ marginTop: 18 }}>
            <div className="k">ABSORB · 남은 거울 모사 {run.mirrorCharges}회</div>
            <h3>흡수 — 이번 전투에서 모사한 기술을 영구히 내 것으로</h3>
            <div className="mute" style={{ fontSize: 12 }}>흡수하면 침식 {run.erosion}% → {after}% ({TIER_NAMES[tierOf(after, meta)]}). 흡수 카드는 아크가 당신을 스캔할 때도 쓰입니다.</div>
            <div className="choices">
              {reward.absorbOptions.map((id) => (
                <div key={id} className={`choice ${abs === id ? 'picked' : abs ? 'faded' : ''}`}>
                  <CardView id={id} onClick={() => setAbs(abs === id ? null : id)} />
                  <small>{ENEMIES[CARDS[id].source!].name}의 기술</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 14 }}>
          <div className="k">REWARD</div>
          <h3>카드 1장 선택</h3>
          <div className="choices">
            {reward.cards.map((id) => (
              <div key={id} className={`choice ${card === id ? 'picked' : card ? 'faded' : ''}`}>
                <CardView id={id} onClick={() => setCard(card === id ? null : id)} />
              </div>
            ))}
          </div>
        </div>

        {reward.relic && (
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="k">RELIC</div>
            <div className="relic"><div className="ico"><span><Icon name="relic" size={20} /></span></div><div><b>{RELICS[reward.relic].name}</b><div className="mute">{RELICS[reward.relic].text}</div></div></div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button className="btn solid" onClick={() => onDone(card, abs)}>{card || abs ? '확정하고 진행 →' : '건너뛰고 진행 →'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── 우연한 만남 ───────────────────────────────────────
export function EventView({ eventId, run, onChoose, result, onContinue, needRemove, onRemove }: {
  eventId: string; run: RunState; onChoose: (i: number) => void; result: string | null; onContinue: () => void; needRemove: boolean; onRemove: (uid: number) => void;
}) {
  const ev = EVENT_MAP[eventId];
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <Emblem size={120} erosion={run.erosion} />
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="k">CHANCE ENCOUNTER · 거울 섹터 분기</div>
          <h3 style={{ fontSize: 22 }}>{ev.name}</h3>
          <p className="storytext">{result ?? ev.text}</p>
          {!result ? (
            <div className="ev-opts">
              {ev.options.map((o, i) => (
                <button className="ev-opt" key={o.label} onClick={() => onChoose(i)}><b>{o.label}</b><small>{o.desc}</small></button>
              ))}
            </div>
          ) : (
            !needRemove && <div style={{ marginTop: 18 }}><button className="btn solid" onClick={onContinue}>계속 →</button></div>
          )}
        </div>
      </div>
      {needRemove && <DeckModal cards={run.deck} title="두고 갈 카드 선택" onClose={onContinue} onPick={(c) => onRemove(c.uid)} />}
    </div>
  );
}

// ─── 정비 구역 ─────────────────────────────────────────
export function RestView({ run, onRest }: { run: RunState; onRest: (opt: 'heal' | 'compose') => void }) {
  const heal = Math.round(run.maxHp * 0.3);
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <Emblem size={140} erosion={run.erosion} />
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="k">MAINTENANCE</div>
          <h3 style={{ fontSize: 22 }}>정비 구역</h3>
          <div className="ev-opts">
            <button className="ev-opt with-ic" onClick={() => onRest('heal')}><Icon name="heart" size={26} /><b>휴식</b><small>체력 {heal} 회복 ({run.hp} → {Math.min(run.maxHp, run.hp + heal)})</small></button>
            <button className="ev-opt with-ic" onClick={() => onRest('compose')}><Icon name="erosion" size={26} /><b>자아 정비</b><small>침식 −15% ({run.erosion}% → {Math.max(0, run.erosion - 15)}%)</small></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 암시장 ────────────────────────────────────────────
export function ShopView({ run, meta, stock, onBuy, onService, onLeave }: {
  run: RunState; meta: string[]; stock: { id: string; price: number; sold?: boolean }[]; onBuy: (i: number) => void;
  onService: (k: 'remove' | 'purge' | 'charge', uid?: number) => void; onLeave: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const P = (b: number) => priceOf(b, meta);
  return (
    <div className="screen" style={{ minHeight: 'auto', flex: 1 }}>
      <div className="center-wrap">
        <div className="panel">
          <div className="k">BLACK MARKET · 보유 각뿔 {run.kakpul}</div>
          <h3 style={{ fontSize: 22 }}>암시장 — 각뿔 거래소</h3>
          <div className="choices">
            {stock.map((s, i) => (
              <div key={i} className={`choice ${s.sold ? 'faded' : ''}`}>
                <CardView id={s.id} disabled={s.sold || run.kakpul < P(s.price)} onClick={() => onBuy(i)} />
                <small>{s.sold ? '판매 완료' : `각뿔 ${P(s.price)}`}</small>
              </div>
            ))}
          </div>
          <div className="ev-opts">
            <button className="ev-opt with-ic" disabled={run.kakpul < P(50) || run.deck.length <= 5} onClick={() => setRemoving(true)}><Icon name="deck" size={26} /><b>카드 소거 · 각뿔 {P(50)}</b><small>덱에서 카드 1장 제거</small></button>
            <button className="ev-opt with-ic" disabled={run.kakpul < P(45) || run.erosion <= 0} onClick={() => onService('purge')}><Icon name="erosion" size={26} /><b>침식 정화 · 각뿔 {P(45)}</b><small>침식 −10%</small></button>
            <button className="ev-opt with-ic" disabled={run.kakpul < P(60)} onClick={() => onService('charge')}><Icon name="mirror" size={26} /><b>거울 모사 충전 · 각뿔 {P(60)}</b><small>흡수 가능 횟수 +1</small></button>
          </div>
          <div style={{ marginTop: 18 }}><button className="btn solid" onClick={onLeave}>떠난다 →</button></div>
        </div>
      </div>
      {removing && <DeckModal cards={run.deck} title="소거할 카드 선택" onClose={() => setRemoving(false)} onPick={(c: CardInst) => { onService('remove', c.uid); setRemoving(false); }} />}
    </div>
  );
}

// ─── 결과 ──────────────────────────────────────────────
export function ResultView({ outcome, run, settle, archived, newCodex, onHub }: { outcome: 'win' | 'lose' | 'eroded'; run: RunState; settle: Settlement; archived: boolean; newCodex: number; onHub: () => void }) {
  const title = outcome === 'win' ? 'SECTOR CLEARED' : outcome === 'eroded' ? 'REPLACED' : 'SIGNAL LOST';
  const sub = outcome === 'win' ? '구역 정화 완료. 거울 속의 당신을 넘어섰습니다.' : outcome === 'eroded' ? '침식 100%. 당신은 원형이 되었습니다.' : '신호 소실. 본체의 기록이 회수됩니다.';
  const top = useMemo(() => Object.entries(run.stats.playCounts).sort((a, b) => b[1] - a[1]).slice(0, 3), [run]);
  return (
    <div className="screen">
      <div className="center-wrap" style={{ justifyContent: 'center' }}>
        <Emblem size={180} erosion={outcome === 'eroded' ? 100 : run.erosion} />
        <div className={`big-title ${outcome !== 'win' ? 'out' : ''}`}>{title}</div>
        <div className="mute">{sub}</div>
        <div className="settle">
          {settle.lines.map(([k, v]) => <div key={k}><span>{k}</span><span>{v ? `+${v}` : ''}</span></div>)}
          <div className="tot"><span>획득 기억 파편</span><span>+{settle.total}</span></div>
        </div>
        <div className="mono mute" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.8 }}>
          가장 많이 쓴 카드: {top.map(([id, n]) => `${CARDS[id]?.name} ×${n}`).join(' · ') || '—'}<br />
          도감 신규 기록 {newCodex}건
          {archived && <><br />이 런의 덱이 원형 기록에 저장되었습니다. 다음 작전의 아크가 당신을 재현할 수 있습니다.</>}
        </div>
        <div style={{ marginTop: 20 }}><button className="btn solid" onClick={onHub}>허브로 →</button></div>
      </div>
    </div>
  );
}
