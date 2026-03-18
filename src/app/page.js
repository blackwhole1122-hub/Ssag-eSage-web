'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';  // 경로는 프로젝트 구조에 맞게 조정

export default function Home() {
  const [filter, setFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 데이터 불러오기
  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotdeals')
        .select('*')
        .order('crawled_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('데이터 불러오기 실패:', error);
      } else {
        setAllDeals(data || []);
      }
      setLoading(false);
    }

    fetchDeals();
  }, []);

  // 필터 + 검색
  const filteredDeals = allDeals.filter((deal) => {
    const isCategoryMatch =
      filter === "전체" ||
      deal.source === filter ||
      deal.category?.includes(filter);
    const isSearchMatch = deal.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return isCategoryMatch && isSearchMatch;
  });

  // 사이트 목록 (source 기준)
  const sources = ["전체", "dogdrip", "fmkorea", "arca", "clien", "ppomppu", "quasarzone", "zod", "ruliweb"];

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-blue-600 p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-white text-xl font-bold">싸게사게 💸</h1>
      </header>

      {/* 검색창 */}
      <div className="p-3 bg-white border-b">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="어떤 상품을 찾으시나요?"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3.5 top-2.5">🔍</span>
        </div>
      </div>

      {/* 사이트 필터 */}
      <nav className="flex gap-2 p-3 overflow-x-auto bg-white border-b scrollbar-hide">
        {sources.map((menu) => (
          <button
            key={menu}
            onClick={() => setFilter(menu)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === menu ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
            }`}
          >
            {menu === "전체" ? "전체" :
             menu === "dogdrip" ? "개미집" :
             menu === "fmkorea" ? "에펨코리아" :
             menu === "arca" ? "아카라이브" :
             menu === "clien" ? "클리앙" :
             menu === "ppomppu" ? "뽐뿌" :
             menu === "quasarzone" ? "퀘이사존" :
             menu === "zod" ? "ZOD" :
             menu === "ruliweb" ? "루리웹" : menu}
          </button>
        ))}
      </nav>

      <main className="p-4 md:p-6">
        {/* 로딩 중 */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            핫딜 불러오는 중... ⏳
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && filteredDeals.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            {searchQuery ? `"${searchQuery}"에 대한 상품이 없어요! 😅` : "핫딜이 없어요 😅"}
          </div>
        )}

        {/* 핫딜 목록 */}
        {!loading && filteredDeals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <a href={deal.url} key={deal.id} target="_blank" rel="noopener noreferrer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full cursor-pointer hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden">
                  
                  {/* 썸네일 이미지 */}
                  {deal.image && (
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}

                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div className="flex-1">
                      {/* 사이트명 + 쇼핑몰 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-500">
                          {deal.source === "dogdrip" ? "개드립" :
                           deal.source === "fmkorea" ? "에펨코리아" :
                           deal.source === "arca" ? "아카라이브" :
                           deal.source === "clien" ? "클리앙" :
                           deal.source === "ppomppu" ? "뽐뿌" :
                           deal.source === "quasarzone" ? "퀘이사존" :
                           deal.source === "zod" ? "ZOD" :
                           deal.source === "ruliweb" ? "루리웹" : deal.source}
                        </span>
                        {deal.shop && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {deal.shop}
                          </span>
                        )}
                        {deal.category && (
                          <span className="text-xs text-gray-400">
                            {deal.category}
                          </span>
                        )}
                      </div>

                      {/* 제목 */}
                      <h2 className="text-sm md:text-base font-medium text-gray-800 line-clamp-2 mb-4">
                        {deal.title}
                      </h2>
                    </div>

                    {/* 가격 + 보기 버튼 */}
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-xl font-bold text-red-600">
                        {deal.price || "가격미정"}
                      </p>
                      <div className="p-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-400">
                        보기 →
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center p-6 text-gray-400 text-xs">
        © 2026 싸게사게 - 핫딜 모음
      </footer>
    </div>
  );
}