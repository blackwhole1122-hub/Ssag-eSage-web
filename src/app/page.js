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

  // 1. 핫딜 목록 페칭 함수
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

    if (sourceFilter !== "전체") query = query.eq('source', sourceFilter);
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

    const { data, error } = await query;

    if (error) {
      console.error('데이터 불러오기 실패:', error);
    } else {
      setAllDeals(prev => {
        const newData = data || [];
        if (reset) return newData;

        // 🔥 [핵심] 중복 제거 로직 추가
        // 기존 데이터(prev)와 새 데이터(newData)를 합친 후 ID 기준으로 중복을 걸러냅니다.
        const combined = [...prev, ...newData];
        const uniqueData = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        return uniqueData;
      });
      setHasMore((data || []).length === 20);
    }

    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
  }, [sourceFilter, searchQuery]);

  // 2. 기준 통계 데이터 로드 및 초기 페칭
  useEffect(() => {
    async function fetchBenchmarks() {
      try {
        const { data, error } = await supabase
          .from('price_benchmarks')
          .select('slug, ref_low, ref_avg');

        if (error) throw error;

        const benchmarkMap = {};
        data.forEach(item => {
          benchmarkMap[item.slug] = item;
        });
        setPriceStats(benchmarkMap); 
      } catch (e) {
        console.error('기준가 불러오기 실패:', e);
      }
    }

    fetchDeals(0, true);
    fetchBenchmarks();
  }, [fetchDeals]);

  // 필터 변경 시 초기화
  useEffect(() => {
    setPage(0);
    fetchDeals(0, true);
  }, [sourceFilter, searchQuery, fetchDeals]);

  // 무한스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // loadingMore가 true일 때는 아예 실행되지 않도록 막기
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchDeals(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchDeals]);

  // 카테고리/소스 설정 데이터
  const categoryKeywords = {
    "식품": ["식품", "먹거리", "음식", "건강", "생활/식품"],
    "생활잡화": ["생활", "잡화", "생활용품", "자동차"],
    "게임": ["게임", "게임S/W", "게임H/W"],
    "PC": ["PC", "컴퓨터", "노트북", "하드웨어", "디지털"],
    "가전": ["가전", "전자", "TV", "A/V", "전자/IT"],
    "의류": ["의류", "패션", "잡화"],
    "화장품": ["화장품", "뷰티"],
    "기타": ["기타", "상품권", "취미", "여행"],
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
    "역대급": "bg-purple-600 text-white font-bold",
    "대박": "bg-red-500 text-white font-bold",
    "중박": "bg-orange-400 text-white",
    "평범": "bg-gray-400 text-white",
    "구매금지": "bg-black text-white",
  };

  // 등급 계산기
  const getDealGrade = (deal) => {
    let matchedSlug = deal.group_slug;
    if (!matchedSlug) {
      const allGroups = Object.values(KEYWORD_GROUPS).flat();
      const matchGroup = allGroups.find(g => g.keywords.some(k => {
        const normTitle = deal.title?.replace(/\s/g, '') || "";
        return k.split(' ').every(w => deal.title?.includes(w) || normTitle.includes(w.replace(/\s/g, '')));
      }));
      if (matchGroup) matchedSlug = matchGroup.slug;
    }

    const benchmark = priceStats[matchedSlug];
    if (!benchmark) return null;

    const currentPriceRaw = parseInt(deal.price?.replace(/[^\d]/g, '') || "0");
    const { price: currentUnitPrice, label: unitLabel } = getUnitPrice({ price_num: currentPriceRaw }, deal.title);

    if (currentUnitPrice <= 0) return null;

    const grade = calculateGrade(currentUnitPrice, benchmark.ref_low, benchmark.ref_avg);

    return { 
      grade, 
      unitPrice: currentUnitPrice, 
      unitLabel, 
      refAvg: benchmark.ref_avg 
    };
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">
      
      {/* 🟢 상단 고정 영역 (헤더 + 검색 + 필터) */}
      <div className="sticky top-0 z-20 shadow-sm">
        
        {/* 1. 헤더 */}
        <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* 1. 싸게사게 (메인 로고, 크기 h-11로 시원하게!) */}
            <a href="/" className="flex items-center ml-1">
              <img 
                src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo.png" 
                alt="싸게사게" 
                className="h-11 w-auto object-contain" 
              />
            </a>

            {/* 구분선 (두 로고 사이를 깔끔하게 분리) */}
            <div className="w-px h-5 bg-gray-200 mx-1"></div> 

            {/* 2. 메뉴 (핫딜온도계 이미지 + 정보모음 텍스트) */}
            <nav className="flex items-center gap-4">
              {/* ✅ 텍스트 대신 'logo2' 이미지를 사용하여 디자인 통일 */}
              <a href="/hotdeal-thermometer" className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo2.png" 
                  alt="핫딜온도계" 
                  // 싸게사게 로고보다 살짝 작게 (h-9) 설정해서 밸런스를 맞췄어
                  className="h-9 w-auto object-contain" 
                />
              </a>
              {/* 정보모음도 텍스트로 시원하게 (폰트 크기와 색상 조절) */}
              <a href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                정보모음
              </a>
            </nav>
          </div>

          {/* 우측 상단은 필요하다면 로그인 버튼 등을 넣을 수 있지만, 현재는 공백 */}
          <div className="md:w-32"></div> 
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

        {/* 3. 사이트 및 카테고리 필터 */}
        <div className="bg-white border-b">
          <div className="flex items-center">
            {/* 사이트 필터 버튼 */}
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

            {/* 카테고리 탭 (가로 스크롤) */}
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
        </div>
      </div> 

      {/* 핫딜 목록 메인 */}
      <main className="p-3 flex flex-col gap-3">
        {loading && <div className="text-center py-20 text-gray-400 text-sm">핫딜 불러오는 중... ⏳</div>}
        {!loading && filteredDeals.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            {searchQuery ? `"${searchQuery}"에 대한 상품이 없어요! 😅` : "핫딜이 없어요 😅"}
          </div>
        )}

        {!loading && filteredDeals.map((deal) => {
          const gradeInfo = getDealGrade(deal);
          return (
            <a key={deal.id} href={`/deal/${deal.id}`} className="relative flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
              {/* 5단계 등급 배지 */}
              {gradeInfo?.grade && (
                <div className={`absolute top-0 left-0 text-[10px] font-bold px-2.5 py-1 rounded-br-xl ${gradeBadge[gradeInfo.grade]}`}>
                  {gradeInfo.grade}
                </div>
              )}
              
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                <img src={deal.image || '/default-image.png'} alt={deal.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-blue-500">{sourceLabel[deal.source] || deal.source}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(deal.crawled_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2">{deal.title}</p>
                
                {/* 🌟 가격 비교 카드 (가장 중요한 부분!) */}
                {gradeInfo && (
                  <div className="bg-blue-50 rounded-lg p-2 mb-2 border border-blue-100">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-blue-700 font-bold">
                        {gradeInfo.unitLabel} <span className="text-blue-600">{Math.floor(gradeInfo.unitPrice).toLocaleString()}원</span>
                      </span>
                      <span className="text-gray-400">어제까지 평균 {Math.floor(gradeInfo.refAvg).toLocaleString()}원</span>
                    </div>
                  </div>
                )}
                
                <p className="text-base font-bold text-red-500">{deal.price || "가격미정"}</p>
              </div>
              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            </a>
          );
        })}
      
        {/* 무한스크롤 로더 */}
        <div ref={observerRef} className="py-10 text-center">
          {loadingMore && <span className="text-gray-400 text-sm">더 불러오는 중... ⏳</span>}
          {!hasMore && !loading && <span className="text-gray-300 text-xs">모든 핫딜을 확인했어요 🎉</span>}
        </div>
      </main>

      <footer className="text-center p-6 text-gray-400 text-xs">
        © 2026 싸게사게
        <div className="mt-2">
          <a href="/privacy" className="hover:text-gray-600 transition-colors underline">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  );
}