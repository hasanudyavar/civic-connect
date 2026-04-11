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

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller is authenticated and has admin privileges
    const { role: callerRole, error: authError } = await getCallerRole(request);
    if (authError || !callerRole) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'taluk_admin'].includes(callerRole)) {
      return NextResponse.json({ error: 'Insufficient privileges. Only admins can create users.' }, { status: 403 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { full_name, email, phone, password, role, ward_id, department_id } = body;

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields: full_name, email, password, role' }, { status: 400 });
    }

    // 3. Enforce role-based creation rules
    const allowedByRole: Record<string, string[]> = {
      super_admin: ['citizen', 'dept_staff', 'ward_supervisor', 'taluk_admin'],
      taluk_admin: ['dept_staff', 'ward_supervisor'],
    };

    const allowed = allowedByRole[callerRole] || [];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: `Your role (${callerRole}) cannot create users with role: ${role}` },
        { status: 403 }
      );
    }

    // 4. Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // 5. Create user via Supabase Admin API (service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), phone: phone?.trim() || null },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 6. Update the profile with correct role (trigger creates it as 'citizen')
    if (authData.user) {
      const profileUpdate: Record<string, unknown> = {
        id: authData.user.id,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role,
        is_active: true,
      };

      // Optionally assign ward and department
      if (ward_id) profileUpdate.ward_id = ward_id;
      if (department_id) profileUpdate.department_id = department_id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileUpdate, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // User was created in auth but profile update failed — return partial success
        return NextResponse.json({
          success: true,
          userId: authData.user.id,
          warning: 'User created but profile role update failed. Please update manually.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId: authData.user?.id,
      data: {
        id: authData.user?.id,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role,
        is_active: true,
      },
    });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json(
      { error: 'Failed to create user', details: String(err) },
      { status: 500 }
    );
  }
}
