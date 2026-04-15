'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { 
      setUser(session?.user ?? null); 
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { 
      setUser(session?.user ?? null); 
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularKeywords = ["짜파게티", "에어컨", "아이폰", "닌텐도", "맥북", "코카콜라", "다이슨", "갤럭시", "플스", "노트북", "세탁세제", "커피"];

  const categories = [
    { name: "커뮤니티 핫딜", desc: "커뮤니티 실시간 핫딜", href: "/hotdeals", icon: "🛍️", color: "bg-[#E6FAF9]" },
    { name: "쿠팡핫딜", desc: "쿠팡 로켓특가 & 초특가 모음", href: "/coupang", icon: "🛒", color: "bg-[#FFF0F0]" },
    { name: "핫딜온도계", desc: "100g당 단가 분석, 진짜 최저가 확인", href: "/hotdeal-thermometer", icon: "🌡️", color: "bg-[#FFFBEB]" },
    { name: "정보모음", desc: "알뜰 쇼핑 꿀팁 & 가이드", href: "/blog", icon: "📚", color: "bg-[#EBF2FF]" },
    { name: "유틸리티", desc: "편리한 도구 모음", href: "/utility", icon: "🛠️", color: "bg-[#F3E8FF]" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* 상단 네비 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/"><img src="/logo-ssagesage.png" alt="싸게사게" className="h-10 w-auto" /></Link>
          {/* ✨ 네비게이션 메뉴 - 가운데 정렬 */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-5">
            <Link href="/hotdeals" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">핫딜모음</Link>
            <Link href="/coupang" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">쿠팡핫딜</Link>
            <Link href="/hotdeal-thermometer" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">핫딜온도계</Link>
            <Link href="/blog" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">정보모음</Link>
            <Link href="/utility" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">유틸리티</Link>
          </nav>
          {user ? (
            <Link href="/mypage" className="text-[#0ABAB5] text-[13px] font-semibold">{user.user_metadata?.display_name || "회원"}님</Link>
          ) : (
            <Link href="/login" className="text-[13px] text-[#64748B] border px-3 py-1 rounded-full">로그인</Link>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="pt-16 pb-10 text-center px-4">
        <h1 className="text-[30px] font-bold text-[#1E293B] mb-6">
          🦀 오늘의 <span className="text-[#0ABAB5]">싸게사게</span>, 뭐가 있을까?
        </h1>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-6">
          <input 
            type="text" 
            className="w-full px-6 py-4 rounded-2xl bg-white shadow-lg border-2 border-[#E2E8F0] focus:border-[#0ABAB5] outline-none"
            placeholder="검색어를 입력해주세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-2.5 bg-[#0ABAB5] text-white p-2.5 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {popularKeywords.map(kw => (
            <button key={kw} onClick={() => router.push(`/search?q=${kw}`)} className="text-[13px] text-[#64748B] bg-white px-3 py-1 rounded-full border hover:text-[#0ABAB5]">#{kw}</button>
          ))}
        </div>
      </section>

      {/* 카테고리 메뉴 */}
      <section className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {categories.map(cat => (
          <Link key={cat.name} href={cat.href} className="bg-white p-5 rounded-2xl border hover:border-[#0ABAB5] transition-all">
            <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center text-xl mb-3`}>{cat.icon}</div>
            <p className="font-bold text-[15px]">{cat.name}</p>
            <p className="text-[12px] text-[#94A3B8]">{cat.desc}</p>
          </Link>
        ))}
      </section>

      {/* 최근 핫딜 컴포넌트 */}
      <RecentDeals />

      <footer className="py-10 text-center text-[12px] text-[#94A3B8]">
        © 2026 싸게사게 · <Link href="/privacy">개인정보처리방침</Link>
      </footer>
    </div>
  );
}

function RecentDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      const { data } = await supabase
        .from('hotdeals')
        .select('*')
        .neq('source', 'zod')
        .order('crawled_at', { ascending: false })
        .limit(6);
      if (data) setDeals(data);
      setLoading(false);
    }
    fetchDeals();
  }, []);

  if (loading || deals.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 pb-10">
      <h2 className="text-[18px] font-bold mb-4">🔥 방금 올라온 핫딜</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {deals.map(deal => (
          <Link key={deal.id} href={`/deal/${deal.id}`} className="bg-white rounded-2xl border overflow-hidden">
            <img src={deal.image || '/default-image.png'} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" alt={deal.title} />
            <div className="p-3">
              <p className="text-[13px] font-medium line-clamp-2">{deal.title}</p>
              <p className="text-[15px] font-bold text-[#FF6B6B] mt-1">{deal.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
