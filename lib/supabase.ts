// 위치: lib/supabase.ts 
import { createClient } from '@supabase/supabase-js'

// 우리가 방금 .env.local에 숨겨둔 열쇠를 끌어오는 코드야
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 짠! 프리미어에 외장하드 마운트 완료! 이제 어디서든 이걸로 DB를 불러올 수 있어!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)