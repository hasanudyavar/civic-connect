import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Require Anthropic API key — NO fake demo fallback
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key') {
      return NextResponse.json(
        { success: false, error: 'AI image verification is not configured. Please set ANTHROPIC_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    // Call Claude Vision API for real analysis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are an image authenticity analyzer for a civic complaint platform. Your job is to determine if an uploaded image is:
1. A REAL photograph taken by a camera/phone of an actual civic issue (pothole, garbage, broken streetlight, etc.)
2. OR if it is AI-generated, a stock photo, screenshot, meme, cartoon, digitally manipulated, or not a real photo of a civic issue.

Be STRICT. Look for:
- AI generation artifacts (smooth textures, weird reflections, impossible geometry)
- Stock photo indicators (watermarks, perfect staging, model-like subjects)
- Screenshots of other apps/websites
- Images that don't show a genuine civic problem

Return ONLY valid JSON, no markdown wrapping.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image_base64.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                type: 'text',
                text: 'Analyze this image strictly. Is it a REAL photograph of a civic issue taken by a camera/phone? Or is it AI-generated/stock/screenshot/manipulated/irrelevant? Return JSON: {"is_authentic": boolean, "confidence": number 0-100, "analysis": "brief explanation of your verdict", "flags": ["list of any concerns"]}',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Image verification service temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    try {
      // Clean potential markdown wrapping
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return NextResponse.json({
        success: true,
        data: {
          is_authentic: Boolean(parsed.is_authentic),
          confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
          analysis: String(parsed.analysis || 'Analysis complete.'),
          flags: Array.isArray(parsed.flags) ? parsed.flags.map(String) : [],
        },
      });
    } catch {
      // If Claude returned text but not valid JSON, assume suspicious
      return NextResponse.json({
        success: true,
        data: {
          is_authentic: false,
          confidence: 40,
          analysis: 'Could not determine image authenticity. Please upload a clearer photo.',
          flags: ['analysis_parse_error'],
        },
      });
    }
  } catch (err) {
    console.error('Image verification error:', err);
    return NextResponse.json({ success: false, error: 'Image verification failed' }, { status: 500 });
  }
}
