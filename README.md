# HookFlow Studio 🎬 (v2 · 노드 캔버스 + 실제 AI)

충격→토지 릴스/유튜브를 **최소비용**으로 찍어내는 제작 스튜디오.
GenSpark식 **노드 캔버스**에서 블록을 연결하면 **실제 AI가 이미지·콘티를 생성**하고, 노드에 결과가 바로 미리보기됩니다.

**라이브:** https://choijungman12.github.io/hookflow-studio/
**이전(탭형) 버전:** `/legacy.html`

---

## 🏗️ 구조 (왜 백엔드가 필요한가)
브라우저는 CORS 때문에 Gemini/fal API를 **직접 못 부릅니다**. 그래서:

```
GitHub Pages (노드 캔버스 프론트)  →  Cloudflare Worker (무료, 키 보관)  →  Gemini / fal.ai
```

- **프론트**: 정적 사이트, 빌드 없음, 실시간 수정.
- **백엔드**: 대표님이 **한 번** 배포하는 무료 Worker(`worker.js`). Gemini 키·fal 키를 Secret으로 보관 → 앱은 Worker URL만 압니다(키 노출 X).
- 설치법: **`WORKER_SETUP.md`** (5분).

## 🔌 연결
1. `WORKER_SETUP.md`대로 Worker 배포 → URL 확보
2. 앱 우상단 **⚙ 설정 → Worker URL** 붙여넣기 → **연결 테스트**(초록불)
3. 이제 노드에서 **실제 이미지·콘티 생성**

> Worker 없이도 **템플릿 콘티 · 콘티/CapCut/Seedance/나레이션 프롬프트 · 리드마그넷 PDF**는 동작합니다. (실제 이미지 생성만 Worker 필요)

---

## 🧩 노드 (= 기존 1~6단계)
| 노드 | 역할 |
|---|---|
| 🎯 프로젝트 | 주제·포맷(9:16/16:9)·컨텍스트·슬로건 |
| 🧑‍🎤 마스터 시트 | 인물/제품 레퍼런스 **이미지 생성**(Nano Banana) → 캐릭터 일관성 앵커 |
| 🎬 콘티 | **AI 콘티**(Gemini JSON) 또는 템플릿 · 충격→해법=토지→댓글「토지」DM |
| 🖼️ 컷 이미지 | 마스터를 참조로 컷별 이미지 **일괄 생성**(일관성 유지) |
| 📤 영상·나레이션 | 콘티시트/CapCut 저비용/Seedance/나레이션 프롬프트 출력 |
| 📄 리드마그넷 PDF | 토지 DM용 카드뉴스 PDF(인쇄 저장) |

**사용:** 노드 추가 → 포트(●) 드래그로 연결 → 각 노드에서 생성. 팔레트의 **＋기본 흐름 자동배치**로 한 번에 세팅.

## 💸 최소비용
- Gemini 텍스트·이미지: 무료 티어 넉넉
- Seedance 영상(fal): **720p 5초 ≈ $0.05** (힉스필드 대비 수십~수백 배 저렴)
- Cloudflare Worker: 무료 티어 하루 10만 요청

## 📁 파일
- `index.html` — 노드 캔버스 앱(v2)
- `worker.js` — Cloudflare Worker 백엔드
- `WORKER_SETUP.md` — Worker 설치 가이드
- `DEPLOY.md` — GitHub Pages 배포
- `legacy.html` — 이전 탭형 앱(v1, 백업)
- `INSTAGRAM_AUTOMATION.md` — 댓글→DM→PDF 자동화 설계

## ⚙️ 배포 후 수정
`index.html` 수정 → `git add -A && git commit -m "update" && git push` → 1~2분 뒤 자동 반영.
