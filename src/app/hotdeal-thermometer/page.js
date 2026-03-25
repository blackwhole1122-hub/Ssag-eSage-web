'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUnitPrice, calculateGrade } from '@/lib/priceUtils';

export default function HotdealThermometer() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState([]); 
  const [categories, setCategories] = useState(["전체"]);
  const [loading, setLoading] = useState(true);
  
  const categoryOrder = ['식품', '생활잡화', '가전/디지털', '상품권'];
  const foodSubOrder = ['가공식품', '음료/탄산', '음료', '음료/에너지음료', '생수', '디저트/아이스크림', '신선식품', '쌀/잡곡', '영양제'];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: groupData } = await supabase.from('keyword_groups').select('*');
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: historyData } = await supabase
        .from('price_history')
        .select('group_slug, price_num, price_raw, crawled_at, price_per_100g, price_per_100ml, price_per_unit')
        .gte('crawled_at', threeMonthsAgo.toISOString())
        .order('crawled_at', { ascending: true });

      if (groupData) {
        const statsMap = {};
        historyData?.forEach(row => {
          const { price } = getUnitPrice(row, "");
          if (!statsMap[row.group_slug]) statsMap[row.group_slug] = [];
          statsMap[row.group_slug].push(price);
        });

        const enrichedGroups = groupData.map(group => {
          const prices = statsMap[group.slug] || [];
          const currentUnitPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
          const minUnitPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const avgUnitPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

          return {
            ...group,
            currentPrice: currentUnitPrice,
            grade: calculateGrade(currentUnitPrice, minUnitPrice, avgUnitPrice)
          };
        });

        setGroups(enrichedGroups);
        const rawCats = [...new Set(enrichedGroups.map(item => item.category))];
        const sortedCats = rawCats.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
        setCategories(["전체", ...sortedCats]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredGroups = groups.filter(item => {
    const matchesCategory = activeCategory === "전체" || item.category === activeCategory;
    const matchesSearch = item.group_name.includes(searchQuery) || item.keywords.some(kw => kw.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const displayData = activeCategory === "전체" 
    ? categoryOrder.filter(cat => filteredGroups.some(g => g.category === cat))
    : [activeCategory];

  if (loading) return <div className="p-20 text-center text-gray-400 font-bold">전 품목 온도 체크 중... 🌡️</div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-100 min-h-screen pb-10">
      {/* 검색창/헤더 영역 */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <header className="p-4 flex items-center justify-between">
          <h1 className="text-lg font-black text-gray-800">🌡️ 핫딜온도계</h1>
          <button onClick={() => window.history.back()} className="text-gray-400 text-sm font-bold">뒤로가기</button>
        </header>
        <div className="px-4 pb-3">
          <input 
            type="text" 
            placeholder="상품을 검색해 보세요" 
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <nav className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeCategory === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {c}
            </button>
          ))}
        </nav>
      </div>
      
      <main className="p-4 space-y-12">
        {displayData.map(catHeader => {
          const itemsInMainCat = filteredGroups.filter(g => g.category === catHeader);
          if (itemsInMainCat.length === 0) return null;

          const subCategories = [...new Set(itemsInMainCat.map(i => i.sub_category))].sort((a, b) => {
            if (catHeader === '식품') return foodSubOrder.indexOf(a) - foodSubOrder.indexOf(b);
            return a.localeCompare(b);
          });

          return (
            <section key={catHeader} className="space-y-6">
              <h2 className="text-sm font-black text-gray-900 px-1 flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                {catHeader}
              </h2>

              {subCategories.map(subCat => {
                const itemsInSubCat = itemsInMainCat.filter(i => i.sub_category === subCat);
                return (
                  <div key={subCat} className="space-y-3 pl-2">
                    <h3 className="text-[11px] font-bold text-gray-400">{subCat}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itemsInSubCat.map((item) => (
                        <a 
                          key={item.slug} 
                          href={`/hotdeal-thermometer/${item.slug}`}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition-all flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img 
                              // 이 부분을 bpoerueomemrufjoxrej 로 교체
                              src={`https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/${item.slug}.png`}
                              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                              onError={(e) => { e.target.src = '/images/default-icon.png'; }}
                              alt={item.group_name}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-800 truncate">{item.group_name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                item.grade === '역대급' ? 'bg-purple-50 text-purple-600' :
                                item.grade === '대박' ? 'bg-red-50 text-red-500' :
                                item.grade === '중박' ? 'bg-orange-50 text-orange-400' : 'bg-gray-50 text-gray-400'
                              }`}>
                                {item.grade || '분석중'} ●
                              </span>
                              <p className="text-[10px] text-gray-300">클릭해서 추이 보기</p>
                            </div>
                          </div>
                          <span className="text-gray-300 text-xs">›</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>
    </div>
  );
}