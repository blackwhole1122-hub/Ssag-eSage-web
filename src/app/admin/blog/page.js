'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => { 
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/admin'); return; }
      fetchData();
    };
    checkAuth();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    const [postsRes, catsRes] = await Promise.all([
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('sort_order', { ascending: true }),
    ]);
    if (postsRes.data) setPosts(postsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }

  // ✅ 카테고리 추가 로직
  async function addCategory() {
    if (!newCatName.trim()) return alert('카테고리 이름을 입력하세요');
    const slug = newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/\s+/g, '-');
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) : 0;
    setCatSaving(true);
    const { data, error } = await supabase.from('blog_categories')
      .insert({ name: newCatName.trim(), slug, sort_order: maxOrder + 1 }).select().single();
    setCatSaving(false);
    if (error) { alert(error.code === '23505' ? '이미 같은 슬러그의 카테고리가 있어요!' : `추가 실패: ${error.message}`); return; }
    if (data) { setCategories(prev => [...prev, data]); setNewCatName(''); setNewCatSlug(''); }
  }

  // ✅ 게시 상태 토글 (예약 포함)
  async function togglePublish(post) {
    const { error } = await supabase.from('blog_posts')
      .update({ published: !post.published, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    if (!error) setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, published: !p.published } : p)));
  }

  async function deletePost(post) {
    if (!confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id);
    if (!error) setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  const getStatusInfo = (post) => {
    if (!post.published) return { label: '비공개', color: 'bg-gray-100 text-gray-500' };
    if (post.scheduled_at && new Date(post.scheduled_at) > new Date()) {
      return { label: '⏰ 예약됨', color: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: '게시됨', color: 'bg-green-100 text-green-700' };
  };

  if (loading) return <div className="p-20 text-center text-gray-400">데이터를 불러오는 중... ⏳</div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-gray-800 text-xl px-1">←</button>
          <h1 className="text-lg font-bold text-gray-800">📝 블로그 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ 카테고리 설정 버튼 활성화 */}
          <button onClick={() => setShowCategoryManager(!showCategoryManager)}
            className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${showCategoryManager ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            🏷️ 카테고리 설정
          </button>
          <button onClick={() => router.push('/admin/blog/editor')}
            className="text-xs bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors font-bold shadow-sm">
            + 새 글 작성
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-6">
        {/* ✅ 카테고리 관리창 (활성화 시 보임) */}
        {showCategoryManager && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-sm font-bold text-gray-700 mb-4">🏷️ 카테고리 추가/관리</h2>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="이름 (예: 리뷰)"
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} placeholder="슬러그 (review)"
                className="w-32 px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={addCategory} disabled={catSaving}
                className="text-xs bg-orange-500 text-white px-5 py-2.5 rounded-2xl hover:bg-orange-600 font-bold flex-shrink-0">
                {catSaving ? '...' : '추가'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full">
                  <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                  <button onClick={async () => {
                    if(confirm('삭제할까요?')) await supabase.from('blog_categories').delete().eq('id', cat.id);
                    fetchData();
                  }} className="text-red-400 text-xs hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 포스트 리스트 */}
        <div className="flex flex-col gap-4">
          {posts.map(post => {
            const status = getStatusInfo(post);
            return (
              <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition-all flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-3xl bg-gray-50 w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0">{post.emoji || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{post.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg">
                        {categories.find(c => c.id === post.category_id)?.name || '미분류'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">/{post.slug}</span>
                    </div>
                  </div>
                  {/* ✅ 예약/게시 토글 버튼 활성화 */}
                  <button onClick={() => togglePublish(post)} className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all shadow-sm ${status.color}`}>
                    {status.label}
                  </button>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)} 
                    className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">
                    수정하기
                  </button>
                  <button onClick={() => deletePost(post)}
                    className="px-5 py-2.5 bg-red-50 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all">
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}