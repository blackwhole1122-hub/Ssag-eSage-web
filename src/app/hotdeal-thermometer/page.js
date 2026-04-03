'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// 👇 calculateGrade 추가
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
      
      try {
        // 1. 필요한 테이블 3개에서 데이터 딱딱 가져오기
        // keyword_groups: 기본 그룹 정보
        // hotdeals: 현재 핫딜가 파악용
        // price_benchmarks: 매일 업데이트되는 1년 치 기준가 (최저가, 평균가)
        const [
          { data: groupData },
          { data: activeHotdeals },
          { data: benchmarkData }
        ] = await Promise.all([
          supabase.from('keyword_groups').select('*'),
          supabase.from('hotdeals').select('*'),
          supabase.from('price_benchmarks').select('*')
        ]);

        if (groupData) {
          // 2. 실시간 최저가 맵 구성 (기존 로직 유지)
          const realTimePriceMap = {};
          activeHotdeals?.forEach(deal => {
            if (!deal.group_name) return;
            const { price } = getUnitPrice(deal, deal.group_name);
            const cleanName = deal.group_name.trim();
            if (price > 0 && (!realTimePriceMap[cleanName] || price < realTimePriceMap[cleanName])) {
              realTimePriceMap[cleanName] = price;
            }
          });

          // 3. 기준가 맵 구성 (DB에서 가져온 값)
          const benchmarkMap = {};
          benchmarkData?.forEach(bm => {
            benchmarkMap[bm.slug] = bm;
          });

          // 4. 등급 판별 로직 (우리가 만든 calculateGrade 함수 사용!)
          // 4. 등급 판별 로직 (어제까지의 평균가(ref_avg) 기준)
          const enrichedGroups = groupData.map(group => {
            const benchmark = benchmarkMap[group.slug];
            
            // 🎯 기준은 오직 "어제까지의 평균가(ref_avg)"
            const currentUnitPrice = benchmark?.ref_avg || 0;
            let grade = "분석중";
            
            if (benchmark && currentUnitPrice > 0) {
              // 평균가(현재가)를 최저가와 비교해서 5단계 등급 산출
              grade = calculateGrade(
                currentUnitPrice, 
                benchmark.ref_low, 
                benchmark.ref_avg
              );
            }

            return { 
              ...group, 
              currentPrice: currentUnitPrice, 
              grade: grade 
            };
          });

          // 5. 상태 업데이트
          setGroups(enrichedGroups);
          const rawCats = [...new Set(enrichedGroups.map(item => item.category))];
          const sortedCats = rawCats.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
          setCategories(["전체", ...sortedCats]);
        }
      } catch (error) {
        console.error("데이터 로딩 중 에러 발생:", error);
      } finally {
        setLoading(false);
      }
    } 

    fetchData();
  }, []);

  // ... (필터링 로직 및 렌더링 부분은 이전과 동일)
  // 등급별 스타일 적용 부분만 확인
  const getGradeStyle = (grade) => {
    switch(grade) {
      case '역대급': return 'bg-purple-600 text-white font-bold';
      case '대박':   return 'bg-red-500 text-white font-bold';
      case '중박':   return 'bg-orange-400 text-white';
      case '평범':   return 'bg-gray-400 text-white';
      case '구매금지': return 'bg-black text-white font-bold'; // 🖤 구매금지 추가
      default:      return 'bg-gray-200 text-gray-400'; // 분석중
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
        {/* ✨ 메인페이지와 크기를 맞춘 상단바 */}
{/* ✨ 메인페이지급 볼륨 + 주인공 교체 상단바 */}
{/* ✨ 메인페이지급 볼륨 + [핫딜온도계 | 싸게사게] 정렬 상단바 */}
{/* ✨ 핫딜온도계가 주인공! [핫딜온도계 이미지 | 싸게사게 | 정보모음] 순서 상단바 */}
        <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            
            {/* 1. 핫딜온도계 (현재 페이지의 주인공이므로 제일 앞으로!) */}
            <a href="/hotdeal-thermometer" className="flex items-center ml-1">
              <img 
                src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo2.png" 
                alt="핫딜온도계" 
                className="h-11 w-auto object-contain" 
              />
            </a>

            {/* 구분선 */}
            <div className="w-px h-5 bg-gray-200 mx-2"></div> 

            {/* 2. 메뉴들: 싸게사게, 쿠팡핫딜(추가), 정보모음 */}
            <nav className="flex items-center gap-3 md:gap-4">
              <a href="/" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                싸게사게
              </a>
              <a href="/coupang" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                쿠팡핫딜
              </a>
              <a href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                정보모음
              </a>
            </nav>
          </div>

          {/* 3. 우측 상단 버튼 (뒤로가기) */}
          <div className="flex gap-2">
            <button 
              onClick={() => window.history.back()} 
              className="text-gray-500 text-xs font-bold bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              뒤로가기
            </button>
          </div>
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
                              {/* ✅ 5단계 스타일이 적용된 등급 뱃지 */}
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${getGradeStyle(item.grade)}`}>
                                {item.grade || '분석중'} ●
                              </span>
                              <p className="text-[10px] text-gray-400 font-bold">클릭해서 추이 보기</p>
                            </div>
                          </div>
                          {/* 화살표 아이콘 */}
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