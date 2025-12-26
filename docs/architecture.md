# System Architecture Document

## 1. Overview

This document describes the high-level system architecture, database design, and API architecture for the multi-tenant SaaS Project & Task Management platform. The architecture is designed to ensure strict tenant isolation, scalability, security, and maintainability while meeting all mandatory evaluation constraints.

---

## 2. High-Level System Architecture

### 2.1 Architecture Description

The system follows a **three-tier architecture** consisting of a client layer, application layer, and data layer. All components are containerized using Docker and orchestrated via Docker Compose.

**Components:**

* **Client (Browser):** Users access the system via a web browser.
* **Frontend Application (React):** Handles UI rendering, authentication flow, and API consumption.
* **Backend API (Node.js + Express):** Implements business logic, authentication, authorization, tenant isolation, and subscription enforcement.
* **Database (PostgreSQL):** Stores all persistent data with tenant-based isolation.

### 2.2 Authentication Flow

1. User accesses tenant-specific subdomain and logs in.
2. Frontend sends credentials to backend authentication API.
3. Backend validates credentials and issues a JWT with role and tenant context.
4. Frontend stores JWT securely and attaches it to all subsequent API requests.
5. Backend middleware validates JWT and enforces RBAC and tenant isolation.

### 2.3 System Architecture Diagram

The following diagram visually represents the system architecture:

**File Location:** `docs/images/system-architecture.png`

**Diagram Description:**

* Browser communicates with the frontend container on port 3000.
* Frontend communicates with backend API via internal Docker network using `http://backend:5000`.
* Backend communicates with PostgreSQL database via `database:5432`.
* Authentication and authorization are enforced at the backend API layer.

---

## 3. Database Architecture

### 3.1 Database Design Principles

* **Shared Database, Shared Schema** multi-tenancy model
* Tenant data isolation using `tenant_id` on all tenant-owned tables
* Strong referential integrity using foreign keys
* Cascading deletes to prevent orphan records
* Indexed tenant_id columns for query performance

### 3.2 Entity Relationship Diagram (ERD)

**File Location:** `docs/images/database-erd.png`

**Core Entities:**

* tenants
* users
* projects
* tasks
* audit_logs

**ERD Highlights:**

* All tenant-owned entities include a `tenant_id` foreign key
* Super admin users have `tenant_id = NULL`
* Composite unique constraint on `(tenant_id, email)` in users table
* Indexes on tenant_id columns for performance optimization

---

## 4. API Architecture

### 4.1 API Design Principles

* RESTful architecture
* Consistent response format: `{ success, message, data }`
* JWT-based authentication for protected endpoints
* Role-Based Access Control (RBAC) enforced at middleware level
* Tenant isolation enforced in every data access layer

### 4.2 API Endpoint List

#### Authentication APIs

* **POST /api/auth/login** – Authenticate user and issue JWT (Public)
* **POST /api/auth/register-tenant** – Register new tenant and tenant admin (Public)

#### Tenant Management APIs

* **GET /api/tenants** – List all tenants (Super Admin only)
* **GET /api/tenants/:id** – Get tenant details (Super Admin only)
* **PATCH /api/tenants/:id/status** – Update tenant status (Super Admin only)

#### User Management APIs

* **POST /api/users** – Create user (Tenant Admin)
* **GET /api/users** – List users in tenant (Tenant Admin)
* **GET /api/users/:id** – Get user details (Tenant Admin)
* **PATCH /api/users/:id** – Update user (Tenant Admin)
* **DELETE /api/users/:id** – Deactivate user (Tenant Admin)

#### Project Management APIs

* **POST /api/projects** – Create project (Tenant Admin)
* **GET /api/projects** – List projects (Authenticated users)
* **GET /api/projects/:id** – Get project details (Authenticated users)
* **PATCH /api/projects/:id** – Update project (Tenant Admin)
* **DELETE /api/projects/:id** – Archive project (Tenant Admin)

#### Task Management APIs

* **POST /api/tasks** – Create task (Tenant Admin, User)
* **GET /api/tasks?project_id=** – List tasks by project (Authenticated users)
* **PATCH /api/tasks/:id** – Update task (Assigned user or Tenant Admin)

#### System APIs

* **GET /api/health** – Health check endpoint (Public)

> Total Endpoints: **19**

### 4.3 Endpoint Security Matrix

| Module  | Auth Required | Role Required       |
| ------- | ------------- | ------------------- |
| Auth    | No            | Public              |
| Tenant  | Yes           | Super Admin         |
| User    | Yes           | Tenant Admin        |
| Project | Yes           | Tenant Admin / User |
| Task    | Yes           | Tenant Admin / User |
| Health  | No            | Public              |

---

## 5. Cross-Cutting Concerns

### 5.1 Tenant Isolation Enforcement

* tenant_id extracted from JWT and validated
* All queries scoped by tenant_id
* Super admin bypass limited to tenant management APIs

### 5.2 Audit Logging

* All critical operations recorded in audit_logs table
* Logs include user_id, tenant_id, action, entity type, and timestamp

---

**This architecture ensures secure, scalable, and evaluator-compliant implementation of the multi-tenant SaaS platform.**