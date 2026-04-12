-- ============================================================
-- Civic Connect — Seed Data v4.0
-- Run AFTER 0001_rls_policies.sql
-- Idempotent: uses ON CONFLICT to avoid duplicate errors
-- ============================================================

-- ============================================================
-- WARDS OF BHATKAL
-- ============================================================
INSERT INTO wards (id, name, ward_number, city) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Ward 1 - Khara Bazar',     1, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000002', 'Ward 2 - Jamia Nagar',     2, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000003', 'Ward 3 - Station Road',    3, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000004', 'Ward 4 - Azad Nagar',      4, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000005', 'Ward 5 - Muskan Colony',   5, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000006', 'Ward 6 - NH-66 Extension', 6, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000007', 'Ward 7 - Old Town',        7, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000008', 'Ward 8 - Industrial Area', 8, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000009', 'Ward 9 - Beach Road',      9, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000010', 'Ward 10 - Masjid Road',   10, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000011', 'Ward 11 - Kumbhar Galli', 11, 'Bhatkal'),
  ('11111111-0001-0001-0001-000000000012', 'Ward 12 - Tenginkeri',    12, 'Bhatkal')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ward_number = EXCLUDED.ward_number;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, name, code, email, head_name, is_active) VALUES
  ('22222222-0001-0001-0001-000000000001', 'Public Works Department',     'PWD',   'pwd@bhatkal.gov.in',         'Shri. Ramesh Kulkarni',  true),
  ('22222222-0001-0001-0001-000000000002', 'Water & Sanitation',          'WSD',   'water@bhatkal.gov.in',       'Shri. Abdul Karim',      true),
  ('22222222-0001-0001-0001-000000000003', 'Health & Sanitation',         'HSD',   'health@bhatkal.gov.in',      'Dr. Priya Shetty',       true),
  ('22222222-0001-0001-0001-000000000004', 'Electricity Department',      'ELEC',  'electricity@bhatkal.gov.in', 'Shri. Mahesh Naik',      true),
  ('22222222-0001-0001-0001-000000000005', 'Municipal Administration',    'ADMIN', 'admin@bhatkal.gov.in',       'Shri. Suresh Hegde',     true),
  ('22222222-0001-0001-0001-000000000006', 'Revenue & Taxation',          'REV',   'revenue@bhatkal.gov.in',     'Smt. Lakshmi Devi',      true),
  ('22222222-0001-0001-0001-000000000007', 'Town Planning & Environment', 'TPE',   'planning@bhatkal.gov.in',    'Shri. Venkat Rao',       true)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  code      = EXCLUDED.code,
  email     = EXCLUDED.email,
  head_name = EXCLUDED.head_name;

-- ============================================================
-- CATEGORIES WITH SLA HOURS
-- ============================================================
INSERT INTO categories (id, slug, name_en, name_kn, name_hi, icon, color, department_id, sla_response_hours, sla_resolution_hours, sort_order) VALUES
  ('33333333-0001-0001-0001-000000000001', 'garbage',         'Garbage / Waste',       'ಕಸ / ತ್ಯಾಜ್ಯ',         'कूड़ा / कचरा',            'Trash2',         '#16A34A', '22222222-0001-0001-0001-000000000003', 24,  48,  1),
  ('33333333-0001-0001-0001-000000000002', 'pothole',         'Pothole',               'ಗುಂಡಿ',                'गड्ढा',                  'Circle',         '#EA580C', '22222222-0001-0001-0001-000000000001', 24,  168, 2),
  ('33333333-0001-0001-0001-000000000003', 'water_leakage',   'Water Leakage',         'ನೀರು ಸೋರಿಕೆ',           'पानी का रिसाव',            'Droplets',       '#2563EB', '22222222-0001-0001-0001-000000000002', 12,  72,  3),
  ('33333333-0001-0001-0001-000000000004', 'streetlight',     'Street Light',          'ಬೀದಿ ದೀಪ',             'स्ट्रीट लाइट',              'Lightbulb',      '#EAB308', '22222222-0001-0001-0001-000000000004', 24,  120, 4),
  ('33333333-0001-0001-0001-000000000005', 'road_damage',     'Road Damage',           'ರಸ್ತೆ ಹಾನಿ',            'सड़क क्षति',               'Construction',   '#DC2626', '22222222-0001-0001-0001-000000000001', 24,  168, 5),
  ('33333333-0001-0001-0001-000000000006', 'sewage',          'Sewage / Drainage',     'ಒಳಚರಂಡಿ',             'सीवेज / ड्रेनेज',           'Waves',          '#7C3AED', '22222222-0001-0001-0001-000000000002', 12,  120, 6),
  ('33333333-0001-0001-0001-000000000007', 'encroachment',    'Encroachment',          'ಅತಿಕ್ರಮಣ',             'अतिक्रमण',                'ShieldAlert',    '#F59E0B', '22222222-0001-0001-0001-000000000005', 48,  240, 7),
  ('33333333-0001-0001-0001-000000000008', 'noise',           'Noise Pollution',       'ಶಬ್ದ ಮಾಲಿನ್ಯ',           'ध्वनि प्रदूषण',            'Volume2',        '#EC4899', '22222222-0001-0001-0001-000000000005', 48,  168, 8),
  ('33333333-0001-0001-0001-000000000009', 'stray_animals',   'Stray Animals',         'ಬೀದಿ ಪ್ರಾಣಿಗಳು',         'आवारा पशु',               'Bug',            '#F97316', '22222222-0001-0001-0001-000000000003', 24,  72,  9),
  ('33333333-0001-0001-0001-000000000010', 'illegal_parking',  'Illegal Parking',      'ಅಕ್ರಮ ಪಾರ್ಕಿಂಗ್',        'अवैध पार्किंग',             'Car',            '#06B6D4', '22222222-0001-0001-0001-000000000005', 24,  48,  10),
  ('33333333-0001-0001-0001-000000000011', 'tree_hazard',     'Fallen Tree / Hazard',  'ಮರ ಅಪಾಯ',             'गिरा पेड़ / खतरा',          'TreePine',       '#14B8A6', '22222222-0001-0001-0001-000000000007', 12,  48,  11),
  ('33333333-0001-0001-0001-000000000012', 'other',           'Other',                 'ಇತರ',                 'अन्य',                   'MoreHorizontal', '#6B7280', '22222222-0001-0001-0001-000000000005', 48,  240, 12)
ON CONFLICT (id) DO UPDATE SET
  slug                 = EXCLUDED.slug,
  name_en              = EXCLUDED.name_en,
  name_kn              = EXCLUDED.name_kn,
  name_hi              = EXCLUDED.name_hi,
  icon                 = EXCLUDED.icon,
  color                = EXCLUDED.color,
  department_id        = EXCLUDED.department_id,
  sla_response_hours   = EXCLUDED.sla_response_hours,
  sla_resolution_hours = EXCLUDED.sla_resolution_hours,
  sort_order           = EXCLUDED.sort_order;
