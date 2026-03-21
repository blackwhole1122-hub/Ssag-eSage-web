// ============================================
// 📁 파일 위치: app/blog/[slug]/page.js
// ============================================
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function markdownToHtml(md) {
  let html = md;
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="md-codeblock"><code class="language-${lang}">${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/^> (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');
  html = html.split('\n\n').map(block => {
    const t = block.trim();
    if (!t) return '';
    if (/^<(h[1-6]|pre|ul|blockquote|hr|img)/.test(t)) return t;
    return `<p class="md-p">${t.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');
  return html;
}

async function getPost(slug) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(name, slug)')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!data) return null;
  if (data.scheduled_at && new Date(data.scheduled_at) > new Date()) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '글을 찾을 수 없습니다' };
  return {
    title: `${post.title} | 싸게사게 블로그`,
    description: post.description || (post.content ? post.content.slice(0, 155) : ''),
    openGraph: {
      title: post.title,
      description: post.description || (post.content ? post.content.slice(0, 155) : ''),
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
  };
}

export const revalidate = 60;

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const htmlContent = markdownToHtml(post.content || '');
  const categoryName = post.blog_categories?.name || null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: '싸게사게' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-8">
          ← 블로그 목록
        </Link>

        <header className="mb-10">
          <div className="text-5xl mb-4">{post.emoji || '📝'}</div>
          {categoryName && (
            <span className="inline-block text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full mb-3 font-medium">
              {categoryName}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-base text-gray-500 leading-relaxed mb-4">{post.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <time>
              {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <span>·</span>
            <span>약 {Math.ceil((post.content?.length || 0) / 500)}분 읽기</span>
          </div>
        </header>

        <hr className="border-gray-200 mb-10" />

        <div className="
          [&_.md-h1]:text-2xl [&_.md-h1]:font-bold [&_.md-h1]:mt-10 [&_.md-h1]:mb-4 [&_.md-h1]:text-gray-900
          [&_.md-h2]:text-xl [&_.md-h2]:font-bold [&_.md-h2]:mt-8 [&_.md-h2]:mb-3 [&_.md-h2]:text-gray-900
          [&_.md-h3]:text-lg [&_.md-h3]:font-semibold [&_.md-h3]:mt-6 [&_.md-h3]:mb-2 [&_.md-h3]:text-gray-800
          [&_.md-p]:text-gray-700 [&_.md-p]:leading-8 [&_.md-p]:mb-5 [&_.md-p]:text-[15px]
          [&_.md-link]:text-blue-600 [&_.md-link]:underline [&_.md-link]:underline-offset-2
          [&_.md-img]:rounded-xl [&_.md-img]:my-6 [&_.md-img]:max-w-full [&_.md-img]:shadow-sm
          [&_.md-quote]:border-l-4 [&_.md-quote]:border-blue-300 [&_.md-quote]:pl-5 [&_.md-quote]:text-gray-600 [&_.md-quote]:italic [&_.md-quote]:my-6 [&_.md-quote]:bg-blue-50 [&_.md-quote]:py-3 [&_.md-quote]:pr-4 [&_.md-quote]:rounded-r-lg
          [&_.md-ul]:list-disc [&_.md-ul]:pl-6 [&_.md-ul]:my-5
          [&_.md-li]:text-gray-700 [&_.md-li]:mb-2 [&_.md-li]:leading-7
          [&_.md-codeblock]:bg-gray-900 [&_.md-codeblock]:text-green-300 [&_.md-codeblock]:p-5 [&_.md-codeblock]:rounded-xl [&_.md-codeblock]:overflow-x-auto [&_.md-codeblock]:text-sm [&_.md-codeblock]:my-6
          [&_.md-inline-code]:bg-gray-100 [&_.md-inline-code]:text-pink-600 [&_.md-inline-code]:px-1.5 [&_.md-inline-code]:py-0.5 [&_.md-inline-code]:rounded [&_.md-inline-code]:text-sm [&_.md-inline-code]:font-mono
          [&_.md-hr]:border-gray-200 [&_.md-hr]:my-8"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
            ← 다른 글 더 보기
          </Link>
        </footer>
      </article>
    </>
  );
}