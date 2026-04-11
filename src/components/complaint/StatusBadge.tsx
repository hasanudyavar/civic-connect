'use client';

import { ComplaintStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const statusClassMap: Record<string, string> = {
  NEW: 'badge-new',
  ASSIGNED: 'badge-assigned',
  IN_PROGRESS: 'badge-in-progress',
  RESOLVED: 'badge-resolved',
  CLOSED: 'badge-closed',
  ESCALATED: 'badge-escalated',
  REOPENED: 'badge-reopened',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const statusClass = statusClassMap[status] || 'badge-new';

  return (
    <span className={cn(
      'badge', statusClass,
      size === 'md' && 'text-sm px-3 py-1'
    )}>
      {config?.label || status}
    </span>
  );
}
