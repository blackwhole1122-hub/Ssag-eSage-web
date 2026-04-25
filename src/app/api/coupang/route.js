import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALLOWED_DOMAINS = ['coupang.com', 'link.coupang.com', 'cp.ee', 'coupa.ng'];

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const ACCESS_KEY =
      process.env.COUPANG_PARTNERS_ACCESS_KEY || process.env.COUPANG_ACCESS_KEY;
    const SECRET_KEY =
      process.env.COUPANG_PARTNERS_SECRET_KEY || process.env.COUPANG_SECRET_KEY;

    if (!ACCESS_KEY || !SECRET_KEY) {
      return NextResponse.redirect(url);
    }

    const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';

    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mi = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    const datetime = `${yy}${mm}${dd}T${hh}${mi}${ss}Z`;

    const message = datetime + 'POST' + path;
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');

    const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

    const res = await fetch(`https://api-gateway.coupang.com${path}`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({ coupangUrls: [url] }),
    });

    const data = await res.json();
    const deeplink = data?.data?.[0]?.shortenUrl;

    if (deeplink && isAllowedUrl(deeplink)) {
      return NextResponse.redirect(deeplink);
    }
  } catch (error) {
    console.error('쿠팡 변환 로직 에러:', error);
  }

  return NextResponse.redirect(url);
}
