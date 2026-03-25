'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUnitPrice } from '@/lib/priceUtils';

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
      
      // 1. 데이터 가져오기 (created_at 추가)
      const { data: groupData } = await supabase.from('keyword_groups').select('*');
      const { data: activeHotdeals } = await supabase.from('hotdeals').select('*');
      const { data: historyData } = await supabase
        .from('price_history')
        .select('group_slug, price_num, price_raw, crawled_at, created_at, price_per_100g, price_per_100ml, price_per_unit')
        .order('crawled_at', { ascending: true });

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (groupData) {
        const nameMap = {};
        groupData.forEach(g => { nameMap[g.slug] = g.group_name; });

        // 2. 히스토리 맵 구성 (상세페이지와 동일한 날짜 처리: crawled_at || created_at)
        const statsMap = {};
        historyData?.forEach(row => {
          const { price } = getUnitPrice(row, nameMap[row.group_slug] || "");
          if (!statsMap[row.group_slug]) statsMap[row.group_slug] = [];
          statsMap[row.group_slug].push({ 
            price, 
            date: row.crawled_at || row.created_at // ← 날짜 로직 통일
          });
        });

        // 3. 실시간 최저가 맵 구성
        const realTimePriceMap = {};
        activeHotdeals?.forEach(deal => {
          if (!deal.group_name) return;
          const { price } = getUnitPrice(deal, deal.group_name);
          const cleanName = deal.group_name.trim();
          if (!realTimePriceMap[cleanName] || price < realTimePriceMap[cleanName]) {
            realTimePriceMap[cleanName] = price;
          }
        });

        // 4. 등급 판별 로직 (1년 기준 vs 최근 10개)
        const enrichedGroups = groupData.map(group => {
          const cleanGroupName = group.group_name.trim();
          const allPricesForGroup = statsMap[group.slug] || [];
          
          // 상세페이지와 동일한 필터링 기준
          let referenceData = allPricesForGroup.filter(p => new Date(p.date) >= oneYearAgo);
          
          if (referenceData.length < 10 && allPricesForGroup.length > 0) {
            referenceData = allPricesForGroup.slice(-10);
          }

          const referencePrices = referenceData.map(d => d.price);
          const latestHistoryPrice = referencePrices.length > 0 ? referencePrices[referencePrices.length - 1] : 0;
          const currentUnitPrice = realTimePriceMap[cleanGroupName] || latestHistoryPrice;

          let grade = "분석중";
          let minPrice = 0;

          if (referencePrices.length > 0 && currentUnitPrice > 0) {
            minPrice = Math.min(...referencePrices);
            const ratio = currentUnitPrice / minPrice;

            if (ratio <= 1.0) grade = "역대급";
              else if (ratio <= 1.08) grade = "대박";
              else if (ratio <= 1.15) grade = "중박";
              else grade = "평범";  // ← else로 바로 처리
          }

          return { ...group, currentPrice: currentUnitPrice, grade: grade };
        });

        // 5. 상태 업데이트
        setGroups(enrichedGroups);
        const rawCats = [...new Set(enrichedGroups.map(item => item.category))];
        const sortedCats = rawCats.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
        setCategories(["전체", ...sortedCats]);
      } 

      setLoading(false); // ← 이제 정상적인 위치입니다.
    } 

    fetchData();
  }, []);

  // ... (필터링 로직 및 렌더링 부분은 이전과 동일)
  // 등급별 스타일 적용 부분만 확인
  const getGradeStyle = (grade) => {
    switch(grade) {
      case '역대급': return 'bg-purple-600 text-white';
      case '대박': return 'bg-red-500 text-white';
      case '중박': return 'bg-orange-400 text-white';
      default: return 'bg-gray-400 text-white'; // 평범 및 분석중
    }
  };

  // 필터링 로직
  const filteredGroups = groups.filter(item => {
    const matchesCategory = activeCategory === "전체" || item.category === activeCategory;
    const matchesSearch = item.group_name.includes(searchQuery) || item.keywords?.some(kw => kw.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const displayData = activeCategory === "전체" 
    ? categoryOrder.filter(cat => filteredGroups.some(g => g.category === cat))
    : [activeCategory];

  if (loading) return <div className="p-20 text-center text-gray-400 font-bold tracking-tighter animate-pulse">전 품목 온도 체크 중... 🌡️</div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/"><img src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo.png" className="h-7 w-auto" alt="로고" /></a>
          </div>
          <button onClick={() => window.history.back()} className="text-gray-400 text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">뒤로가기</button>
        </header>
        <div className="px-4 pb-3">
          <input 
            type="text" 
            placeholder="어떤 상품을 찾으시나요?" 
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <nav className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all ${
                activeCategory === c ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </nav>
      </div>
      
      <main className="p-4 space-y-10">
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
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                {catHeader}
              </h2>

              {subCategories.map(subCat => {
                const itemsInSubCat = itemsInMainCat.filter(i => i.sub_category === subCat);
                return (
                  <div key={subCat} className="space-y-3 pl-1">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{subCat}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {itemsInSubCat.map((item) => (
                        <a 
                          key={item.slug} 
                          href={`/hotdeal-thermometer/${item.slug}`}
                          className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 group"
                        >
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img 
                              src={`https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/${item.slug}.png`}
                              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                              onError={(e) => { e.target.src = '/images/default-icon.png'; }}
                              alt={item.group_name}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-800 truncate">{item.group_name}</h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                item.grade === '역대급' ? 'bg-purple-600 text-white' :
                                item.grade === '대박' ? 'bg-red-500 text-white' :
                                item.grade === '중박' ? 'bg-orange-400 text-white' : 'bg-gray-400 text-white'
                              }`}>
                                {item.grade || '분석중'} ●
                              </span>
                              <p className="text-[10px] text-gray-400 font-bold">클릭해서 추이 보기</p>
                            </div>
                          </div>
                          <span className="text-gray-200 text-lg group-hover:text-gray-400 transition-colors">›</span>
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