import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key-for-now',
});

// Use edge runtime for longer timeouts if needed, but node is fine for testing
// export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { documents, targetStates, businessType } = await req.json();

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }

    // Prepare Claude Vision payload
    const imageBlocks = documents.map((doc: { type: string, data: string }) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: doc.type, // e.g., "image/jpeg" or "image/png"
        data: doc.data // base64 string without prefix
      }
    }));

    const systemPrompt = `You are an expert compliance auditor. 
    Review the provided license/document images. Determine what they are.
    Then, cross-reference them against the standard requirements for a \${businessType} operating in \${targetStates}.
    Identify which required licenses are MISSING or EXPIRED.
    Return a neat JSON object: 
    { 
      "foundLicenses": [{ "name": "...", "state": "...", "status": "Valid|Expired" }], 
      "missingLicenses": [{ "name": "...", "state": "...", "urgency": "Critical|Moderate", "description": "..." }] 
    }
    Output ONLY valid JSON without markdown wrapping or backticks.`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.1,
      system: "You output raw JSON strictly.",
      messages: [
        {
          role: 'user',
          content: [
            { type: "text", text: systemPrompt },
            ...imageBlocks
          ]
        }
      ]
    });

    // @ts-ignore
    const responseText = msg.content[0].text;
    
    let analysis;
    try {
      analysis = JSON.parse(responseText.trim());
    } catch (e) {
      console.error("Parse Error:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis });
    
  } catch (error: any) {
    console.error('Gap Analysis API Error:', error);
    return NextResponse.json({ error: error.message || 'Error running gap analysis' }, { status: 500 });
  }
}
