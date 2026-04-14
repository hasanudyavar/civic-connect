-- Set up explicit GRANTS for PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects just to be safe
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Enable RLS on all tables
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- SUPER SIMPLE RLS: Everyone can read basic data. Admins can do anything. Citizens can manage their own data.
-- 1. PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- 2. MASTER DATA (Wards, Depts, Categories, Settings)
CREATE POLICY "Master data viewable by everyone" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Master data viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Master data viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Master data viewable by everyone" ON public.system_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage wards" ON public.wards FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- 3. COMPLAINTS & RELATED DATA
CREATE POLICY "Complaints viewable by everyone" ON public.complaints FOR SELECT USING (
    is_public = true OR
    citizen_id = auth.uid() OR
    public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin')
);
CREATE POLICY "Citizens can insert complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = citizen_id);
CREATE POLICY "Citizens can update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() = citizen_id);
CREATE POLICY "Staff can update any complaint" ON public.complaints FOR UPDATE USING (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Admins can insert/delete complaints" ON public.complaints FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Media
CREATE POLICY "Media viewable by everyone" ON public.complaint_media FOR SELECT USING (
    is_public = true OR
    public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.citizen_id = auth.uid())
);
CREATE POLICY "Anyone can upload media" ON public.complaint_media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage media" ON public.complaint_media FOR ALL USING (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));

-- Comments
CREATE POLICY "Comments viewable by everyone" ON public.complaint_comments FOR SELECT USING (
    is_public = true OR
    public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.citizen_id = auth.uid())
);
CREATE POLICY "Anyone can insert comment" ON public.complaint_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins can manage comments" ON public.complaint_comments FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Status History
CREATE POLICY "Status history viewable by everyone" ON public.complaint_status_history FOR SELECT USING (true);
CREATE POLICY "Staff can insert history" ON public.complaint_status_history FOR INSERT WITH CHECK (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage history" ON public.complaint_status_history FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Internal Notes (Only Staff)
CREATE POLICY "Notes viewable by staff" ON public.complaint_notes FOR SELECT USING (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Staff can insert notes" ON public.complaint_notes FOR INSERT WITH CHECK (auth.uid() = author_id AND public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage notes" ON public.complaint_notes FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Notifications (Own only + Admins)
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Escalations & SLAs (Staff only)
CREATE POLICY "Escalations viewable by staff" ON public.escalations FOR SELECT USING (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Staff can insert escalations" ON public.escalations FOR INSERT WITH CHECK (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage escalations" ON public.escalations FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

CREATE POLICY "SLAs viewable by staff" ON public.sla_breaches FOR SELECT USING (public.get_my_role() IN ('dept_staff', 'ward_supervisor', 'taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage SLAs" ON public.sla_breaches FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));

-- Audit Log (Admins only)
CREATE POLICY "Audit viewable by admins" ON public.system_audit_log FOR SELECT USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));
CREATE POLICY "Admins can manage audit log" ON public.system_audit_log FOR ALL USING (public.get_my_role() IN ('taluk_admin', 'super_admin'));
