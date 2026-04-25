'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';

export default function DealDetailPage({ params: promiseParams }) {
  const params = use(promiseParams);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/hotdeals');
    }
  };

  useEffect(() => {
    async function fetchDeal() {
      const { data, error } = await supabase
        .from('hotdeals')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error:', error);
      } else {
        setDeal(data);
      }
      setLoading(false);
    }

    fetchDeal();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <span className="text-4xl">🔍</span>
        <p className="text-[15px] font-semibold">게시물을 찾을 수 없습니다.</p>
        <Link href="/hotdeals" className="text-[#0ABAB5] underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const cleanedRawContent = (deal.content || '')
    // Remove common trailing crawler artifacts such as a standalone "<" or "\"<".
    .replace(/^\s*["'`]*\s*<\s*$/gm, '')
    .replace(/^\s*["'`]+\s*$/gm, '');

  const sanitizedContent = DOMPurify.sanitize(cleanedRawContent, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'strong',
      'i',
      'em',
      'u',
      'a',
      'img',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'h4',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'video',
      'source',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'style',
      'class',
      'target',
      'rel',
      'controls',
      'autoplay',
      'loop',
      'muted',
      'referrerpolicy',
    ],
    ALLOW_DATA_ATTR: false,
  });

  const sanitizedContentNormalized = sanitizedContent
    .replace(/(?:&quot;|&#34;)\s*&lt;\s*$/i, '')
    .replace(/^\s*(?:&quot;|&#34;)\s*&lt;\s*$/gim, '');

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const coupangSearchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(deal.title || '')}`;
  const coupangPartnerLink = `/api/coupang?url=${encodeURIComponent(coupangSearchUrl)}`;

  return (
    <div className="max-w-4xl mx-auto bg-[#FAF6F0] min-h-screen">
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={handleBack} className="text-[#64748B] hover:text-[#0ABAB5]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[16px] font-bold text-[#1E293B]">핫딜 상세</h1>
      </header>

      <main className="p-4 flex flex-col">
        <h1 className="text-[20px] font-bold mb-1">{deal.title}</h1>
        {deal.crawled_at && (
          <p className="text-[12px] text-[#94A3B8] mb-3">등록 {formatDate(deal.crawled_at)}</p>
        )}

        {deal.image && (
          <img
            src={deal.image}
            alt={deal.title}
            className="w-full rounded-xl mb-4"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-[16px] font-bold text-[#FF6B6B] mb-2">{deal.price}</p>
          <p className="text-[13px] text-[#64748B]">{deal.shop}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] mb-10 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#1E293B] mb-4 pb-2 border-b border-[#F1F5F9]">상세 내용</h3>
          <div
            className="prose prose-sm max-w-none text-[#334155] leading-relaxed break-words [&_*]:!text-left prose-p:my-1 prose-br:hidden"
            dangerouslySetInnerHTML={{ __html: sanitizedContentNormalized }}
          />
        </div>

        {deal.title && (
          <a
            href={coupangPartnerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#0ABAB5] text-white text-center py-4 rounded-xl font-bold mb-3 shadow-sm"
          >
            쿠팡 최저가 구매하러가기
          </a>
        )}

        {deal.shop_url && (
          <a
            href={deal.shop_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white text-[#1E293B] border border-[#E2E8F0] text-center py-4 rounded-xl font-bold mb-3 hover:bg-[#FAF6F0] transition-colors"
          >
            구매하러 가기
          </a>
        )}

        {deal.url && (
          <>
            <a
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white text-[#1E293B] border border-[#E2E8F0] text-center py-4 rounded-xl font-bold mb-2 hover:bg-[#FAF6F0] transition-colors"
            >
              원본게시글 보기
            </a>
            <p className="mb-8 text-center text-[12px] text-[#94A3B8]">
              이 배너는 제휴 활동의 일환으로 일정액의 수수료를 제공받습니다
            </p>
          </>
        )}
      </main>
    </div>
  );
}
