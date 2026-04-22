import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { createSessionClient, createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a compliance document analyst specializing in U.S. business licenses and permits.
You will receive images of business license documents and a business context.

Analyze the documents and return a single JSON object with this exact shape:
{
  "foundLicenses": [
    {
      "name": string,         // e.g. "California LLC Foreign Qualification"
      "state": string,        // 2-letter state code
      "expiryDate": string | null,  // ISO date string or null if not found
      "status": "valid" | "expiring" | "expired"
    }
  ],
  "missingLicenses": [
    {
      "name": string,         // e.g. "New York Sales Tax Certificate"
      "state": string,        // 2-letter state code
      "urgency": "immediate" | "soon" | "planned",
      "description": string   // 1-2 sentence explanation of why this is needed
    }
  ],
  "overallScore": number,     // 0-100: compliance completeness percentage
  "summary": string           // 2-3 sentence plain English summary of the compliance situation
}

Rules:
- Return ONLY valid JSON with no markdown fences, no explanation.
- "expiring" means within 60 days, "expired" means past the expiry date.
- Base missingLicenses on the business context (type + target states) vs. what documents are present.
- overallScore = (foundLicenses.length / (foundLicenses.length + missingLicenses.length)) * 100, rounded.
- If no documents are readable, return empty arrays and score 0 with an appropriate summary.`

export async function POST(req: Request) {
  try {
    const { documents, targetStates, businessType } = await req.json()

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 })
    }

    // Get authenticated user
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload each document to Supabase Storage, then get a short-lived signed URL
    const imageBlocks = await Promise.all(
      documents.map(async (doc: { type: string; data: string }, i: number) => {
        const ext = doc.type.split('/')[1] || 'jpg'
        const path = `gap-analysis/${Date.now()}-${i}.${ext}`
        const buffer = Buffer.from(doc.data, 'base64')

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, buffer, { contentType: doc.type, upsert: false })

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        const { data: signed, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 120)

        if (signError || !signed?.signedUrl) {
          throw new Error(`Failed to get signed URL: ${signError?.message}`)
        }

        return {
          type: 'image' as const,
          source: { type: 'url' as const, url: signed.signedUrl },
        }
      })
    )

    const userPrompt = `Business type: ${businessType}
Target states for expansion: ${targetStates}

Please analyze the attached license document images and identify compliance gaps.`

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...imageBlocks,
          ],
        },
      ],
    })

    const responseText = (msg.content[0] as { type: 'text'; text: string }).text

    let analysis: unknown
    try {
      const json = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
      analysis = JSON.parse(json)
    } catch (parseErr) {
      console.error('Gap analysis parse error:', responseText)
      return NextResponse.json(
        { error: 'Analysis failed, please retry' },
        { status: 500 }
      )
    }

    // Persist to gap_analyses table (best-effort)
    if (user) {
      try {
        const db = createServiceClient()
        await db.from('gap_analyses').insert({
          user_id: user.id,
          business_type: businessType,
          target_states: targetStates,
          results: analysis,
        })
      } catch (dbErr) {
        console.warn('Could not save gap analysis to DB (table may not exist yet):', dbErr)
      }
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error running gap analysis'
    console.error('Gap Analysis API Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
