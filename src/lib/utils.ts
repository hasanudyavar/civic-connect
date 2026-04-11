// Bhatkal Civic Connect — Utility Functions (Production)

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';

// ── Tailwind class merge ───────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Sanitize text input ────────────────────────────────────────
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// ── Date formatting ────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ── SLA Countdown ──────────────────────────────────────────────
export function getSLACountdown(deadline: string): {
  text: string;
  color: 'green' | 'yellow' | 'red';
  isOverdue: boolean;
} {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursLeft = differenceInHours(deadlineDate, now);
  const minutesLeft = differenceInMinutes(deadlineDate, now);

  if (minutesLeft <= 0) {
    const overdueHours = Math.abs(hoursLeft);
    const overdueMins = Math.abs(minutesLeft) % 60;
    return { text: `Overdue by ${overdueHours}h ${overdueMins}m`, color: 'red', isOverdue: true };
  }

  if (hoursLeft < 24) {
    const mins = minutesLeft % 60;
    return { text: `${hoursLeft}h ${mins}m remaining`, color: 'yellow', isOverdue: false };
  }

  const days = Math.floor(hoursLeft / 24);
  const hrs = hoursLeft % 24;
  return { text: `${days}d ${hrs}h remaining`, color: 'green', isOverdue: false };
}

// ── File validation ────────────────────────────────────────────
export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed';
  }
  if (file.size > maxSize) {
    return 'Image must be less than 5MB';
  }
  // Check for suspicious filenames
  if (/[<>:"/\\|?*]/.test(file.name)) {
    return 'Invalid file name';
  }
  return null;
}

// ── File to Base64 ─────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Formatters ─────────────────────────────────────────────────
export function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ── Clipboard ──────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Debounce ───────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Coordinate privacy ────────────────────────────────────────
export function roundCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  const offset = () => (Math.random() - 0.5) * 0.0036;
  return {
    lat: Math.round((lat + offset()) * 1000) / 1000,
    lng: Math.round((lng + offset()) * 1000) / 1000,
  };
}

// ── CSV Export ─────────────────────────────────────────────────
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = String(row[h] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Role permission checks ────────────────────────────────────
export function canManageUser(currentRole: string, targetRole: string): boolean {
  if (currentRole === 'super_admin') return true;
  if (currentRole === 'taluk_admin') {
    return ['dept_staff', 'ward_supervisor'].includes(targetRole);
  }
  return false;
}

export function canToggleUserStatus(currentRole: string, targetRole: string): boolean {
  if (currentRole === 'super_admin') return true;
  if (currentRole === 'taluk_admin') {
    // TA can NOT activate/deactivate citizens
    return ['dept_staff', 'ward_supervisor'].includes(targetRole);
  }
  return false;
}
