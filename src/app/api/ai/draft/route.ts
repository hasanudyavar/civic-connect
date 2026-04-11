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

    // Require Anthropic API key — NO fake template fallback
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key') {
      return NextResponse.json(
        { success: false, error: 'AI drafting service not configured. Please set ANTHROPIC_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    // Call Anthropic Claude API
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
        system: `You are a civic complaint assistant for Bhatkal Taluk, Karnataka, India. Your task is to take a rough citizen description and convert it into a well-structured, formal civic complaint. The complaint should be:
1. Professional and respectful in tone
2. Include specific details from the citizen's description
3. Reference the location if provided
4. Be clear about what action is requested

Return ONLY valid JSON, no markdown wrapping.`,
        messages: [
          {
            role: 'user',
            content: `Category: ${category || 'general'}\nLocation: ${sanitizedAddress || 'Not specified'}\nCitizen description: ${sanitizedDescription}\n\nConvert this into a formal civic complaint. Return JSON: {"subject": "concise title max 100 chars", "formal_description": "2-3 professional sentences describing the issue and requesting action", "key_points": ["point1", "point2", "point3"]}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return NextResponse.json(
        { success: false, error: 'AI drafting service temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
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
