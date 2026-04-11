import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, title, description, ai_description, location, address, ward_id, image_verified } = body;

    // Validate required fields
    if (!category || !description || description.length < 20) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Get category SLA config
    const { data: catConfig } = await supabase
      .from('category_mappings')
      .select('department_id, sla_hours')
      .eq('category', category)
      .single();

    // Calculate SLA deadline
    const slaHours = catConfig?.sla_hours || 72; // default 72h
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Insert complaint
    const { data: complaint, error: insertError } = await supabase
      .from('complaints')
      .insert({
        citizen_id: user.id,
        category,
        title: sanitizeInput(title || ''),
        description: sanitizeInput(description),
        ai_description: ai_description ? sanitizeInput(ai_description) : null,
        status: 'NEW',
        location: location || null,
        address: address ? sanitizeInput(address) : null,
        ward_id: ward_id || null,
        department_id: catConfig?.department_id || null,
        sla_deadline: slaDeadline,
        image_verified: image_verified || false,
        is_public: true,
      })
      .select('id, ticket_id')
      .single();

    if (insertError) {
      console.error('Complaint insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    // Create initial timeline entry
    await supabase.from('complaint_timeline').insert({
      complaint_id: complaint.id,
      status: 'NEW',
      changed_by: user.id,
      note: 'Complaint submitted',
      is_public: true,
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'complaint_created',
      entity_type: 'complaint',
      entity_id: complaint.id,
      new_value: { category, title },
    });

    return NextResponse.json({
      success: true,
      data: { id: complaint.id, ticket_id: complaint.ticket_id },
    });
  } catch (err) {
    console.error('Complaint creation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('complaints')
      .select('*, ward:wards(name), department:departments(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
