'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { KEYWORD_GROUPS } from '../page';
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


function matchesKeyword(title, keyword) {
  if (!title) return false;
  const normalizedTitle = title.replace(/\s/g, '');
  return keyword.split(' ').every(word =>
    title.includes(word) || normalizedTitle.includes(word.replace(/\s/g, ''))
  );
}

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

  // slug로 그룹 정보 찾기
  const groupInfo = Object.values(KEYWORD_GROUPS).flat().find(g => g.slug === slugParam);

  useEffect(() => {
    if (!groupInfo) return;

    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('title, price_num, price_per_100ml, price_per_100g, price_per_unit, crawled_at')
          .gt('price_num', 0)
          .order('crawled_at', { ascending: false });

        if (error || !data) return;

        const grouped = {};
        const groupedHistory = {};
        function matchesKeyword(title, keyword) {
          if (!title) return false;
          const normalizedTitle = title.replace(/\s/g, '');
          return keyword.split(' ').every(word => 
            title.includes(word) || normalizedTitle.includes(word.replace(/\s/g, ''))
          );
        }
        data.forEach(row => {
          const kw = groupInfo.keywords.find(k => matchesKeyword(row.title, k));
          if (!kw) return;
          if (!grouped[kw]) grouped[kw] = [];
          if (!groupedHistory[kw]) groupedHistory[kw] = [];
          grouped[kw].push(row);
          const up = getUnitPrice(row);
          if (up) {
            groupedHistory[kw].push({
              date: row.crawled_at?.slice(0, 10),
              price: up.price,
            });
          }
        });

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
        });                    // ← 이거 추가!

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
          }))
        });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchStats();
  }, [slugParam]);

  if (!groupInfo) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">페이지를 찾을 수 없어요 😅</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">

      {/* 헤더 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <a href="/hotdeal-thermometer" className="text-gray-400 hover:text-gray-600">
          ←
        </a>
        <h1 className="text-lg font-bold text-gray-800">🌡️ {groupInfo.group}</h1>
        <div className="w-px h-5 bg-gray-200"></div>
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          싸게사게
        </a>
      </header>

      <main className="p-3 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">불러오는 중... ⏳</div>
        )}

        {!loading && groupInfo.keywords.map(kw => {
          const stat = priceStats[kw];
          const grade = stat ? calcGrade(stat.latestPrice, stat.minPrice, stat.avgPrice) : null;

          return (
            <div key={kw} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* 등급 뱃지 */}
              {grade ? (
                <div className={`text-xs font-bold px-3 py-1.5 ${gradeBadge[grade]}`}>
                  {grade}
                </div>
              ) : (
                <div className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-400">
                  수집중
                </div>
              )}

              <div className="p-4">
                {/* 키워드 */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">{kw}</p>
                  {stat?.unitLabel && (
                    <span className="text-xs bg-orange-50 text-orange-500 border border-orange-200 px-2 py-0.5 rounded-full">
                      {stat.unitLabel} 기준
                    </span>
                  )}
                </div>

                {stat ? (
                  <div className="flex flex-col gap-2">
                    {/* 역대 최저가 */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-400">역대 최저가</span>
                      <span className="text-sm font-bold text-purple-600">
                        {stat.minPrice.toLocaleString()}원
                      </span>
                    </div>
                    {/* 평균가 */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-400">평균가</span>
                      <span className="text-sm font-medium text-gray-600">
                        {stat.avgPrice.toLocaleString()}원
                      </span>
                    </div>
                    {/* 최근가 */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-gray-400">최근 수집가</span>
                      <span className="text-sm font-bold text-red-500">
                        {stat.latestPrice.toLocaleString()}원
                      </span>
                    </div>

                    {/* 데이터 건수 */}
                    <p className="text-xs text-gray-300 text-right mt-1">
                      수집 데이터 {stat.count}건
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    아직 데이터가 없어요 😅
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* 가격 추이 그래프 */}
        {chartData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-2">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📈 가격 추이</h3>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 11 } } },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (v) => v + '원',
                      font: { size: 10 },
                    }
                  },
                  x: {
                    ticks: { font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
        )}
        
      </main>
    </div>
  );
}