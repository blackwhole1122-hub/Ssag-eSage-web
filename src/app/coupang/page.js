'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function CoupangHotdeals() {
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [discountFilter, setDiscountFilter] = useState("전체");
  const [showDiscountMenu, setShowDiscountMenu] = useState(false);

  const categories = ["전체", "식품", "가전", "생활용품", "뷰티", "패션", "기타"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchDeals = useCallback(async (pageNum = 0, reset = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * 20;
    const to = from + 19;

    let query = supabase
      .from('coupang_hotdeals')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (category !== "전체") query = query.eq('category', category);
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    
    if (discountFilter === "50~60%") {
      query = query.gte('discount_rate', 50).lt('discount_rate', 60);
    } else if (discountFilter === "60~70%") {
      query = query.gte('discount_rate', 60).lt('discount_rate', 70);
    } else if (discountFilter === "70% 이상") {
      query = query.gte('discount_rate', 70);
    }

    const { data, error } = await query;

    if (error) {
      console.error('데이터 실패:', error);
    } else {
      setAllDeals(prev => {
        const newData = data || [];
        if (reset) return newData;
        const combined = [...prev, ...newData];
        return Array.from(new Map(combined.map(item => [item.product_id, item])).values());
      });
      setHasMore((data || []).length === 20);
    }

    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
    // ✅ 수정: 의존성 배열에 discountFilter 추가
  }, [category, searchQuery, discountFilter]); 

  useEffect(() => {
    setPage(0);
    fetchDeals(0, true);
  }, [category, searchQuery, discountFilter, fetchDeals]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
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

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      
      <div className="sticky top-0 z-20 shadow-sm">
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/coupang" className="flex items-center ml-1">
              <img src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo3.png" alt="쿠팡핫딜" className="h-11 w-auto object-contain" />
            </a>
            <div className="w-px h-5 bg-gray-200 mx-2"></div> 
            <nav className="flex items-center gap-3 md:gap-4">
              <a href="/" className="text-sm font-medium text-gray-500 hover:text-gray-800">싸게사게</a>
              <a href="/hotdeal-thermometer" className="text-sm font-medium text-gray-500 hover:text-gray-800">핫딜온도계</a>
              <a href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-800">정보모음</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <a href="/mypage" className="text-sm font-bold text-blue-600">{user.user_metadata?.display_name || "회원"}님</a>
            ) : (
              <a href="/login" className="text-sm font-medium text-gray-500">로그인</a>
            )}
          </div>
        </header>

        <div className="p-3 bg-white border-b">
          <div className="relative">
            <input type="text" placeholder="쿠팡 핫딜 검색..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowDiscountMenu(!showDiscountMenu)}
                className={`flex items-center justify-center w-10 h-10 ml-2 rounded-full transition-colors ${discountFilter !== "전체" ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {showDiscountMenu && (
                <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-2xl shadow-lg z-30 p-2 w-36">
                  {["전체", "50~60%", "60~70%", "70% 이상"].map((df) => (
                    <button key={df} onClick={() => { setDiscountFilter(df); setShowDiscountMenu(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${discountFilter === df ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {df === "전체" ? "할인율 전체" : df}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <nav className="flex gap-2 px-2 py-2 overflow-x-auto scrollbar-hide flex-1">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                  {c}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <main className="p-3 flex flex-col gap-3 mt-2">
        {loading && <div className="text-center py-20 text-gray-400 text-sm">쿠팡 핫딜 스캔 중... 🚀</div>}
        {!loading && allDeals.length === 0 && <div className="text-center py-20 text-gray-400 text-sm">상품이 없어요! 😅</div>}

        {!loading && allDeals.map((deal) => (
          <a key={deal.product_id} href={`/coupang/${deal.product_id}`} className="relative flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all overflow-hidden group">
            {deal.discount_rate >= 50 && (
              <div className="absolute top-0 left-0 bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-br-xl shadow-sm z-10">
                {deal.discount_rate}% OFF
              </div>
            )}
            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100 p-1">
              <img src={deal.image_url || '/coupang-default.png'} alt={deal.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{deal.category}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-blue-600">{deal.name}</p>
              <div className="flex flex-col gap-0.5">
                {deal.original_price > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 line-through">{deal.original_price.toLocaleString()}원</span>
                    {/* ✅ 원가 옆에 할인율 텍스트 추가 (요청사항 반영) */}
                    <span className="text-[10px] font-bold text-red-500">-{deal.discount_rate}%</span>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <span className="text-lg font-black text-red-500">{deal.discount_price.toLocaleString()}원</span>
                  <span className="text-[10px] font-bold text-blue-500 mb-1">🚀 특가</span>
                </div>
              </div>
            </div>
          </a>
        ))}
        <div ref={observerRef} className="py-10 text-center">
          {loadingMore && <span className="text-blue-400 font-bold text-sm animate-pulse">더 긁어오는 중... 🛒</span>}
          {!hasMore && !loading && <span className="text-gray-300 text-xs">마지막 핫딜입니다 🎉</span>}
        </div>
      </main>
    </div>
  );
}