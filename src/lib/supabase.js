// src/lib/supabase.js
import { createBrowserClient } from '@supabase/ssr'

// 클라이언트 사이드 전용 수파베이스 클라이언트
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)