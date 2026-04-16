'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/constants';
import {
  LayoutDashboard, FileText, PlusCircle, Bell, User, Settings,
  Users, BarChart3, Shield, Building2, ChevronLeft, ChevronRight,
  LogOut, FolderKanban, Eye, Palette, ClipboardList, Loader2,
  Home, Search, Menu, X, Sun, Moon
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'citizen':
      return [
        { href: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/citizen/complaints/new', label: 'File Report', icon: PlusCircle },
        { href: '/citizen/complaints', label: 'My Complaints', icon: FileText },
        { href: '/citizen/notifications', label: 'Notifications', icon: Bell },
        { href: '/citizen/profile', label: 'Profile', icon: User },
      ];
    case 'dept_staff':
      return [
        { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/staff/complaints', label: 'Assigned Work', icon: FolderKanban },
        { href: '/staff/profile', label: 'Profile', icon: User },
      ];
    case 'ward_supervisor':
      return [
        { href: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/supervisor/complaints', label: 'Ward Complaints', icon: FileText },
        { href: '/supervisor/staff', label: 'Ward Staff', icon: Users },
        { href: '/supervisor/profile', label: 'Profile', icon: User },
      ];
    case 'taluk_admin':
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/complaints', label: 'All Complaints', icon: FileText },
        { href: '/admin/users/staff', label: 'Manage Staff', icon: Users },
        { href: '/admin/users/supervisors', label: 'Supervisors', icon: Eye },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/admin/info-requests', label: 'Info Requests', icon: Shield },
        { href: '/admin/profile', label: 'Profile', icon: User },
      ];
    case 'super_admin':
      return [
        { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/superadmin/branding', label: 'Branding', icon: Palette },
        { href: '/superadmin/taluk-admins', label: 'Taluk Admins', icon: Users },
        { href: '/superadmin/users', label: 'All Users', icon: Users },
        { href: '/superadmin/complaints', label: 'All Complaints', icon: FileText },
        { href: '/superadmin/config', label: 'App Config', icon: Settings },
        { href: '/superadmin/audit-log', label: 'Audit Log', icon: ClipboardList },
      ];
    default:
      return [];
  }
}

function getCitizenMobileNav(): NavItem[] {
  return [
    { href: '/citizen/dashboard', label: 'Home', icon: Home },
    { href: '/citizen/complaints/new', label: 'File', icon: PlusCircle },
    { href: '/citizen/complaints', label: 'Track', icon: Search },
    { href: '/citizen/notifications', label: 'Alerts', icon: Bell },
    { href: '/citizen/profile', label: 'Profile', icon: User },
  ];
}

// ── Sidebar Component ──────────────────────────────────────────
function Sidebar() {
  const { user, appConfig, signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'citizen';
  const navItems = getNavItems(role);
  const cityName = appConfig.city_name || 'Bhatkal';
  const webName = appConfig.web_name || 'Civic Connect';

  return (
    <aside className={`desktop-sidebar hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-[var(--surface-container-low)] border-r border-[var(--glass-border)] transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,105,72,0.3)]">
          <Building2 className="w-5 h-5 text-[var(--on-primary)]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-[var(--on-surface)] truncate" style={{ fontFamily: 'var(--font-display)' }}>{webName}</p>
            <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">{cityName} Taluk</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--outline)] hover:text-[var(--on-surface)] transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[var(--surface-container-highest)] text-[var(--primary)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--glass-bg)] hover:text-[var(--on-surface)]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--outline)] group-hover:text-[var(--on-surface)]'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-[var(--glass-border)]">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-bold text-[var(--on-surface)] truncate">{user.full_name}</p>
            <p className="text-[11px] font-medium text-[var(--outline)]">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Mobile Bottom Nav (Citizens) ───────────────────────────────
function MobileBottomNav() {
  const pathname = usePathname();
  const mobileItems = getCitizenMobileNav();

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-container-low)]/90 backdrop-blur-xl border-t border-[var(--glass-border)] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[56px] ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--outline)]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Mobile Header ──────────────────────────────────────────────
function MobileHeader() {
  const { user, appConfig, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role || 'citizen';
  const navItems = getNavItems(role);
  const webName = appConfig.web_name || 'Civic Connect';

  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('civic-theme', next);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--surface-container-low)]/90 backdrop-blur-xl border-b border-[var(--glass-border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[var(--on-primary)]" />
          </div>
          <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>{webName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--outline)]">
            <Sun className="w-4 h-4 hidden [data-theme=dark]_&:block" />
            <Moon className="w-4 h-4 [data-theme=dark]_&:hidden" />
          </button>
          {role !== 'citizen' && (
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--outline)]">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer for non-citizen roles */}
      {menuOpen && role !== 'citizen' && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--surface-container-low)] border-l border-[var(--glass-border)] p-4 animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-sm font-bold">{user?.full_name}</p>
                <p className="text-xs text-[var(--outline)]">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-[var(--glass-bg)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-[var(--glass-bg)] hover:text-[var(--on-surface)] transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors mt-4">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Theme Toggle ───────────────────────────────────────────────
export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    syncTheme();
    window.addEventListener('themechange', syncTheme);
    return () => window.removeEventListener('themechange', syncTheme);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('civic-theme', next);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <button
      onClick={toggle}
      className="p-2.5 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--outline)] hover:text-[var(--on-surface)] transition-all duration-300"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// ── Dashboard Shell ────────────────────────────────────────────
interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, loading } = useAuth();
  const role = user?.role || 'citizen';
  const isCitizen = role === 'citizen';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm font-semibold text-[var(--on-surface-variant)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 md:ml-[260px] ${isCitizen ? 'pb-20 md:pb-0' : ''} pt-14 md:pt-0`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav for Citizens */}
      {isCitizen && <MobileBottomNav />}
    </div>
  );
}

// Wrapper that includes AuthProvider
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  );
}

function DashboardShellInner({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const role = user?.role || 'citizen';
  const isCitizen = role === 'citizen';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm font-semibold text-[var(--on-surface-variant)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <MobileHeader />
      <main className={`flex-1 min-h-screen transition-all duration-300 md:ml-[260px] ${isCitizen ? 'pb-20 md:pb-0' : ''} pt-14 md:pt-0`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      {isCitizen && <MobileBottomNav />}
    </div>
  );
}
