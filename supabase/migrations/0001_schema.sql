-- Enable pgcrypto for UUIDs and hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Types
CREATE TYPE public.user_role AS ENUM ('citizen', 'dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin');
CREATE TYPE public.complaint_status AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'ESCALATED', 'CLOSED');
CREATE TYPE public.priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE public.notification_type AS ENUM ('STATUS_CHANGE', 'ASSIGNMENT', 'ESCALATION', 'SLA_WARNING', 'SLA_BREACH', 'COMMENT', 'RESOLUTION');

-- 2. Base Tables
CREATE TABLE public.wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ward_number INTEGER NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT 'Bhatkal',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    head_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_kn TEXT,
    name_hi TEXT,
    icon TEXT,
    color TEXT DEFAULT '#2563EB',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    sla_response_hours INTEGER NOT NULL DEFAULT 24,
    sla_resolution_hours INTEGER NOT NULL DEFAULT 72,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'User',
    phone TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'citizen',
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    language TEXT DEFAULT 'en',
    notification_prefs JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT UNIQUE NOT NULL DEFAULT '',
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    category_id UUID NOT NULL REFERENCES public.categories(id),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.complaint_status NOT NULL DEFAULT 'NEW',
    priority public.priority_level DEFAULT 'NORMAL',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    ai_description TEXT,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    address TEXT,
    response_sla_deadline TIMESTAMPTZ,
    resolution_sla_deadline TIMESTAMPTZ,
    response_sla_breached BOOLEAN DEFAULT false,
    resolution_sla_breached BOOLEAN DEFAULT false,
    is_duplicate_flagged BOOLEAN DEFAULT false,
    duplicate_of UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    image_verified BOOLEAN DEFAULT false,
    citizen_rating SMALLINT,
    citizen_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.complaint_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    media_type TEXT NOT NULL DEFAULT 'evidence',
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ai_verified BOOLEAN DEFAULT false,
    ai_confidence REAL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    old_status public.complaint_status,
    new_status public.complaint_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.complaint_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    escalated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    from_status public.complaint_status,
    to_status public.complaint_status DEFAULT 'ESCALATED',
    reason TEXT NOT NULL,
    is_auto BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sla_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    breach_type TEXT NOT NULL,
    breached_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core Triggers & Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    CAST(COALESCE(NEW.raw_app_meta_data->>'role', 'citizen') AS public.user_role)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- ALWAYS return NEW so auth creation does not fail
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Utility to get role cleanly
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_wards_updated BEFORE UPDATE ON public.wards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Ticket ID generator
CREATE OR REPLACE FUNCTION public.generate_ticket_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(ticket_id, '-', 3) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.complaints
  WHERE ticket_id LIKE 'CC-' || year_str || '-%';

  NEW.ticket_id := 'CC-' || year_str || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_ticket_id BEFORE INSERT ON public.complaints
FOR EACH ROW WHEN (NEW.ticket_id IS NULL OR NEW.ticket_id = '') 
EXECUTE FUNCTION public.generate_ticket_id();

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_ward_id ON public.profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_category_id ON public.complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ward_id ON public.complaints(ward_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_id ON public.complaints(ticket_id text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_complaint_media_complaint_id ON public.complaint_media(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint_id ON public.complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_notes_complaint_id ON public.complaint_notes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON public.complaint_comments(complaint_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_complaint_id ON public.escalations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_complaint_id ON public.sla_breaches(complaint_id);
