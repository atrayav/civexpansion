import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const db = createServiceClient()

    const now = new Date()
    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)

    // Fetch licenses expiring within 30 days with their related data
    const { data: expiringDeadlines, error } = await db
      .from('deadlines')
      .select(`
        id,
        expiration_date,
        notified_7,
        notified_30,
        company_licenses (
          id,
          user_id,
          status,
          requirement_id,
          requirements (
            name,
            jurisdiction_id,
            jurisdictions ( name, code )
          ),
          users ( id, company_name )
        )
      `)
      .lte('expiration_date', in30Days.toISOString().split('T')[0])
      .gte('expiration_date', now.toISOString().split('T')[0])

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!expiringDeadlines || expiringDeadlines.length === 0) {
      return NextResponse.json({ success: true, processed: 0, emailsSent: 0 })
    }

    let emailsSent = 0
    const flagsToUpdate: { id: string; field: 'notified_7' | 'notified_30' }[] = []

    for (const deadline of expiringDeadlines) {
      const expDate = new Date(deadline.expiration_date)
      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const license = deadline.company_licenses as unknown as Record<string, unknown> | null
      if (!license) continue

      const requirement = license.requirements as Record<string, unknown> | null
      const jurisdiction = requirement?.jurisdictions as Record<string, unknown> | null
      const userRecord = license.users as Record<string, unknown> | null

      const requirementName = (requirement?.name as string) ?? 'License'
      const stateCode = (jurisdiction?.code as string) ?? ''
      const companyName = (userRecord?.company_name as string) ?? 'there'

      // Determine which threshold applies and whether we've already notified
      let shouldNotify = false
      let flagField: 'notified_7' | 'notified_30' | null = null

      if (daysLeft <= 7 && !deadline.notified_7) {
        shouldNotify = true
        flagField = 'notified_7'
      } else if (daysLeft <= 30 && !deadline.notified_30) {
        shouldNotify = true
        flagField = 'notified_30'
      }

      if (!shouldNotify || !flagField) continue

      // Resend scaffold — only sends if API key is configured
      if (process.env.RESEND_API_KEY) {
        try {
          // In production, fetch the user's email from auth.users via admin API
          // For now we use a placeholder; wire in real email via supabase admin.listUsers()
          await resend.emails.send({
            from: 'CivExpander Alerts <alerts@civexpander.com>',
            to: 'admin@example.com', // TODO: replace with real user email from auth
            subject: `Action Required: ${stateCode} ${requirementName} due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            html: `<p>Hi ${companyName},</p>
                   <p>Your <strong>${stateCode} ${requirementName}</strong> expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
                   <p>Log in to your <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://civexpander.com'}/dashboard">CivExpander dashboard</a> to take action.</p>`,
          })
          emailsSent++
        } catch (emailErr) {
          console.error('Email send failed:', emailErr)
        }
      }

      flagsToUpdate.push({ id: deadline.id, field: flagField })
    }

    // Batch-update notification flags
    for (const { id, field } of flagsToUpdate) {
      await db.from('deadlines').update({ [field]: true }).eq('id', id)
    }

    return NextResponse.json({
      success: true,
      processed: expiringDeadlines.length,
      emailsSent,
      flagsUpdated: flagsToUpdate.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cron error'
    console.error('Cron Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
