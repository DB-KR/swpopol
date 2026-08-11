# MY 자산 통장

휴대폰에서도 접속 가능한 개인 자산 포트폴리오 대시보드입니다.
GitHub Pages(무료 호스팅) + Supabase(무료 DB·로그인)로 동작합니다.

---

## 0. 준비물
- GitHub 계정
- Supabase 계정 (https://supabase.com, GitHub 계정으로 가입 가능)
- Node.js 18 이상 (로컬에서 미리 확인해보고 싶을 때만 필요)

---

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 에서 **New project** 생성 (이름/비밀번호는 자유롭게, DB 비밀번호는 별도 보관)
2. 프로젝트가 생성되면 왼쪽 메뉴 **SQL Editor** 로 이동
3. 이 저장소의 `supabase/schema.sql` 파일 내용을 전부 복사해서 붙여넣고 **Run** 실행
   → `assets`, `snapshots`, `goals`, `cashflow` 4개 테이블과 보안 정책(RLS)이 생성됩니다.
4. 왼쪽 메뉴 **Project Settings > API** 에서 다음 두 값을 복사해두세요.
   - `Project URL`
   - `anon public` 키

### 로그인 계정 만들기 (본인만 접속 가능하게)
이 앱은 이메일로 받는 "매직 링크"로 로그인합니다. 별도 회원가입 화면은 없고, 처음 한 번은 본인 이메일로 로그인 시도를 하면 계정이 자동 생성됩니다.

1. 앱을 배포한 뒤(3단계) 로그인 화면에서 본인 이메일로 링크 요청 → 메일함에서 링크 클릭 → 계정 생성 및 로그인 완료
2. **꼭 확인하세요**: Supabase 대시보드 **Authentication > Settings** 에서 **"Allow new user signups"(회원가입 허용)** 를 **꺼주세요.**
   이렇게 하면 이후로는 이미 만든 계정(본인 이메일)으로만 로그인할 수 있고, 다른 사람이 URL을 알아도 새 계정을 만들 수 없습니다.

---

## 2. 로컬에서 먼저 확인하기 (선택)

```bash
npm install
cp .env.example .env
# .env 파일을 열어 Supabase URL / anon key 입력
npm run dev
```

브라우저에서 `http://localhost:5173` 접속해서 로그인 → 정상 동작 확인.

---

## 3. GitHub에 올리고 자동 배포하기

1. GitHub에서 새 저장소 생성 (예: `portfolio-dashboard`)
2. `vite.config.js` 파일의 `base` 값을 저장소 이름과 동일하게 수정
   ```js
   base: "/저장소이름/",
   ```
3. 이 프로젝트 폴더 전체를 그 저장소에 푸시
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/내아이디/저장소이름.git
   git push -u origin main
   ```
4. GitHub 저장소 **Settings > Secrets and variables > Actions > New repository secret** 에서 2개 등록
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Settings > Pages** 에서 **Source: GitHub Actions** 선택
6. `main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 자동으로 빌드·배포합니다.
   완료되면 `https://내아이디.github.io/저장소이름/` 으로 접속됩니다. (Actions 탭에서 진행 상황 확인 가능)

---

## 4. 휴대폰에서 접속하기

- 배포된 주소를 휴대폰 브라우저(Safari/Chrome)로 열면 됩니다.
- 홈 화면에 추가하면 앱처럼 아이콘으로 바로 실행할 수 있어요.
  - iOS Safari: 공유 버튼 → "홈 화면에 추가"
  - Android Chrome: 메뉴(⋮) → "홈 화면에 추가"

---

## 5. 저장소 공개 범위 (Public / Private)

**GitHub 무료 개인 계정이라면 저장소를 Public으로 만들어야 합니다.** GitHub Pages는 Free 플랜에서 Public 저장소에서만 동작하고, Private 저장소로 Pages를 쓰려면 GitHub Pro(월 $4) 이상이 필요합니다.

Public이어도 자산 데이터는 안전합니다:
- 배포된 사이트(JS 번들)는 저장소 공개 여부와 무관하게 어차피 인터넷에 공개됩니다. 그 안에 포함되는 Supabase `anon key`는 원래 공개되어도 되는 키예요.
- 실제 데이터 접근 권한은 Supabase의 **Row Level Security(RLS)** 가 "로그인한 본인의 데이터만" 보이도록 제한합니다 (`schema.sql`에 이미 설정됨).
- `.env` 파일은 `.gitignore`에 포함되어 실제 키 값이 커밋되지 않고, 빌드 시점에 GitHub Secrets에서 주입됩니다.
- Public이라 남는 부분은 "소스 코드(로직)가 보인다"는 정도이며, 아래 회원가입 차단만 해두면 실질적인 위험은 없습니다.

저장소 자체를 비공개로 두고 싶다면 GitHub Pro로 업그레이드하거나, Vercel/Netlify 같은 다른 무료 호스팅(Private 저장소 지원)으로 배포 방식을 바꾸면 됩니다.

## 6. 로그인 보안

위에서 안내한 대로 Supabase **Authentication > Settings** 에서 **"Allow new user signups"(회원가입 허용)** 를 꼭 꺼두세요. 켜져 있으면 URL을 아는 누구나 본인 이메일로 새 계정을 만들어 로그인할 수 있습니다 (서로의 데이터는 RLS로 보호되어 볼 수 없지만, 원치 않는 접근 자체를 막기 위함입니다).

---

## 7. 커스터마이징 팁

- 자산 카테고리 추가/변경: `src/lib/constants.js`
- 색상·폰트 등 디자인: `src/index.css`
- 새 메뉴(사이드바) 추가: `src/components/Sidebar.jsx`의 `MENU` 배열 + `src/App.jsx`에 라우트 추가 + `src/pages/`에 새 페이지 파일 생성
