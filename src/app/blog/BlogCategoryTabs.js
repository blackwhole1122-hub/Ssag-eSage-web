'use client';

import { useState, useEffect } from 'react'; // useEffect 추가
import Link from 'next/link';

export default function BlogCategoryTabs({ posts, categories }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [mounted, setMounted] = useState(false); // 마운트 상태 추가

  // 컴포넌트가 브라우저에 나타난 후에만 실행
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => String(p.category_id) === activeCategory);

  function getCategoryName(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  }

  return (
    <>
      {/* 카테고리 탭 로직 (동일) */}
      {/* ...생략... */}

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
                      
                      {/* 🚨 수정 포인트: mounted 되었을 때만 시간 출력 */}
                      <time className="text-xs text-gray-400">
                        {mounted && new Date(post.created_at).toLocaleDateString('ko-KR', {
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