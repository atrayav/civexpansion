import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'fake-key-for-now');

export async function GET(req: Request) {
  try {
    // In a real application, you would invoke a Supabase sql function or query:
    // 1. Fetch `company_licenses` joined with `deadlines` and `requirements`
    // 2. Filter for expiration_date within 60, 30, and 7 days
    // 3. Ensure the respective boolean flag (notified_60, etc.) is false
    // Example:
    /*
      const { data: dueLicenses } = await supabase
        .from('deadlines')
        .select('*, company_licenses(user_id, requirements(name))')
        .lte('expiration_date', thirtyDaysFromNow)
        .eq('notified_30', false);
    */

    const dummyExpiringLicenses = [
      { id: 'uuid-1', company: 'Acme Corp', requirement: 'Biennial Statement', state: 'NY', daysLeft: 7, email: 'admin@acmecorp.com' }
    ];

    let emailsSent = 0;

    for (const license of dummyExpiringLicenses) {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'CivExpander Alerts <alerts@civexpander.com>',
          to: license.email,
          subject: `Action Required: \${license.state} \${license.requirement} due in \${license.daysLeft} days`,
          html: `<p>Hi there,</p>
                 <p>Your <strong>\${license.state} \${license.requirement}</strong> is expiring in \${license.daysLeft} days.</p>
                 <p>Please log in to your CivExpander dashboard to update your compliance records.</p>`,
        });
      }
      
      emailsSent++;
      
      // Update database flag `notified_7 = true`
    }

    return NextResponse.json({ success: true, processed: dummyExpiringLicenses.length, emailsSent });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
