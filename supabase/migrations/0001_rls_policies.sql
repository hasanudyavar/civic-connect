-- ============================================================
-- Civic Connect — Hardened RLS Policies v3.0
-- Run AFTER 0000_schema.sql
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE
-- ============================================================

-- Enable RLS on ALL tables
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints              ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_media         ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_breaches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: Drop all existing policies to make this script idempotent
-- ============================================================
DO $$
DECLARE
  _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol.policyname, _pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- SYSTEM SETTINGS
-- Readable by everyone (including anon for branding).
-- Writable only by taluk_admin / super_admin.
-- ============================================================
CREATE POLICY "settings_anon_select" ON system_settings
  FOR SELECT TO anon USING (true);

CREATE POLICY "settings_auth_select" ON system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_admin_insert" ON system_settings
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "settings_admin_update" ON system_settings
  FOR UPDATE TO authenticated
  USING  (get_my_role() IN ('taluk_admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "settings_admin_delete" ON system_settings
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- ============================================================
-- WARDS
-- Readable by everyone (anon needs ward names for transparency).
-- Writable only by admins.
-- ============================================================
CREATE POLICY "wards_anon_select" ON wards
  FOR SELECT TO anon USING (true);

CREATE POLICY "wards_auth_select" ON wards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "wards_admin_insert" ON wards
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "wards_admin_update" ON wards
  FOR UPDATE TO authenticated
  USING  (get_my_role() IN ('taluk_admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "wards_admin_delete" ON wards
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- ============================================================
-- DEPARTMENTS
-- Readable by all authenticated. Writable by admins.
-- ============================================================
CREATE POLICY "departments_auth_select" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_admin_insert" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "departments_admin_update" ON departments
  FOR UPDATE TO authenticated
  USING  (get_my_role() IN ('taluk_admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "departments_admin_delete" ON departments
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- ============================================================
-- CATEGORIES
-- Readable by everyone (anon needs categories for transparency page).
-- Writable only by admins.
-- ============================================================
CREATE POLICY "categories_anon_select" ON categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "categories_auth_select" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_admin_insert" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE TO authenticated
  USING  (get_my_role() IN ('taluk_admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- ============================================================
-- PROFILES
-- ============================================================
-- Citizens can read their own profile
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Staff and above can view all profiles
CREATE POLICY "profiles_staff_select" ON profiles
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));

-- Users can update their own profile but CANNOT change their own role
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );

-- Admins can manage (insert/update/delete) any profile
CREATE POLICY "profiles_admin_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    OR get_my_role() IN ('taluk_admin', 'super_admin')
  );

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE TO authenticated
  USING  (get_my_role() IN ('taluk_admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "profiles_admin_delete" ON profiles
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- ============================================================
-- COMPLAINTS
-- ============================================================
-- Citizens see own + public + assigned complaints. Staff/admins see all.
CREATE POLICY "complaints_select" ON complaints
  FOR SELECT TO authenticated
  USING (
    citizen_id = auth.uid() OR
    assigned_to = auth.uid() OR
    is_public = true OR
    get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin') OR
    (get_my_role() = 'dept_staff' AND assigned_to = auth.uid())
  );

-- Anon can see public complaints (transparency dashboard)
CREATE POLICY "complaints_anon_select" ON complaints
  FOR SELECT TO anon
  USING (is_public = true);

-- Only citizens can submit complaints (citizen_id MUST equal auth.uid())
CREATE POLICY "complaints_citizen_insert" ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'citizen' AND
    citizen_id = auth.uid()
  );

-- Staff/admins can update complaints they're assigned to or have authority over.
-- Citizens can update only their own complaints (e.g. citizen_rating, feedback).
CREATE POLICY "complaints_update" ON complaints
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid() OR
    get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin') OR
    (get_my_role() = 'citizen' AND citizen_id = auth.uid())
  )
  WITH CHECK (
    assigned_to = auth.uid() OR
    get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin') OR
    (get_my_role() = 'citizen' AND citizen_id = auth.uid())
  );

-- No DELETE policy = nobody can delete complaints (by design)

-- ============================================================
-- COMPLAINT MEDIA
-- ============================================================
CREATE POLICY "media_select" ON complaint_media
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    is_public = true OR
    get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin')
  );

CREATE POLICY "media_anon_select" ON complaint_media
  FOR SELECT TO anon
  USING (is_public = true);

CREATE POLICY "media_insert" ON complaint_media
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- STATUS HISTORY (immutable — SELECT only, insert via trigger)
-- ============================================================
CREATE POLICY "status_history_select" ON complaint_status_history
  FOR SELECT TO authenticated
  USING (
    is_public = true OR
    get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin')
  );
-- NOTE: Inserts are handled by the log_status_change() SECURITY DEFINER trigger.

-- ============================================================
-- NOTES (internal — staff only)
-- ============================================================
CREATE POLICY "notes_staff_select" ON complaint_notes
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));

CREATE POLICY "notes_staff_insert" ON complaint_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin') AND
    author_id = auth.uid()
  );

-- ============================================================
-- COMMENTS (public-facing)
-- ============================================================
CREATE POLICY "comments_select" ON complaint_comments
  FOR SELECT TO authenticated
  USING (
    is_public = true OR
    author_id = auth.uid() OR
    get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin')
  );

CREATE POLICY "comments_insert" ON complaint_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS (user-scoped — each user sees only their own)
-- ============================================================
CREATE POLICY "notifications_own_select" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert via server/triggers only (service role bypasses RLS)

-- ============================================================
-- ESCALATIONS
-- ============================================================
CREATE POLICY "escalations_select" ON escalations
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin'));

CREATE POLICY "escalations_insert" ON escalations
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin'));

-- ============================================================
-- SLA BREACHES
-- ============================================================
CREATE POLICY "sla_breaches_select" ON sla_breaches
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('ward_supervisor', 'taluk_admin', 'super_admin'));

-- Insert via cron/service role only

-- ============================================================
-- AUDIT LOG (immutable — admin read only)
-- ============================================================
CREATE POLICY "audit_admin_select" ON system_audit_log
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('taluk_admin', 'super_admin'));

-- Insert via SECURITY DEFINER triggers/service role only

-- ============================================================
-- STORAGE POLICIES (for complaint-images bucket)
-- ============================================================
-- These are applied via the Supabase Dashboard > Storage > Policies,
-- but we document them here for completeness:
--
-- INSERT: authenticated users can upload to complaint-images/
-- SELECT: anyone can read public images
-- DELETE: only the uploader or admins can delete
