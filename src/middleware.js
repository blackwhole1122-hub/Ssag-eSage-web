// ============================================
// 📁 파일 위치: src/middleware.js
// ============================================
// ⚠️ 반드시 src/ 폴더 바로 아래에 넣어야 함!
// (app 폴더 안이 아님!)
//
// 이 파일은 서버 단에서 실행되어,
// 브라우저가 /admin 페이지를 받기 전에 세션을 검사합니다.
// 자바스크립트 조작으로 뚫을 수 없습니다.
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // /admin 로그인 페이지는 통과시킴 (로그인 페이지에 접근은 가능해야 하니까)
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.next();
  }

  // /admin/* 경로만 보호 (dashboard, blog, hotdeals 등)
  if (!pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  // Supabase 세션 확인 (서버 단에서!)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 로그인 안 된 상태 → /admin 로그인 페이지로 강제 이동
  if (!user) {
    const loginUrl = new URL('/admin', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// 미들웨어가 작동할 경로 설정
export const config = {
  matcher: ['/admin/:path*'],
};