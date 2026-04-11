import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/verify-email', '/transparency'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/transparency')
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For authenticated users
  if (user) {
    // Redirect from login/register if already authenticated
    if (pathname === '/login' || pathname === '/register') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'citizen';
      return NextResponse.redirect(new URL(getRoleHome(role), request.url));
    }

    // Check role-based route access for protected routes
    if (!isPublicRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'citizen';
      const redirect = checkRoleAccess(pathname, role);
      if (redirect) {
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }
  }

  return response;
}

function checkRoleAccess(pathname: string, role: string): string | null {
  // Citizen routes
  if (pathname.startsWith('/citizen') && !['citizen', 'taluk_admin', 'super_admin'].includes(role)) {
    return getRoleHome(role);
  }
  // Staff routes
  if (pathname.startsWith('/staff') && !['dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'].includes(role)) {
    return getRoleHome(role);
  }
  // Supervisor routes
  if (pathname.startsWith('/supervisor') && !['ward_supervisor', 'taluk_admin', 'super_admin'].includes(role)) {
    return getRoleHome(role);
  }
  // Admin routes
  if (pathname.startsWith('/admin') && !['taluk_admin', 'super_admin'].includes(role)) {
    return getRoleHome(role);
  }
  // Super admin routes
  if (pathname.startsWith('/superadmin') && role !== 'super_admin') {
    return getRoleHome(role);
  }
  return null;
}

function getRoleHome(role: string): string {
  switch (role) {
    case 'dept_staff': return '/staff/dashboard';
    case 'ward_supervisor': return '/supervisor/dashboard';
    case 'taluk_admin': return '/admin/dashboard';
    case 'super_admin': return '/superadmin/dashboard';
    default: return '/citizen/dashboard';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
