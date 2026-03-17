'use client'
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [filter, setFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState(""); // [1단계 추가]

  const allDeals = [
    { id: 1, mall: "지마켓", title: "폴햄 트레이닝 팬츠 5종", price: "16,320", grade: "대박", category: "의류" },
    { id: 2, mall: "네이버", title: "삼성 스마트 M5 32인치 모니터", price: "358,070", grade: "중박", category: "전자/IT" },
    { id: 3, mall: "롯데온", title: "지리산 물하나 2L x 24병", price: "9,900", grade: "대박", category: "식품" },
    { id: 4, mall: "쿠팡", title: "신라면 20봉", price: "12,000", grade: "평범", category: "식품" },
  ];

  // [2단계 수정]
  const filteredDeals = allDeals.filter((deal) => {
    const isCategoryMatch = 
      filter === "전체" || 
      (filter === "대박급" && deal.grade === "대박") || 
      (filter === "중박급" && deal.grade === "중박") || 
      deal.category === filter;
    const isSearchMatch = deal.title.toLowerCase().includes(searchQuery.toLowerCase());
    return isCategoryMatch && isSearchMatch;
  });

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-blue-600 p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-white text-xl font-bold">싸게사게 💸</h1>
      </header>

      {/* [3단계 추가] 검색창 */}
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

      <nav className="flex gap-2 p-3 overflow-x-auto bg-white border-b scrollbar-hide">
        {["전체", "대박급", "중박급", "전자/IT", "식품", "의류", "화장품", "생활잡화"].map((menu) => (
          <button
            key={menu}
            onClick={() => setFilter(menu)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === menu ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
            }`}
          >
            {menu}
          </button>
        ))}
      </nav>

      <main className="p-4 md:p-6">
        {filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <Link href={`/deal/${deal.id}`} key={deal.id}>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full cursor-pointer hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-500">{deal.mall}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold ${
                        deal.grade === '대박' ? 'bg-red-500' : deal.grade === '중박' ? 'bg-orange-400' : 'bg-gray-400'
                      }`}>
                        {deal.grade}
                      </span>
                    </div>
                    <h2 className="text-sm md:text-base font-medium text-gray-800 line-clamp-2 mb-4">{deal.title}</h2>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xl font-bold text-red-600">{deal.price}원</p>
                    <div className="p-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-400">보기</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            "{searchQuery}"에 대한 상품이 없어요! 😅
          </div>
        )}
      </main>

      <footer className="text-center p-6 text-gray-400 text-xs">
        © 2026 싸게사게 - 핫딜 가격판단 봇
      </footer>
    </div>
  );
}