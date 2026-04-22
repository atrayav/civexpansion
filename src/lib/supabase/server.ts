import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Session-aware server client — use in route handlers and server components. */
export async function createSessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to ignore in Server Components — middleware handles refresh.
          }
        },
      },
    }
  )
}

/** Service-role client — bypasses RLS. Use only in trusted server contexts. */
export function createServiceClient() {
  return createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SERVICE_ROLE_KEY || 'placeholder',
    { auth: { persistSession: false } }
  )
}

/** Returns true only when all required Supabase env vars are present. */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SERVICE_ROLE_KEY)
}
