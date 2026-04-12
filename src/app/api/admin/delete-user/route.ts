import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Verify the caller's identity and role from their session cookie
async function getCallerRole(_request: NextRequest): Promise<{ role: string | null; error: string | null }> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            try { cookieStore.set({ name, value, ...options }); } catch { /* server component */ }
          },
          remove(name: string, options: CookieOptions) {
            try { cookieStore.set({ name, value: '', ...options }); } catch { /* server component */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { role: null, error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) return { role: null, error: 'Profile not found' };
    return { role: profile.role, error: null };
  } catch {
    return { role: null, error: 'Auth verification failed' };
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify caller is authenticated and has superadmin privileges
    const { role: callerRole, error: authError } = await getCallerRole(request);
    
    if (authError || !callerRole) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    if (callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient privileges. Only super admins can delete users.' }, { status: 403 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    // 3. Delete user via Supabase Admin API (service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      userId
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json(
      { error: 'Failed to delete user', details: String(err) },
      { status: 500 }
    );
  }
}
