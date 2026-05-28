import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Uses cookies (not localStorage) so the server proxy can read the session
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
