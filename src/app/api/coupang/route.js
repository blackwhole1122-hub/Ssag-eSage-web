import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  // URL이 없으면 메인으로 보냄
  if (!url) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 1. 쿠팡 링크가 아니면 바로 리다이렉트 (API 호출 낭비 방지)
  if (!url.includes('coupang.com')) {
    return NextResponse.redirect(url);
  }

  // 2. 쿠팡 링크일 경우 수익 링크로 변환 시도
  try {
    const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
    const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
    const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';

    // 기존의 타임스탬프 생성 로직 (YYMMDD 형식 유지)
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mi = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    const datetime = `${yy}${mm}${dd}T${hh}${mi}${ss}Z`;

    const message = datetime + 'POST' + path;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(message)
      .digest('hex');

    const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

    const res = await fetch(`https://api-gateway.coupang.com${path}`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({ coupangUrls: [url] }),
    });

    const data = await res.json();
    
    // 수익 링크가 생성되었다면 해당 링크로, 실패했다면 원래 링크로 이동
    const deeplink = data?.data?.[0]?.shortenUrl;
    
    if (deeplink) {
      return NextResponse.redirect(deeplink);
    }
  } catch (error) {
    console.error('쿠팡 변환 로직 에러:', error);
  }

  // 최악의 경우(에러 발생 등)에도 유저는 쇼핑몰로 가야 하므로 원래 URL로 리다이렉트
  return NextResponse.redirect(url);
}