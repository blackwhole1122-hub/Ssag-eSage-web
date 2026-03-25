'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getUnitPrice, calculateGrade } from '@/lib/priceUtils';

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
      
      // 1. 필요한 데이터 한꺼번에 가져오기 (benchmarks 추가)
      const [
        { data: productData },
        { data: benchmarkData },
        { data: priceData }
      ] = await Promise.all([
        supabase.from('keyword_groups').select('*').eq('slug', slug).maybeSingle(),
        supabase.from('price_benchmarks').select('*').eq('slug', slug).maybeSingle(),
        supabase.from('price_history').select('*').eq('group_slug', slug).order('crawled_at', { ascending: true })
      ]);

      if (productData) {
        setProduct({ ...productData, benchmark: benchmarkData }); // 🌟 벤치마크 데이터를 상품 정보에 포함

        // 최저가 핫딜 찾기 (기존 로직 유지)
        const { data: allDeals } = await supabase
          .from('hotdeals')
          .select('*')
          .eq('group_name', productData.group_name.trim());

        let bestDeal = null;
        let bestUnitPrice = Infinity;
        allDeals?.forEach(deal => {
          const { price } = getUnitPrice(deal, deal.group_name);
          if (price > 0 && price < bestUnitPrice) {
            bestUnitPrice = price;
            bestDeal = deal;
          }
        });
        setActiveDeal(bestDeal);
      }

      if (priceData) {
        setPriceHistory(priceData);
      }
      setLoading(false);
    }
    fetchDetailData();
  }, [slug]);

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">시세 분석 중... 📈</div>;
  if (!product) return <div className="p-20 text-center">상품 정보가 없습니다.</div>;

  // --- 🎯 통합 데이터 계산 로직 (메인과 100% 동기화) ---

// --- 🎯 통합 데이터 계산 로직 (price_benchmarks 적용) ---
  const processedHistory = priceHistory.map(h => {
    const unitInfo = getUnitPrice(h, product.group_name);
    return { ...h, price: unitInfo.price, label: unitInfo.label, date: h.crawled_at || h.created_at };
  });

  const benchmark = product.benchmark; 
  const latestHistory = processedHistory.length > 0 ? processedHistory[processedHistory.length - 1] : {};
  
  // 🎯 핵심: 실시간 핫딜 가격은 무시하고 DB의 "평균가(ref_avg)"를 현재 시세의 기준으로 잡음
  const currentUnitPrice = benchmark?.ref_avg || 0;
  const unitLabel = latestHistory.label || "단위당";
  
  // 등급 계산을 위한 기준 수치 (DB 데이터 사용)
  const referenceLow = benchmark ? benchmark.ref_low : 0;
  const avg3Month = benchmark ? benchmark.ref_avg : 0;
  const lastPrice = latestHistory.price || 0;

  let grade = "분석중";
  if (currentUnitPrice > 0 && referenceLow > 0) {
    // 평균가가 최저가 대비 어떤 상태인지 5단계 등급 계산
    grade = calculateGrade(currentUnitPrice, referenceLow, avg3Month);
  }

  // 👇 이 부분이 삭제되어서 에러가 났던 거야! 다시 넣어줘.
  const gradeStyles = {
    "역대급": "bg-purple-600 text-white",
    "대박": "bg-red-500 text-white",
    "중박": "bg-orange-400 text-white",
    "평범": "bg-gray-400 text-white",
    "구매금지": "bg-black text-white", // 🖤 구매금지도 추가
    "분석중": "bg-gray-400 text-white",
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
  }; // 👈 여기서 객체가 안전하게 닫혀야 함!

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
            <p className="text-xs text-gray-400 font-bold">어제까지의 {unitLabel} 평균 시세</p>
            {/* 총 가격 부분은 평균가 기준이므로 굳이 노출하지 않거나 텍스트 보정 */}
            <p className="text-[10px] text-gray-300 font-bold">최근 데이터 기반 분석 결과</p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-gray-50">
            {/* 1. 왼쪽: 1년 최저가 */}
            <div className="space-y-1">
              <p className="text-[9px] text-gray-400 font-bold">1년 최저가</p>
              <p className="text-base font-black text-purple-600 truncate">
                {referenceLow > 0 ? `${Math.floor(referenceLow).toLocaleString()}원` : "-"}
              </p>
            </div>

            {/* 2. 중간: 평균가 (3개월) */}
            <div className="space-y-1 text-center border-x border-gray-50">
              <p className="text-[9px] text-gray-400 font-bold">평균가(3개월)</p>
              <p className="text-base font-black text-gray-800 truncate">
                {avg3Month > 0 ? `${Math.floor(avg3Month).toLocaleString()}원` : "-"}
              </p>
            </div>

            {/* 3. 오른쪽: 마지막 가격 (가장 최근 기록) */}
            <div className="space-y-1 text-right">
              <p className="text-[9px] text-gray-400 font-bold">마지막 가격</p>
              <p className="text-base font-black text-blue-600 truncate">
                {lastPrice > 0 ? `${Math.floor(lastPrice).toLocaleString()}원` : "-"}
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