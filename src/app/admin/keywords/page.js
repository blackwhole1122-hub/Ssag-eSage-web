'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminKeywords() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  
  // ✅ 5가지 필수 정보가 담긴 입력 폼
  const [form, setForm] = useState({
    category: '식품',
    sub_category: '', // 소분류 (음료, 유제품 등)
    group_name: '',    // 품목 이름 (삼다수, 햇반 등)
    slug: '',          // 슬러그 (samdasoo, hatbahn 등)
    keywords: ''       // 매칭 키워드 (삼다수, 광동 삼다수 등)
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    const { data } = await supabase
      .from('keyword_groups')
      .select('*')
      .order('category', { ascending: true })
      .order('sub_category', { ascending: true });
    
    if (data) setGroups(data);
    setLoading(false);
  }

  // ✅ 데이터 저장 로직
  async function handleAdd() {
    if (!form.sub_category || !form.group_name || !form.slug || !form.keywords) {
      return alert('모든 빈칸을 채워주세요!');
    }

    // 키워드는 쉼표로 구분해서 배열로 변환
    const kwArray = form.keywords.split(',').map(k => k.trim()).filter(Boolean);

    const { error } = await supabase.from('keyword_groups').insert({
      category: form.category,
      sub_category: form.sub_category,
      group_name: form.group_name,
      slug: form.slug,
      keywords: kwArray
    });

    if (error) {
      alert('등록 실패: ' + error.message);
    } else {
      alert('품목 그룹 등록 완료! 🚀');
      // 저장 후 입력창 초기화 (대분류/소분류는 유지해서 연속 입력 편하게!)
      setForm({ ...form, group_name: '', slug: '', keywords: '' });
      fetchGroups();
    }
  }

  async function handleDelete(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('keyword_groups').delete().eq('id', id);
    if (!error) fetchGroups();
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-20 font-sans">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 text-xl px-2">←</button>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">🔑 키워드 및 품목 그룹 관리</h1>
      </header>

      <main className="p-4 flex flex-col gap-6">
        {/* --- 입력 영역 --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6">
          <h2 className="text-sm font-black text-gray-700 mb-5 flex items-center gap-2">
            <span className="bg-orange-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">＋</span>
            새로운 품목 그룹 추가
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. 대분류 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 ml-1">대분류</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              >
                <option>식품</option><option>생활잡화</option><option>가전/디지털</option><option>상품권</option>
              </select>
            </div>

            {/* 2. 소분류 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 ml-1">소분류 (음료, 유제품 등)</label>
              <input type="text" value={form.sub_category} onChange={e => setForm({...form, sub_category: e.target.value})}
                placeholder="예: 생수/음료" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            {/* 3. 품목명 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 ml-1">품목명 (표시용)</label>
              <input type="text" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})}
                placeholder="예: 삼다수 2L" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            {/* 4. 슬러그 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 ml-1">슬러그 (이미지 파일명)</label>
              <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                placeholder="예: samdasoo" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            {/* 5. 키워드 (가로 한 칸 다 쓰기) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-gray-400 ml-1">매칭 키워드 (쉼표로 구분)</label>
              <textarea value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})}
                placeholder="삼다수, 광동 삼다수, 제주 삼다수" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-400 h-20 resize-none" />
            </div>
          </div>

          <button onClick={handleAdd} className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl mt-6 hover:bg-orange-600 transition-all shadow-lg active:scale-[0.98]">
            품목 그룹 저장하기
          </button>
        </div>

        {/* --- 목록 영역 --- */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">등록된 품목 ({groups.length})</h2>
          {loading ? (
            <div className="text-center py-20 text-gray-300 animate-pulse">데이터를 불러오고 있습니다...</div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">{g.category}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded">{g.sub_category}</span>
                    <span className="text-[9px] font-mono text-gray-300 ml-1">/{g.slug}</span>
                  </div>
                  <h3 className="text-sm font-black text-gray-800 mb-1">{g.group_name}</h3>
                  <p className="text-[11px] text-gray-400 truncate pr-4">
                    <span className="text-gray-300">🔑</span> {g.keywords.join(', ')}
                  </p>
                </div>
                <button onClick={() => handleDelete(g.id)} className="text-xs font-bold text-gray-300 hover:text-red-500 transition-colors px-2">삭제</button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}