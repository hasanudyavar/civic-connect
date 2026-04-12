-- ============================================================
-- Civic Connect — Super Admin Seeder v4.0
-- Run AFTER 0002_seed.sql
--
-- Credentials:
--   Email:    superadmin@system.com
--   Password: StrongPassword@123
--
-- Idempotent: safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  superadmin_id   UUID;
  existing_id     UUID;
  identity_exists BOOLEAN;
BEGIN
  -- 1. Check if superadmin already exists
  SELECT id INTO existing_id
  FROM auth.users
  WHERE email = 'superadmin@system.com';

  IF existing_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'super_admin',
        full_name = COALESCE(full_name, 'Super Administrator'),
        is_active = true
    WHERE id = existing_id;

    RAISE NOTICE 'SuperAdmin already exists (id: %). Ensured role = super_admin.', existing_id;
    RETURN;
  END IF;

  -- 2. Generate a new ID
  superadmin_id := gen_random_uuid();

  -- 3. Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    superadmin_id,
    '00000000-0000-0000-0000-000000000000',
    'superadmin@system.com',
    crypt('StrongPassword@123', gen_salt('bf')),
    NOW(),
    '',
    '',
    jsonb_build_object(
      'full_name', 'Super Administrator',
      'phone',     '+91 9999999999'
    ),
    jsonb_build_object(
      'provider',  'email',
      'providers', jsonb_build_array('email'),
      'role',      'super_admin'
    ),
    'authenticated',
    'authenticated',
    false,
    NOW(),
    NOW()
  );

  -- 4. Insert into auth.identities (required for signInWithPassword)
  SELECT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = superadmin_id AND provider = 'email'
  ) INTO identity_exists;

  IF NOT identity_exists THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      superadmin_id,
      superadmin_id::text,
      jsonb_build_object(
        'sub',   superadmin_id::text,
        'email', 'superadmin@system.com'
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- 5. Upsert into public.profiles
  INSERT INTO public.profiles (id, full_name, phone, role, is_active)
  VALUES (
    superadmin_id,
    'Super Administrator',
    '+91 9999999999',
    'super_admin',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role      = 'super_admin',
    full_name = 'Super Administrator',
    is_active = true;

  RAISE NOTICE '✅ SuperAdmin created successfully (id: %)', superadmin_id;
  RAISE NOTICE '   Email:    superadmin@system.com';
  RAISE NOTICE '   Password: StrongPassword@123';
END $$;
