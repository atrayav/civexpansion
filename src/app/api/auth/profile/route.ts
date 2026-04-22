import { NextResponse } from 'next/server'
import { createSessionClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/profile
 * Upserts a row in the public.users table for the current authenticated user.
 * Uses the service-role client to bypass the missing INSERT RLS policy.
 * Body: { company_name?: string; business_type?: string; target_states?: string[] }
 */
export async function POST(req: Request) {
  try {
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { company_name, business_type } = body

    const db = createServiceClient()
    const { error } = await db.from('users').upsert(
      {
        id: user.id,
        company_name: company_name ?? '',
        business_type: business_type ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('Profile upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
