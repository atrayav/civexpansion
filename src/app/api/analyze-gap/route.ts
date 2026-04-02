import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key-for-now',
});

export async function POST(req: Request) {
  try {
    const { documents, targetStates, businessType } = await req.json();

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upload each document to Supabase Storage, then get a short-lived signed URL
    // to pass to Claude Vision — avoids base64 token bloat.
    const imageBlocks = await Promise.all(
      documents.map(async (doc: { type: string; data: string }, i: number) => {
        const ext = doc.type.split('/')[1] || 'jpg';
        const path = `gap-analysis/${Date.now()}-${i}.${ext}`;
        const buffer = Buffer.from(doc.data, 'base64');

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, buffer, { contentType: doc.type, upsert: false });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: signed, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 120); // 120s TTL — enough for Claude to fetch

        if (signError || !signed?.signedUrl) {
          throw new Error(`Failed to get signed URL: ${signError?.message}`);
        }

        return {
          type: 'image' as const,
          source: { type: 'url' as const, url: signed.signedUrl },
        };
      })
    );

    // TODO: replace with production prompt
    const systemPrompt = `/* TODO: production gap analysis prompt */`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify({ businessType, targetStates }),
            },
            ...imageBlocks,
          ],
        },
      ],
    });

    const responseText = (msg.content[0] as { type: 'text'; text: string }).text;

    let analysis;
    try {
      const json = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      analysis = JSON.parse(json);
    } catch {
      console.error('Gap analysis parse error:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Gap Analysis API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error running gap analysis' },
      { status: 500 }
    );
  }
}
