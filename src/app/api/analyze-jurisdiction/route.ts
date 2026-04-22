import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSessionClient, createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a business compliance expert specializing in U.S. state licensing requirements.
Given a business type and list of target states, return a JSON array of state compliance objects.

Each object in the array must strictly follow this TypeScript shape:
{
  "state": string,           // 2-letter state code e.g. "CA"
  "stateName": string,       // full state name e.g. "California"
  "stateRiskLevel": "high" | "medium" | "low",
  "stateRiskRationale": string,   // 1 sentence explaining the risk level
  "priorityOrder": string[],      // array of requirement IDs in recommended filing order
  "requirements": [
    {
      "id": string,               // short unique slug e.g. "ca-foreign-qualification"
      "category": string,         // e.g. "Foreign Qualification", "Tax Registration", "Business License"
      "title": string,
      "description": string,      // 2-3 sentence description of what this is and why it is needed
      "urgency": "critical" | "high" | "medium" | "low",
      "urgencyReason": string,    // why this urgency level
      "typicalTimeline": string,  // e.g. "2-4 weeks"
      "estimatedCost": string,    // e.g. "$500-$2,000"
      "filingAuthority": string,  // e.g. "California Secretary of State"
      "filingUrl": string | null, // official state agency URL if known, else null
      "penaltyForNonCompliance": string,
      "isIndustrySpecific": boolean,
      "commonMistakes": string[]  // 2-3 common mistakes businesses make
    }
  ]
}

Rules:
- Return ONLY a valid JSON array with no markdown fences, no explanation, no commentary.
- Include 3-6 requirements per state covering: foreign qualification, registered agent, state tax registration, local business license, and any industry-specific permits.
- Be specific and accurate — use real agency names and real filing URLs where possible.
- Order the priorityOrder array from most urgent to least urgent by their IDs.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { businessName, businessType, states } = body

    if (!businessType || typeof businessType !== 'string' || businessType.trim() === '') {
      return NextResponse.json({ error: 'businessType is required' }, { status: 400 })
    }
    if (!Array.isArray(states) || states.length === 0) {
      return NextResponse.json({ error: 'states must be a non-empty array' }, { status: 400 })
    }

    // Get authenticated user
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const userPrompt = `Business name: ${businessName || 'Unknown'}
Business type: ${businessType}
Target states: ${states.join(', ')}

Analyze what licenses, permits, and registrations this business needs in each target state to operate legally.`

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = (msg.content[0] as { type: 'text'; text: string }).text

    let requirements: unknown[]
    try {
      const json = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
      requirements = JSON.parse(json)
      if (!Array.isArray(requirements)) throw new Error('Response is not an array')
    } catch (parseErr) {
      console.error('Failed to parse jurisdiction JSON:', responseText)
      return NextResponse.json(
        { error: 'Analysis failed, please retry' },
        { status: 500 }
      )
    }

    // Persist to analyses table (best-effort — don't fail the request if DB is not set up yet)
    if (user) {
      try {
        const db = createServiceClient()
        await db.from('analyses').insert({
          user_id: user.id,
          business_name: businessName || null,
          business_type: businessType,
          states,
          results: requirements,
        })
      } catch (dbErr) {
        console.warn('Could not save analysis to DB (table may not exist yet):', dbErr)
      }
    }

    return NextResponse.json({ success: true, requirements })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Jurisdiction API Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
