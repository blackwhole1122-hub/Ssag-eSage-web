'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DealDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyUrl, setBuyUrl] = useState(null);

  const sourceLabel = {
    dogdrip: "개미집", fmkorea: "에펨코리아", arca: "아카라이브",
    clien: "클리앙", ppomppu: "뽐뿌", quasarzone: "퀘이사존",
    zod: "ZOD", ruliweb: "루리웹"
  };

  // 1. deal 데이터 가져오기
  useEffect(() => {
    async function fetchDeal() {
      const { data, error } = await supabase
        .from('hotdeals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error(error);
      else setDeal(data);
      setLoading(false);
    }
    fetchDeal();
  }, [id]);

  // 2. deal 가져온 후 쿠팡 링크 변환
  // ★ shop_url 또는 url에 "coupang" 문자열이 포함된 경우 무조건 파트너스 링크로 변환
  useEffect(() => {
    async function convertLink() {
      const shopUrl = deal?.shop_url || deal?.url;
      if (!shopUrl) {
        setBuyUrl(deal?.url || '');
        return;
      }

      // "coupang" 포함 여부로 판단 (coupang.com, link.coupang.com, cp.ee 등 모두 처리)
      if (!shopUrl.includes('coupang')) {
        setBuyUrl(shopUrl);
        return;
      }

      try {
        const res = await fetch(`/api/coupang?url=${encodeURIComponent(shopUrl)}`);
        const data = await res.json();
        setBuyUrl(data.deeplink || shopUrl);
      } catch {
        setBuyUrl(shopUrl);
      }
    }
    if (deal) convertLink();
  }, [deal]);

  if (loading) return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center text-gray-400 text-sm">
      불러오는 중... ⏳
    </div>
  );

  if (!deal) return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center text-gray-400 text-sm">
      게시글을 찾을 수 없어요 😅
    </div>
  );

  const rawUrl = deal?.shop_url || deal?.url || '';
  const isCoupang = rawUrl.includes('coupang');

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10">

      {/* 헤더: 메인 페이지로 이동 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => {
            // 브라우저 뒤로가기 대신 무조건 메인 주소로 이동
            router.push('/');
          }}
          className="text-gray-400 hover:text-gray-600 text-xl px-1"
        >
          ←
        </button>
        <h1 className="text-sm font-bold text-gray-800 truncate flex-1">{deal.title}</h1>
      </header>

      <main className="p-3 flex flex-col gap-3">

        {/* 핵심 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full
              ${deal.grade === '역대급' ? 'bg-purple-500 text-purple-100' :
                deal.grade === '대박'   ? 'bg-red-500 text-red-100' :
                deal.grade === '중박'   ? 'bg-orange-400 text-orange-100' :
                deal.grade === '평범'   ? 'bg-gray-400 text-gray-100' :
                'bg-red-500 text-red-100'}`}>
              {deal.grade || '대박'}
            </span>
            <span className="text-xs font-bold text-blue-500">
              {sourceLabel[deal.source] || deal.source}
            </span>
            {deal.shop && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {deal.shop}
              </span>
            )}
            {deal.category && (
              <span className="text-xs text-gray-400">{deal.category}</span>
            )}
          </div>

          <h2 className="text-base font-bold text-gray-800 leading-snug mb-3">
            {deal.title}
          </h2>

          <p className="text-2xl font-bold text-red-500 mb-1">
            {deal.price || '가격미정'}
          </p>
           <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {new Date(deal.crawled_at).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                const btn = document.getElementById('copy-btn');
                btn.innerText = '✓';
                setTimeout(() => btn.innerText = '🔗', 1500);
              }}
              id="copy-btn"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              🔗
            </button>
          </div>
        </div>

        {/* 이미지 + 본문 카드 */}
        {(deal.image || deal.content) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {deal.image && (
              <img
                src={deal.image}
                alt={deal.title}
                referrerPolicy="no-referrer"
                className="w-full object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            {deal.content && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">📋 게시글 내용</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {deal.content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 가격 추이 그래프 자리 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📈 가격 추이</h3>
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">가격 데이터가 쌓이면 그래프가 표시돼요</p>
          </div>
        </div>

        {/* 구매하기 버튼 */}
        <a
          href={buyUrl || deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-600 text-white text-center font-bold py-4 rounded-2xl shadow-sm hover:bg-blue-700 transition-colors"
        >
          구매하기 →
        </a>

        {/* 쿠팡 파트너스 안내 문구 — 쿠팡 링크일 때만 표시 */}
        {isCoupang && (
          <p className="text-center text-xs text-gray-400 -mt-1">
            이 링크는 쿠팡 파트너스 링크로, 수수료를 받을 수 있습니다.
          </p>
        )}

        {/* 원본 게시글 보기 */}
        <a
          href={deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white text-gray-500 text-center text-sm py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          원본 게시글 보기
        </a>

      </main>
    </div>
  );
}
