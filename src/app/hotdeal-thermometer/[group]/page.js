'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
// ✅ 통합 함수 가져오기
import { getUnitPrice, calculateGrade } from '@/lib/priceUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function DetailPage() {
  const params = useParams();
  const slug = params?.group;
  
  const [product, setProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetailData() {
      if (!slug) return;
      setLoading(true);
      
      const { data: productData } = await supabase.from('keyword_groups').select('*').eq('slug', slug).maybeSingle();
      const { data: priceData } = await supabase.from('price_history').select('*').eq('group_slug', slug).order('created_at', { ascending: true });

      if (productData) setProduct(productData);

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

  // --- 🎯 통합 데이터 계산 로직 ---

  // 1. 모든 히스토리에 통합 단가 로직 적용
  const rawProcessedHistory = priceHistory.map(h => {
  const unitInfo = getUnitPrice(h, product.group_name);
  return { ...h, price: unitInfo.price, label: unitInfo.label };
});

// ✅ 2. 중복 날짜 제거 로직 추가 (1일 1데이터로 압축)
const processedHistory = [];
const seenDates = new Set();

for (let i = rawProcessedHistory.length - 1; i >= 0; i--) {
  const dateStr = new Date(rawProcessedHistory[i].crawled_at || rawProcessedHistory[i].created_at).toLocaleDateString();
  
  if (!seenDates.has(dateStr)) {
    processedHistory.unshift(rawProcessedHistory[i]); // 배열 앞쪽에 추가해서 순서 유지
    seenDates.add(dateStr);
  }
}

  // 2. 주요 지표 추출
  const latest = processedHistory[processedHistory.length - 1] || {};
  const currentUnitPrice = latest.price || 0;
  const unitLabel = latest.label || "단위당";
  const currentPriceRaw = latest.price_num || 0;

  // 3. 역대 최저가 및 3개월 평균 (단가 기준)
  const allTimeLow = processedHistory.length > 0 
    ? Math.min(...processedHistory.map(h => h.price)) 
    : 0;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  let recent3Months = processedHistory.filter(h => new Date(h.crawled_at) >= threeMonthsAgo);
  if (recent3Months.length === 0 && processedHistory.length > 0) {
    recent3Months = processedHistory.slice(-10);
  }
  
  const avg3Month = recent3Months.length > 0 
    ? recent3Months.reduce((a, b) => a + b.price, 0) / recent3Months.length 
    : 0;

  // 4. ✅ 통합 등급 판별 적용 (1.03 오차범위 포함)
  const grade = calculateGrade(currentUnitPrice, allTimeLow, avg3Month);

  // 등급별 UI 색상 매칭
  const gradeStyles = {
    "역대급": "bg-purple-600 text-white",
    "대박": "bg-red-500 text-white",
    "중박": "bg-orange-400 text-white",
    "평범": "bg-gray-400 text-white"
  };

  // --- 📈 차트 설정 ---
  const lineData = {
  labels: processedHistory.map(h => 
    new Date(h.crawled_at || h.created_at).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})
  ),
  datasets: [{
      data: processedHistory.map(h => h.price),
      fill: true,
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.05)',
      tension: 0.3,
      pointRadius: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0 } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } }
    }
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
             {/* ✅ 실시간 등급 반영 */}
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
              <p className="text-[10px] text-gray-400 font-bold">역대 최저가 ({unitLabel})</p>
              <p className="text-lg font-black text-purple-600">
                {allTimeLow > 0 ? `${Math.floor(allTimeLow).toLocaleString()}원` : "-"}
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
              <Line data={lineData} options={chartOptions} />
            ) : (
              <div className="text-center text-gray-300 py-20 text-xs italic">데이터를 분석하고 있습니다...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}