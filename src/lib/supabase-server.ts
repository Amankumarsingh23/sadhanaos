import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Server client factory ──────────────────────────────────────────────────
// Call inside Server Components / Route Handlers.
// Reads / writes session cookies so the request runs as the logged-in user.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get:    (name)          => cookieStore.get(name)?.value,
      set:    (_name, _value) => { /* Server Components cannot set cookies */ },
      remove: (_name)         => { /* Server Components cannot remove cookies */ },
    },
  })
}
