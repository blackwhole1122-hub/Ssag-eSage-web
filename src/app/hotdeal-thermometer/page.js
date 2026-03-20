'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const KEYWORD_GROUPS = {
  "식품": [
    
    { group: "햇반",         slug: "hatban",            keywords: ["햇반 210g"] },
    { group: "오뚜기밥",     slug: "ottogi-rice",       keywords: ["오뚜기밥 210g"] },
    { group: "스팸 클래식",  slug: "spam-classic",      keywords: ["스팸 클래식 200g", "스팸 클래식 340g"] },
    { group: "비비고 왕교자",   slug: "bibigo-mandu",      keywords: ["비비고 왕교자"] },
    { group: "비비고 사골곰탕", slug: "bibigo-sogalcomtang", keywords: ["비비고 사골곰탕"] },
    { group: "조선호텔 김치",  slug: "josunhotel-rice",   keywords: ["조선호텔 2.5kg", "조선호텔 4kg", "조선호텔 8kg"] },
    { group: "동원참치",     slug: "dongwon-tuna",      keywords: ["동원참치"] },
    { group: "동원비엔나",   slug: "dongwon-vienna",    keywords: ["동원비엔나"] },
    { group: "펩시 제로", slug: "pepsi-zero", keywords: ["펩시 210ml", "펩시 245ml", "펩시 355ml", "펩시 500ml"] },
  
  
  
  
  ],
  "생활잡화": [
    { group: "크리넥스 3겹", slug: "kleenex-3ply",      keywords: ["크리넥스 3겹 25m", "크리넥스 3겹 30m"] },
  ],
};

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

export default function HotdealThermometer() {
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceStats, setPriceStats] = useState({});
  const [loading, setLoading] = useState(true);

  const categories = ["전체", "식품", "생활잡화"];
  console.log('컴포넌트 렌더링됨');  // ← useEffect 위에 추가
  useEffect(() => {
    console.log('useEffect 실행됨');  // ← useEffect 안 첫 줄에 추가
    async function fetchPriceStats() {
      console.log('fetchPriceStats 실행됨');  // ← 함수 첫 줄에 추가
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('title, price_num')
          .gt('price_num', 0);

        console.log('price_history 데이터 수:', data?.length);   // ← 추가
        console.log('에러:', error);                              // ← 추가
        console.log('샘플:', data?.slice(0, 3));                  // ← 추가
        if (error || !data) return;

        // 키워드별 통계 계산
        const grouped = {};
        const allKeywords = Object.values(KEYWORD_GROUPS).flat().flatMap(g => g.keywords);

        function matchesKeyword(title, keyword) {
           if (!title) return false;
  // 공백 제거 후 비교 (펩시제로 = 펩시 제로)
          const normalizedTitle = title.replace(/\s/g, '');
          return keyword.split(' ').every(word => 
          title.includes(word) || normalizedTitle.includes(word.replace(/\s/g, ''))
          );
        } 
        data.forEach(row => {
          const kw = allKeywords.find(k => matchesKeyword(row.title, k));
          if (!kw) return;
          if (!grouped[kw]) grouped[kw] = [];
          grouped[kw].push(row.price_num);
        });

        console.log('grouped 결과:', grouped);

        const stats = {};
        Object.entries(grouped).forEach(([kw, prices]) => {
          if (prices.length < 3) return;
          const minPrice = Math.min(...prices);
          const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          const latestPrice = prices[0];
          stats[kw] = { minPrice, avgPrice, latestPrice, count: prices.length };
        });

        console.log('stats 결과:', stats);        // ← stats 선언 후로 이동
        setPriceStats(stats);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchPriceStats();
  }, []);

  // 그룹별 대표 등급 계산 (키워드 중 가장 좋은 등급)
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

  // 그룹별 데이터 건수
  function getGroupCount(keywords) {
    return keywords.reduce((sum, kw) => sum + (priceStats[kw]?.count || 0), 0);
  }

  // 필터링
  const filteredGroups = {};
  Object.entries(KEYWORD_GROUPS).forEach(([cat, groups]) => {
    if (category !== "전체" && category !== cat) return;
    const filtered = groups.filter(g =>
      !searchQuery || g.group.includes(searchQuery)
    );
    if (filtered.length > 0) filteredGroups[cat] = filtered;
  });

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">

      {/* 헤더 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-800">🌡️ 핫딜온도계</h1>
        <div className="w-px h-5 bg-gray-200"></div>
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          싸게사게
        </a>
      </header>

      {/* 검색창 */}
      <div className="p-3 bg-white border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="상품을 검색해보세요"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <nav className="flex gap-2 px-3 py-2 bg-white border-b overflow-x-auto scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${
              category === c ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
            }`}
          >
            {c}
          </button>
        ))}
      </nav>

      {/* 본문 */}
      <main className="p-3">
        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">불러오는 중... ⏳</div>
        )}

        {!loading && Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">데이터가 없어요 😅</div>
        )}

        {!loading && Object.entries(filteredGroups).map(([cat, groups]) => (
          <div key={cat} className="mb-6">

            {/* 카테고리 구분선 */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-sm font-bold text-gray-700">{cat}</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* 3열 그리드 */}
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
                    {/* 등급 뱃지 */}
                    {grade ? (
                      <div className={`text-center text-xs font-bold py-1 ${gradeBadge[grade]}`}>
                        {grade}
                      </div>
                    ) : (
                      <div className="text-center text-xs font-bold py-1 bg-gray-100 text-gray-400">
                        수집중
                      </div>
                    )}

                    <div className="p-2">
                      <p className="text-xs font-bold text-gray-800 text-center mb-1">
                        {group}
                      </p>
                      <p className="text-xs text-gray-300 text-center">
                        {count > 0 ? `${count}건` : "데이터 수집 중"}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}