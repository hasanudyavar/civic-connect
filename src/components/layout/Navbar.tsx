'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Building2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/transparency', label: 'Transparency' },
    { href: '/login', label: 'Login' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group relative">
            <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center shadow-lg shadow-[rgba(0,105,72,0.3)] relative z-10 transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5 text-[var(--on-primary)]" />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-xl font-bold text-[var(--on-surface)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Civic Connect
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-[var(--primary)] -mt-1 tracking-widest uppercase opacity-80">
                Bhatkal Taluk
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1 bg-[rgba(255,255,255,0.03)] p-1.5 rounded-2xl border border-[var(--glass-border-light)]">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative',
                    pathname === link.href
                      ? 'text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[rgba(255,255,255,0.05)]'
                  )}
                >
                  {pathname === link.href && (
                    <span className="absolute inset-0 bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded-xl -z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></span>
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <div className="h-6 w-px bg-[var(--outline-variant)] mx-1"></div>
              <Link href="/register" className="btn-primary py-2.5 px-6 group">
                Report Issue
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2.5 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--on-surface)] border border-transparent hover:border-[var(--glass-border)] transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          menuOpen ? "max-h-96 opacity-100 py-4 border-t border-[var(--glass-border)]" : "max-h-0 opacity-0"
        )}>
          <div className="space-y-2">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-5 py-3.5 text-base font-medium rounded-xl transition-all",
                  pathname === link.href
                    ? "bg-[var(--surface-container-highest)] text-[var(--primary)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--glass-bg)]"
                )}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-[var(--outline-variant)]">
              <Link
                href="/register"
                className="w-full btn-primary py-3.5 flex justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Report Issue Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
