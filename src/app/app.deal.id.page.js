'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
// 👇 중복 다 지우고 이렇게 딱 한 줄씩만 남기기!
import { KEYWORD_GROUPS } from '@/lib/keywords';
import { getUnitPrice, calculateGrade } from '@/lib/priceUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export default function DealDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [dealGrade, setDealGrade] = useState(null); 
  const [unitPrice, setUnitPrice] = useState(0);
  const [unitLabel, setUnitLabel] = useState("");

  const sourceLabel = {
    dogdrip: "개드립", fmkorea: "에펨코리아", arca: "아카라이브", clien: "클리앙", ppomppu: "뽐뿌", quasarzone: "퀘이사존", zod: "ZOD", ruliweb: "루리웹"
  };

  const gradeBadge = {
    "역대급": "bg-purple-600 text-white font-bold",
    "대박":   "bg-red-500 text-white font-bold",
    "중박":   "bg-orange-400 text-white",
    "평범":   "bg-gray-400 text-white",
    "구매금지": "bg-black text-white",
  };

  // 🌟 실수로 지워졌던 가장 중요한 데이터 호출 코드 복구!
  useEffect(() => {
    async function fetchDeal() {
      const { data, error } = await supabase.from('hotdeals').select('*').eq('id', id).single();
      
      if (!error && data) {
        setDeal(data);

        // 👇 여기서부터 등급 계산 로직 추가
        let matchedSlug = data.group_slug;
        if (!matchedSlug) {
          const allGroups = Object.values(KEYWORD_GROUPS).flat();
          const matchGroup = allGroups.find(g => g.keywords.some(k => {
            const normTitle = data.title?.replace(/\s/g, '') || "";
            return k.split(' ').every(w => data.title?.includes(w) || normTitle.includes(w.replace(/\s/g, '')));
          }));
          if (matchGroup) matchedSlug = matchGroup.slug;
        }

        if (matchedSlug) {
          const currentPriceRaw = parseInt(data.price?.replace(/[^\d]/g, '') || "0");
          const { price: calcUnitPrice, label: calcUnitLabel } = getUnitPrice({ price_num: currentPriceRaw }, data.title);

          if (calcUnitPrice > 0) {
            setUnitPrice(calcUnitPrice); 
            setUnitLabel(calcUnitLabel); // 👈 계산된 라벨(100ml당 등) 저장
            
            // 기준가 DB에서 이 상품(slug) 것만 딱 1개 가져오기
            const { data: benchmark } = await supabase
              .from('price_benchmarks')
              .select('ref_low, ref_avg')
              .eq('slug', matchedSlug)
              .single();

            if (benchmark) {
              const grade = calculateGrade(calcUnitPrice, benchmark.ref_low, benchmark.ref_avg);
              setDealGrade(grade); // 등급 상태 저장
            }
          }
        }
        // 👆 계산 로직 끝
      }
      setLoading(false);
    }
    fetchDeal();
  }, [id]);

  useEffect(() => {
    async function fetchGraphData() {
      if (!deal) return;
      
      const allGroups = Object.values(KEYWORD_GROUPS).flat();
      let targetKw = deal.matched_keyword;
      
      if (!targetKw) {
        const matchedGroup = allGroups.find(group => {
          return group.keywords.some(k => {
            const normalizedTitle = deal.title?.replace(/\s/g, '') || "";
            return k.split(' ').every(word => deal.title?.includes(word) || normalizedTitle.includes(word.replace(/\s/g, '')));
          });
        });
        if (matchedGroup) targetKw = matchedGroup.keywords[0];
      }

      if (!targetKw) return;

      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .gt('price_num', 0)
        .gte('crawled_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
        .order('crawled_at', { ascending: false });

      if (error || !data) return;

      const history = [];
      data.forEach(row => {
        let rowKw = row.matched_keyword;
        if (!rowKw) {
          const matchGroup = allGroups.find(g => g.keywords.some(k => row.title?.includes(k)));
          if (matchGroup) rowKw = matchGroup.keywords[0];
        }
        
        if (rowKw === targetKw) {
          const unitInfo = getUnitPrice(row, row.title);
          history.push({ 
            date: row.crawled_at?.slice(5, 10), 
            price: unitInfo.price 
          });
        }
      });

      if (history.length === 0) {
        setChartData(null);
        return;
      }

      const uniqueHistory = [];
      const seenDates = new Set();
      history.reverse().forEach(h => {
        if (!seenDates.has(h.date)) {
          seenDates.add(h.date);
          uniqueHistory.push(h);
        }
      });

      setChartData({
        labels: uniqueHistory.map(h => h.date),
        datasets: [{
          label: targetKw,
          data: uniqueHistory.map(h => h.price),
          borderColor: '#EF9F27',
          backgroundColor: '#EF9F2720',
          tension: 0.3,
          pointRadius: 4,
        }]
      });
    }

    fetchGraphData();
  }, [deal]);

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">시세 분석 중... 📈</div>;
  if (!deal) return <div className="p-20 text-center">상품 정보가 없습니다.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">
      <header className="bg-white border-b p-3 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-xl px-1">←</button>
        <a href="/" className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100">🏠 홈</a>
        <h1 className="text-sm font-bold text-gray-800 truncate flex-1">{deal.title}</h1>
      </header>

      <main className="p-3 flex flex-col gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">핫딜</span>
            <span className="text-xs font-bold text-blue-500">{sourceLabel[deal.source] || deal.source}</span>
            {/* 👇 등급 뱃지 추가 */}
            {dealGrade && (
              <span className={`text-xs px-2.5 py-1 rounded-full ${gradeBadge[dealGrade]}`}>
                {dealGrade}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-3">{deal.title}</h2>
          
          <div className="flex flex-col mb-1">
            <p className="text-2xl font-bold text-red-500">{deal.price || '가격미정'}</p>
            {/* 👇 단가 추가 */}
            {unitPrice > 0 && (
              <p className="text-sm font-medium text-gray-500 mt-1">
                (단가: {unitLabel} {Math.floor(unitPrice).toLocaleString()}원) 
                {/* 👆 '1개당' 대신 {unitLabel}을 사용 */}
              </p>
            )}
          </div>
        </div>

        {deal.image && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <img src={deal.image} alt={deal.title} referrerPolicy="no-referrer" className="w-full object-contain" />
          </div>
        )}

        {deal.content && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 overflow-hidden">
             <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Community Post</h4>
             <div 
               className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words html-renderer"
               dangerouslySetInnerHTML={{ 
                 __html: deal.content
                   // 1. 과거 데이터: 마크다운 ![image](url) 형태를 img 태그로 변환하면서 방어막 씌우기
                   .replace(/!\[image\]\((.*?)\)/g, '<img src="$1" referrerpolicy="no-referrer" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />')
                   // 2. 신규 데이터: 새로운 크롤러가 가져온 <img ...> 태그에도 모두 방어막 씌우기
                   .replace(/<img /g, '<img referrerpolicy="no-referrer" ') 
               }}
             />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📈 가격 추이 (최근 6개월)</h3>
          {chartData ? (
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : (
            <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400">분석 가능한 가격 데이터가 부족합니다 ⏳</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:static md:bg-transparent md:border-t-0 md:p-0 mt-4 flex flex-col gap-2">
          
          {/* 1. 메인: 쇼핑몰 이동 버튼 */}
          <a 
            href={`/api/out?url=${encodeURIComponent(deal.shop_url || deal.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-2xl mx-auto bg-red-500 hover:bg-red-600 text-white text-center font-bold text-lg py-4 rounded-xl shadow-lg transition-colors"
          >
            🛒 쇼핑몰로 이동하여 구매하기
          </a>

          

                {/* ✨ 쿠팡 파트너스 안내 문구 추가 */}
          {(deal.shop_url?.includes('coupang.com') || deal.url?.includes('coupang.com')) && (
            <p className="text-[10px] text-gray-400 text-center mt-1 leading-tight">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로,<br />
              이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          )}

          {/* 원본 게시물 이동 버튼 (기존 회색 버튼) */}
          {deal.url && (
            <a 
              href={`/api/out?url=${encodeURIComponent(deal.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full max-w-2xl mx-auto bg-gray-400 hover:bg-gray-500 text-white text-center font-bold text-base py-3 rounded-xl shadow transition-colors mt-2"
            >
              📝 원본 커뮤니티 게시물 보기
            </a>
          )}
        </div>
      </main>
    </div>
  );
}