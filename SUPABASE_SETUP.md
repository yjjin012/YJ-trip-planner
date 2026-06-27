# Supabase 연결 방법

이 단계는 앱 데이터를 내 브라우저가 아니라 Supabase에 저장하기 위한 준비입니다.

## 1. Supabase 프로젝트 만들기

1. Supabase에 가입합니다.
2. 새 프로젝트를 만듭니다.
3. 프로젝트가 만들어질 때까지 기다립니다.

## 2. 데이터 저장 규칙 만들기

1. Supabase 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
2. `supabase-setup.sql` 파일 내용을 그대로 붙여 넣습니다.
3. 실행합니다.

이 규칙은 로그인한 사용자가 자기 여행 데이터만 읽고 쓸 수 있게 합니다.

## 3. 앱에 Supabase 주소 넣기

1. Supabase 프로젝트에서 `Project Settings`를 엽니다.
2. `API` 메뉴에서 `Project URL`과 `anon public` key를 찾습니다.
3. `supabase-config.js` 파일을 열고 아래처럼 채웁니다.

```js
window.TRIP_APP_SUPABASE = {
  url: "여기에 Project URL",
  anonKey: "여기에 anon public key",
};
```

## 4. 개발 중 이메일 인증 끄기

개발 중에는 가입하자마자 바로 로그인할 수 있게 이메일 인증을 꺼두는 것이 편합니다.

1. Supabase 왼쪽 메뉴에서 `Authentication`을 엽니다.
2. `Sign In / Providers` 또는 `Providers` 메뉴를 엽니다.
3. `Email` 항목을 엽니다.
4. `Confirm email` 또는 `Enable email confirmations` 옵션을 끕니다.
5. 저장합니다.

나중에 실제로 다른 사람에게 공개할 때는 이 옵션을 다시 켜는 것이 좋습니다.

## 5. 앱에서 로그인하기

1. 앱의 `공유` 탭으로 갑니다.
2. `클라우드 저장`에서 이메일과 비밀번호를 입력합니다.
3. 처음이면 `가입`, 이미 가입했다면 `로그인`을 누릅니다.
4. 로그인 후에는 저장할 때 클라우드에도 자동 저장됩니다.

## 중요한 점

Supabase는 데이터를 인터넷에 저장하는 곳입니다. 사이트 주소를 외부에 공개하려면 나중에 Netlify, Vercel, GitHub Pages 같은 배포 단계가 한 번 더 필요합니다.
