import { useState } from 'react';
import { CARD_LIST, ENEMY_LIST, EVENTS, META, META_TREE, RELIC_LIST, ABSORB_OF } from '../game/data';
import { canUnlock, reqMet } from '../game/meta';
import type { MetaSave } from '../game/types';
import { CardView, squadName } from './common';
import { CodexIcon } from './CodexIcons';
import { Portrait } from './Portraits';
import { Icon } from './Icons';

// ─── 우위 선점 ─────────────────────────────────────────
export function TreeView({ meta, onBack, onUnlock, onRefund }: { meta: MetaSave; onBack: () => void; onUnlock: (id: string) => void; onRefund: () => void }) {
  const [sel, setSel] = useState('awaken');
  const n = META[sel];
  const own = meta.unlocked.includes(sel);
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 허브로</button>
        <div><div className="kicker">META PROGRESSION · ADVANTAGE TREE</div><h2>우위 선점</h2></div>
        <span className="spacer" />
        <span className="mono mute">선점한 우위 {meta.unlocked.length} / {META_TREE.length}</span>
        <span className="chip icon-btn"><Icon name="fragment" size={14} /> 보유 기억 파편 <b>{meta.fragments}</b></span>
        <button className="btn ghost" onClick={onRefund} disabled={!meta.unlocked.length}>초기화 (전액 환불)</button>
      </div>
      <div className="tree-scroll">
        <div className="tree-inner">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {META_TREE.flatMap((m) =>
              m.req.map((r) => {
                const a = META[r];
                const on = meta.unlocked.includes(r) && meta.unlocked.includes(m.id);
                return <line key={r + m.id} className={on ? 'on' : ''} x1={a.x} y1={a.y} x2={m.x} y2={m.y} vectorEffect="non-scaling-stroke" />;
              }),
            )}
          </svg>
          {META_TREE.map((m) => {
            const owned = meta.unlocked.includes(m.id);
            const avail = !owned && reqMet(meta, m.id);
            return (
              <button key={m.id} className={`tnode ${m.core ? 'core' : ''} ${owned ? 'own' : ''} ${avail ? 'avail' : ''} ${sel === m.id ? 'sel' : ''}`} style={{ left: `${m.x}%`, top: `${m.y}%` }} onClick={() => setSel(m.id)}>
                <span className="o"><span><Icon name={m.id} size={m.core ? 28 : 24} stroke={1.5} /></span></span>
                <span className="l">{m.name}</span>
                <span className="c">{owned ? '선점' : `파편 ${m.cost}`}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="treefoot">
        <div style={{ width: 56, height: 56, border: '1px solid var(--fg)', display: 'grid', placeItems: 'center', transform: n.core ? 'rotate(45deg)' : undefined }}>
          <span style={{ transform: n.core ? 'rotate(-45deg)' : undefined, display: 'grid' }}><Icon name={n.id} size={24} /></span>
        </div>
        <div className="info">
          <div className="kicker mono mute" style={{ fontSize: 11 }}>{n.core ? '핵심 우위' : '우위'}{n.req.length ? ` · 선행: ${n.req.map((r) => META[r].name).join(' 또는 ')}` : ''}</div>
          <b>{n.name}</b>
          <div className="mute">{n.text}</div>
        </div>
        <span className="mono">필요 파편 × {n.cost}</span>
        <button className="btn solid" disabled={own || !canUnlock(meta, sel)} onClick={() => onUnlock(sel)}>{own ? '선점 완료' : '우위 선점'}</button>
      </div>
    </div>
  );
}

// ─── 데이터 뱅크 ───────────────────────────────────────
type Tab = 'home' | 'cards' | 'relics' | 'enemies' | 'events' | 'archive';
export function CodexView({ meta, onBack }: { meta: MetaSave; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const cards = CARD_LIST.filter((c) => c.cat !== '상태');
  const c = meta.codex;
  const sections: { id: Tab; name: string; sub: string; cnt: string; er: number }[] = [
    { id: 'cards', name: '도플갱어 카드', sub: '전술 · 거울 · 흡수 시그니처 카드', cnt: `${c.cards.filter((x) => cards.some((y) => y.id === x)).length} / ${cards.length}`, er: 0 },
    { id: 'relics', name: '전술 소장품', sub: '패시브 시너지 유물', cnt: `${c.relics.length} / ${RELIC_LIST.length}`, er: 20 },
    { id: 'enemies', name: '표적 · 원형', sub: '처치 = 실루엣 · 모사 = 패턴 공개', cnt: `${c.enemiesSeen.length} / ${ENEMY_LIST.length}`, er: 45 },
    { id: 'events', name: '우연한 만남', sub: '거울 섹터 분기 사건', cnt: `${c.events.length} / ${EVENTS.length}`, er: 65 },
    { id: 'archive', name: '원형 기록', sub: '침식 100%로 끝난 나의 덱', cnt: `${meta.archive.length}`, er: 95 },
  ];
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={() => (tab === 'home' ? onBack() : setTab('home'))}><Icon name="back" size={16} /> {tab === 'home' ? '허브로' : '데이터 뱅크'}</button>
        <div><div className="kicker">DATA BANK ARCHIVE</div><h2>데이터 뱅크 · 도감</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>작전 중 획득 · 조우 · 모사한 항목이 자동으로 기록됩니다</span>
      </div>
      {tab === 'home' ? (
        <div className="codex-home">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setTab(s.id)}>
              <span className="ci-wrap"><span className="ci-ring" /><CodexIcon kind={s.id} /></span>
              <b>{s.name}</b>
              <small>{s.sub}</small>
              <span className="cnt">{s.cnt}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="tabs">
            {sections.map((s) => (
              <button key={s.id} className={`tab ${tab === s.id ? 'on' : ''}`} onClick={() => setTab(s.id)}><CodexIcon kind={s.id} size={22} />{s.name}<small>{s.cnt}</small></button>
            ))}
          </div>
          <div className="codex-grid">
            {tab === 'cards' && cards.map((d) => (c.cards.includes(d.id) ? <CardView key={d.id} id={d.id} mini /> : <div className="locked" key={d.id}>{d.cat === '흡수' ? '흡수 · ???' : '???'}</div>))}
            {tab === 'relics' && RELIC_LIST.map((r) => (
              <div key={r.id} className={`entry ${c.relics.includes(r.id) ? '' : 'lock'}`}>
                <div className="tagrow">{r.pool === 'squad' ? '분대 소장품' : '정예 보상'}</div>
                <h4>{c.relics.includes(r.id) ? r.name : '???'}</h4>
                <p>{c.relics.includes(r.id) ? r.text : '획득하면 기록됩니다.'}</p>
              </div>
            ))}
            {tab === 'enemies' && ENEMY_LIST.map((e) => {
              const seen = c.enemiesSeen.includes(e.id);
              const mim = c.enemiesMimicked.includes(e.id);
              const abs = ABSORB_OF[e.id];
              return (
                <div key={e.id} className={`entry with-pt ${seen ? '' : 'lock'}`}>
                  <div className={`pt-frame ${seen ? '' : 'unseen'}`}><Portrait kind={e.id} squad={meta.archive[meta.archive.length - 1]?.squad ?? 'scout'} size={84} /></div>
                  <div className="tagrow">{e.tier === 'boss' ? '구역 보스' : e.tier === 'elite' ? '정예' : e.tier === 'minion' ? '잔상' : '복제체'} · {mim ? '패턴 해독 완료' : seen ? '실루엣만 기록' : '미조우'}</div>
                  <h4>{seen ? e.name : '???'}</h4>
                  {seen && <p>체력 {e.hp[0]}{e.hp[1] !== e.hp[0] ? `~${e.hp[1]}` : ''}</p>}
                  <p>{mim || (seen && e.tier === 'boss') ? e.desc : seen ? '한 번 모사하면 행동 패턴이 공개됩니다.' : '조우하면 기록됩니다.'}</p>
                  {mim && abs && <p>흡수 시: {CARD_LIST.find((x) => x.id === abs)?.name}</p>}
                </div>
              );
            })}
            {tab === 'events' && EVENTS.map((e) => (
              <div key={e.id} className={`entry ${c.events.includes(e.id) ? '' : 'lock'}`}>
                <div className="tagrow">거울 섹터 분기</div>
                <h4>{c.events.includes(e.id) ? e.name : '???'}</h4>
                <p>{c.events.includes(e.id) ? e.text : '조우하면 기록됩니다.'}</p>
                {c.events.includes(e.id) && e.options.map((o) => <p key={o.label}>▸ {o.label}: {o.desc}</p>)}
              </div>
            ))}
            {tab === 'archive' && (meta.archive.length ? meta.archive.map((a, i) => (
              <div key={i} className="entry">
                <div className="tagrow">원형 #{String(i + 1).padStart(2, '0')} · {a.at} · DEPTH {a.depth}</div>
                <h4>{squadName(a.squad)}의 원형</h4>
                <p>주력 카드: {a.cards.map((id) => CARD_LIST.find((x) => x.id === id)?.name).join(' / ')}</p>
                <p>다음 작전에서 아크가 이 덱을 재현할 수 있습니다.</p>
              </div>
            )) : <div className="entry lock"><h4>기록 없음</h4><p>침식 100%로 작전이 끝나면, 그 런의 덱이 여기 원형으로 남습니다.</p></div>)}
          </div>
        </>
      )}
    </div>
  );
}
