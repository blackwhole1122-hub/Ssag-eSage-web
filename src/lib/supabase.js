import { createClient } from '@supabase/supabase-js'

// .env.local에 저장한 열쇠들을 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 웹사이트 어디서든 쓸 수 있는 'supabase 대리인'을 만듭니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)