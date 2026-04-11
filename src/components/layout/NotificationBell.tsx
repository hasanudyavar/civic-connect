'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface Notification {
  id: string;
  type: 'status_change' | 'assignment' | 'sla_warning' | 'escalation' | 'rating';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'status_change', title: 'Complaint Updated', message: 'CC-2024-100001 moved to In Progress', time: '2 hours ago', read: false, link: '/complaint/complaint-001' },
  { id: 'n2', type: 'assignment', title: 'New Assignment', message: 'You have been assigned CC-2024-100004', time: '5 hours ago', read: false, link: '/complaint/complaint-004' },
  { id: 'n3', type: 'sla_warning', title: 'SLA Warning', message: 'CC-2024-100005 SLA breach in 6 hours', time: '1 day ago', read: true },
  { id: 'n4', type: 'escalation', title: 'Auto-Escalated', message: 'CC-2024-100005 escalated to supervisor', time: '1 day ago', read: true },
  { id: 'n5', type: 'status_change', title: 'Complaint Resolved', message: 'CC-2024-100002 has been resolved', time: '2 days ago', read: true },
];

const typeIcons = {
  status_change: CheckCircle2,
  assignment: ArrowRight,
  sla_warning: AlertTriangle,
  escalation: AlertTriangle,
  rating: CheckCircle2,
};

const typeColors = {
  status_change: 'text-[var(--secondary)] bg-[var(--blue-light)]',
  assignment: 'text-[var(--success)] bg-[var(--success-bg)]',
  sla_warning: 'text-[var(--warning)] bg-[var(--warning-bg)]',
  escalation: 'text-[var(--danger)] bg-[var(--danger-bg)]',
  rating: 'text-[var(--primary)] bg-[var(--surface-container-highest)]',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card z-50 max-h-[70vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
            <h3 className="text-sm font-semibold text-[var(--on-surface)]" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[var(--primary)] font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[400px] divide-y divide-[var(--glass-border-light)]">
            {notifications.map(n => {
              const Icon = typeIcons[n.type];
              const colorClass = typeColors[n.type];
              return (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                  className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors ${!n.read ? 'bg-[rgba(59,130,246,0.06)]' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-[var(--on-surface)]">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 bg-[var(--secondary)] rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[var(--outline)] mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-[var(--outline)] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{n.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
