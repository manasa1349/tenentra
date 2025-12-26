-- =========================
-- TENANT
-- =========================
INSERT INTO tenants (
    id, name, subdomain, status, subscription_plan, max_users, max_projects
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
);

-- =========================
-- SUPER ADMIN (NO TENANT)
-- =========================
INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NULL,
  'superadmin@system.com',
  '$2b$10$5zjLI.eAbV3SMev.G9Mhqes.e6oIHBNAWsMpjc70P4LCxLVAv/lBS',
  'System Super Admin',
  'super_admin'
);


-- =========================
-- TENANT ADMIN
-- =========================
INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'admin@demo.com',
  '$2b$10$RucSQ8uCJv1DyJsXKCxyYuHef0BivY1Hcgzm1ONxy3fgQ7kzG4JA6',
  'Demo Tenant Admin',
  'tenant_admin'
);


-- =========================
-- REGULAR USERS
-- =========================
INSERT INTO users (
    id, tenant_id, email, password_hash, full_name, role
) VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'user1@demo.com',
    '$2b$10$ts5lyNCDs5OLAuZ5N6ocUOQVFbM5k.CZNfTpkUL1Sz5ZMNMHu8DW2',
    'Demo User One',
    'user'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'user2@demo.com',
    '$2b$10$ts5lyNCDs5OLAuZ5N6ocUOQVFbM5k.CZNfTpkUL1Sz5ZMNMHu8DW2',
    'Demo User Two',
    'user'
);

-- =========================
-- PROJECTS
-- =========================
INSERT INTO projects (
    id, tenant_id, name, description, status, created_by
) VALUES
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'Internal Tooling',
    'Internal development tools project',
    'active',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'Client Dashboard',
    'Customer-facing dashboard project',
    'active',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- =========================
-- TASKS (5 TOTAL)
-- =========================
INSERT INTO tasks (
    id, project_id, tenant_id, title, description, status, priority, assigned_to
) VALUES
(uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
 'Setup CI Pipeline', 'Configure CI/CD pipeline', 'todo', 'high', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

(uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
 'Write Unit Tests', 'Add backend unit tests', 'in_progress', 'medium', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),

(uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111',
 'Design UI Mockups', 'Create UI wireframes', 'completed', 'low', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

(uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111',
 'Implement Dashboard', 'Build dashboard components', 'todo', 'high', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),

(uuid_generate_v4(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111',
 'API Integration', 'Connect frontend with backend APIs', 'todo', 'medium', NULL);