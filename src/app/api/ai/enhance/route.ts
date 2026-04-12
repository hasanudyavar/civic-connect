import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, category, ward } = await request.json();
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const prompt = `You are helping a citizen of Bhatkal Taluk, Karnataka file a civic grievance report.\n\nCategory: ${category || 'General'}\nWard: ${ward || 'Not specified'}\nCitizen's raw description: "${text}"\n\nRewrite this as a clear, formal civic complaint in 2-3 sentences. Keep facts accurate. Add professional language. Use English. Do not add assumptions. Output ONLY the enhanced text, no preamble.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return NextResponse.json({ error: 'AI service error', details: errBody }, { status: 502 });
    }

    const data = await response.json();
    const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    return NextResponse.json({ enhanced: enhanced.trim(), original: text });
    
  } catch (err) {
    return NextResponse.json({ error: 'Failed to enhance report', details: String(err) }, { status: 500 });
  }
}
