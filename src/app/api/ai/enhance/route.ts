import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, category, ward } = await request.json();
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    // Support both direct Anthropic and OpenRouter
    const isOpenRouter = apiKey.startsWith('sk-or-');
    const baseUrl = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.anthropic.com/v1/messages';

    if (isOpenRouter) {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are helping a citizen of Bhatkal Taluk, Karnataka file a civic grievance report.\n\nCategory: ${category || 'General'}\nWard: ${ward || 'Not specified'}\nCitizen's raw description: "${text}"\n\nRewrite this as a clear, formal civic complaint in 2-3 sentences. Keep facts accurate. Add professional language. Use English. Do not add assumptions. Output ONLY the enhanced text, no preamble.`
          }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        return NextResponse.json({ error: 'AI service error', details: errBody }, { status: 502 });
      }

      const data = await response.json();
      const enhanced = data.choices?.[0]?.message?.content || text;
      return NextResponse.json({ enhanced, original: text });
    } else {
      // Direct Anthropic API
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are helping a citizen of Bhatkal Taluk, Karnataka file a civic grievance report.\n\nCategory: ${category || 'General'}\nWard: ${ward || 'Not specified'}\nCitizen's raw description: "${text}"\n\nRewrite this as a clear, formal civic complaint in 2-3 sentences. Keep facts accurate. Add professional language. Use English. Do not add assumptions. Output ONLY the enhanced text, no preamble.`
          }],
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'AI service error' }, { status: 502 });
      }

      const data = await response.json();
      const enhanced = data.content?.[0]?.text || text;
      return NextResponse.json({ enhanced, original: text });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to enhance report', details: String(err) }, { status: 500 });
  }
}
