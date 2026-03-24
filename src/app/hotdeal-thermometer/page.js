'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KEYWORD_GROUPS } from '@/lib/keywords'; // 1. 외부 키워드 파일 연결

// 등급 계산 로직
function calcGrade(currentPrice, minPrice, avgPrice) {
  if (!currentPrice || !minPrice || !avgPrice || currentPrice <= 0) return null;
  const ratioToMin = (currentPrice - minPrice) / minPrice * 100;
  const ratioToAvg = (avgPrice - currentPrice) / avgPrice * 100;
  if (ratioToMin <= 5 && ratioToAvg >= 20) return "역대급";
  if (ratioToMin <= 15 || ratioToAvg >= 10) return "대박";
  if (ratioToMin <= 30 || ratioToAvg >= 0) return "중박";
  return "평범";
}

const gradeBadge = {
  "역대급": "bg-purple-500 text-purple-100",
  "대박": "bg-red-500 text-red-100",
  "중박": "bg-orange-400 text-orange-100",
  "평범": "bg-gray-400 text-gray-100",
};

export default function HotdealThermometer() {
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceStats, setPriceStats] = useState({});
  const [loading, setLoading] = useState(true);

  const categories = ["전체", "식품", "생활잡화", "가전/디지털", "상품권"];

  // 1. 데이터 가져오기 (useEffect)
  useEffect(() => {
    async function fetchPriceStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('title, price_num, matched_keyword')
          .gt('price_num', 0)
          .order('crawled_at', { ascending: false });

        if (error) {
          console.error("수파베이스 에러:", error);
        } else if (data) {
          const grouped = {};
          const allKeywords = Object.values(KEYWORD_GROUPS).flat().flatMap(g => g.keywords);

          data.forEach(row => {
            let kw = null;
            if (row.matched_keyword && allKeywords.includes(row.matched_keyword)) {
              kw = row.matched_keyword;
            } else {
              kw = allKeywords.find(k => {
                const normalizedTitle = row.title?.replace(/\s/g, '') || "";
                return k.split(' ').every(word => 
                  row.title?.includes(word) || normalizedTitle.includes(word.replace(/\s/g, ''))
                );
              });
            }
            if (!kw) return;
            if (!grouped[kw]) grouped[kw] = [];
            grouped[kw].push(row.price_num);
          });

          const stats = {};
          Object.entries(grouped).forEach(([kw, prices]) => {
            const minPrice = Math.min(...prices);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            const latestPrice = prices[0];
            stats[kw] = { minPrice, avgPrice, latestPrice, count: prices.length };
          });

          setPriceStats(stats);
        }
      } catch (e) {
        console.error("오류 발생:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPriceStats();
  }, []);

  // 2. 그룹별 정보 계산 함수들 (JSX에서 사용됨)
  function getGroupGrade(keywords) {
    const gradeOrder = ["역대급", "대박", "중박", "평범"];
    let bestGrade = null;
    for (const kw of keywords) {
      const stat = priceStats[kw];
      if (!stat) continue;
      const grade = calcGrade(stat.latestPrice, stat.minPrice, stat.avgPrice);
      if (!grade) continue;
      if (!bestGrade || gradeOrder.indexOf(grade) < gradeOrder.indexOf(bestGrade)) {
        bestGrade = grade;
      }
    }
    return bestGrade;
  }

  function getGroupCount(keywords) {
    return keywords.reduce((sum, kw) => sum + (priceStats[kw]?.count || 0), 0);
  }

  // 3. 필터링 로직 (여기가 빠져있었습니다!)
  const filteredGroups = {};
  Object.entries(KEYWORD_GROUPS).forEach(([cat, groups]) => {
    if (category !== "전체" && category !== cat) return;
    const filtered = groups.filter(g =>
      !searchQuery || g.group.includes(searchQuery)
    );
    if (filtered.length > 0) filteredGroups[cat] = filtered;
  });

  // 4. 화면 그리기 (여기도 빠져있었습니다!)
  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-800">🌡️ 핫딜온도계</h1>
        <div className="w-px h-5 bg-gray-200"></div>
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">싸게사게</a>
      </header>

      {/* 검색창 */}
      <div className="p-3 bg-white border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="상품을 검색해보세요"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <nav className="flex gap-2 px-3 py-2 bg-white border-b overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === c ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {c}
          </button>
        ))}
      </nav>

      {/* 본문 그리드 */}
      <main className="p-3">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">불러오는 중... ⏳</div>
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">데이터가 없어요 😅</div>
        ) : (
          Object.entries(filteredGroups).map(([cat, groups]) => (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-sm font-bold text-gray-700">{cat}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {groups.map(({ group, slug, keywords }) => {
                  const grade = getGroupGrade(keywords);
                  const count = getGroupCount(keywords);
                  return (
                    <a
                      key={slug}
                      href={`/hotdeal-thermometer/${slug}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className={`text-center text-[10px] font-bold py-1 ${grade ? gradeBadge[grade] : 'bg-gray-100 text-gray-400'}`}>
                        {grade || '수집중'}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-gray-800 text-center mb-1 truncate">{group}</p>
                        <p className="text-[10px] text-gray-300 text-center">{count > 0 ? `${count}건` : "수집중"}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}