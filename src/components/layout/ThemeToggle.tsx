'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncTheme = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current as 'dark' | 'light');
    };
    syncTheme(); // initial

    window.addEventListener('themechange', syncTheme);
    return () => window.removeEventListener('themechange', syncTheme);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('civic-theme', next);
    document.documentElement.classList.add('theme-transition');
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event('themechange'));
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
  };

  if (!mounted) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={toggle}
      className="relative p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-[var(--primary)] group-hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--primary)] group-hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
