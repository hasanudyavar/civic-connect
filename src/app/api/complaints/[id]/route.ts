import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'citizen';

    // Get existing complaint
    const { data: existing } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    // Status change
    if (body.status && body.status !== existing.status) {
      const hasPermission =
        role === 'super_admin' ||
        (role === 'taluk_admin') ||
        (role === 'ward_supervisor') ||
        (role === 'dept_staff' && ['IN_PROGRESS', 'RESOLVED'].includes(body.status)) ||
        (role === 'citizen' && body.status === 'REOPENED' && existing.citizen_id === user.id);

      if (!hasPermission) {
        return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
      }

      updates.status = body.status;
      if (body.status === 'RESOLVED') updates.resolved_at = new Date().toISOString();
      if (body.status === 'CLOSED') updates.closed_at = new Date().toISOString();

      await supabase.from('complaint_timeline').insert({
        complaint_id: id,
        status: body.status,
        changed_by: user.id,
        note: body.note ? sanitizeInput(body.note) : null,
        is_public: body.is_public !== false,
      });

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'status_change',
        entity_type: 'complaint',
        entity_id: id,
        old_value: { status: existing.status },
        new_value: { status: body.status },
      });
    }

    // Assignment change
    if (body.assigned_to !== undefined) {
      updates.assigned_to = body.assigned_to;
      if (!existing.assigned_to && body.assigned_to) {
        updates.status = 'ASSIGNED';
      }
    }

    // SLA breach check
    if (existing.sla_deadline && new Date() > new Date(existing.sla_deadline) &&
        !['RESOLVED', 'CLOSED'].includes(String(updates.status || existing.status))) {
      updates.sla_breached = true;
    }

    const { data: updated, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('complaints')
      .select('*, ward:wards(name), department:departments(name), timeline:complaint_timeline(*, changer:profiles(full_name, role))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
