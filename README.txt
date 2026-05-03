================================================================
  Rustic Collage — 정적 페이지 (Framer 페이지 코드 재현)
================================================================

원본: https://conscientious-website-384801.framer.app


【파일 구성 — 3개 + README】

  rustic-collage/
  ├─ index.html       페이지 마크업
  ├─ style.css        디자인 (한 파일에 전부)
  ├─ app.js           가벼운 인터랙션 (스크롤 페이드인, 네비 보더)
  └─ README.txt       (이 파일)


【FTP 업로드】

위 3개 파일(index.html, style.css, app.js)을 호스팅 서버 웹 루트에 그대로 업로드.
완료. 끝.


【재현 범위 / 디자인 결정】

원본 Framer 페이지의 시각 디자인을 100% 픽셀 단위로 복제하는 것이 아닌,
"같은 구조 · 같은 톤 · 같은 사용자 경험" 을 코드로 재현하는 데 초점을 두었습니다.

  - 컬러 팔레트: 웜 베이지 베이스(#F3EDE2) + 딥 브라운 텍스트 — 우드 브랜드 톤에 맞춤
  - 타이포: 영문 디스플레이 = Cormorant Garamond (이탤릭 포함),
            본문 = Pretendard (한글 우선) + Inter (영문 폴백)
  - 섹션:
      Hero — 풀스크린 이미지 + 큰 워드마크 + 한국어/영문 카피 병기
      Steps — SELECT / PLACE / LAYER 3컬럼
      colllage collection — 3개 제품 카드 (호버 시 두 번째 이미지로 전환)
      Projects — 4개 컬렉션, 좌우 교차 레이아웃
      Contact — 풀블리드 이미지 + 어두운 오버레이 + Call/SUBMIT
      Footer — 다크 브라운 배경, 6링크 그리드


【이미지에 대한 안내】

현재 이미지들은 원본 Framer CDN(framerusercontent.com)을 그대로 참조하고 있어요.
이 상태로도 사이트는 정상 작동하지만, 다음 두 가지 이슈가 있습니다.

  1) Framer 측 사정으로 이미지 URL이 만료/변경될 수 있음
  2) 한국 사용자의 경우 framerusercontent.com 에 접속 차단 환경 가능성

【권장】 운영 시작 전에 이미지를 자체 호스팅으로 옮기세요.

  ① 원본 페이지에서 모든 이미지 다운로드
  ② rustic-collage/images/ 폴더 만들어서 넣기
  ③ index.html의 src 값을 상대경로로 변경
       예) https://framerusercontent.com/images/qKDqXk6yo1e0liFFvrsCY72Pzvw.jpg
       →   ./images/hero.jpg
  ④ FTP 업로드 시 images/ 폴더도 함께 올리기


【콘텐츠 수정】

이 페이지는 텍스트가 index.html 안에 직접 들어 있어, 콘텐츠 변경은 HTML을 직접 수정합니다.

만약 비개발자가 직접 수정 가능한 형태(어드민 UI 또는 data.json 편집 방식)가 필요하면,
이전 작업물 ../homepage-cms/static-only/ 의 패턴(data.json + editor.html)을 이 페이지에
적용해드릴 수 있습니다. 말씀해주세요.


【반응형】

  - 모바일 (< 768px): 1컬럼 스택, Hero 카피 세로 정렬, 컬렉션 카드 텍스트 위/이미지 아래
  - 태블릿 (768~1024px): Steps 3컬럼, Products 2~3컬럼
  - 데스크톱 (> 1024px): 풀 그리드, 좌우 교차 컬렉션


【접근성 / 성능】

  - prefers-reduced-motion 사용자에겐 애니메이션 즉시 종결
  - Hero 이미지에 fetchpriority="high"
  - 그 외 모든 이미지에 loading="lazy"
  - alt 속성 부여 (장식용 이미지는 alt="")
  - 시맨틱 태그 사용 (header / nav / main / section / article / figure / footer)


【커스터마이즈 포인트】

style.css 상단의 :root 변수만 바꾸면 톤을 빠르게 조정할 수 있어요.

  --bg          페이지 배경색
  --ink-900     본문 텍스트 메인 컬러
  --accent      우드 액센트 컬러
  --font-display  디스플레이 세리프 (현재 Cormorant Garamond)
  --container   최대 폭 (현재 1240px)
