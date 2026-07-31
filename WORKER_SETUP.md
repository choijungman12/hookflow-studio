# 백엔드(Cloudflare Worker) 설치 — 실제 AI 생성용

프론트(GitHub Pages)는 CORS 때문에 Gemini/fal를 직접 못 부릅니다. 아래 **무료 Worker**가 키를 안전하게 보관하고 대신 호출합니다. **한 번만** 설치하면 됩니다. (무료 티어: 하루 10만 요청)

## 준비물 (모두 무료)
- **Google AI Studio Gemini API 키** — https://aistudio.google.com/apikey (필수, 무료)
- (선택) **fal.ai 키** — https://fal.ai/dashboard/keys (Seedance 영상 생성용, 5초 ~$0.05)
- Cloudflare 계정 — https://dash.cloudflare.com (무료)

---

## 방법 A · CLI (가장 확실, 5분)
```bash
npm i -g wrangler
wrangler login                      # 브라우저로 Cloudflare 로그인

# 이 폴더에서 (worker.js 있는 곳)
wrangler deploy worker.js --name hookflow-worker --compatibility-date 2024-11-01

# 키 등록 (입력창에 키 붙여넣기)
wrangler secret put GEMINI_API_KEY --name hookflow-worker
wrangler secret put FAL_KEY        --name hookflow-worker   # 선택(영상)
```
배포가 끝나면 이런 URL이 나옵니다: `https://hookflow-worker.<계정>.workers.dev`

## 방법 B · 대시보드 (CLI 없이)
1. Cloudflare 대시보드 → **Workers & Pages → Create → Create Worker** → 이름 `hookflow-worker` → Deploy
2. **Edit code** → 왼쪽 코드 전체 삭제 후 `worker.js` 내용 붙여넣기 → **Deploy**
3. **Settings → Variables and Secrets → Add**:
   - `GEMINI_API_KEY` = (Gemini 키) · **Encrypt(Secret)** 체크
   - (선택) `FAL_KEY` = (fal 키) · Secret
4. 상단의 Worker URL 복사 (`https://hookflow-worker.<계정>.workers.dev`)

---

## 앱에 연결
1. 배포된 스튜디오 https://choijungman12.github.io/hookflow-studio/ 접속
2. 우상단 **⚙ 설정** → **Worker URL** 에 위 주소 붙여넣기 → **연결 테스트**
3. 초록불이 뜨면 이제 앱에서 **실제 이미지·콘티가 생성**됩니다.

## 확인/문제해결
- Worker URL을 브라우저로 열면 `{"ok":true,"hasGemini":true}` 가 보여야 정상.
- `hasGemini:false` → Secret 이름이 정확히 `GEMINI_API_KEY` 인지 확인.
- 이미지가 안 나오면 → Gemini 키의 이미지 모델 접근 권한/리전 확인.

## 비용 감각 (최소비용)
- Gemini 텍스트/이미지: 무료 티어 넉넉 (일일 한도 내 무료, 초과 시 매우 저렴)
- Seedance 영상(fal): 720p 5초 ≈ **$0.05** (힉스필드 대비 수십~수백 배 저렴)
- Cloudflare Worker: 무료 티어 하루 10만 요청

> 보안: 키는 Worker Secret에만 저장됩니다. 공개 배포로 확장하면 `ALLOW_ORIGIN` 변수에 사이트 도메인을 넣어 잠그세요.
