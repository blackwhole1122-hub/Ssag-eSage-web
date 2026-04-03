import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogCategoryTabs from './BlogCategoryTabs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const metadata = {
  title: '정보모음 | 싸게사게',
  description: '알뜰 쇼핑 꿀팁, 핫딜 활용법, 가격 비교 가이드 등 유용한 정보를 제공합니다.',
};

export const revalidate = 60;

async function getData() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [postsRes, catsRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, slug, title, description, emoji, created_at, category_id, scheduled_at')
      .eq('published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  const now = new Date();
  const posts = (postsRes.data || []).filter(post => {
    if (!post.scheduled_at) return true;
    return new Date(post.scheduled_at) <= now;
  });

  return { posts, categories: catsRes.data || [] };
}

export default async function BlogListPage() {
  const { posts, categories } = await getData();

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
      
      {/* 🌟 핫딜 온도계 스타일을 계승한 상단 네비게이션 바 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          {/* 1. 현재 페이지 제목 (주인공) */}
          <Link href="/blog" className="text-lg font-black text-gray-900 tracking-tighter">
            싸게사게 정보모음
          </Link>

          {/* 세로 구분선 */}
          <div className="w-px h-4 bg-gray-200 mx-4"></div> 

          {/* 2. 네비게이션 메뉴 (싸게사게 -> 쿠팡핫딜 -> 핫딜 온도계) */}
          <nav className="flex items-center gap-4 md:gap-5">
            <Link 
              href="/" 
              className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors"
            >
              싸게사게
            </Link>
            <Link 
              href="/coupang" 
              className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors"
            >
              쿠팡핫딜
            </Link>
            <Link 
              href="/hotdeal-thermometer" 
              className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors"
            >
              핫딜 온도계
            </Link>
          </nav>
        </div>

        {/* 우측 보조 버튼 (선택 사항) */}
        <div className="hidden md:block">
          <Link 
            href="/" 
            className="text-[10px] font-black px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all"
          >
            🏠 HOME
          </Link>
        </div>
      </header>

      {/* 본문 콘텐츠 영역 */}
      <main className="p-4 md:py-12">
        <header className="mb-10 mt-4 text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900 mb-3">전체 포스팅</h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto md:mx-0 leading-relaxed">
            스마트한 일상을 위한 유용한 정보를 한눈에 확인하세요. 💡
          </p>
        </header>

        {/* 카테고리 탭 및 리스트 */}
        <BlogCategoryTabs posts={posts} categories={categories} />
      </main>
    </div>
  );
}