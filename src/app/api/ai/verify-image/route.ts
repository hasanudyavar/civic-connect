import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI image verification is not configured. Please set GEMINI_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    const sysPrompt = `You are an image authenticity analyzer for a civic complaint platform. Your job is to determine if an uploaded image is:
1. A REAL photograph taken by a camera/phone of an actual civic issue (pothole, garbage, broken streetlight, etc.)
2. OR if it is AI-generated, a stock photo, screenshot, meme, cartoon, digitally manipulated, or not a real photo of a civic issue.

Be STRICT. Look for:
- AI generation artifacts (smooth textures, weird reflections, impossible geometry)
- Stock photo indicators (watermarks, perfect staging, model-like subjects)
- Screenshots of other apps/websites
- Images that don't show a genuine civic problem

Return ONLY valid JSON with exactly: {"is_authentic": boolean, "confidence": number 0-100, "analysis": "brief explanation", "flags": ["list", "of", "concerns"]}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{
          parts: [
            { text: 'Analyze this image strictly. Return ONLY the requested JSON format.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: image_base64.replace(/^data:image\/\w+;base64,/, ''),
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Image verification service temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(text);
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
