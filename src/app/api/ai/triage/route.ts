import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, category, priority } = await request.json();
    
    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: 'Description too short' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const prompt = `You are an AI Smart Triage Assistant for the Bhatkal Taluk Municipal Corporation.
Analyze this civic complaint submitted by a citizen:

Category: ${category || 'Unknown'}
Current Priority Rating: ${priority || 'Unknown'}
Complaint Text: "${text}"

Provide a JSON output with EXACTLY these 3 keys:
1. "summary": A concise, 1-sentence TL;DR of the actual problem. Maximum 15 words.
2. "severity": Re-evaluate severity as either "LOW", "MEDIUM", "HIGH", or "CRITICAL".
3. "actionable_insight": A 1-sentence suggestion on what municipal department or equipment is likely needed (e.g., "Dispatch PWD road repair crew", "Send health inspector").

Output ONLY valid JSON without any markdown formatting, code blocks, or extra text.`;

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
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Clean up potential markdown formatting from Gemini
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const triage = JSON.parse(resultText);
      return NextResponse.json({ triage });
    } catch (parseErr) {
      console.error('Failed to parse AI output:', resultText);
      return NextResponse.json({ 
        triage: { 
          summary: text.substring(0, 50) + '...',
          severity: priority || 'MEDIUM',
          actionable_insight: "Needs manual review."
        } 
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to triage complaint', details: String(err) }, { status: 500 });
  }
}
