import { supabase } from '@/lib/supabase'

export default async function sitemap() {
  const baseUrl = 'https://www.ssagesage.com'

  // 1. 블로그 포스트 데이터 가져오기
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')

  const blogUrls = (posts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
  }))

  // 2. ✨ 핫딜(hotdeals) 데이터 가져오기
  const { data: hotdeals } = await supabase
    .from('hotdeals') // 킴님이 알려주신 테이블 이름!
    .select('id, created_at')

  const dealUrls = (hotdeals || []).map((deal) => ({
    url: `${baseUrl}/deal/${deal.id}`, // 상세 페이지 주소 규칙에 맞게 수정하세요!
    lastModified: new Date(deal.created_at),
  }))

  // 3. 전체 사이트맵 합치기
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
    },
    ...blogUrls,
    ...dealUrls, // ✨ 이제 핫딜 페이지들도 검색 엔진이 수집합니다!
  ]
}