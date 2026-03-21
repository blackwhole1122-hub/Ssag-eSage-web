// ============================================
// 📁 파일 위치: app/blog/page.js
// ============================================
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogCategoryTabs from './BlogCategoryTabs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const metadata = {
  title: '블로그 | 싸게사게',
  description: '알뜰 쇼핑 꿀팁, 핫딜 활용법, 가격 비교 가이드 등 유용한 정보를 제공합니다.',
  openGraph: {
    title: '블로그 | 싸게사게',
    description: '알뜰 쇼핑 꿀팁, 핫딜 활용법, 가격 비교 가이드 등 유용한 정보를 제공합니다.',
  },
};

export const revalidate = 60;

async function getData() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date().toISOString();

  const [postsRes, catsRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, slug, title, description, emoji, created_at, category_id, scheduled_at')
      .eq('published', true)
      // 예약 시간이 없거나(즉시 게시), 예약 시간이 지난 글만
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  return {
    posts: postsRes.data || [],
    categories: catsRes.data || [],
  };
}

export default async function BlogListPage() {
  const { posts, categories } = await getData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">블로그</h1>
        <p className="text-sm text-gray-500">
          알뜰 쇼핑 꿀팁부터 핫딜 활용법까지, 유용한 정보를 모았습니다.
        </p>
      </header>

      <BlogCategoryTabs posts={posts} categories={categories} />
    </div>
  );
}