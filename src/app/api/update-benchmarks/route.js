import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getUnitPrice } from '@/lib/priceUtils';

export async function GET(request) {
  // 보안을 위해 특정 키가 있는 경우에만 실행 (선택사항)
  // if (request.headers.get('auth') !== process.env.CRON_SECRET) return ...

  // 1. 어제 밤 11시 59분 59초 기준점 설정
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // 2. 전체 가격 히스토리 가져오기
  const { data: history } = await supabase
    .from('price_history')
    .select('*')
    .lte('crawled_at', yesterday.toISOString());

  // 3. 품목별(slug)로 그룹화해서 최저가/평균가 계산
  const stats = {};
  history.forEach(item => {
    const { price } = getUnitPrice(item); // 기존에 만든 단가 계산 함수 활용
    if (!stats[item.group_slug]) {
      stats[item.group_slug] = { prices: [] };
    }
    stats[item.group_slug].prices.push(price);
  });

  const benchmarkData = Object.keys(stats).map(slug => {
    const prices = stats[slug].prices;
    const min = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      slug,
      ref_low: Math.round(min),
      ref_avg: Math.round(avg),
      updated_at: new Date()
    };
  });

  // 4. Supabase의 price_benchmarks 테이블에 덮어쓰기
  const { error } = await supabase
    .from('price_benchmarks')
    .upsert(benchmarkData);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "정산 완료!", data: benchmarkData });
}