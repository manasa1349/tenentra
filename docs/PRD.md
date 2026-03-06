# Product Requirements Document (PRD)

## 1. Product Vision

Tenantra is a multi-tenant SaaS platform that helps organizations manage projects, tasks, and team ownership in a secure, tenant-isolated environment.

The product goal is to provide a professional operations workflow with strict role boundaries, responsive UI, and practical day-to-day execution visibility.

---

## 2. Personas and Responsibilities

## 2.1 Super Admin

Responsibilities:

- View and manage all tenants.
- Update tenant status, subscription, and limits.
- View cross-tenant portfolio data.

Notable constraints:

- Does not manage tenant users through tenant-admin-only flows.

## 2.2 Tenant Admin

Responsibilities:

- Manage users within own tenant.
- Create and manage projects.
- Create, assign, update, and delete tasks within tenant scope.
- Update tenant name for own organization.

## 2.3 User

Responsibilities:

- View tenant projects.
- View assigned tasks.
- Update status for tasks assigned to self.
- Manage own profile and preferences.

Constraints:

- Cannot create/edit/delete projects.
- Cannot create/delete tasks.
- Cannot edit other users.

---

## 3. Functional Requirements

## 3.1 Authentication and Account

- FR-001: Tenant registration with initial tenant admin account.
- FR-002: Email/password login using JWT authentication.
- FR-003: Current user profile read/update endpoint.
- FR-004: Password change requires current password verification.
- FR-005: Preferences API for notification and default task view settings.

## 3.2 Tenant Management

- FR-006: Super admin can list and inspect all tenants.
- FR-007: Super admin can update tenant governance fields (status, plan, limits).
- FR-008: Tenant admin can update own tenant name only.
- FR-009: All tenant-scoped access is blocked across tenant boundaries.

## 3.3 User Management

- FR-010: Tenant admin can add users in own tenant.
- FR-011: Tenant admin can update/delete tenant users (with self-delete guard).
- FR-012: User listing supports pagination and filtering.

## 3.4 Projects

- FR-013: Tenant-scoped project listing and detail retrieval.
- FR-014: Tenant admin can create projects within plan limits.
- FR-015: Tenant admin and super admin can update/delete accessible projects.

## 3.5 Tasks

- FR-016: Task CRUD with tenant isolation and assignee validation.
- FR-017: Task listing supports filters (status, assignee, priority, search).
- FR-018: Regular users can update status only for assigned tasks.

## 3.6 UX and Interface

- FR-019: Public home page with long-form product presentation and dynamic sections.
- FR-020: Responsive layout for mobile/tablet/desktop.
- FR-021: Role-aware navigation and protected routes.
- FR-022: Interactive feedback with toasts/loaders (and confetti on success flows).

## 3.7 Observability and Safety

- FR-023: Health endpoint reports DB + readiness checks.
- FR-024: Critical actions are written to audit logs.

---

## 4. Non-Functional Requirements

- NFR-001: Strong tenant isolation for all protected resources.
- NFR-002: Secure password hashing and token validation.
- NFR-003: Responsive and accessible baseline UI across major screen sizes.
- NFR-004: One-command local startup via Docker Compose.
- NFR-005: Maintainable modular structure for backend routes/controllers and frontend pages/components.

---

## 5. Success Criteria

- Users from one tenant cannot access another tenant data.
- Role restrictions behave correctly for super admin, tenant admin, and user.
- Core flows (register, login, projects, tasks, profile, settings) work without static placeholders.
- Home, auth, and app pages render correctly on mobile, tablet, and desktop.

---

This PRD reflects the currently implemented product behavior.
