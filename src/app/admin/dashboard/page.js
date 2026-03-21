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
    checkAuth();
    fetchStats();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin');
    }
  }

  async function fetchStats() {
    setLoading(true);
    try {
      // 전체 핫딜 수
      const { count: totalDeals } = await supabase
        .from('hotdeals')
        .select('*', { count: 'exact', head: true });

      // 오늘 수집된 핫딜 수
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayDeals } = await supabase
        .from('hotdeals')
        .select('*', { count: 'exact', head: true })
        .gte('crawled_at', today.toISOString());

      // 가격 이력 수
      const { count: totalPriceHistory } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true });

      // 사이트별 수집 현황
      const { data: sourceData } = await supabase
        .from('hotdeals')
        .select('source')
        .order('source');

      const sourceCounts = {};
      (sourceData || []).forEach(row => {
        sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1;
      });
      const sourceStats = Object.entries(sourceCounts).map(([source, count]) => ({
        source, count
      })).sort((a, b) => b.count - a.count);

      setStats({ totalDeals, todayDeals, totalPriceHistory, sourceStats });
    } catch (e) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Dev Error]', e);
  }
}
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin');
  }

  const sourceLabel = {
    dogdrip: "개미집", fmkorea: "에펨코리아", arca: "아카라이브",
    clien: "클리앙", ppomppu: "뽐뿌", quasarzone: "퀘이사존",
    zod: "ZOD", ruliweb: "루리웹"
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-100 min-h-screen pb-10">

      {/* 헤더 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">싸게사게 💸</h1>
          <div className="w-px h-5 bg-gray-200"></div>
          <span className="text-sm text-gray-500">어드민</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
            사이트 보기
          </a>
          <button
            onClick={handleLogout}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">전체 핫딜</p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : (stats.totalDeals || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">건</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">오늘 수집</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? '...' : (stats.todayDeals || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">건</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">가격 이력</p>
            <p className="text-2xl font-bold text-orange-500">
              {loading ? '...' : (stats.totalPriceHistory || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">건</p>
          </div>
        </div>

        {/* 사이트별 수집 현황 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-4">📊 사이트별 수집 현황</h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.sourceStats.map(({ source, count }) => {
                const maxCount = stats.sourceStats[0]?.count || 1;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">
                      {sourceLabel[source] || source}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right">
                      {count.toLocaleString()}건
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/admin/hotdeals"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">🗂️</div>
            <p className="text-sm font-bold text-gray-800">핫딜 관리</p>
            <p className="text-xs text-gray-400 mt-1">데이터 조회 및 삭제</p>
          </a>
          
          <a
             href="/admin/thermometer"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">🌡️</div>
            <p className="text-sm font-bold text-gray-800">온도계 관리</p>
            <p className="text-xs text-gray-400 mt-1">키워드 추가/삭제</p>
          </a>
          
          <a
            href="/admin/blog"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm font-bold text-gray-800">블로그 관리</p>
            <p className="text-xs text-gray-400 mt-1">정보성 글 작성 · 애드센스</p>
          </a>

          <a
            href="/admin/members"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all opacity-50"
          >
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm font-bold text-gray-800">회원 관리</p>
            <p className="text-xs text-gray-400 mt-1">준비 중</p>
          </a>
          
          <a
            href="/admin/board"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all opacity-50"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm font-bold text-gray-800">게시판 관리</p>
            <p className="text-xs text-gray-400 mt-1">준비 중</p>
          </a>
        </div>

      </main>
    </div>
  );
}