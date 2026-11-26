// 작전 교본: 기믹과 규칙을 장별로 설명하는 튜토리얼 화면
import { useEffect, useState, type ReactNode } from 'react';
import { CardView } from './common';
import { Icon } from './Icons';
import { Portrait } from './Portraits';

interface Chapter { id: string; icon: string; title: string; sub: string; visual: ReactNode; body: ReactNode }

const Flow = ({ items }: { items: [string, string][] }) => (
  <div className="g-flow">
    {items.map(([ic, label], i) => (
      <div key={i} className="g-flow-i" style={{ animationDelay: `${i * 0.12}s` }}>
        <span className="o"><Icon name={ic} size={22} /></span>
        <span>{label}</span>
      </div>
    ))}
  </div>
);

const CHAPTERS: Chapter[] = [
  {
    id: 'goal', icon: 'launch', title: '작전 목표', sub: 'OBJECTIVE',
    visual: <Flow items={[['combat', '전투'], ['event', '미확인'], ['elite', '정예'], ['rest', '휴식'], ['shop', '상점'], ['boss', '아크']]} />,
    body: (
      <>
        <p>침묵 회랑은 <b>다섯 구역과 보스 구역</b>으로 이루어져 있습니다. 맵에서 연결된 다음 노드를 하나씩 골라 내려가고, 마지막에 거울 파수꾼 <b>아크</b>를 쓰러뜨리면 작전 성공입니다.</p>
        <ul>
          <li><Icon name="combat" size={14} /> 전투 · <Icon name="elite" size={14} /> 정예: 적을 처치하고 카드·각뿔 보상</li>
          <li><Icon name="event" size={14} /> 미확인: 선택지가 있는 사건. 이득과 침식을 맞바꾸는 경우가 많음</li>
          <li><Icon name="rest" size={14} /> 휴식: 체력 회복 또는 침식 감소 · <Icon name="shop" size={14} /> 상점: 각뿔로 카드·소장품 구매</li>
        </ul>
        <p className="warn"><Icon name="heart" size={14} /> 체력 0, 또는 <Icon name="erosion" size={14} /> 침식 100%. 둘 중 하나면 패배합니다.</p>
      </>
    ),
  },
  {
    id: 'turn', icon: 'sword', title: '전투의 흐름', sub: 'TURN CYCLE',
    visual: <Flow items={[['antenna', '관측'], ['deck', '행동'], ['twin', '잔상'], ['combat', '적 단계']]} />,
    body: (
      <>
        <ol>
          <li><b>관측</b>: 차폐가 사라지고 행동 횟수 3 회복, 카드 5장을 뽑습니다. 모든 적의 다음 행동(의도)이 머리 위에 공개됩니다.</li>
          <li><b>행동</b>: 행동 횟수를 써서 카드를 냅니다. 턴마다 한 번 <b>모사</b>를 할 수 있습니다.</li>
          <li><b>잔상</b>: 턴을 끝내면 분신이 각인된 카드를 한 번 더 시전하고, 마지막으로 낸 카드가 <b>잔향</b>으로 남습니다.</li>
          <li><b>적 단계</b>: 적이 예고한 의도를 실행합니다.</li>
        </ol>
        <div className="g-legend">
          {[['sword', '공격'], ['shield', '방어'], ['buff', '강화'], ['debuff', '약화·취약'], ['echo', '반향'], ['summon', '증원'], ['seal', '역상']].map(([ic, l]) => (
            <span key={ic}><Icon name={ic} size={16} /> {l}</span>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'mimic', icon: 'mirror', title: '모사', sub: 'MIMIC · 도플갱어의 핵심',
    visual: (
      <div className="g-mimic">
        <div className="g-pt"><Portrait kind="patrol" size={96} /><span className="intent"><Icon name="sword" size={14} /> 순찰 사격</span></div>
        <div className="g-arrow"><Icon name="mirror" size={26} /><i /></div>
        <CardView id="patrolShot" mini />
      </div>
    ),
    body: (
      <>
        <p>적의 <b>공개된 의도를 베껴 내 패로 가져오는 것</b>이 이 게임의 중심입니다. <b>모사</b> 버튼을 누른 뒤 적을 고르세요.</p>
        <ul>
          <li>턴당 1회, 행동 횟수 1. 베낀 카드는 이번 전투에서만 쓰고 사라집니다.</li>
          <li>모사당한 적은 그 행동의 위력이 <b>25% 줄어듭니다</b>. 공격을 베끼는 것은 방어이기도 합니다.</li>
          <li>대가로 <b>침식 +3%</b>. 베낄수록 강해지고, 베낄수록 내가 지워집니다.</li>
          <li>도감에서 적의 행동 패턴은 그 적을 한 번이라도 모사해야 공개됩니다.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'absorb', icon: 'relic', title: '흡수', sub: 'ABSORB',
    visual: (
      <div className="g-absorb">
        <CardView id="patrolShot" mini />
        <div className="g-arrow down"><Icon name="descend" size={24} /></div>
        <div className="g-deck"><Icon name="deck" size={30} /><span>덱에 영구 편입</span></div>
      </div>
    ),
    body: (
      <>
        <p>전투에서 이기면 보상 화면에서 <b>이번 전투에 모사했던 기술 하나를 흡수</b>할 수 있습니다. 흡수한 카드는 덱에 영구히 들어갑니다.</p>
        <ul>
          <li>흡수는 상단의 <Icon name="mirror" size={14} /> <b>거울 모사 횟수</b>(기본 4회)만큼만 가능합니다.</li>
          <li>흡수할 때마다 <b>침식 +8%</b>.</li>
          <li>흡수 카드는 <b>거울·흡수 분류</b>라서 침식이 높을수록 더 세집니다.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'erosion', icon: 'erosion', title: '침식', sub: 'EROSION · 두 번째 체력',
    visual: (
      <div className="g-tiers">
        {[['0', '안정', '기본 상태'], ['30', '동요', '거울·흡수 피해 +15% · 이름 없는 기억 1장'], ['60', '잠식', '피해 +30% · 이름 없는 기억 2장'], ['90', '붕괴 직전', '피해 +50% · 매 턴 패 1장 덮어쓰기']].map(([v, n, t], i) => (
          <div key={v} className={`t t${i}`}><span className="v">{v}%</span><b>{n}</b><span className="d">{t}</span></div>
        ))}
        <div className="t end"><span className="v">100%</span><b>치환</b><span className="d">패배 · 당신은 원형이 됩니다</span></div>
      </div>
    ),
    body: (
      <>
        <p>침식은 런 내내 유지되는 게이지입니다. 구간이 오를수록 <b>거울·흡수 카드가 강해지지만</b>, 전투 시작 시 쓸 수 없는 <b>이름 없는 기억</b>이 덱에 섞입니다.</p>
        <ul>
          <li>이름 없는 기억을 손에 든 채 턴을 끝내면 장마다 침식 +1%.</li>
          <li>휴식 노드, 일부 거울 카드(자아 정돈 등), 사건 선택지로 낮출 수 있습니다.</li>
          <li>카드에 마우스를 올리면 침식 바에 쓰고 난 뒤의 침식이 미리 표시됩니다.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'echo', icon: 'echo', title: '반향과 분신', sub: 'ECHO · AFTERIMAGE',
    visual: (
      <div className="g-mimic">
        <div className="g-pt"><Portrait kind="phantom" size={96} /><span className="intent"><Icon name="echo" size={14} /> 반향</span></div>
        <div className="g-arrow rev"><Icon name="echo" size={26} /><i /></div>
        <div className="g-pt"><Portrait kind="resonance" size={96} /><span className="intent"><Icon name="twin" size={14} /> 분신</span></div>
      </div>
    ),
    body: (
      <>
        <p><b>반향</b> 의도를 가진 적은 반대로 <b>나를 베낍니다</b>. 내가 이번 턴 마지막으로 낸 카드를 그대로 따라 씁니다.</p>
        <ul>
          <li>반향 의도는 내가 카드를 낼 때마다 실시간으로 바뀝니다. 약한 카드를 마지막에 내서 미끼로 쓰세요.</li>
          <li>심도 01부터는 일반 적도 반향을 쓰고, 심도 02부터는 두 번 따라 씁니다.</li>
        </ul>
        <p><b>분신</b>은 공명 탐사의 주력입니다. 잔상 복제 뒤에 낸 카드가 분신에 각인되고, 턴 끝에 분신이 그 카드를 한 번 더 시전합니다.</p>
      </>
    ),
  },
  {
    id: 'ark', icon: 'boss', title: '거울 파수꾼 · 아크', sub: 'BOSS · 런이 만든 나',
    visual: <div className="g-ark"><Portrait kind="ark" squad="scout" size={150} /></div>,
    body: (
      <>
        <p>아크는 전투 시작 시 <b>내 런 기록을 스캔</b>해 나를 재현합니다.</p>
        <ul>
          <li>이번 런에서 <b>가장 많이 쓴 카드 3장</b>과 <b>흡수한 카드</b>가 1.5배로 강화되어 아크의 기술이 됩니다.</li>
          <li>체력이 절반 아래로 떨어지면 <b>역상</b>: 매 턴 내 패 1장을 봉인하고 그 카드를 자기가 씁니다.</li>
          <li>침식 100%로 끝난 런의 덱은 <b>원형 기록</b>에 남고, 이후 아크가 가끔 그 "과거의 나"로 나타납니다.</li>
        </ul>
        <p className="mute">덜 베끼고 깔끔하게 온 런일수록 아크도 약합니다.</p>
      </>
    ),
  },
  {
    id: 'meta', icon: 'tree', title: '작전이 끝난 뒤', sub: 'META PROGRESSION',
    visual: <Flow items={[['fragment', '기억 파편'], ['tree', '우위 선점'], ['codex', '도감'], ['d4', '심도']]} />,
    body: (
      <>
        <p>성공하든 실패하든 작전이 끝나면 <b>기억 파편</b>을 얻습니다. 돌파한 노드, 처치한 정예, 아크 처치, 처음 모사한 적이 점수가 되고 심도 배율이 곱해집니다. 침식 100%로 끝나면 ×1.3 보너스가 붙습니다.</p>
        <ul>
          <li><Icon name="tree" size={14} /> <b>우위 선점</b>: 파편으로 영구 강화를 엽니다. 언제든 전액 환불하고 다시 짤 수 있습니다.</li>
          <li><Icon name="codex" size={14} /> <b>데이터 뱅크</b>: 런마다 구성이 달라지니, 본 카드·적·사건이 도감에 쌓입니다.</li>
          <li><Icon name="d4" size={14} /> <b>프로토콜 심도</b>: 깊이 내려갈수록 규칙이 하나씩 추가되고 파편 배율이 오릅니다.</li>
        </ul>
      </>
    ),
  },
];

export function GuideView({ onBack }: { onBack: () => void }) {
  const [i, setI] = useState(0);
  const ch = CHAPTERS[i];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setI((v) => Math.min(CHAPTERS.length - 1, v + 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div className="screen">
      <div className="head">
        <button className="btn ghost icon-btn" onClick={onBack}><Icon name="back" size={16} /> 허브로</button>
        <div><div className="kicker">FIELD MANUAL · 작전 교본</div><h2>기믹과 규칙</h2></div>
        <span className="spacer" />
        <span className="mono mute" style={{ fontSize: 12 }}>{String(i + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')} · ←→ 키</span>
      </div>
      <div className="wrap guide">
        <nav className="g-nav">
          {CHAPTERS.map((c, n) => (
            <button key={c.id} className={n === i ? 'on' : n < i ? 'done' : ''} onClick={() => setI(n)}>
              <span className="n">{String(n + 1).padStart(2, '0')}</span>
              <Icon name={c.icon} size={18} />
              <span>{c.title}</span>
            </button>
          ))}
        </nav>
        <section className="g-page" key={ch.id}>
          <div className="kicker">{ch.sub}</div>
          <h3><Icon name={ch.icon} size={26} /> {ch.title}</h3>
          <div className="g-visual">{ch.visual}</div>
          <div className="g-body">{ch.body}</div>
          <div className="g-foot">
            <button className="btn ghost icon-btn" disabled={i === 0} onClick={() => setI(i - 1)}><Icon name="back" size={14} /> 이전</button>
            <span className="spacer" />
            {i < CHAPTERS.length - 1
              ? <button className="btn solid icon-btn" onClick={() => setI(i + 1)}>다음 · {CHAPTERS[i + 1].title}</button>
              : <button className="btn solid icon-btn" onClick={onBack}><Icon name="launch" size={16} /> 허브로 돌아가기</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
