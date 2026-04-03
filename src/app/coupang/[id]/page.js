'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CoupangDealDetail() {
  const { id } = useParams(); // URL에서 product_id를 가져옴
  const router = useRouter();
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // 🌟 쿠팡_hotdeals 테이블에서 데이터 가져오기
  useEffect(() => {
    async function fetchDeal() {
      // id가 coupang_hotdeals의 'product_id'와 일치하는 것을 찾음
      const { data, error } = await supabase
        .from('coupang_hotdeals')
        .select('*')
        .eq('product_id', id)
        .single();
      
      if (!error && data) {
        setDeal(data);

        // ✨ 종료 판정: 업데이트된 지 3일(72시간) 이상 지났으면 만료 경고
        if (data.updated_at) {
          const updatedAt = new Date(data.updated_at);
          const hoursElapsed = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
          if (hoursElapsed > 72) setIsExpired(true);
        }
      } else {
        console.error("쿠팡 핫딜을 불러올 수 없습니다:", error);
      }
      setLoading(false);
    }
    fetchDeal();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">핫딜 정보 불러오는 중... 🚀</div>;
  if (!deal) return <div className="p-20 text-center text-gray-500">상품 정보가 없습니다. (종료된 딜일 수 있습니다)</div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      
      {/* 🟢 헤더 */}
      <header className="bg-white border-b p-3 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-xl px-1">←</button>
        <a href="/coupang" className="text-xl font-bold text-blue-800 truncate flex-1 hover:text-blue-600 transition-colors">
           <span className="text-sm text-gray-400 font-medium ml-1">쿠팡핫딜</span>
        </a>
      </header>

      <main className="p-3 flex flex-col gap-3">
        
        {/* ✨ 종료 가능성 배너 */}
        {isExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">이 핫딜은 종료되었을 수 있습니다</p>
              <p className="text-xs text-yellow-600 mt-0.5">수집된 지 3일 이상 지났습니다. 쇼핑몰에서 가격을 꼭 확인해 주세요.</p>
            </div>
          </div>
        )}

        {/* 📦 메인 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white shadow-sm">🚀 로켓특가</span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">{deal.category}</span>
            {/* 할인율 배지 */}
            {deal.discount_rate >= 50 && (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-red-500 text-white shadow-sm">
                {deal.discount_rate}% OFF
              </span>
            )}
          </div>
          
          <h2 className="text-lg font-bold text-gray-800 mb-4 leading-snug">{deal.name}</h2>
          
          <div className="flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-100">
            {deal.original_price > 0 && (
              // 👇 flex로 묶어서 원가와 할인율이 나란히 오게 만듦!
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-400 line-through">
                  정가: {deal.original_price.toLocaleString()}원
                </p>
                {deal.discount_rate > 0 && (
                  <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                    ↓ {deal.discount_rate}%
                  </span>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-red-500">{deal.discount_price.toLocaleString()}<span className="text-xl">원</span></p>
            </div>
            
            {/* 쿠팡 단위 가격 (예: 100ml당 1500원) */}
            {deal.unit_price && (
              <p className="text-xs font-medium text-blue-500 mt-2">
                ℹ️ {deal.unit_price}
              </p>
            )}
          </div>
        </div>

        {/* 📸 썸네일 이미지 영역 (파이썬 봇이 가져온 image_url) */}
        {deal.image_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 flex justify-center">
            <img 
              src={deal.image_url} 
              alt={deal.name} 
              referrerPolicy="no-referrer" 
              className="max-w-full h-auto max-h-96 object-contain rounded-xl" 
            />
          </div>
        )}

        {/* 🛒 하단 고정 구매 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:static md:bg-transparent md:border-t-0 md:p-0 mt-4 flex flex-col gap-2 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none">
          
          <a 
            href={`/api/out?url=${encodeURIComponent(deal.partners_link)}`} // 아웃링크 API 사용
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-2xl mx-auto bg-blue-600 hover:bg-blue-700 text-white text-center font-black text-lg py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🛒</span> 쿠팡에서 할인가로 구매하기
          </a>

          {/* ✨ 안내 문구 (폰트 확대, 색상 진하게, 줄바꿈 적용) */}
          <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed break-keep">
            쿠팡 수익용 링크가 아니고 정말 저렴해서 공유하는 것이에요.<br />
            가격변동이 있을 수 있으니 현재 페이지 가격과 쿠팡의 실제 가격을 비교해주세요!
          </p>
        </div>
      </main>
    </div>
  );
}