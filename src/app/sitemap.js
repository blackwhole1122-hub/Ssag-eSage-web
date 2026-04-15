// src/app/sitemap.js
import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://www.ssagesage.com';

  // 1. 핫딜온도계 품목(slug)들 가져오기
  const { data: groups } = await supabase.from('keyword_groups').select('slug');
  const groupEntries = groups?.map((g) => ({
    url: `${baseUrl}/hotdeal-thermometer/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  })) || [];

  // 2. 최신 핫딜 100개 가져오기
  const { data: deals } = await supabase
    .from('hotdeals')
    .select('id')
    .order('crawled_at', { ascending: false })
    .limit(100);

  const dealEntries = deals?.map((d) => ({
    url: `${baseUrl}/deal/${d.id}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.6,
  })) || [];

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/hotdeal-thermometer`, lastModified: new Date(), priority: 0.9 },
    ...groupEntries,
    ...dealEntries,
  ];
}