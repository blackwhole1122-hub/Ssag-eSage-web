'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BlogCategoryTabs({ posts, categories }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => String(p.category_id) === activeCategory);

  function getCategoryName(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  }

  return (
    <>
      {/* 카테고리 탭 */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-sm px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 ${
              activeCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {categories.map(cat => {
            const count = posts.filter(p => p.category_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(String(cat.id))}
                className={`text-sm px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 ${
                  activeCategory === String(cat.id)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
                <span className="ml-1 text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 글 목록 */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">
            {activeCategory === 'all' ? '아직 게시된 글이 없습니다.' : '이 카테고리에 글이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredPosts.map(post => {
            const catName = getCategoryName(post.category_id);
            return (
              <article key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl flex-shrink-0">{post.emoji || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      {catName && (
                        <span className="inline-block text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full mb-1.5 font-medium">
                          {catName}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5">
                        {post.title}
                      </h2>
                      {post.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
                          {post.description}
                        </p>
                      )}
                      <time className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1">
                      →
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}