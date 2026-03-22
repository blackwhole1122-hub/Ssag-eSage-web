import { supabase } from '@/lib/supabase'

export default async function sitemap() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')

  const blogUrls = (posts || []).map((post) => ({
    url: `https://www.ssagesage.com/blog/${post.slug}`,
    lastModified: post.updated_at,
  }))

  return [
    {
      url: 'https://www.ssagesage.com',
      lastModified: new Date(),
    },
    {
      url: 'https://www.ssagesage.com/blog',
      lastModified: new Date(),
    },
    ...blogUrls,
  ]
}