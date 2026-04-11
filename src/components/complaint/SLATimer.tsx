'use client';

import { useEffect, useState } from 'react';
import { ComplaintStatus } from '@/lib/types';
import { getSLACountdown } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLATimerProps {
  deadline: string;
  status: ComplaintStatus;
}

export function SLATimer({ deadline, status }: SLATimerProps) {
  const [countdown, setCountdown] = useState(getSLACountdown(deadline));

  useEffect(() => {
    // Don't tick on terminal states
    if (status === 'RESOLVED' || status === 'CLOSED') return;

    const interval = setInterval(() => {
      setCountdown(getSLACountdown(deadline));
    }, 60000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (status === 'RESOLVED' || status === 'CLOSED') return null;

  const colorClasses = {
    green: 'text-[var(--success)] bg-[var(--success-bg)]',
    yellow: 'text-[var(--warning)] bg-[var(--warning-bg)]',
    red: 'text-[var(--danger)] bg-[var(--danger-bg)]',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', colorClasses[countdown.color])}>
      {countdown.isOverdue ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {countdown.text}
    </div>
  );
}
