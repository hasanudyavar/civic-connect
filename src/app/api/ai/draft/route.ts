import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/utils';

// In-memory rate limit store (per-process)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, address, description } = body;

    // Validate
    if (!description || description.length < 20) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Rate limit check
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const limit = rateLimitStore.get(clientId);

    if (limit) {
      if (now < limit.resetAt && limit.count >= 10) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Try again in an hour.' },
          { status: 429 }
        );
      }
      if (now >= limit.resetAt) {
        rateLimitStore.set(clientId, { count: 1, resetAt: now + 3600000 });
      } else {
        limit.count++;
      }
    } else {
      rateLimitStore.set(clientId, { count: 1, resetAt: now + 3600000 });
    }

    // Sanitize
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedAddress = address ? sanitizeInput(address) : '';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI drafting service not configured. Please set GEMINI_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    const sysPrompt = `You are a civic complaint assistant for Bhatkal Taluk, Karnataka, India. Your task is to take a rough citizen description and convert it into a well-structured, formal civic complaint. The complaint should be:
1. Professional and respectful in tone
2. Include specific details from the citizen's description
3. Reference the location if provided
4. Be clear about what action is requested

Return ONLY valid JSON with this exact structure: {"subject": "concise title max 100 chars", "formal_description": "2-3 professional sentences describing the issue and requesting action", "key_points": ["point1", "point2", "point3"]}`;

    const userPrompt = `Category: ${category || 'general'}\nLocation: ${sanitizedAddress || 'Not specified'}\nCitizen description: ${sanitizedDescription}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return NextResponse.json(
        { success: false, error: 'AI drafting service temporarily unavailable. Please try again.' },
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
          subject: String(parsed.subject || '').slice(0, 100),
          formal_description: String(parsed.formal_description || sanitizedDescription),
          key_points: Array.isArray(parsed.key_points) ? parsed.key_points.map(String) : [],
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'AI could not process the draft. Please try rephrasing.' },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

