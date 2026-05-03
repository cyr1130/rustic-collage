# Rustic Collage — Project CMS (GitHub + Vercel)

`projects-data.json` 하나로 모든 프로젝트 콘텐츠를 관리하고, 어드민 페이지에서 편집 → 저장하면 GitHub에 자동 커밋되며 Vercel이 사이트를 다시 빌드합니다.

## 아키텍처

```
사용자(어드민)
    ↓
/admin/index.html        ← 로그인 + 편집 UI
    ↓ POST /api/save-projects { password, projects }
/api/save-projects.js    ← Vercel Function (인증 → GitHub API 커밋)
    ↓
GitHub (projects-data.json 업데이트)
    ↓
Vercel auto-deploy (30~60초)
    ↓
projects.html / project-detail.html 이 새 JSON을 fetch 해 자동 반영
```

## 파일 구조

```
rustic-collage/
├─ index.html
├─ about.html
├─ collection.html
├─ projects.html              ← projects-data.json 에서 카드 동적 렌더링
├─ project-detail.html        ← URL ?id= 로 해당 프로젝트 동적 렌더링
├─ contact.html
├─ projects-data.json         ← ★ 모든 프로젝트 콘텐츠
├─ admin/
│  └─ index.html              ← 어드민 에디터 페이지
├─ api/
│  └─ save-projects.js        ← Vercel 서버리스 함수
├─ package.json               ← @octokit/rest 의존성
├─ style.css, app.js          ← 공통
└─ .env.example
```

## 셋업 (한 번만)

### 1. GitHub 저장소에 코드 올리기

```bash
cd rustic-collage
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<your-username>/rustic-collage.git
git push -u origin main
```

### 2. Vercel에 import

1. https://vercel.com → **Add New → Project**
2. GitHub 저장소 선택 → Import
3. **Framework Preset**: Other (정적 HTML + serverless functions 자동 감지)
4. 환경변수는 다음 단계에서 설정 → 일단 Deploy

### 3. GitHub Personal Access Token 발급

1. https://github.com/settings/personal-access-tokens → **Generate new token (Fine-grained)**
2. **Repository access**: Only select repositories → `rustic-collage` 선택
3. **Permissions** → **Repository permissions**:
   - **Contents**: Read and write ✓
   - 나머지는 그대로
4. Generate → 토큰 복사 (한 번만 보임)

### 4. Vercel 환경변수 등록

Vercel 프로젝트 → **Settings → Environment Variables**:

| Name | Value | 비고 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | (충분히 강한 비밀번호) | 어드민 로그인용 |
| `GITHUB_REPO_OWNER` | `your-username` | GitHub 사용자명 또는 organization |
| `GITHUB_REPO_NAME` | `rustic-collage` | 저장소 이름 |
| `GITHUB_BRANCH` | `main` | (선택) 기본 main |
| `GITHUB_TOKEN` | `github_pat_…` | Step 3에서 발급한 토큰 |

저장 후 **Redeploy** (Deployments → 최신 → ⋯ → Redeploy)

### 5. 도메인 (선택)

Vercel 프로젝트 → Settings → Domains 에서 사용자 정의 도메인 추가.

## 사용 방법

### 어드민 페이지 접속

`https://your-domain.vercel.app/admin/`

또는 도메인 연결 시 `https://yourdomain.com/admin/`

### 편집 흐름

1. 페이지 로드 시 현재 `projects-data.json` 자동 불러옴
2. 카드 클릭하면 펼쳐짐 — 모든 필드 인라인 편집
3. **+ Add Project** 로 새 프로젝트 추가
4. ▲▼ 버튼으로 순서 변경, ✕ 로 삭제
5. **Save & Publish** 클릭 → 비밀번호 입력 → 자동으로 GitHub에 커밋 → Vercel 빌드 시작
6. 30~60초 후 사이트에 반영

### 이미지 처리

`projects-data.json` 은 이미지 URL만 저장합니다. 이미지 자체는 다음 중 하나로 호스팅:

- **GitHub repo의 `/images/` 폴더에 업로드** — GitHub.com 웹에서 드래그앤드롭으로 가능, 그 후 어드민에서 `./images/파일명.jpg` 로 입력
- **외부 호스팅** — Cloudinary, Imgur, ImageKit 등 무료 이미지 호스팅 URL 입력
- **기존 이미지 URL** 직접 사용

## 데이터 구조

`projects-data.json`:

```json
{
  "projects": [
    {
      "id": "project-1",
      "name": "프로젝트 이름",
      "thumbnail": "이미지 URL",
      "title": "상세 페이지 타이틀",
      "description": "설명 텍스트",
      "details": "Product Details 토글 내용",
      "size": "Size 토글 내용",
      "gallery": [
        "이미지 URL 1",
        "이미지 URL 2",
        "이미지 URL 3"
      ]
    }
  ]
}
```

각 필드:

| 필드 | 용도 |
| --- | --- |
| `id` | URL의 `?id=` 와 매칭. 영문/숫자/하이픈만 권장 |
| `name` | projects.html 카드 라벨, 브레드크럼 |
| `thumbnail` | projects.html 카드 이미지 |
| `title` | project-detail.html 큰 제목 |
| `description` | 디테일 페이지 본문 |
| `details` | "Product Details" 토글 안 내용 |
| `size` | "Size" 토글 안 내용 |
| `gallery` | 디테일 페이지 갤러리 이미지 3장 (최대 3개 사용) |

## 보안 메모

- `ADMIN_PASSWORD` 는 충분히 길고 추측하기 어렵게 (16자 이상 권장)
- `GITHUB_TOKEN` 은 해당 저장소에만 권한 있는 fine-grained token 사용
- 어드민 비밀번호는 `sessionStorage` 에 저장 — 브라우저 닫으면 사라짐
- `/admin/` 페이지에 `<meta name="robots" content="noindex">` 적용 — 검색엔진 색인 안 됨
- 추가 보안 필요 시 Vercel Authentication (Pro 플랜 기능)으로 `/admin` 경로 보호 가능

## 로컬 테스트

API 함수까지 로컬에서 테스트하려면 Vercel CLI 사용:

```bash
npm install -g vercel
vercel link        # Vercel 프로젝트와 연결
vercel env pull    # 환경변수 가져오기 → .env.local 자동 생성
vercel dev         # 로컬에서 API 함수 포함 실행 (보통 http://localhost:3000)
```

순수 정적 부분만 보려면 `npx serve .` 또는 VS Code Live Server 등으로 가능 (단, `/api/` 호출은 동작 안 함).

## 트러블슈팅

**"Server misconfigured: ADMIN_PASSWORD not set"**
→ Vercel 환경변수가 등록 안 됐거나 Redeploy 전. Settings → Env Vars 확인 후 Redeploy.

**"Invalid password"**
→ 입력한 비밀번호와 `ADMIN_PASSWORD` 환경변수 불일치.

**"Failed to commit to GitHub"**
→ `GITHUB_TOKEN` 만료/권한 부족 또는 `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` 오타.
   토큰 권한이 **Contents: Read and write** 인지 확인.

**저장 후 사이트에 반영 안 됨**
→ Vercel 빌드는 GitHub commit 후 30~60초 소요. Vercel 대시보드에서 Deployments 진행 상황 확인.
   브라우저 강제 새로고침(Cmd/Ctrl + Shift + R) 도 시도.

**카드/디테일 페이지가 빈 상태**
→ 브라우저 콘솔에 `projects-data.json` fetch 오류가 있는지 확인.
   파일이 GitHub에 푸시됐는지, Vercel 배포가 성공했는지 확인.
