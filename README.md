# 거울 프로토콜 (Mirror Protocol)

26 DT 아이디어톤 출품작 프로토타입. 키워드 **도플갱어**.

> 도플갱어와 싸우는 게임이 아니라, 도플갱어가 되어 가는 게임.

적의 의도를 **모사**해 손패로 가져오고, 전투가 끝나면 그중 하나를 **흡수**해 덱에 영구히 넣습니다. 베낄수록 강해지지만 **침식**이 올라 정체성이 무너지고(100%면 패배), 구역 끝의 보스 **거울 파수꾼 · 아크**는 이번 런의 기록(가장 많이 쓴 카드, 흡수한 카드, 침식도)을 스캔해 "당신"으로 싸웁니다.

설계 문서: [`docs/design/doppelganger-core-and-combat.md`](docs/design/doppelganger-core-and-combat.md)

## 실행

```bash
npm install
npm run dev          # 개발 서버
npm run build        # dist/ 정적 빌드 (GitHub Pages 등)
npm run build:single # dist-single/index.html 한 파일 빌드
npm run sim          # 자동 플레이로 전투 엔진 점검
```

## 배포 (GitHub Pages)

`.github/workflows/pages.yml`이 `main`에 푸시될 때마다 빌드해 Pages에 올립니다. 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 한 번 설정해야 합니다.

## 구조

```
src/game/   규칙 (화면과 분리된 순수 TypeScript)
  data.ts     카드·적·분대·심도·우위 트리·이벤트 데이터 (밸런스 수치는 여기서 조정)
  engine.ts   전투: 모사, 반향, 분신 각인, 침식, 아크 스캔·역상
  run.ts      맵 생성, 보상·흡수, 이벤트, 상점, 정산
  meta.ts     저장(localStorage), 도감 기록, 우위 해금
src/ui/     React 화면
  Combat.tsx  전투 화면 (거울 축, 탐색 스캔, 모사 연출)
  screens.tsx 허브, 출격 준비, 노드 맵(안테나 레이더), 보상, 이벤트, 정비, 암시장, 결과
  MetaScreens.tsx 우위 선점 트리, 데이터 뱅크 도감
```
