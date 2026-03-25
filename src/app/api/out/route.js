import { NextResponse } from 'next/server';

// 💡 환경변수(.env.local)에 넣는 게 좋지만, 당장 작동 확인을 위해 아이디를 직접 넣을게!
const LINKPRICE_A_ID = process.env.NEXT_PUBLIC_LINKPRICE_A_ID || "A100703318";

export async function GET(request) {
  // 1. 클릭한 원본 URL 가져오기 (/api/out?url=원본주소)
  const searchParams = request.nextUrl.searchParams;
  const originalUrl = searchParams.get('url');

  if (!originalUrl) {
    // URL이 없으면 메인 홈페이지로 돌려보냄
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. 링크프라이스 지원 쇼핑몰 목록 (필요하면 나중에 더 추가 가능)
  const merchantMap = {
    "11st.co.kr": "11st",
    "gmarket.co.kr": "gmarket",
    "auction.co.kr": "auction",
    "ssg.com": "ssg",
    "lotteon.com": "lotteon",
    "wemakeprice.com": "wemakeprice",
    "tmon.co.kr": "tmon",
    "gsshop.com": "gsshop",
    "cjmall.com": "cjmall"
  };

  let matchedMerchant = null;
  
  // 3. 원본 주소가 지원 쇼핑몰인지 검사
  for (const [domain, mId] of Object.entries(merchantMap)) {
    if (originalUrl.includes(domain)) {
      matchedMerchant = mId;
      break;
    }
  }

  let finalUrl = originalUrl;

  // 4. 지원 쇼핑몰이라면 링크프라이스 딥링크로 변환!
  if (matchedMerchant) {
    const encodedUrl = encodeURIComponent(originalUrl);
    finalUrl = `https://click.linkprice.com/click.php?m=${matchedMerchant}&a=${LINKPRICE_A_ID}&l=9999&l_cd1=3&l_cd2=0&tu=${encodedUrl}`;
  } 
  // (나중에 쿠팡 파트너스 변환 로직도 이 부분에 추가할 수 있어!)

  // 5. 최종 URL로 유저를 튕겨냄 (302 Redirect)
  return NextResponse.redirect(finalUrl, 302);
}