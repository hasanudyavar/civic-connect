-- ============================================================
-- Civic Connect — Complete Production Schema v3.0
-- Run in Supabase SQL Editor FIRST
-- Idempotent: safe to re-run
-- ============================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for crypt() / gen_salt()

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED',
    'REOPENED', 'ESCALATED', 'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'STATUS_CHANGE', 'ASSIGNMENT', 'ESCALATION',
    'SLA_WARNING', 'SLA_BREACH', 'COMMENT', 'RESOLUTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Wards
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ward_number INTEGER NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT 'Bhatkal',
    boundary GEOMETRY(POLYGON, 4326),
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    head_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'citizen',
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'kn', 'hi')),
    notification_prefs JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_kn TEXT,
    name_hi TEXT,
    icon TEXT,
    color TEXT DEFAULT '#2563EB',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    sla_response_hours INTEGER NOT NULL DEFAULT 24,
    sla_resolution_hours INTEGER NOT NULL DEFAULT 72,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints (core table)
-- NOTE: ticket_id defaults to '' and is auto-filled by the generate_ticket_id trigger.
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT UNIQUE NOT NULL DEFAULT '',
    citizen_id UUID NOT NULL REFERENCES profiles(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

    status complaint_status NOT NULL DEFAULT 'NEW',
    priority priority_level DEFAULT 'NORMAL',

    title TEXT NOT NULL CHECK (char_length(title) >= 5),
    description TEXT NOT NULL CHECK (char_length(description) >= 20),
    ai_description TEXT,

    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    public_location GEOMETRY(POINT, 4326),

    -- SLA tracking
    response_sla_deadline TIMESTAMPTZ,
    resolution_sla_deadline TIMESTAMPTZ,
    response_sla_breached BOOLEAN DEFAULT false,
    resolution_sla_breached BOOLEAN DEFAULT false,

    -- Duplicate detection
    is_duplicate_flagged BOOLEAN DEFAULT false,
    duplicate_of UUID REFERENCES complaints(id) ON DELETE SET NULL,

    -- Flags
    is_public BOOLEAN DEFAULT true,
    image_verified BOOLEAN DEFAULT false,
    citizen_rating SMALLINT CHECK (citizen_rating BETWEEN 1 AND 5),
    citizen_feedback TEXT,

    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint media
CREATE TABLE IF NOT EXISTS complaint_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    media_type TEXT NOT NULL DEFAULT 'evidence' CHECK (media_type IN ('evidence', 'resolution', 'escalation')),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ai_verified BOOLEAN DEFAULT false,
    ai_confidence REAL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history (immutable audit trail)
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    old_status complaint_status,
    new_status complaint_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    note TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal staff notes (not visible to citizens)
CREATE TABLE IF NOT EXISTS complaint_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public comments (visible to citizens)
CREATE TABLE IF NOT EXISTS complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL CHECK (char_length(content) >= 2),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation logs
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    from_status complaint_status,
    to_status complaint_status DEFAULT 'ESCALATED',
    reason TEXT NOT NULL,
    is_auto BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA breach records
CREATE TABLE IF NOT EXISTS sla_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    breach_type TEXT NOT NULL CHECK (breach_type IN ('response', 'resolution')),
    breached_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System audit log (immutable)
CREATE TABLE IF NOT EXISTS system_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings (Super Admin configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_complaints_citizen    ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ward       ON complaints(ward_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status     ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category   ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned   ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_created    ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_ticket     ON complaints(ticket_id);
CREATE INDEX IF NOT EXISTS idx_complaints_geo        ON complaints USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_complaints_public_geo ON complaints USING GIST(public_location);
CREATE INDEX IF NOT EXISTS idx_complaints_title_trgm ON complaints USING GIN(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_role         ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_ward         ON profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department   ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active       ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_comments_complaint       ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_media_complaint          ON complaint_media(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created    ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_complaint    ON escalations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_complaint   ON sla_breaches(complaint_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity             ON system_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created            ON system_audit_log(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_complaints_updated
    BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_wards_updated
    BEFORE UPDATE ON wards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prevent modification of immutable tables
CREATE OR REPLACE FUNCTION prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'This table is immutable. UPDATE and DELETE are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_status_history_immutable
    BEFORE UPDATE OR DELETE ON complaint_status_history
    FOR EACH ROW EXECUTE FUNCTION prevent_modification();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON system_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_modification();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Generate sequential ticket ID (race-condition safe with advisory lock)
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');

  -- Advisory lock prevents concurrent inserts from getting same sequence
  PERFORM pg_advisory_xact_lock(hashtext('ticket_id_' || year_str));

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(ticket_id, '-', 3) AS INTEGER)
  ), 0) + 1 INTO seq_num
  FROM complaints
  WHERE ticket_id LIKE 'CC-' || year_str || '-%';

  NEW.ticket_id := 'CC-' || year_str || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER trg_generate_ticket_id
    BEFORE INSERT ON complaints
    FOR EACH ROW
    WHEN (NEW.ticket_id IS NULL OR NEW.ticket_id = '')
    EXECUTE FUNCTION generate_ticket_id();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Set SLA deadlines on complaint creation
CREATE OR REPLACE FUNCTION set_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  resp_hours INTEGER;
  resol_hours INTEGER;
BEGIN
  SELECT sla_response_hours, sla_resolution_hours
  INTO resp_hours, resol_hours
  FROM categories WHERE id = NEW.category_id;

  IF resp_hours IS NOT NULL THEN
    NEW.response_sla_deadline := NOW() + (resp_hours || ' hours')::INTERVAL;
  END IF;
  IF resol_hours IS NOT NULL THEN
    NEW.resolution_sla_deadline := NOW() + (resol_hours || ' hours')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER trg_set_sla
    BEFORE INSERT ON complaints
    FOR EACH ROW EXECUTE FUNCTION set_sla_deadlines();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create status history on complaint status change
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, COALESCE(auth.uid(), NEW.assigned_to));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER trg_log_status_change
    AFTER UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validate state machine transitions
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Valid transitions
  IF (OLD.status = 'NEW'         AND NEW.status IN ('ASSIGNED', 'ESCALATED')) OR
     (OLD.status = 'ASSIGNED'    AND NEW.status IN ('IN_PROGRESS', 'ESCALATED')) OR
     (OLD.status = 'IN_PROGRESS' AND NEW.status IN ('RESOLVED', 'ESCALATED')) OR
     (OLD.status = 'RESOLVED'    AND NEW.status IN ('CLOSED', 'REOPENED')) OR
     (OLD.status = 'REOPENED'    AND NEW.status IN ('ASSIGNED', 'ESCALATED')) OR
     (OLD.status = 'ESCALATED'   AND NEW.status IN ('ASSIGNED'))
  THEN
    -- Set timestamps
    IF NEW.status = 'ASSIGNED' AND OLD.assigned_at IS NULL THEN
      NEW.assigned_at := NOW();
    END IF;
    IF NEW.status = 'RESOLVED' THEN NEW.resolved_at := NOW(); END IF;
    IF NEW.status = 'CLOSED'   THEN NEW.closed_at   := NOW(); END IF;
    IF NEW.status = 'REOPENED' THEN
      NEW.resolved_at := NULL;
      NEW.closed_at   := NULL;
    END IF;
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER trg_validate_transition
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_status_transition();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Duplicate detection function
CREATE OR REPLACE FUNCTION check_duplicate_complaints(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_category_id UUID,
  p_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
  id UUID,
  ticket_id TEXT,
  title TEXT,
  status complaint_status,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.ticket_id, c.title, c.status,
    ST_Distance(
      c.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_meters,
    c.created_at
  FROM complaints c
  WHERE ST_DWithin(
    c.location::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    200
  )
  AND c.category_id = p_category_id
  AND c.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
  AND c.status NOT IN ('CLOSED')
  ORDER BY distance_meters ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get user role helper
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Get user ward helper
CREATE OR REPLACE FUNCTION get_my_ward()
RETURNS UUID AS $$
  SELECT ward_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    'citizen'
  )
  ON CONFLICT (id) DO NOTHING;
  -- ON CONFLICT DO NOTHING prevents duplicate errors when profile
  -- is created manually (e.g. by the superadmin seeder or create-user API)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and re-create the auth trigger to avoid stale references
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SYSTEM SETTINGS — seed defaults
-- ============================================================
INSERT INTO system_settings (key, value) VALUES
  ('city_name', 'Bhatkal'),
  ('web_name', 'Civic Connect'),
  ('logo_url', ''),
  ('primary_color', '#006948'),
  ('support_email', 'support@bhatkal.gov.in'),
  ('support_phone', '+91 8382 123456')
ON CONFLICT (key) DO NOTHING;