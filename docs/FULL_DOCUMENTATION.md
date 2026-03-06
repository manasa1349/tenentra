# Tenantra Full Documentation

## 1. Product Overview

Tenantra is a multi-tenant SaaS platform for managing tenants, users, projects, and tasks with strict tenant isolation and role-based access control.

### Core Capabilities

- Multi-tenant architecture with isolated tenant data
- JWT authentication with role-based permissions
- Tenant onboarding with admin auto-provisioning
- User management for tenant admins
- Project and task lifecycle management
- Profile and password management for authenticated users
- User preference management (notification + task view defaults)
- Dashboard analytics for projects and tasks

---

## 2. Roles and Responsibilities

### 2.1 `super_admin`

- Can view all tenants
- Can manage tenant-level configuration
- Can view all projects/tasks across tenants
- Can update own profile/password

### 2.2 `tenant_admin`

- Can manage users within their tenant
- Can create/update/delete projects in their tenant
- Can create/update/delete tasks in their tenant
- Can update task status
- Can update own profile/password and preferences

### 2.3 `user`

- Can access dashboard and projects in their tenant
- Can view only assigned tasks on task board/list
- Can update status only for tasks assigned to them
- Cannot create/edit/delete projects
- Cannot create/edit/delete tasks
- Can update own profile/password and preferences

---

## 3. Architecture

### 3.1 Frontend

- React + Vite
- React Router for protected and role-aware routes
- Axios for API communication
- React Hot Toast for actionable UI notifications
- Canvas Confetti for registration success celebration
- React Spinners for non-blocking loading states
- Custom CSS system with shared tokens in `global.css`

### 3.2 Backend

- Node.js + Express
- PostgreSQL via `pg` pool
- `jsonwebtoken` for auth
- `bcrypt` for password hashing
- `express-validator` for request validation

### 3.3 Database

- PostgreSQL schema initialized with SQL scripts in `database/init/`
- Foreign-key constrained model with tenant-scoped ownership
- Audit logs for critical actions

---

## 4. Data Model (High Level)

### 4.1 Primary Tables

- `tenants`
- `users`
- `projects`
- `tasks`
- `audit_logs`
- `user_preferences`

### 4.2 `user_preferences` Columns

- `user_id` (PK/FK to users)
- `email_notifications` (boolean)
- `task_due_reminders` (boolean)
- `weekly_summary` (boolean)
- `default_task_view` (`board` or `list`)
- `updated_at`

---

## 5. API Reference (Implemented)

Base URL: `http://localhost:5000/api`

### 5.1 Authentication

- `POST /auth/register-tenant`
- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/me` (update full name and/or password)
- `GET /auth/preferences`
- `PUT /auth/preferences`
- `POST /auth/logout`

### 5.2 Tenant Management

- `GET /tenants` (super admin)
- `GET /tenants/:tenantId` (super admin)
- `PUT /tenants/:tenantId` (super admin)

### 5.3 Tenant User Management

- `POST /tenants/:tenantId/users` (tenant admin)
- `GET /tenants/:tenantId/users` (tenant admin)
- `PUT /users/:userId` (tenant admin, or self for full name only)
- `DELETE /users/:userId` (tenant admin)

### 5.4 Projects

- `GET /projects` (authenticated)
- `POST /projects` (tenant admin, super admin)
- `GET /projects/:projectId` (authenticated, tenant-scoped)
- `PUT /projects/:projectId` (tenant admin, super admin)
- `DELETE /projects/:projectId` (tenant admin, super admin)

### 5.5 Tasks

- `GET /projects/:projectId/tasks` (authenticated; users are limited to assigned tasks)
- `POST /projects/:projectId/tasks` (tenant admin, super admin)
- `PATCH /tasks/:taskId/status` (tenant admin/super admin; users only on assigned tasks)
- `PUT /tasks/:taskId` (tenant admin/super admin; users can only change status on assigned tasks)
- `DELETE /tasks/:taskId` (tenant admin, super admin)

### 5.6 System

- `GET /health`

---

## 6. Frontend Routes

### Public

- `/` (marketing/home landing page)
- `/login`
- `/register`

### Protected

- `/dashboard`
- `/projects`
- `/projects/:projectId`
- `/tasks`
- `/profile`
- `/settings`
- `/users` (tenant admin only)
- `/tenants` (super admin only)

---

## 7. UI and UX Notes

- Public landing page provides a long-form real product entry experience (`/`)
- Landing page remains reachable after login and links back to dashboard
- Top navigation includes role-aware links
- Mobile headers use sidebar drawers for navigation
- User dropdown now includes working `Profile`, `Settings`, and `Logout`
- Hover states have explicit contrast handling for readability
- Tasks page supports `Board View` and `List View`
- Task default view is loaded from user preferences
- Visual system follows formal pastel styling (enterprise-friendly)
- Home screen includes animated counters, product image carousel, ratings, FAQ accordion, and testimonial carousel

---

## 8. Setup and Run

### 8.1 Prerequisites

- Docker
- Docker Compose

### 8.2 Start

```bash
docker-compose up -d
```

### 8.3 Access

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

---

## 9. Seed/Test Accounts

- Super admin: `superadmin@system.com` / `Admin@123`
- Tenant admin (`demo`): `admin@demo.com` / `Demo@123`
- User (`demo`): `user1@demo.com` / `User@123`

---

## 10. Security and Isolation Rules

- JWT contains `userId`, `tenantId`, and `role`
- Tenant users are always restricted to their `tenant_id`
- Super admin has global access (`tenant_id = NULL`)
- Sensitive password updates require current password verification

---

## 11. Recommended Next Enhancements

- Add password reset flow via email
- Add in-app notification center (backed by DB, not static)
- Add tenant-level audit log UI page
- Add API pagination standardization on all list endpoints
- Add automated tests (API + frontend integration)
