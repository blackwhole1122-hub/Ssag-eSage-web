import { createClient } from '@supabase/supabase-js';
import BlogCategoryTabs from './BlogCategoryTabs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ 1. 구글 SEO를 위한 메타데이터 설정 (서버 전용)
export const metadata = {
  title: '블로그 | 싸게사게',
  description: '알뜰 쇼핑 꿀팁, 핫딜 활용법, 가격 비교 가이드 등 유용한 정보를 제공합니다.',
};

// ✅ 2. 60초마다 캐시를 갱신하는 설정 (ISR)
export const revalidate = 60;

// ✅ 3. Supabase에서 데이터를 가져오는 함수 (서버 전용)
async function getData() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [postsRes, catsRes] = await Promise.all([
    // [blog_posts] 시트에서 발행된 글만 최신순으로 가져오기
    supabase
      .from('blog_posts')
      .select('id, slug, title, description, emoji, created_at, category_id, scheduled_at')
      .eq('published', true)
      .order('created_at', { ascending: false }),
    // [blog_categories] 시트에서 카테고리 정보 가져오기
    supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  // 예약 발행 로직: 현재 시간보다 예약 시간이 과거인 글만 필터링
  const now = new Date();
  const posts = (postsRes.data || []).filter(post => {
    if (!post.scheduled_at) return true;
    return new Date(post.scheduled_at) <= now;
  });

  return { posts, categories: catsRes.data || [] };
}

// ✅ 4. 메인 블로그 페이지 컴포넌트
export default async function BlogListPage() {
  const { posts, categories } = await getData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      {/* 헤더 영역 */}
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-black text-gray-900 mb-3">싸게사게 블로그</h1>
        <p className="text-base text-gray-500 max-w-xl mx-auto md:mx-0">
          알뜰 쇼핑 꿀팁부터 핫딜 활용법, 가격 비교 가이드까지!<br />
          스마트한 쇼핑을 위한 유용한 정보를 모두 모았습니다. 💡
        </p>
      </header>

      {/* 🌟 5. 실제 카테고리 탭과 글 목록이 나오는 컴포넌트 (데이터 넘겨주기) */}
      <BlogCategoryTabs posts={posts} categories={categories} />
    </div>
  );
}