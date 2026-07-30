# GitHub Pages 배포 안내 (대표님 계정에 올리기)

로컬 저장소는 **이미 git 초기화 + 첫 커밋**까지 완료돼 있습니다. 아래 두 방법 중 하나를 고르세요.

---

## 방법 A · CLI 없이 (가장 쉬움, 5분)

1. **github.com 로그인** → 우측 상단 **＋ → New repository**
2. Repository name: `hookflow-studio` · **Public** 선택 → **Create repository**
3. 새 저장소 화면에서 **"uploading an existing file"** 클릭
4. 이 폴더의 파일을 드래그해서 올리기:
   - **필수:** `index.html`
   - 선택: `README.md`, `INSTAGRAM_AUTOMATION.md`, `DEPLOY.md`, `.nojekyll`
5. 아래 **Commit changes** 클릭
6. 저장소 상단 **Settings → 좌측 Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/(root)** → **Save**
7. 1~2분 후 접속: **`https://<사용자이름>.github.io/hookflow-studio/`**

> 예: 사용자이름이 `hookflow`면 → `https://hookflow.github.io/hookflow-studio/`

---

## 방법 B · Git CLI (로컬 커밋 완료 상태에서 push만)

github.com에서 빈 저장소 `hookflow-studio`만 먼저 만들고(READY 화면의 URL 확인), 이 폴더에서:

```bash
cd "C:/Users/Pro/hookflow-studio"
git remote add origin https://github.com/<사용자이름>/hookflow-studio.git
git push -u origin main
```

그 다음 **Settings → Pages → Branch: main /(root) → Save** (방법 A의 6~7단계와 동일).

> 인증 창이 뜨면 GitHub 계정으로 로그인(또는 Personal Access Token) 하시면 됩니다.

---

## 배포 후 수정·보완 (실시간)

`index.html` **한 파일만** 고치면 됩니다.

- **방법 A 사용자:** 저장소에서 `index.html` 열기 → 연필(✏️) 아이콘 → 수정 → Commit. 1~2분 후 자동 반영.
- **방법 B 사용자:**
  ```bash
  git add index.html
  git commit -m "update"
  git push
  ```

---

## 참고

| 구분 | Artifact 미리보기 | GitHub Pages |
|---|---|---|
| URL | claude.ai/code/artifact/… | `<id>.github.io/hookflow-studio/` |
| 공개 | 비공개(본인만) | **공개(전 세계)** |
| 지속 | 임시 | **영구** |
| 용도 | 빠른 확인 | 실제 운영·공유 |

- 저장 데이터(프로젝트)는 **브라우저 localStorage**에 남습니다. 다른 기기와 옮길 땐 앱 상단 **JSON 내보내기/불러오기** 사용.
- 토지 DM PDF는 앱 ⑥탭에서 **PDF로 저장(인쇄)** 후, 저장소에 `guide.pdf`로 올리면 `…github.io/hookflow-studio/guide.pdf` 링크로 배포됩니다. (인스타 자동발송 연동은 `INSTAGRAM_AUTOMATION.md` 참고)
