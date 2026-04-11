// Bhatkal Civic Connect — App Constants (Production)
// Aligned with database enums and triggers

import { ComplaintStatus, UserRole } from './types';

// ── Status Colors & Labels ─────────────────────────────────────
export const STATUS_CONFIG: Record<ComplaintStatus, { bg: string; text: string; label: string; color: string }> = {
  NEW:          { bg: 'badge-new',         text: '', label: 'New',          color: '#3b82f6' },
  ASSIGNED:     { bg: 'badge-assigned',    text: '', label: 'Assigned',     color: '#8b5cf6' },
  IN_PROGRESS:  { bg: 'badge-in-progress', text: '', label: 'In Progress',  color: '#f59e0b' },
  RESOLVED:     { bg: 'badge-resolved',    text: '', label: 'Resolved',     color: '#10b981' },
  REOPENED:     { bg: 'badge-reopened',     text: '', label: 'Reopened',     color: '#f97316' },
  CLOSED:       { bg: 'badge-closed',      text: '', label: 'Closed',       color: '#6b7280' },
  ESCALATED:    { bg: 'badge-escalated',   text: '', label: 'Escalated',    color: '#ef4444' },
};

// Backwards compat alias
export const STATUS_COLORS = STATUS_CONFIG;

// ── Role Configuration ─────────────────────────────────────────
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  citizen: 0,
  dept_staff: 1,
  ward_supervisor: 2,
  taluk_admin: 3,
  super_admin: 4,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  dept_staff: 'Department Staff',
  ward_supervisor: 'Ward Supervisor',
  taluk_admin: 'City Admin',
  super_admin: 'Super Admin',
};

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  citizen: '/citizen/dashboard',
  dept_staff: '/staff/dashboard',
  ward_supervisor: '/supervisor/dashboard',
  taluk_admin: '/admin/dashboard',
  super_admin: '/superadmin/dashboard',
};

// ── Complaint State Machine (matches DB trigger validate_status_transition) ──
export const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  NEW:          ['ASSIGNED', 'ESCALATED'],
  ASSIGNED:     ['IN_PROGRESS', 'ESCALATED'],
  IN_PROGRESS:  ['RESOLVED', 'ESCALATED'],
  RESOLVED:     ['CLOSED', 'REOPENED'],
  REOPENED:     ['ASSIGNED', 'ESCALATED'],
  CLOSED:       [],
  ESCALATED:    ['ASSIGNED'],
};

export const COMPLAINT_PROGRESS_STEPS: ComplaintStatus[] = [
  'NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
];

// ── Map Defaults (Bhatkal Center) ──────────────────────────────
export const BHATKAL_CENTER = {
  lat: 13.9856,
  lng: 74.5553,
  zoom: 14,
};

// ── Upload Limits ──────────────────────────────────────────────
export const MAX_IMAGES = 3;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Pagination ─────────────────────────────────────────────────
export const PAGE_SIZE = 20;

// ── SLA Thresholds ─────────────────────────────────────────────
export const SLA_WARNING_HOURS = 24;

// ── Priority Config ────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      color: '#6b7280', icon: 'ArrowDown' },
  NORMAL:   { label: 'Normal',   color: '#f59e0b', icon: 'Minus' },
  HIGH:     { label: 'High',     color: '#ef4444', icon: 'ArrowUp' },
  CRITICAL: { label: 'Critical', color: '#dc2626', icon: 'AlertTriangle' },
} as const;
