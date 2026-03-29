'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HotdealManagement() {
  const [activeTab, setActiveTab] = useState('hotdeals'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const observerRef = useRef(null);
  const router = useRouter();
  const PAGE_SIZE = 20;

  // 1. 데이터 페칭 (pageNum에 따라 추가 혹은 초기화)
  const fetchData = useCallback(async (pageNum = 0, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 🌟 유저님 의견 반영: 모든 탭에서 crawled_at 역순(최신순) 정렬
    let query = supabase.from(activeTab).select('*').order('crawled_at', { ascending: false }).range(from, to);
    
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error) {
      const newData = data || [];
      if (isInitial) {
        setItems(newData);
        setPage(0); // 페이지 초기화
      } else {
        setItems(prev => [...prev, ...newData]);
      }
      setHasMore(newData.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [activeTab, searchQuery]);

  // 탭이나 검색어가 바뀌면 처음부터 다시 불러오기
  useEffect(() => {
    fetchData(0, true);
  }, [activeTab, searchQuery, fetchData]);

  // 2. 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchData(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchData]);

  // 3. 실시간 계산 및 수정 로직 (기존과 동일)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => {
      const updated = { ...prev, [name]: value };
      const price = parseFloat(updated.price_num) || 0;
      const count = parseFloat(updated.count) || 1;
      updated.total_ml = (parseFloat(updated.ml) || 0) * count;
      updated.total_gram = (parseFloat(updated.gram) || 0) * count;
      if (updated.total_ml > 0) updated.price_per_100ml = Math.round((price / updated.total_ml) * 100 * 10) / 10;
      if (updated.total_gram > 0) updated.price_per_100g = Math.round((price / updated.total_gram) * 100 * 10) / 10;
      if (count > 0) updated.price_per_unit = Math.round((price / count) * 10) / 10;
      return updated;
    });
  };

  const handleSave = async () => {
    const { id, ...updateData } = editingItem;
    const { error } = await supabase.from(activeTab).update(updateData).eq('id', id);
    if (!error) {
      alert('저장 완료! ✅');
      setIsEditModalOpen(false);
      fetchData(0, true);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠어요?')) {
      const { error } = await supabase.from(activeTab).delete().eq('id', id);
      if (!error) setItems(items.filter(item => item.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen pb-20 p-4 font-sans text-gray-800">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-gray-800 font-bold flex items-center gap-1">← 뒤로가기</button>
        <h1 className="text-xl font-black text-gray-800">🗂️ 데이터 관리 센터</h1>
        <div className="w-20"></div>
      </header>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab('hotdeals')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'hotdeals' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>🔥 실시간 핫딜</button>
        <button onClick={() => setActiveTab('price_history')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'price_history' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>📈 가격 이력</button>
      </div>

      {/* 검색창 */}
      <div className="mb-6">
        <input type="text" placeholder="제목 검색..." className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-gray-500">정보 (수집일 기준)</th>
              <th className="p-4 text-gray-500">가격/단위</th>
              <th className="p-4 text-gray-500 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{item.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">
                    {item.source} · {new Date(item.crawled_at).toLocaleString()}
                  </p>
                </td>
                <td className="p-4">
                  {/* 🌟 가격 표시 로직 개선: price_num이 있으면 우선 사용, 없으면 원본 price 사용 */}
                  <p className="font-black text-gray-700">
                    {item.price_num ? `${item.price_num.toLocaleString()}원` : (item.price || '0원')}
                  </p>
                  <p className="text-[10px] text-blue-500 font-bold">
                    {item.count || 0}개 / {item.total_ml || item.total_gram || 0}{item.total_ml ? 'ml' : 'g'}
                  </p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-[11px]">상세수정</button>
                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold text-[11px]">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 무한 스크롤 로더 */}
        <div ref={observerRef} className="py-10 text-center border-t">
          {loadingMore && <span className="text-gray-400 text-xs animate-pulse">데이터 더 찾는 중... ⏳</span>}
          {!hasMore && items.length > 0 && <span className="text-gray-300 text-[10px]">모든 데이터를 불러왔습니다.</span>}
        </div>
      </div>

      {/* 🌟 상세 수정 모달 (태그 꼬임 해결) */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">🛠️ 항목 상세 수정</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 ml-1">상품명</label>
                <input name="title" value={editingItem.title || ''} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">가격(원)</label>
                <input name="price_num" type="number" value={editingItem.price_num || 0} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">수량(count)</label>
                <input name="count" type="number" value={editingItem.count || 0} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border rounded-xl text-sm font-bold text-blue-600" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">단위 용량(ml)</label>
                <input name="ml" type="number" value={editingItem.ml || 0} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">합계 용량(total_ml)</label>
                <input name="total_ml" type="number" value={editingItem.total_ml || 0} readOnly className="w-full p-3 bg-gray-200 border rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">단위 중량(g)</label>
                <input name="gram" type="number" value={editingItem.gram || 0} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 ml-1">합계 중량(total_g)</label>
                <input name="total_gram" type="number" value={editingItem.total_gram || 0} readOnly className="w-full p-3 bg-gray-200 border rounded-xl text-sm font-bold" />
              </div>

              {/* 자동 계산 결과 박스 */}
              <div className="col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mt-2">
                <p className="text-[10px] font-black text-blue-400 mb-2 uppercase">자동 계산 결과</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400">1개당</p>
                    <p className="text-sm font-bold text-blue-700">{(editingItem.price_per_unit || 0).toLocaleString()}원</p>
                  </div>
                  <div className="text-center border-x border-blue-100">
                    <p className="text-[9px] text-gray-400">100ml당</p>
                    <p className="text-sm font-bold text-blue-700">{(editingItem.price_per_100ml || 0).toLocaleString()}원</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400">100g당</p>
                    <p className="text-sm font-bold text-blue-700">{(editingItem.price_per_100g || 0).toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            </div> {/* grid 끝 */}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors">취소</button>
              <button onClick={handleSave} className="flex-2 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}