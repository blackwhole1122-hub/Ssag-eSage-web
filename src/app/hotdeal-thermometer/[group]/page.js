'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { KEYWORD_GROUPS } from '@/lib/keywords'; // 👈 경로가 맞는지 꼭 확인!
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend
);

function getUnitPrice(row) {
  if (row.price_per_100ml && row.price_per_100ml > 0) return { price: row.price_per_100ml, unit: "100ml당" };
  if (row.price_per_100g  && row.price_per_100g  > 0) return { price: row.price_per_100g,  unit: "100g당" };
  if (row.price_per_unit  && row.price_per_unit  > 0) return { price: row.price_per_unit,  unit: "개당" };
  return null;
}

function calcGrade(currentPrice, minPrice, avgPrice) {
  if (!currentPrice || !minPrice || !avgPrice || currentPrice <= 0) return null;
  const ratioToMin = (currentPrice - minPrice) / minPrice * 100;
  const ratioToAvg = (avgPrice - currentPrice) / avgPrice * 100;
  if (ratioToMin <= 5  && ratioToAvg >= 20) return "역대급";
  if (ratioToMin <= 15 || ratioToAvg >= 10) return "대박";
  if (ratioToMin <= 30 || ratioToAvg >= 0)  return "중박";
  return "평범";
}

const gradeBadge = {
  "역대급": "bg-purple-500 text-purple-100",
  "대박":   "bg-red-500 text-red-100",
  "중박":   "bg-orange-400 text-orange-100",
  "평범":   "bg-gray-400 text-gray-100",
};

export default function GroupDetail() {
  const { group: slugParam } = useParams();
  const [priceStats, setPriceStats] = useState({});
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const groupInfo = Object.values(KEYWORD_GROUPS).flat().find(g => g.slug === slugParam);

  useEffect(() => {
    if (!groupInfo) return;

    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('title, price_num, price_per_100ml, price_per_100g, price_per_unit, crawled_at, matched_keyword')
          .gt('price_num', 0)
          .order('crawled_at', { ascending: false });

        if (error || !data) {
          console.error("데이터 로드 실패:", error);
          return;
        }

        const grouped = {};
        const groupedHistory = {};

        data.forEach(row => {
          let kw = null;
          // 1. 키워드 매칭
          if (row.matched_keyword && groupInfo.keywords.includes(row.matched_keyword)) {
            kw = row.matched_keyword;
          } else {
            kw = groupInfo.keywords.find(k => {
              const normalizedTitle = row.title?.replace(/\s/g, '') || "";
              return k.split(' ').every(word => 
                row.title?.includes(word) || normalizedTitle.includes(word.replace(/\s/g, ''))
              );
            });
          }

          if (!kw) return;

          // 2. 가방 초기화
          if (!grouped[kw]) grouped[kw] = [];
          if (!groupedHistory[kw]) groupedHistory[kw] = [];

          // 3. 데이터 삽입
          grouped[kw].push(row);
          const up = getUnitPrice(row);
          if (up) {
            groupedHistory[kw].push({
              // ✨ select한 컬럼명과 똑같이 crawled_at으로 통일!
              date: row.crawled_at?.slice(5, 10), 
              price: up.price,
            });
          }
        });

        // 통계 계산
        const stats = {};
        Object.entries(grouped).forEach(([kw, rows]) => {
          const unitPrices = rows.map(r => getUnitPrice(r)).filter(Boolean);
          let minPrice, avgPrice, latestPrice, unitLabel;

          if (unitPrices.length > 0) {
            const prices = unitPrices.map(u => u.price);
            minPrice    = Math.min(...prices);
            avgPrice    = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            latestPrice = prices[0];
            unitLabel   = unitPrices[0].unit;
          } else {
            const prices = rows.map(r => r.price_num).filter(p => p > 0);
            if (prices.length === 0) return;
            minPrice    = Math.min(...prices);
            avgPrice    = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            latestPrice = prices[0];
            unitLabel   = "총액";
          }
          
          stats[kw] = {
            minPrice, avgPrice, latestPrice, unitLabel,
            count: rows.length,
            history: (groupedHistory[kw] || []).slice(0, 30).reverse(),
          };
        });

        setPriceStats(stats);

        // 그래프 데이터 생성
        const colors = ['#E24B4A', '#378ADD', '#1D9E75', '#EF9F27'];
        const allDates = [...new Set(
          Object.values(stats).flatMap(s => s.history.map(h => h.date))
        )].sort();

        setChartData({
          labels: allDates,
          datasets: Object.entries(stats).map(([kw, stat], i) => ({
            label: kw,
            data: allDates.map(date => {
              const found = stat.history.find(h => h.date === date);
              return found ? found.price : null;
            }),
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length] + '20',
            tension: 0.3,
            spanGaps: true,
            pointRadius: 4,
          }))
        });
      } catch (e) {
        console.error("오류:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [slugParam, groupInfo]);

  if (!groupInfo) return <div className="p-10 text-center text-gray-400">정보가 없어요 😅</div>;

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-gray-400 text-xl">←</button>
        <h1 className="text-lg font-bold text-gray-800">🌡️ {groupInfo.group} 상세</h1>
      </header>
      <main className="p-3">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">데이터 분석 중... ⏳</div>
        ) : (
          <>
            {groupInfo.keywords.map(kw => {
              const stat = priceStats[kw];
              const grade = stat ? calcGrade(stat.latestPrice, stat.minPrice, stat.avgPrice) : null;
              return (
                <div key={kw} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
                  <div className={`text-[10px] font-bold px-3 py-1 ${grade ? gradeBadge[grade] : 'bg-gray-100 text-gray-400'}`}>
                    {grade || '수집중'}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-gray-800 text-sm">{kw}</p>
                      {stat && <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{stat.unitLabel} 기준</span>}
                    </div>
                    {stat ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400 mb-1">최저가</p>
                          <p className="text-xs font-bold text-purple-600">{stat.minPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400 mb-1">평균가</p>
                          <p className="text-xs font-bold text-gray-600">{stat.avgPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl">
                          <p className="text-[10px] text-gray-400 mb-1">최근가</p>
                          <p className="text-xs font-bold text-red-500">{stat.latestPrice.toLocaleString()}원</p>
                        </div>
                      </div>
                    ) : <p className="text-xs text-gray-300 text-center py-4">데이터 수집 중</p>}
                  </div>
                </div>
              );
            })}
            {chartData && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-4">📈 가격 추이 (최근 30일)</h3>
                <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}