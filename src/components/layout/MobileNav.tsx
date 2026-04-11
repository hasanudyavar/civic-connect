'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/report', label: 'Report', icon: PlusCircle },
  { href: '/dashboard', label: 'Complaints', icon: FileText },
  { href: '/dashboard', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 glass-card !rounded-none !border-x-0 !border-b-0 z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-colors',
                isActive ? 'text-[var(--primary)]' : 'text-[var(--outline)]'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
