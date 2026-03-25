'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { KEYWORD_GROUPS } from '@/lib/keywords';
import { getUnitPrice, calculateGrade } from '@/lib/priceUtils';



export default function Home() {
  const [category, setCategory] = useState("전체");
  const [sourceFilter, setSourceFilter] = useState("전체");
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [priceStats, setPriceStats] = useState({});
  const observerRef = useRef(null);

  const fetchDeals = useCallback(async (pageNum = 0, reset = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * 20;
    const to = from + 19;

    let query = supabase
      .from('hotdeals')
      .select('*')
      .order('crawled_at', { ascending: false })
      .range(from, to);

    if (sourceFilter !== "전체") {
      query = query.eq('source', sourceFilter);
    }
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) console.error('데이터 불러오기 실패:', error);
    else {
      setAllDeals(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      setHasMore((data || []).length === 20);
    }

    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
  }, [sourceFilter, searchQuery]);

  useEffect(() => {
    // ✅ useEffect 내부의 fetchPriceStats 함수를 이 코드로 교체하세요.
async function fetchPriceStats() {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data, error } = await supabase
      .from('price_history')
      .select('price_num, price_raw, crawled_at, matched_keyword, title, price_per_100g, price_per_100ml, price_per_unit') // ✅ 모든 단가 컬럼 가져오기
      .gt('price_num', 0) 
      .gte('crawled_at', threeMonthsAgo.toISOString())
      .order('crawled_at', { ascending: false }) 
      .limit(5000);

    if (error || !data) return;
    
    const grouped = {};
    const allGroups = Object.values(KEYWORD_GROUPS).flat(); 

    data.forEach(row => {
      // 1. 키워드 매칭
      let kw = row.matched_keyword;
      if (!kw) {
         const matchGroup = allGroups.find(g =>
            g.keywords.some(k => {
               const normTitle = row.title?.replace(/\s/g, '') || "";
               return k.split(' ').every(w => row.title?.includes(w) || normTitle.includes(w.replace(/\s/g, '')));
            })
         );
         if (matchGroup) kw = matchGroup.keywords[0];
      }
      if (!kw) return;

      // 🌟 2. 단가 로직 적용 (판매가가 아닌 단가를 통계에 넣음)
      const { price: unitPrice } = getUnitPrice(row, row.title);
      
      // 날짜 안전하게 가져오기
      const dateKey = row.crawled_at ? row.crawled_at.slice(5, 10) : "00-00";

      if (!grouped[kw]) grouped[kw] = [];
      if (unitPrice && !isNaN(unitPrice)) {
        grouped[kw].push({ date: dateKey, price: unitPrice });
      }
    });

    const stats = {};
    Object.entries(grouped).forEach(([kw, items]) => {
      const uniquePrices = [];
      const seenDates = new Set();
      
      // 날짜별로 중복 제거 (하루에 여러 데이터 있으면 하나만)
      items.forEach(item => {
        if (!seenDates.has(item.date)) {
          seenDates.add(item.date);
          uniquePrices.push(item.price);
        }
      });

      if (uniquePrices.length === 0) return; 

      // 3. 통계 계산 (NaN 방지 처리)
      const minPrice = Math.min(...uniquePrices);
      const avgPrice = Math.round(uniquePrices.reduce((a, b) => a + b, 0) / uniquePrices.length);
      
      stats[kw] = { minPrice, avgPrice, count: uniquePrices.length };
    });
    
    setPriceStats(stats);
  } catch (e) {
    console.error('가격 통계 불러오기 실패:', e);
  }
}

    fetchDeals(0, true);
    fetchPriceStats();
  }, [fetchDeals]);

  // 필터 변경시 초기화
  useEffect(() => {
    setAllDeals([]);
    setPage(0);
    setHasMore(true);
    fetchDeals(0, true);
  }, [sourceFilter, searchQuery, fetchDeals]);

  // 무한스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchDeals(nextPage);
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchDeals]);

  // 카테고리 키워드 매핑
  const categoryKeywords = {
    "식품":    ["식품", "먹거리", "음식", "건강", "생활/식품"],
    "생활잡화": ["생활", "잡화", "생활용품", "자동차"],
    "게임":    ["게임", "게임S/W", "게임H/W"],
    "PC":     ["PC", "컴퓨터", "노트북", "하드웨어", "디지털"],
    "가전":    ["가전", "전자", "TV", "A/V", "전자/IT"],
    "의류":    ["의류", "패션", "잡화"],
    "화장품":  ["화장품", "뷰티"],
    "기타":    ["기타", "상품권", "취미", "여행"],
  };

  const categories = ["전체", "식품", "생활잡화", "게임", "PC", "가전", "의류", "화장품", "기타"];
  const sources = ["전체", "dogdrip", "fmkorea", "arca", "clien", "ppomppu", "quasarzone", "zod", "ruliweb"];
  const sourceLabel = {
    dogdrip: "개드립", fmkorea: "에펨코리아", arca: "아카라이브",
    clien: "클리앙", ppomppu: "뽐뿌", quasarzone: "퀘이사존",
    zod: "ZOD", ruliweb: "루리웹"
  };

  const filteredDeals = allDeals.filter((deal) => {
    return category === "전체" ||
      categoryKeywords[category]?.some(k => deal.category?.includes(k));
  });

  const gradeBadge = {
    "역대급": "bg-purple-500 text-purple-100",
    "대박":   "bg-red-500 text-red-100",
    "중박":   "bg-orange-400 text-orange-100",
    "평범":   "bg-gray-400 text-gray-100",
  };

  const getDealGrade = (deal) => {
    let kw = deal.matched_keyword;
    if (!kw) {
       const allGroups = Object.values(KEYWORD_GROUPS).flat();
       const matchGroup = allGroups.find(g => g.keywords.some(k => {
           const normTitle = deal.title?.replace(/\s/g, '') || "";
           return k.split(' ').every(w => deal.title?.includes(w) || normTitle.includes(w.replace(/\s/g, '')));
       }));
       if (matchGroup) kw = matchGroup.keywords[0];
    }
    if (!kw || !priceStats[kw]) return null;
    
    const stat = priceStats[kw];
    const currentPriceRaw = parseInt(deal.price?.replace(/[^\d]/g, '') || "0");

    // ✅ 현재 핫딜의 판매가를 단가로 변환
    const { price: currentUnitPrice } = getUnitPrice({ price_num: currentPriceRaw }, deal.title);

    if (currentUnitPrice <= 0) return null;

    // ✅ 통합 함수를 사용하여 등급 판별 (역대급 3% 오차 자동 적용)
    return calculateGrade(currentUnitPrice, stat.minPrice, stat.avgPrice);

  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">
      
      {/* ✨ 여기서부터 전체를 묶어서 상단에 고정합니다 (z-20으로 우선순위 높임) */}
      <div className="sticky top-0 z-20 shadow-sm">
        
        {/* 1. 헤더 (개별 고정 속성은 제거했습니다) */}
        <header className="bg-white border-b p-4 flex items-center gap-3">
          <a href="https://www.ssagesage.com/"><h1 className="text-lg font-bold text-gray-800">싸게사게 🦀</h1></a>
          <div className="w-px h-5 bg-gray-200"></div>
          <a
            href="/hotdeal-thermometer"
            className="flex items-center gap-1.5 bg-orange-50 border border-orange-300 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
          >
            🌡️ 핫딜온도계
          </a>
          <a
            href="/blog"
            className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            📝 정보모음
          </a>
        </header>

        {/* 2. 검색창 */}
        <div className="p-3 bg-white border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="어떤 상품을 찾으시나요?"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* 3. 사이트 필터 탭 */}
        <div className="bg-white border-b">
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowSourceFilter(!showSourceFilter)}
                className={`flex items-center justify-center w-10 h-10 ml-2 rounded-full transition-colors ${
                  sourceFilter !== "전체" ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {showSourceFilter && (
                <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 p-2 w-36">
                  {sources.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSourceFilter(s); setShowSourceFilter(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        sourceFilter === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {s === "전체" ? "전체 커뮤니티" : sourceLabel[s] || s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex gap-2 px-2 py-2 overflow-x-auto scrollbar-hide flex-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${
                    category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>

          {sourceFilter !== "전체" && (
            <div className="flex items-center gap-2 px-3 pb-2">
              <span className="text-xs text-gray-400">커뮤니티:</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {sourceLabel[sourceFilter]}
              </span>
              <button
                onClick={() => setSourceFilter("전체")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        
      </div> 
      {/* ✨ 상단 고정 영역 끝 */}

      {/* 핫딜 목록 */}
      <main className="p-3 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">
            핫딜 불러오는 중... ⏳
          </div>
        )}

        {!loading && filteredDeals.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            {searchQuery ? `"${searchQuery}"에 대한 상품이 없어요! 😅` : "핫딜이 없어요 😅"}
          </div>
        )}

        {!loading && filteredDeals.map((deal) => {
          const grade = getDealGrade(deal);
          return (
            <a
              key={deal.id}
              href={`/deal/${deal.id}`}
              className="relative flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              {grade && (
                <div className={`absolute top-0 left-0 text-xs font-bold px-2.5 py-1 rounded-br-xl ${gradeBadge[grade]}`}>
                  {grade}
                </div>
              )}

              {/* 썸네일 */}
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                {deal.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={deal.image}
                    alt={deal.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">🛍️</div>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-blue-500">
                    {sourceLabel[deal.source] || deal.source}
                  </span>
                  {deal.shop && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {deal.shop}
                    </span>
                  )}
                  {deal.category && (
                    <span className="text-xs text-gray-400">
                      {deal.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(deal.crawled_at).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2">
                  {deal.title}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-red-500">
                    {deal.price || "가격미정"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(`${window.location.origin}/deal/${deal.id}`);
                      e.currentTarget.innerText = '✓';
                      setTimeout(() => e.currentTarget.innerText = '🔗', 1500);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 transition-colors flex-shrink-0"
                  >
                    🔗
                  </button>
                </div>
              </div>

              {/* 화살표 */}
              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            </a>
          );
        })}
      
        {/* 무한 스크롤 감지 */}
        <div ref={observerRef} className="py-4 text-center">
          {loadingMore && (
            <span className="text-gray-400 text-sm">더 불러오는 중... ⏳</span>
          )}
          {!hasMore && !loading && (
            <span className="text-gray-300 text-xs">모든 핫딜을 확인했어요 🎉</span>
          )}
        </div>
      </main>

      <footer className="text-center p-6 text-gray-400 text-xs">
        © 2026 싸게사게
        <div className="mt-2">
          <a href="/privacy" className="hover:text-gray-600 transition-colors underline">
            개인정보처리방침
          </a>
        </div>
      </footer>
    </div>
  );
}