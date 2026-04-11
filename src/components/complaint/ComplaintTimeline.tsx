'use client';

import { TimelineEntry, ComplaintStatus } from '@/lib/types';
import { STATUS_CONFIG, COMPLAINT_PROGRESS_STEPS } from '@/lib/constants';
import { formatDateTime, cn } from '@/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

interface ComplaintTimelineProps {
  entries: TimelineEntry[];
  currentStatus?: string;
}

export function ComplaintTimeline({ entries }: ComplaintTimelineProps) {
  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const config = STATUS_CONFIG[entry.new_status as ComplaintStatus] || STATUS_CONFIG.NEW;
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isLast ? 'bg-[var(--primary)] text-[var(--background)]' : 'bg-[rgba(255,255,255,0.08)]'
              )}>
                {isLast ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[var(--outline)]" />
                )}
              </div>
              {!isLast && (
                <div className="w-0.5 h-full min-h-[40px] bg-[var(--glass-border)]" />
              )}
            </div>
            <div className="pb-6 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('badge', config.bg)}>{config.label}</span>
                <span className="text-xs text-[var(--outline)]">{formatDateTime(entry.created_at)}</span>
              </div>
              {entry.note && (
                <p className="text-sm text-[var(--on-surface-variant)] mt-1">{entry.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Progress stepper component
interface ProgressStepperProps {
  currentStatus: string;
}

export function ProgressStepper({ currentStatus }: ProgressStepperProps) {
  const currentIndex = COMPLAINT_PROGRESS_STEPS.indexOf(currentStatus as typeof COMPLAINT_PROGRESS_STEPS[number]);

  return (
    <div className="flex items-center justify-between w-full">
      {COMPLAINT_PROGRESS_STEPS.map((step, index) => {
        const config = STATUS_CONFIG[step];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                isCompleted && 'step-completed',
                isCurrent && 'step-active',
                !isCompleted && !isCurrent && 'step-pending'
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isCurrent ? 'text-[var(--primary)]' : 'text-[var(--outline)]'
              )}>
                {config.label}
              </span>
            </div>
            {index < COMPLAINT_PROGRESS_STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1',
                index < currentIndex ? 'bg-[var(--success)]' : 'bg-[var(--glass-border)]'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
