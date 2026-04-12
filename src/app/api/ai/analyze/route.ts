import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const prompt = `You are a civic grievance verification system for Bhatkal Taluk. Analyze this evidence image for a complaint resolution. Provide:
1. What the image shows (2-3 sentences)
2. Whether it appears to show genuine resolution work (true/false/null)
3. Quality assessment (clear/blurry/insufficient)
4. Key observations relevant to civic complaint resolution
Be concise and factual. Output as JSON: { "description": "", "showsResolution": true/false/null, "quality": "clear"|"blurry"|"insufficient", "observations": "" }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mediaType || 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
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
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    try {
      const analysis = JSON.parse(resultText);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({ analysis: { description: resultText, showsResolution: null, quality: 'unclear', observations: '' } });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Evidence analysis failed', details: String(err) }, { status: 500 });
  }
}
