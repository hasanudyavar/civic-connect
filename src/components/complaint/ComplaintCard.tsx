'use client';

import { Complaint } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { SLATimer } from './SLATimer';
import { formatDate, truncateText } from '@/lib/utils';
import { ChevronRight, Tag } from 'lucide-react';
import Link from 'next/link';

interface ComplaintCardProps {
  complaint: Complaint;
  linkPrefix?: string;
  showSLA?: boolean;
}

export function ComplaintCard({ complaint, linkPrefix = '/citizen/complaints', showSLA = true }: ComplaintCardProps) {
  const categoryName = complaint.category?.name_en || 'Unknown';
  const categoryColor = complaint.category?.color || '#6B7280';
  const isOverdue = complaint.resolution_sla_breached;
  const slaDeadline = complaint.resolution_sla_deadline;
  const isWarning = slaDeadline &&
    !isOverdue &&
    new Date(slaDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Link href={`${linkPrefix}/${complaint.id}`} className="block">
      <div className={`glass-card p-5 group cursor-pointer transition-all duration-400 relative overflow-hidden ${isOverdue ? '!border-l-4 !border-l-[var(--danger)]' : isWarning ? '!border-l-4 !border-l-[var(--warning)]' : '!border-l-4 !border-l-transparent'}`}>
        {/* Subtle Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-r-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Category Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-[var(--glass-border)] transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundColor: categoryColor + '15', color: categoryColor }}
            >
              <Tag className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider text-[var(--accent)] bg-[rgba(245,166,35,0.08)] px-2 py-0.5 rounded-md border border-[rgba(245,166,35,0.2)] uppercase">
                  #{complaint.ticket_id}
                </span>
                <StatusBadge status={complaint.status} />
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: categoryColor + '15', color: categoryColor }}>
                  {categoryName}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
                {truncateText(complaint.title, 80)}
              </h3>

              <div className="flex items-center gap-4 flex-wrap mt-1">
                {showSLA && slaDeadline && (
                  <SLATimer deadline={slaDeadline} status={complaint.status} />
                )}
                <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wide uppercase">
                  Filed: {formatDate(complaint.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Icon */}
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--glass-bg)] group-hover:bg-[var(--accent)] group-hover:text-white text-[var(--text-muted)] transition-all duration-300 transform group-hover:translate-x-1 border border-[var(--glass-border)]">
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
