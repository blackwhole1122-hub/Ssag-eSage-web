'use client' // 🌟 1. 이 컴포넌트는 유저가 클릭하면 반응하는 '클라이언트' 컴포넌트예요.

import { useState } from 'react';
import Link from 'next/link';

export default function BlogCategoryTabs({ posts, categories }) {
  // 🌟 2. 현재 선택된 카테고리 상태 (null이면 '전체')
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // 🌟 3. 선택된 카테고리에 맞는 글만 필터링
  const filteredPosts = activeCategoryId
    ? posts.filter(post => post.category_id === activeCategoryId)
    : posts;

  return (
    <div>
      {/* 🔹 카테고리 탭 (가로 스크롤 가능) */}
      <nav className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-100">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
            activeCategoryId === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeCategoryId === cat.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* 🔹 블로그 글 목록 그리드 */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 animate-fade-in">
          {filteredPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* 이모지 배지 */}
              <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-2xl text-4xl mb-5 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                {post.emoji || '📝'}
              </div>
              
              {/* 제목 & 설명 */}
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6 flex-1">
                {post.description}
              </p>
              
              {/* 하단 날짜 정보 */}
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider pt-4 border-t border-gray-100">
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // 🔹 글이 하나도 없을 때
        <div className="py-24 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="text-6xl mb-4">😅</div>
          <p className="font-bold text-gray-600">이 카테고리에는 아직 글이 없어요.</p>
          <p className="text-sm mt-1">에디터가 열심히 글을 쓰고 있으니 조금만 기다려주세요!</p>
        </div>
      )}
    </div>
  );
}