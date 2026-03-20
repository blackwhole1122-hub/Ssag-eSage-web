import crypto from 'crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return Response.json({ error: 'URL 필요' }, { status: 400 });
  }

  const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
  const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

  const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';

  // ← 핵심! 2자리 연도 형식 (260319T152736Z)
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

  const body = JSON.stringify({ coupangUrls: [url] });

  const res = await fetch(`https://api-gateway.coupang.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body,
  });

  const data = await res.json();
  

  const deeplink = data?.data?.[0]?.shortenUrl || url;

  return Response.json({ deeplink });
}
