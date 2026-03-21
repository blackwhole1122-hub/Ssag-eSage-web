// ============================================
// 📁 파일 위치: app/admin/blog/page.js
// ============================================
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

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [postsRes, catsRes] = await Promise.all([
      supabase.from('blog_posts')
        .select('id, slug, title, emoji, published, created_at, updated_at, category_id, scheduled_at')
        .order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('sort_order', { ascending: true }),
    ]);
    if (postsRes.data) setPosts(postsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }

  function getCategoryName(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : '미분류';
  }

  function getStatusInfo(post) {
    if (!post.published) return { label: '비공개', color: 'bg-gray-100 text-gray-500' };
    if (post.scheduled_at && new Date(post.scheduled_at) > new Date()) {
      return { label: '⏰ 예약', color: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: '게시됨', color: 'bg-green-100 text-green-700' };
  }

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

  async function deleteCategory(cat) {
    const postsInCat = posts.filter(p => p.category_id === cat.id);
    if (postsInCat.length > 0) { alert(`이 카테고리에 글이 ${postsInCat.length}개 있어서 삭제할 수 없어요!`); return; }
    if (!confirm(`"${cat.name}" 카테고리를 삭제할까요?`)) return;
    const { error } = await supabase.from('blog_categories').delete().eq('id', cat.id);
    if (!error) setCategories(prev => prev.filter(c => c.id !== cat.id));
  }

  async function moveCategoryOrder(cat, direction) {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const target = categories[swapIdx];
    await Promise.all([
      supabase.from('blog_categories').update({ sort_order: target.sort_order }).eq('id', cat.id),
      supabase.from('blog_categories').update({ sort_order: cat.sort_order }).eq('id', target.id),
    ]);
    const newCats = [...categories];
    const tempOrder = newCats[idx].sort_order;
    newCats[idx].sort_order = newCats[swapIdx].sort_order;
    newCats[swapIdx].sort_order = tempOrder;
    newCats.sort((a, b) => a.sort_order - b.sort_order);
    setCategories(newCats);
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-100 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/dashboard" className="text-lg font-bold text-gray-800">싸게사게 💸</a>
          <div className="w-px h-5 bg-gray-200"></div>
          <span className="text-sm text-gray-500">블로그 관리</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategoryManager(!showCategoryManager)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${showCategoryManager ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            🏷️ 카테고리
          </button>
          <button onClick={() => router.push('/admin/blog/editor')}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors font-medium">
            + 새 글 작성
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">전체 글</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : posts.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">게시됨</p>
            <p className="text-2xl font-bold text-green-600">{loading ? '...' : posts.filter(p => p.published && (!p.scheduled_at || new Date(p.scheduled_at) <= new Date())).length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">예약됨</p>
            <p className="text-2xl font-bold text-yellow-500">{loading ? '...' : posts.filter(p => p.published && p.scheduled_at && new Date(p.scheduled_at) > new Date()).length}</p>
          </div>
        </div>

        {showCategoryManager && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-4">🏷️ 카테고리 관리</h2>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="카테고리 이름"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} placeholder="슬러그"
                className="w-32 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addCategory} disabled={catSaving}
                className="text-xs bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors font-medium flex-shrink-0">
                {catSaving ? '...' : '추가'}
              </button>
            </div>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">카테고리가 없습니다</p>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <span className="text-xs text-gray-400">/{cat.slug}</span>
                      <span className="text-xs text-gray-300">· {posts.filter(p => p.category_id === cat.id).length}개 글</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveCategoryOrder(cat, 'up')} disabled={idx === 0} className="text-xs px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                      <button onClick={() => moveCategoryOrder(cat, 'down')} disabled={idx === categories.length - 1} className="text-xs px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                      <button onClick={() => deleteCategory(cat)} className="text-xs px-2 py-1 text-red-400 hover:text-red-600 ml-1">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <div className="text-center py-20 text-gray-400 text-sm">불러오는 중...</div>}

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-sm text-gray-500 mb-4">아직 작성된 글이 없어요</p>
            <button onClick={() => router.push('/admin/blog/editor')} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">첫 글 작성하기</button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="flex flex-col gap-3">
            {posts.map(post => {
              const status = getStatusInfo(post);
              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{post.emoji || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-orange-500 font-medium">{getCategoryName(post.category_id)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">/{post.slug}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        {post.scheduled_at && new Date(post.scheduled_at) > new Date() && (
                          <>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-yellow-600">
                              ⏰ {new Date(post.scheduled_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => togglePublish(post)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${status.color}`}>
                      {status.label}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)} className="flex-1 text-xs text-center py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors">수정</button>
                    <button onClick={() => deletePost(post)} className="flex-1 text-xs text-center py-2 bg-red-50 text-red-500 rounded-xl font-medium hover:bg-red-100 transition-colors">삭제</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}