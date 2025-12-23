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
    '$2b$10$kZ0GxG4pK0Yc0k9Z6P0sxe1nZ8Zs0xZxKQz1cZr5x0VhFz7Tn7CqS',
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
    '$2b$10$3dT5vG4mE2R6KzH3R3mJSe2HnJX5cM0A6b0c1A5p7nGZK2n4z7W6y',
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
    '$2b$10$8YxH3Cq7Y4N8H9VJp7JZpOBqN3KZx8W9s3A1LzXxZ9D3zKxYQeP6e',
    'Demo User One',
    'user'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'user2@demo.com',
    '$2b$10$8YxH3Cq7Y4N8H9VJp7JZpOBqN3KZx8W9s3A1LzXxZ9D3zKxYQeP6e',
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