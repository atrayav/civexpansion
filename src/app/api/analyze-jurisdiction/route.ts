import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key-for-now',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, businessType, states } = body;

    if (!businessType || typeof businessType !== 'string' || businessType.trim() === '') {
      return NextResponse.json({ error: 'businessType is required' }, { status: 400 });
    }

    if (!Array.isArray(states) || states.length === 0) {
      return NextResponse.json(
        { error: 'states must be a non-empty array' },
        { status: 400 }
      );
    }

    // TODO: replace with production prompt
    const systemPrompt = `/* TODO: production jurisdiction analysis prompt */`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ businessName, businessType, states }),
        },
      ],
    });

    const responseText = (msg.content[0] as { type: 'text'; text: string }).text;

    let requirements;
    try {
      const json = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      requirements = JSON.parse(json);
    } catch {
      console.error('Failed to parse jurisdiction JSON:', responseText);
      return NextResponse.json(
        { error: 'AI produced invalid JSON', raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requirements });
  } catch (error: any) {
    console.error('Jurisdiction API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
