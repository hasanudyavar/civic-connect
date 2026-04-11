'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn('glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-container-highest)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[11px] font-bold text-[var(--outline)] uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-[var(--on-surface)] tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-medium text-[var(--on-surface-variant)]">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3 bg-[var(--glass-bg)] w-max px-2 py-1 rounded-md border border-[var(--glass-border)]">
              <span className={cn(
                'text-[10px] font-bold tracking-wide flex items-center gap-0.5',
                trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[10px] font-medium text-[var(--outline)]">vs last month</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[var(--glass-bg-hover)] to-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 group-hover:border-[var(--primary)] transition-all duration-500">
          <Icon className="w-5 h-5 text-[var(--primary)] drop-shadow-[0_0_8px_currentColor]" />
        </div>
      </div>
    </div>
  );
}
