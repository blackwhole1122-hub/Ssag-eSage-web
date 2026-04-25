import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { classifyCoupangCategoryByKeywordGroups } from '@/lib/coupangCategory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, reason: 'missing_service_role_key' },
        { status: 200 }
      );
    }

    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: rules, error: rulesError }, { data: deals, error: dealsError }] = await Promise.all([
      supabase.from('keyword_groups').select('group_name, keywords, category'),
      supabase
        .from('coupang_hotdeals')
        .select('id, name, category, updated_at')
        .eq('category', '기타')
        .gte('updated_at', cutoffIso)
        .order('updated_at', { ascending: false })
        .limit(200),
    ]);

    if (rulesError || dealsError) {
      return NextResponse.json(
        {
          ok: false,
          rulesError: rulesError?.message || null,
          dealsError: dealsError?.message || null,
        },
        { status: 500 }
      );
    }

    const ruleRows = Array.isArray(rules) ? rules : [];
    const targetDeals = Array.isArray(deals) ? deals : [];

    const updates = targetDeals
      .map((deal) => {
        const nextCategory = classifyCoupangCategoryByKeywordGroups(deal.name, ruleRows);
        if (!nextCategory || nextCategory === '기타') return null;
        return { id: deal.id, category: nextCategory };
      })
      .filter(Boolean);

    if (updates.length === 0) {
      return NextResponse.json({
        ok: true,
        scanned: targetDeals.length,
        updated: 0,
      });
    }

    const settled = await Promise.allSettled(
      updates.map((row) =>
        supabase.from('coupang_hotdeals').update({ category: row.category }).eq('id', row.id)
      )
    );

    const updated = settled.filter((it) => it.status === 'fulfilled').length;
    const failed = settled.length - updated;

    return NextResponse.json({
      ok: true,
      scanned: targetDeals.length,
      matched: updates.length,
      updated,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'unknown_error' },
      { status: 500 }
    );
  }
}
