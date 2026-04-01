import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key-for-now', 
});

export async function POST(req: Request) {
  try {
    const { businessName, businessType, states } = await req.json();

    if (!businessType || !states) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const stateList = Array.isArray(states) ? states.join(', ') : states;

    const systemPrompt = `You are an expert multi-jurisdictional compliance assistant. 
    Analyze the compliance requirements for a \${businessType} operating in \${stateList}.
    Provide a detailed JSON array of objects representing required licenses, permits, and registrations.
    Each object MUST have:
    - "id" (string, e.g., "req-1")
    - "state" (string, the state abbreviation like CA, NY)
    - "name" (string, e.g., "Foreign Qualification", "Sales Tax Permit")
    - "description" (string, explaining why it's needed)
    - "urgency" (string, strictly one of: "Critical", "Moderate", "Standard" based on standard legal operational blocking)
    - "agency" (string, e.g., "Secretary of State", "Department of Revenue")
    - "estimatedDays" (number, typical processing time)
    
    Return ONLY valid JSON array with no markdown wrappers or additional text. DO NOT wrap with \`\`\`json.`;

    // Prompt engineering to force JSON output
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0.2,
      system: "You output raw valid JSON strictly.",
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ]
    });

    // Parse the JSON
    // @ts-ignore
    const responseText = msg.content[0].text;
    
    let requirements = [];
    try {
      requirements = JSON.parse(responseText.trim());
    } catch (e) {
      console.error("Failed to parse JSON", responseText);
      return NextResponse.json({ error: 'AI produced invalid format' }, { status: 500 });
    }

    // In a real app we'd save these to Supabase 'requirements' table right here
    // ... Supabase logic ...

    return NextResponse.json({ success: true, requirements });
    
  } catch (error: any) {
    console.error('Jurisdiction API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
