'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeals: 0,
    todayDeals: 0,
    totalPriceHistory: 0,
    sourceStats: [],
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        fetchStats();
        setLoading(false);
      } else if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function fetchStats() {
    try {
      const { count: totalDeals } = await supabase.from('hotdeals').select('*', { count: 'exact', head: true });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: todayDeals } = await supabase.from('hotdeals').select('*', { count: 'exact', head: true }).gte('crawled_at', today.toISOString());
      const { count: totalPriceHistory } = await supabase.from('price_history').select('*', { count: 'exact', head: true });
      const { data: sourceData } = await supabase.from('hotdeals').select('source');

      const sourceCounts = {};
      (sourceData || []).forEach(row => { sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1; });
      const sourceStats = Object.entries(sourceCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

      setStats({ totalDeals, todayDeals, totalPriceHistory, sourceStats });
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin'); 
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-400 text-sm animate-pulse">관리 권한 확인 중... 🛡️</p></div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-600">싸게사게 Admin 🦀</h1>
        <button onClick={handleLogout} className="text-xs bg-red-50 text-red-500 px-4 py-2 rounded-full hover:bg-red-100 font-bold transition-colors">로그아웃</button>
      </header>

      <main className="p-4 flex flex-col gap-6">
        {/* 통계 요약 영역 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-400 mb-2 font-bold">전체 핫딜</p>
            <p className="text-3xl font-black text-gray-800">{(stats.totalDeals || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-400 mb-2 font-bold">오늘 수집</p>
            <p className="text-3xl font-black text-blue-600">{(stats.todayDeals || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-400 mb-2 font-bold">가격 이력</p>
            <p className="text-3xl font-black text-orange-500">{(stats.totalPriceHistory || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* 메뉴 영역 (4개 카드로 확장) */}
        <div className="grid grid-cols-2 gap-4">
          {/* ✅ 키워드 관리 카드 추가 */}
          <a href="/admin/keywords" className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all group bg-orange-50/20">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔑</div>
            <p className="text-base font-bold text-gray-800">키워드 & 그룹 관리</p>
            <p className="text-xs text-gray-400 mt-1">품목 분류 및 매칭 키워드 설정</p>
          </a>

          <a href="/admin/thermometer" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🌡️</div>
            <p className="text-base font-bold text-gray-800">온도계 이미지 관리</p>
            <p className="text-xs text-gray-400 mt-1">그룹별 이미지 업로드 (Storage)</p>
          </a>
          
          <a href="/admin/blog" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
            <p className="text-base font-bold text-gray-800">블로그 관리</p>
            <p className="text-xs text-gray-400 mt-1">정보성 글 및 카테고리 설정</p>
          </a>

          <a href="/admin/hotdeals" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🗂️</div>
            <p className="text-base font-bold text-gray-800">핫딜 데이터 관리</p>
            <p className="text-xs text-gray-400 mt-1">전체 데이터 조회 및 매칭 확인</p>
          </a>
        </div>
      </main>
    </div>
  );
}