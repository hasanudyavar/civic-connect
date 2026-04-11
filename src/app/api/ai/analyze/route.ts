import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const prompt = `You are a civic grievance verification system for Bhatkal Taluk. Analyze this evidence image for a complaint resolution. Provide:
1. What the image shows (2-3 sentences)
2. Whether it appears to show genuine resolution work (yes/no/unclear)
3. Quality assessment (clear/blurry/insufficient)
4. Key observations relevant to civic complaint resolution
Be concise and factual. Output as JSON: { "description": "", "showsResolution": true/false/null, "quality": "clear"|"blurry"|"insufficient", "observations": "" }`;

    const isOpenRouter = apiKey.startsWith('sk-or-');

    if (isOpenRouter) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mediaType || 'image/jpeg'};base64,${imageBase64}` }
              },
              { type: 'text', text: prompt }
            ],
          }],
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content || '{}';
      
      try {
        const analysis = JSON.parse(resultText);
        return NextResponse.json({ analysis });
      } catch {
        return NextResponse.json({ analysis: { description: resultText, showsResolution: null, quality: 'unclear', observations: '' } });
      }
    } else {
      // Direct Anthropic API with vision
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt }
            ],
          }],
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
      }

      const data = await response.json();
      const resultText = data.content?.[0]?.text || '{}';
      
      try {
        const analysis = JSON.parse(resultText);
        return NextResponse.json({ analysis });
      } catch {
        return NextResponse.json({ analysis: { description: resultText, showsResolution: null, quality: 'unclear', observations: '' } });
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Evidence analysis failed', details: String(err) }, { status: 500 });
  }
}
