'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getUnitPrice } from '@/lib/priceUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function DetailPage() {
  const params = useParams();
  const slug = params?.group;
  
  const [product, setProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [activeDeal, setActiveDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetailData() {
      if (!slug) return;
      setLoading(true);
      
      const { data: productData } = await supabase.from('keyword_groups').select('*').eq('slug', slug).maybeSingle();

      if (productData) {
  setProduct(productData);

  // 전체 deals를 가져온 뒤 단가 기준으로 최저가 선택 (메인과 동일 로직)
  const { data: allDeals } = await supabase
    .from('hotdeals')
    .select('*')
    .eq('group_name', productData.group_name.trim());

  let bestDeal = null;
  let bestUnitPrice = Infinity;
  allDeals?.forEach(deal => {
    const { price } = getUnitPrice(deal, deal.group_name);  // ← deal.group_name으로 변경
    if (price > 0 && price < bestUnitPrice) {
      bestUnitPrice = price;
      bestDeal = deal;
    }
  });
  setActiveDeal(bestDeal); // ← 단가 기준 최저가 deal 저장
}

      // 🌟 [수정 포인트 1] 메인 페이지와 동일하게 'crawled_at' 기준으로 정렬
      const { data: priceData } = await supabase
      .from('price_history')
      .select('group_slug, price_num, price_raw, crawled_at, created_at, price_per_100g, price_per_100ml, price_per_unit')
      .eq('group_slug', slug)
      .order('crawled_at', { ascending: true });

      if (priceData) {
        const cleanedData = priceData.map(item => ({
          ...item,
          price_num: Number(item.price_raw?.replace(/[^0-9]/g, "")) || 0 
        }));
        setPriceHistory(cleanedData);
      }
      setLoading(false);
    }
    fetchDetailData();
  }, [slug]);

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">시세 분석 중... 📈</div>;
  if (!product) return <div className="p-20 text-center">상품 정보가 없습니다.</div>;

  // --- 🎯 통합 데이터 계산 로직 (메인과 100% 동기화) ---

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // 1. 모든 데이터를 단가 데이터로 변환 (날짜 로직 통일)
  const processedHistory = priceHistory.map(h => {
    const unitInfo = getUnitPrice(h, product.group_name);
    return { 
      ...h, 
      price: unitInfo.price, 
      label: unitInfo.label,
      date: h.crawled_at || h.created_at 
    };
  });

  // 2. 메인 페이지와 동일한 1년/10개 필터링
  let referenceData = processedHistory.filter(h => new Date(h.date) >= oneYearAgo);
  if (referenceData.length < 10 && processedHistory.length > 0) {
    referenceData = processedHistory.slice(-10);
  }

  // 3. 최저가 추출
  const referenceLow = referenceData.length > 0 
    ? Math.min(...referenceData.map(h => h.price)) 
    : 0;

  // 4. 현재 지표 계산 (메인 페이지의 latestHistoryPrice 로직 적용)
  const latestItem = referenceData.length > 0 ? referenceData[referenceData.length - 1] : {};
  const activeUnit = activeDeal ? getUnitPrice(activeDeal, product.group_name) : null;
  
  const currentUnitPrice = activeUnit ? activeUnit.price : (latestItem.price || 0);
  const unitLabel = activeUnit ? activeUnit.label : (latestItem.label || "단위당");
  const currentPriceRaw = activeDeal 
    ? Number(activeDeal.price_raw?.replace(/[^0-9]/g, "")) 
    : (latestItem.price_num || 0);

  // 5. 등급 판별
  let grade = "분석중";  // ← "분석중"으로 초기화
if (currentUnitPrice > 0 && referenceLow > 0) {
  const ratio = currentUnitPrice / referenceLow;
  if (ratio <= 1.0) grade = "역대급";
  else if (ratio <= 1.08) grade = "대박";
  else if (ratio <= 1.15) grade = "중박";
  else grade = "평범";  // ← else도 명시적으로 추가
}

  // 6. 평균가 계산 (3개월)
  let recent3Months = processedHistory.filter(h => new Date(h.date) >= threeMonthsAgo);
  if (recent3Months.length === 0 && processedHistory.length > 0) recent3Months = processedHistory.slice(-10);
  const avg3Month = recent3Months.length > 0 ? recent3Months.reduce((a, b) => a + b.price, 0) / recent3Months.length : 0;

  const gradeStyles = {
  "역대급": "bg-purple-600 text-white",
  "대박": "bg-red-500 text-white",
  "중박": "bg-orange-400 text-white",
  "평범": "bg-gray-400 text-white",
  "분석중": "bg-gray-400 text-white",  // ← 추가
};
  const lineData = {
    labels: processedHistory.map(h => new Date(h.date).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})),
    datasets: [{
      data: processedHistory.map(h => h.price),
      fill: true,
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.05)',
      tension: 0.3,
      pointRadius: 1,
    }]
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-50 min-h-screen">
      <header className="p-4 flex items-center bg-white border-b sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="mr-4">←</button>
        <h1 className="text-sm font-black text-gray-800">{product.group_name}</h1>
      </header>
      <main className="p-6 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center text-gray-400">
             <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${gradeStyles[grade]}`}>
               {grade} ●
             </span>
             <span className="text-[9px] font-bold uppercase tracking-widest">{unitLabel} 가격 기준</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold">현재 {unitLabel} 시세</p>
            <div className="text-4xl font-black text-gray-900">
              {currentUnitPrice > 0 ? `${Math.floor(currentUnitPrice).toLocaleString()}원` : "0원"}
            </div>
            <p className="text-[10px] text-gray-300 font-bold">총 가격: {currentPriceRaw.toLocaleString()}원</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-bold">1년 최저가 ({unitLabel})</p>
              <p className="text-lg font-black text-purple-600">
                {referenceLow > 0 ? `${Math.floor(referenceLow).toLocaleString()}원` : "-"}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-gray-400 font-bold">평균가 (3개월/{unitLabel})</p>
              <p className="text-lg font-black text-gray-800">
                {avg3Month > 0 ? `${Math.floor(avg3Month).toLocaleString()}원` : "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-800 mb-6">{unitLabel} 가격 변동 흐름</h3>
          <div className="h-48 w-full">
            {processedHistory.length > 0 ? (
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center text-gray-300 py-20 text-xs italic">데이터 분석 중...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}