import { NextResponse } from 'next/server';
import crypto from 'crypto';

const LINKPRICE_A_ID = process.env.NEXT_PUBLIC_LINKPRICE_A_ID || "A100703318";

// ── 쿠팡 파트너스 딥링크 변환 ──────────────────────────────────────────
async function convertCoupangUrl(originalUrl) {
  try {
    const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
    const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

    if (!ACCESS_KEY || !SECRET_KEY) return null;

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
      body: JSON.stringify({ coupangUrls: [originalUrl] }),
    });

    const data = await res.json();
    return data?.data?.[0]?.shortenUrl || null;
  } catch (error) {
    console.error('쿠팡 파트너스 변환 오류:', error);
    return null;
  }
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const originalUrl = searchParams.get('url');

  if (!originalUrl) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── 1. 쿠팡 링크 처리 ──────────────────────────────────────
  if (originalUrl.includes('coupang.com') ||
      originalUrl.includes('cp.ee') ||
      originalUrl.includes('link.coupang.com')) {
    const partnerUrl = await convertCoupangUrl(originalUrl);
    if (partnerUrl) {
      return NextResponse.redirect(partnerUrl, 302);
    }
    return NextResponse.redirect(originalUrl, 302);
  }

  // ── 2. 링크프라이스 지원 쇼핑몰 처리 ──────────────────────────
  const merchantMap = {
    "11st.co.kr": "11st",
    "gmarket.co.kr": "gmarket",
    "auction.co.kr": "auction",
    "ssg.com": "ssg",
    "lotteon.com": "lotteon",
    "wemakeprice.com": "wemakeprice",
    "tmon.co.kr": "tmon",
    "gsshop.com": "gsshop",
    "cjmall.com": "cjmall",
    "aliexpress.com": "aliexpress",
    "hmall.com": "hmall",
    "yes24.com": "yes24",
    "kyobobook.co.kr": "kyobobook",
    "iherb.com": "iherb",
  };

  let matchedMerchant = null;
  for (const [domain, mId] of Object.entries(merchantMap)) {
    if (originalUrl.includes(domain)) {
      matchedMerchant = mId;
      break;
    }
  }

  if (matchedMerchant && LINKPRICE_A_ID) {
    const encodedUrl = encodeURIComponent(originalUrl);
    const finalUrl = `https://click.linkprice.com/click.php?m=${matchedMerchant}&a=${LINKPRICE_A_ID}&l=9999&l_cd1=3&l_cd2=0&tu=${encodedUrl}`;
    return NextResponse.redirect(finalUrl, 302);
  }

  // ── 3. 그 외 URL은 그대로 리다이렉트 ──────────────────────────
  return NextResponse.redirect(originalUrl, 302);
}
