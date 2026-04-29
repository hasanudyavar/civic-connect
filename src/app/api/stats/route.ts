import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    // Get aggregate stats
    const { count: total } = await supabase.from('complaints').select('*', { count: 'exact', head: true });
    const { count: resolved } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['RESOLVED', 'CLOSED']);
    const { count: active } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).not('status', 'in', '("RESOLVED","CLOSED")');
    const { count: breached } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('resolution_sla_breached', true);

    const resolvedPct = total ? Math.round(((resolved || 0) / total) * 100) : 0;
    const slaCompliance = total ? Math.round(((total - (breached || 0)) / total) * 100) : 100;

    return NextResponse.json({
      success: true,
      data: {
        total_complaints: total || 0,
        resolved: resolved || 0,
        active: active || 0,
        resolved_percentage: resolvedPct,
        sla_compliance: slaCompliance,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
