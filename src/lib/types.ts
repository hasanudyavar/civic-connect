// Bhatkal Civic Connect — TypeScript Type Definitions (Production)
// Aligned with database schema in 0000_schema.sql

// ── Database Enums ──────────────────────────────────────────────
export type UserRole = 'citizen' | 'dept_staff' | 'ward_supervisor' | 'taluk_admin' | 'super_admin';
export type ComplaintStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'ESCALATED' | 'CLOSED';
export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type NotificationType = 'STATUS_CHANGE' | 'ASSIGNMENT' | 'ESCALATION' | 'SLA_WARNING' | 'SLA_BREACH' | 'COMMENT' | 'RESOLUTION';

// ── Core Entities ───────────────────────────────────────────────

export interface Ward {
  id: string;
  name: string;
  ward_number: number;
  city: string;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  email: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  head_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  // email is NOT in the profiles table — it comes from auth.users
  // We merge it in auth-context after fetching from supabase.auth.getUser()
  email?: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  ward_id: string | null;
  department_id: string | null;
  language: 'en' | 'kn' | 'hi';
  notification_prefs: Record<string, boolean> | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  ward?: Ward;
  department?: Department;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_kn: string | null;
  name_hi: string | null;
  icon: string;
  color: string;
  department_id: string | null;
  sla_response_hours: number;
  sla_resolution_hours: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // Joined
  department?: Department;
}

export interface Complaint {
  id: string;
  ticket_id: string;
  citizen_id: string;
  category_id: string;
  ward_id: string | null;
  department_id: string | null;
  assigned_to: string | null;
  status: ComplaintStatus;
  priority: PriorityLevel;
  title: string;
  description: string;
  ai_description: string | null;
  // PostGIS location — stored as GEOMETRY but we read lat/lng from queries
  address: string | null;
  response_sla_deadline: string | null;
  resolution_sla_deadline: string | null;
  response_sla_breached: boolean;
  resolution_sla_breached: boolean;
  is_duplicate_flagged: boolean;
  duplicate_of: string | null;
  is_public: boolean;
  image_verified: boolean;
  citizen_rating: number | null;
  citizen_feedback: string | null;
  submitted_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Virtual fields (set by queries or UI layer)
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  // Joined
  citizen?: Profile;
  assigned_staff?: Profile;
  ward?: Ward;
  department?: Department;
  category?: Category;
  images?: ComplaintImage[];
  timeline?: TimelineEntry[];
}

export interface ComplaintImage {
  id: string;
  complaint_id: string;
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  media_type: 'evidence' | 'resolution' | 'escalation';
  uploaded_by: string | null;
  ai_verified: boolean;
  ai_confidence: number | null;
  is_public: boolean;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  complaint_id: string;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  changed_by: string | null;
  note: string | null;
  is_public: boolean;
  created_at: string;
  // Joined
  changer?: Profile;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  author_id: string;
  content: string;
  is_public: boolean;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  complaint_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Escalation {
  id: string;
  complaint_id: string;
  escalated_by: string | null;
  escalated_to: string | null;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus;
  reason: string;
  is_auto: boolean;
  created_at: string;
}

export interface SLABreach {
  id: string;
  complaint_id: string;
  breach_type: 'response' | 'resolution';
  breached_at: string;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: Profile;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface CitizenInfoRequest {
  id: string;
  citizen_id: string;
  taluk_admin_id: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  requested_at: string;
  responded_at: string | null;
  expires_at: string | null;
  created_at: string;
  // Joined
  taluk_admin?: Profile;
  citizen?: Profile;
}

// ── API Types ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Form Types ─────────────────────────────────────────────────

export interface ComplaintFormData {
  category_id: string;
  ward_id: string;
  title: string;
  description: string;
  ai_description: string | null;
  location_lat: number;
  location_lng: number;
  location_address: string;
  priority: PriorityLevel;
  images: File[];
}

// ── Dashboard Stats ────────────────────────────────────────────

export interface DashboardStats {
  total_complaints: number;
  resolved_count: number;
  resolved_percentage: number;
  avg_resolution_days: number;
  active_count: number;
  overdue_count: number;
  sla_compliance: number;
}

export interface CategoryStat {
  category_name: string;
  category_slug: string;
  count: number;
  color: string;
}

export interface StatusStat {
  status: ComplaintStatus;
  count: number;
}

export interface WardStat {
  ward_name: string;
  total: number;
  resolved_percentage: number;
  avg_days: number;
  active: number;
}

export interface StaffPerformance {
  staff_name: string;
  assigned: number;
  resolved: number;
  avg_resolution_days: number;
  sla_breach_percentage: number;
}

// ── Map Types ──────────────────────────────────────────────────

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  status: ComplaintStatus;
  category: string;
  title?: string;
  ticket_id?: string;
  created_at?: string;
}
