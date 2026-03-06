# System Architecture

## 1. Overview

Tenantra is a three-tier multi-tenant SaaS system with strict tenant isolation, role-aware authorization, and a shared PostgreSQL schema. The system is containerized with Docker Compose for repeatable local and evaluation runs.

---

## 2. High-Level Architecture

## 2.1 Components

- Browser client
- Frontend application (React + Vite)
- Backend API (Node.js + Express)
- PostgreSQL database

## 2.2 Runtime Topology

- Browser -> Frontend: `http://localhost:3000`
- Frontend -> Backend API: `http://backend:5000` (inside Docker network)
- Backend -> Database: `database:5432`

## 2.3 Processing Flow

1. User authenticates through `/api/auth/login`.
2. Backend issues JWT with `userId`, `tenantId`, and `role`.
3. Frontend attaches JWT to protected API requests.
4. Backend middleware validates token, role, and tenant access before controller logic.
5. Controllers execute tenant-scoped SQL and return normalized API responses.

---

## 3. Security and Isolation Model

## 3.1 Identity and Auth

- Stateless JWT authentication.
- Password hashing with bcrypt.
- CORS allowlist via `FRONTEND_URL`.

## 3.2 Tenant Isolation

- Tenant-owned tables store `tenant_id`.
- Query filters are tenant-scoped unless role is `super_admin`.
- `requireTenantAccess` middleware blocks cross-tenant route access.

## 3.3 Authorization Model

Roles:

- `super_admin`
- `tenant_admin`
- `user`

Examples:

- `tenant_admin` manages tenant users and creates projects/tasks in own tenant.
- `user` can update status only for tasks assigned to self.
- `super_admin` has global visibility and tenant governance APIs.

---

## 4. Data Architecture

## 4.1 Multi-Tenancy Pattern

- Shared database + shared schema.
- Isolation by `tenant_id` and role-based controls.

## 4.2 Core Entities

- `tenants`
- `users`
- `projects`
- `tasks`
- `audit_logs`
- `user_preferences`

## 4.3 Integrity Controls

- Foreign keys between tenants/users/projects/tasks.
- Enum constraints for roles, statuses, and priorities.
- Audit entries for critical write operations.

---

## 5. API Architecture

Base path: `/api`

## 5.1 Auth

- `POST /auth/register-tenant`
- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/me`
- `GET /auth/preferences`
- `PUT /auth/preferences`
- `POST /auth/logout`

## 5.2 Tenants

- `GET /tenants` (super admin)
- `GET /tenants/:tenantId` (same-tenant user or super admin)
- `PUT /tenants/:tenantId` (tenant admin for name; super admin for full tenant controls)

## 5.3 Tenant Users

- `POST /tenants/:tenantId/users` (tenant admin)
- `GET /tenants/:tenantId/users` (tenant-scoped access)
- `PUT /users/:userId`
- `DELETE /users/:userId`

## 5.4 Projects

- `GET /projects`
- `GET /projects/:projectId`
- `POST /projects` (requires tenant context; regular users forbidden)
- `PUT /projects/:projectId` (tenant admin/super admin)
- `DELETE /projects/:projectId` (tenant admin/super admin)

## 5.5 Tasks

- `GET /projects/:projectId/tasks`
- `POST /projects/:projectId/tasks` (tenant admin/super admin)
- `PATCH /tasks/:taskId/status`
- `PUT /tasks/:taskId`
- `DELETE /tasks/:taskId` (tenant admin/super admin)

## 5.6 System

- `GET /health`

---

## 6. Frontend Route Architecture

Public:

- `/`
- `/login`
- `/register`

Protected:

- `/dashboard`
- `/projects`
- `/projects/:projectId`
- `/tasks`
- `/profile`
- `/settings`
- `/users` (tenant admin)
- `/tenants` (super admin)

---

## 7. Reliability and Operations

- Health endpoint checks DB connectivity and required seed entities.
- Compose service dependencies use container health checks.
- One-command startup for evaluation: `docker-compose up -d`.

---

This architecture reflects the current implementation behavior and route design in the repository.
