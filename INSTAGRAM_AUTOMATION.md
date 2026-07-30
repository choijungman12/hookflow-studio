# 인스타 댓글 → DM → PDF 자동발송 설계

> GitHub Pages(정적)로는 발송 서버를 돌릴 수 없습니다. 아래 **경로 A(노코드)** 를 먼저 쓰고,
> 커스텀 로직이 필요해지면 **경로 B(직접 웹훅)** 로 확장하세요.

## 흐름

```
릴스/카드뉴스 게시 (캡션에 트리거 키워드 "가이드")
      │
      ▼
[댓글 감지]  ManyChat 또는 Meta Graph API 웹훅
      │  키워드 "가이드" 매칭
      ▼
[댓글 자동 답글]  "DM 확인해 주세요! 📩"
      │
      ▼
[자동 DM 발송]  Instagram Messaging API
      │  PDF 다운로드 링크(GitHub Pages/Drive) 첨부
      ▼
[리드 확보]  팔로우 전환 CTA
```

핵심: 정책상 **24시간 메시징 윈도우** 안에서만 자유 DM 가능. 댓글 트리거로 시작된 대화는 허용되지만, 무분별한 대량 DM은 계정 제재 대상.

---

## 경로 A · ManyChat (노코드, 추천)

1. [ManyChat](https://manychat.com) 가입 → **Instagram** 채널 연결 (Pro 플랜, 비즈니스/크리에이터 계정 필요)
2. **Automation → New → Instagram → Comment** 트리거
   - Post: 대상 릴스 선택 / Keyword: `가이드`
3. Action 흐름:
   - **Reply to comment**: `DM 보냈어요! 확인해 주세요 📩`
   - **Send Message (DM)**: 인사 + **Button**(URL=PDF 링크)
   - 조건: "팔로우 시 다음 편도" CTA → 팔로우 성장
4. 라이브 → 실제 댓글로 테스트

Meta 앱 심사 불필요. 하루 만에 출시 가능.

---

## 경로 B · 직접 웹훅 (개발, 유연)

### 준비
- Meta 개발자 앱 + Instagram Graph API
- 권한: `instagram_manage_comments`, `instagram_manage_messages`, `pages_manage_metadata`
- 비즈니스 계정 ↔ 페이지 연결, **App Review** 통과(라이브)

### 웹훅 수신 (Cloudflare Workers 예시)

```js
// wrangler + Cloudflare Workers — 댓글 이벤트 → 키워드 매칭 → DM 발송
const VERIFY_TOKEN = "YOUR_VERIFY_TOKEN";
const PAGE_TOKEN   = "YOUR_LONG_LIVED_TOKEN"; // Secret 으로 관리
const KEYWORD      = "가이드";
const PDF_URL      = "https://<사용자>.github.io/hookflow-studio/guide.pdf";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 1) 웹훅 검증 (GET)
    if (req.method === "GET") {
      if (url.searchParams.get("hub.verify_token") === VERIFY_TOKEN)
        return new Response(url.searchParams.get("hub.challenge"));
      return new Response("forbidden", { status: 403 });
    }

    // 2) 이벤트 수신 (POST)
    const body = await req.json();
    for (const entry of body.entry ?? []) {
      for (const ch of entry.changes ?? []) {
        if (ch.field !== "comments") continue;
        const text = (ch.value.text || "").toLowerCase();
        if (!text.includes(KEYWORD)) continue;

        const commentId = ch.value.id;
        const userId    = ch.value.from?.id;

        // 2-1) 댓글 답글
        await fetch(`https://graph.facebook.com/v21.0/${commentId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "DM 보냈어요! 확인해 주세요 📩", access_token: PAGE_TOKEN }),
        });

        // 2-2) 자동 DM (댓글 발신자에게)
        await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { comment_id: commentId },      // 또는 { id: userId }
            message: {
              text: `무료 가이드 PDF 여기 있어요 👇\n${PDF_URL}\n\n다음 편도 놓치지 않게 팔로우 부탁드려요!`,
            },
            access_token: PAGE_TOKEN,
          }),
        });
      }
    }
    return new Response("ok");
  },
};
```

> Vercel/Netlify Functions로도 동일 로직 구현 가능. `PAGE_TOKEN`은 반드시 환경변수/Secret으로.

### 배포
```bash
npm i -g wrangler
wrangler secret put PAGE_TOKEN
wrangler deploy
# → 배포 URL을 Meta 앱 웹훅 콜백으로 등록, comments 필드 구독
```

---

## PDF 호스팅
- 앱 **⑥ 리드마그넷** 탭에서 "PDF로 저장(인쇄)" → 생성한 PDF를 저장소에 `guide.pdf`로 커밋
- 링크: `https://<사용자>.github.io/hookflow-studio/guide.pdf`
- 대용량/트래킹이 필요하면 Google Drive 공유링크나 노션 대신 전용 랜딩 사용

## 정책 체크리스트
- [ ] 비즈니스/크리에이터 계정
- [ ] 트리거는 사용자가 **먼저 댓글**을 단 경우에만 (선발신 금지)
- [ ] 24시간 윈도우 준수, 프로모션 태그 규칙 확인
- [ ] 동일 문구 대량 발송 지양(스팸 필터)
