-- 1. Insert Departments
INSERT INTO public.departments (id, name, code, email, head_name) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Water Supply & Sanitation', 'WSS', 'water@bhatkal.gov.in', 'Rajesh K'),
    ('a2000000-0000-0000-0000-000000000002', 'Public Works (PWD)', 'PWD', 'pwd@bhatkal.gov.in', 'Suresh M'),
    ('a3000000-0000-0000-0000-000000000003', 'Solid Waste Management', 'SWM', 'waste@bhatkal.gov.in', 'Mohammed Ali'),
    ('a4000000-0000-0000-0000-000000000004', 'Electricity & Streetlights', 'ELE', 'elec@bhatkal.gov.in', 'Prakash Rao'),
    ('a5000000-0000-0000-0000-000000000005', 'Public Health', 'HLT', 'health@bhatkal.gov.in', 'Dr. Ramesh'),
    ('a6000000-0000-0000-0000-000000000006', 'Town Planning', 'TPL', 'planning@bhatkal.gov.in', 'Venkat S')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Wards
INSERT INTO public.wards (id, ward_number, name, contact_phone) VALUES
    ('b0100000-0000-0000-0000-000000000001', 1, 'Makhdoom Colony', '9988776601'),
    ('b0200000-0000-0000-0000-000000000002', 2, 'Navayath Colony', '9988776602'),
    ('b0300000-0000-0000-0000-000000000003', 3, 'Maghdoom', '9988776603'),
    ('b0400000-0000-0000-0000-000000000004', 4, 'Bunder Road', '9988776604'),
    ('b0500000-0000-0000-0000-000000000005', 5, 'Shirali', '9988776605'),
    ('b0600000-0000-0000-0000-000000000006', 6, 'Gorte', '9988776606'),
    ('b0700000-0000-0000-0000-000000000007', 7, 'Muttalli', '9988776607'),
    ('b0800000-0000-0000-0000-000000000008', 8, 'Murdeshwar', '9988776608')
ON CONFLICT (ward_number) DO NOTHING;

-- 3. Insert Categories
INSERT INTO public.categories (id, slug, name_en, department_id, icon, color) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'water-leak', 'Water Leakage', 'a1000000-0000-0000-0000-000000000001', 'Droplet', '#3B82F6'),
    ('c2000000-0000-0000-0000-000000000002', 'no-water', 'No Water Supply', 'a1000000-0000-0000-0000-000000000001', 'Droplets', '#1D4ED8'),
    ('c3000000-0000-0000-0000-000000000003', 'pothole', 'Pothole', 'a2000000-0000-0000-0000-000000000002', 'Construction', '#6B7280'),
    ('c4000000-0000-0000-0000-000000000004', 'broken-road', 'Broken Road', 'a2000000-0000-0000-0000-000000000002', 'Map', '#4B5563'),
    ('c5000000-0000-0000-0000-000000000005', 'garbage', 'Garbage Dump', 'a3000000-0000-0000-0000-000000000003', 'Trash2', '#10B981'),
    ('c6000000-0000-0000-0000-000000000006', 'streetlight', 'Streetlight Not Working', 'a4000000-0000-0000-0000-000000000004', 'Lightbulb', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- 4. Initial System Settings
INSERT INTO public.system_settings (key, value) VALUES
    ('app_name', 'Civic Connect Bhatkal'),
    ('city_name', 'Bhatkal'),
    ('helpline_number', '1800-425-1234'),
    ('emergency_number', '112'),
    ('support_email', 'support@bhatkal.gov.in')
ON CONFLICT (key) DO NOTHING;

-- 5. Seed Users
-- Delete if exists
DELETE FROM auth.users WHERE email IN ('superadmin@system.com', 'cityadmin@system.com', 'ws@system.com', 'staff@system.com');

-- A) Superadmin
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a2f2eecb-3942-431e-83a4-254baca904bc',
    'authenticated', 'authenticated', 'superadmin@system.com',
    crypt('superadmin', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "super_admin"}',
    '{"full_name": "Super Administrator", "phone": "+91 9999999999"}',
    FALSE, NOW(), NOW(), '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (gen_random_uuid(), 'a2f2eecb-3942-431e-83a4-254baca904bc', 'a2f2eecb-3942-431e-83a4-254baca904bc', format('{"sub": "%s", "email": "%s"}', 'a2f2eecb-3942-431e-83a4-254baca904bc', 'superadmin@system.com')::jsonb, 'email', NOW(), NOW(), NOW());
UPDATE public.profiles SET role = 'super_admin'::public.user_role WHERE id = 'a2f2eecb-3942-431e-83a4-254baca904bc';

-- B) City Admin (Taluk Admin)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b2f2eecb-3942-431e-83a4-254baca904bc',
    'authenticated', 'authenticated', 'cityadmin@system.com',
    crypt('city admin', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "taluk_admin"}',
    '{"full_name": "City Administrator", "phone": "+91 8888888888"}',
    FALSE, NOW(), NOW(), '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (gen_random_uuid(), 'b2f2eecb-3942-431e-83a4-254baca904bc', 'b2f2eecb-3942-431e-83a4-254baca904bc', format('{"sub": "%s", "email": "%s"}', 'b2f2eecb-3942-431e-83a4-254baca904bc', 'cityadmin@system.com')::jsonb, 'email', NOW(), NOW(), NOW());
UPDATE public.profiles SET role = 'taluk_admin'::public.user_role WHERE id = 'b2f2eecb-3942-431e-83a4-254baca904bc';

-- C) Ward Supervisor
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'c2f2eecb-3942-431e-83a4-254baca904bc',
    'authenticated', 'authenticated', 'ws@system.com',
    crypt('ws', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "ward_supervisor"}',
    '{"full_name": "Ward Supervisor", "phone": "+91 7777777777"}',
    FALSE, NOW(), NOW(), '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (gen_random_uuid(), 'c2f2eecb-3942-431e-83a4-254baca904bc', 'c2f2eecb-3942-431e-83a4-254baca904bc', format('{"sub": "%s", "email": "%s"}', 'c2f2eecb-3942-431e-83a4-254baca904bc', 'ws@system.com')::jsonb, 'email', NOW(), NOW(), NOW());
UPDATE public.profiles SET role = 'ward_supervisor'::public.user_role, ward_id = 'b0100000-0000-0000-0000-000000000001' WHERE id = 'c2f2eecb-3942-431e-83a4-254baca904bc';

-- D) Staff
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'd2f2eecb-3942-431e-83a4-254baca904bc',
    'authenticated', 'authenticated', 'staff@system.com',
    crypt('staff', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "dept_staff"}',
    '{"full_name": "Department Staff", "phone": "+91 6666666666"}',
    FALSE, NOW(), NOW(), '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (gen_random_uuid(), 'd2f2eecb-3942-431e-83a4-254baca904bc', 'd2f2eecb-3942-431e-83a4-254baca904bc', format('{"sub": "%s", "email": "%s"}', 'd2f2eecb-3942-431e-83a4-254baca904bc', 'staff@system.com')::jsonb, 'email', NOW(), NOW(), NOW());
UPDATE public.profiles SET role = 'dept_staff'::public.user_role, department_id = 'a1000000-0000-0000-0000-000000000001' WHERE id = 'd2f2eecb-3942-431e-83a4-254baca904bc';
