import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser client (singleton) ─────────────────────────────────────────────
// Use in Client Components and custom hooks.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ── Server client ──────────────────────────────────────────────────────────
// Call inside Server Components / Route Handlers.
// Reads the session cookie so the request runs as the logged-in user.
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}
