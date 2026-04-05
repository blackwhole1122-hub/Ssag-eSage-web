// lib/keywords.js
// ★ DB 기반 키워드 그룹 로딩 + 하드코딩 fallback
//
// 사용법:
//   import { useKeywordGroups } from '@/lib/keywords';
//   const { allGroups, groupsByCategory, loading } = useKeywordGroups();
//
// 하위 호환 (기존 코드용):
//   import { KEYWORD_GROUPS } from '@/lib/keywords';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// ══════════════════════════════════════════════════════════════
// 1. 하드코딩 fallback (DB 실패 시 사용)
// ══════════════════════════════════════════════════════════════
export const KEYWORD_GROUPS = {
  "식품": [
    {"group": "햇반 210g", "slug": "cj-hatbahn-210g", "keywords": ["햇반 210", "햇반"]},
    {"group": "오뚜기밥 210g", "slug": "otogirice-210g", "keywords": ["오뚜기밥 210", "오뚜기밥"]},
    {"group": "스팸클래식 200g", "slug": "spamclassic-200g", "keywords": ["스팸 클래식 200", "스팸클래식 200"]},
    {"group": "스팸클래식 340g", "slug": "spamclassic-340g", "keywords": ["스팸 클래식 340", "스팸클래식 340"]},
    {"group": "비비고 왕교자 1.05kg", "slug": "bibigo-mandu-1050g", "keywords": ["비비고 왕교자 1.05", "비비고 왕교자 1050", "왕교자 1.05", "왕교자 1050"]},
    {"group": "비비고 왕교자 455g", "slug": "bibigo-mandu-455g", "keywords": ["비비고 왕교자 455", "왕교자 455"]},
    {"group": "비비고 사골곰탕 500g", "slug": "bibigo-beef-boon-soup-500g", "keywords": ["비비고 사골곰탕 500", "사골곰탕 500", "비비고 곰탕 500"]},
    {"group": "비비고 사골곰탕 300g", "slug": "bibigo-beef-boon-soup-300g", "keywords": ["비비고 사골곰탕 300", "비비고 사골 300"]},
    {"group": "동원 참치 라이트 150g", "slug": "dongwon-right-tuna-150g", "keywords": ["동원참치 150", "동원참치 라이트", "라이트스탠다드"]},
    {"group": "동원 통그릴 비엔나 1kg", "slug": "dongwon-vienna-1kg", "keywords": ["동원비엔나 1kg", "동원 비엔나 1kg", "통그릴 비엔나", "동원비엔나"]},
    {"group": "유혜광돈까스", "slug": "yhgfood", "keywords": ["유혜광", "유혜광돈까스"]},
    {"group": "쟌슨빌 소시지", "slug": "johnsonville", "keywords": ["쟌슨빌", "쟌슨빌 소시지"]},
    {"group": "오뚜기 프레스코 600g", "slug": "otogi-fresco-600g", "keywords": ["오뚜기프레스코", "프레스코", "오뚜기 소스"]},
    {"group": "폰타나파스타소스 600g", "slug": "fontana-pasta-sauce-600g", "keywords": ["폰타나 파스타", "폰타나"]},
    {"group": "데체코 올리브오일 1l", "slug": "dececco-olive-oil-1l", "keywords": ["데체코", "데체코 올리브"]},
    {"group": "조선호텔 김치 8kg", "slug": "josunkimchi-8kg", "keywords": ["조선호텔 8kg", "조선호텔 김치 8", "조선김치 8"]},
    {"group": "조선호텔 김치 4kg", "slug": "josunkimchi-4kg", "keywords": ["조선호텔 4kg", "조선호텔 김치 4", "조선김치 4"]},
    {"group": "조선호텔 김치 2.5kg", "slug": "josunkimchi-2.5kg", "keywords": ["조선호텔 2.5kg", "조선호텔 김치 2.5", "조선김치 2.5"]},
    {"group": "스테비아 토마토 2kg", "slug": "stevia-tomato-2kg", "keywords": ["스테비아 토마토", "토망고"]},
    {"group": "김포금쌀 고시히카리 10kg", "slug": "gimpo-rice-10kg", "keywords": ["김포금 10", "김포금쌀", "고시히카리"]},
    {"group": "새청무 쌀 10kg", "slug": "saecheongmu-rice-10kg", "keywords": ["새청무 10", "새청무 쌀"]},
    {"group": "수향미 10kg", "slug": "suhyangmi-rice-10kg", "keywords": ["수향미 10", "수향미"]},
    {"group": "펩시 제로 210ml", "slug": "pepsi-zero-210ml", "keywords": ["펩시 제로 210"]},
    {"group": "펩시 제로 245ml", "slug": "pepsi-zero-245ml", "keywords": ["펩시 제로 245"]},
    {"group": "펩시 제로 355ml", "slug": "pepsi-zero-355ml", "keywords": ["펩시 제로 355"]},
    {"group": "펩시 제로 500ml", "slug": "pepsi-zero-500ml", "keywords": ["펩시 제로 500", "펩시제로 500"]},
    {"group": "칠성사이다제로 210ml", "slug": "chilsung-cider-zero-210ml", "keywords": ["칠성 제로", "칠성사이다 제로", "칠성제로"]},
    {"group": "삼다수 500ml", "slug": "samdasoo-500ml", "keywords": ["삼다수 500"]},
    {"group": "삼다수 2l", "slug": "samdasoo-2l", "keywords": ["삼다수 2"]},
    {"group": "초록매실 제로 1.5l", "slug": "green-plum-1.5l", "keywords": ["초록매실 제로 1.5", "초록매실 1.5"]},
    {"group": "초록매실 제로 500ml", "slug": "green-plum-500ml", "keywords": ["초록매실 제로 500", "초록매실 500"]},
    {"group": "몬스터 에너지", "slug": "monster-energy-355g", "keywords": ["몬스터 에너지", "몬스터", "몬스터에너지"]},
    {"group": "벤앤제리스 파인트", "slug": "benjerry", "keywords": ["벤앤제리스", "벤엔제리스", "밴앤제리스"]},
    {"group": "하겐다즈파인트", "slug": "haagendazs-473g", "keywords": ["하겐다즈", "하겐"]},
    {"group": "스포츠 리서치 오메가", "slug": "sports-research-omega3", "keywords": ["스포츠리서치", "오메가3"]},
    {"group": "크리넥스 3겹 30m", "slug": "kleenex-tissue-30m", "keywords": ["크리넥스 3겹 30", "크리넥스 30m"]},
    {"group": "크리넥스 3겹 25m", "slug": "kleenex-tissue-25m", "keywords": ["크리넥스 3겹 25", "크리넥스 25m", "데코앤소프트"]},
    {"group": "다우니 1l", "slug": "downy-1l", "keywords": ["다우니", "다우니 1L"]},
    {"group": "ps5pro", "slug": "ps5pro", "keywords": ["PS5 Pro", "플스5 프로", "ps5 pro", "ps5pro", "플스5프로"]},
    {"group": "컬쳐랜드 문화상품권 1만원", "slug": "cultureland-10k", "keywords": ["컬쳐랜드 1만", "컬쳐 1만"]},
    {"group": "컬쳐랜드 문화상품권 5만원", "slug": "cultureland-50k", "keywords": ["컬쳐랜드 5만", "컬쳐 5만"]},
  ]
};


// ══════════════════════════════════════════════════════════════
// 2. DB 캐시 (모듈 레벨 — 페이지 이동 시에도 유지)
// ══════════════════════════════════════════════════════════════
let _dbCache = null;       // { allGroups: [...], groupsByCategory: {...} }
let _dbCacheTime = 0;
const _DB_CACHE_TTL = 5 * 60 * 1000; // 5분

async function _fetchFromDB() {
  const now = Date.now();
  if (_dbCache && (now - _dbCacheTime) < _DB_CACHE_TTL) {
    return _dbCache;
  }

  try {
    const { data, error } = await supabase
      .from('keyword_groups')
      .select('group_name, slug, keywords, category');

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'empty');
    }

    // flat 배열
    const allGroups = data.map(row => ({
      group: row.group_name,
      slug: row.slug,
      keywords: row.keywords || [],
    }));

    // 카테고리별 그룹 (기존 KEYWORD_GROUPS 형태와 동일)
    const groupsByCategory = {};
    data.forEach(row => {
      const cat = row.category || '식품';
      if (!groupsByCategory[cat]) groupsByCategory[cat] = [];
      groupsByCategory[cat].push({
        group: row.group_name,
        slug: row.slug,
        keywords: row.keywords || [],
      });
    });

    _dbCache = { allGroups, groupsByCategory };
    _dbCacheTime = now;
    return _dbCache;

  } catch (e) {
    console.warn('🔑 DB 키워드 로드 실패, fallback 사용:', e);

    // fallback: 하드코딩 데이터 변환
    const allGroups = Object.values(KEYWORD_GROUPS).flat();
    const groupsByCategory = KEYWORD_GROUPS;
    _dbCache = { allGroups, groupsByCategory };
    _dbCacheTime = now;
    return _dbCache;
  }
}


// ══════════════════════════════════════════════════════════════
// 3. React Hook — 컴포넌트에서 사용
// ══════════════════════════════════════════════════════════════
/**
 * DB에서 키워드 그룹을 로드하는 React Hook.
 * 
 * @returns {Object}
 *   - allGroups: [{group, slug, keywords}, ...] — 전체 flat 배열
 *   - groupsByCategory: {식품: [...], 생활잡화: [...]} — 카테고리별
 *   - loading: boolean
 * 
 * 사용 예:
 *   const { allGroups, loading } = useKeywordGroups();
 *   if (loading) return <Spinner />;
 *   const match = allGroups.find(g => g.slug === deal.group_slug);
 */
export function useKeywordGroups() {
  // 초기값: 캐시가 있으면 즉시 사용 (깜빡임 방지)
  const [data, setData] = useState(() => {
    if (_dbCache) return { ..._dbCache, loading: false };
    // 캐시 없으면 fallback으로 즉시 렌더링
    const fallbackAll = Object.values(KEYWORD_GROUPS).flat();
    return { allGroups: fallbackAll, groupsByCategory: KEYWORD_GROUPS, loading: true };
  });

  useEffect(() => {
    let cancelled = false;

    _fetchFromDB().then(result => {
      if (!cancelled) {
        setData({ ...result, loading: false });
      }
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}


// ══════════════════════════════════════════════════════════════
// 4. 비-Hook 함수 (useEffect 내에서 직접 호출용)
// ══════════════════════════════════════════════════════════════
/**
 * Promise 기반 키워드 그룹 로드.
 * Hook을 쓸 수 없는 곳(useEffect 콜백 등)에서 사용.
 * 
 * const { allGroups } = await loadKeywordGroups();
 */
export async function loadKeywordGroups() {
  return _fetchFromDB();
}
