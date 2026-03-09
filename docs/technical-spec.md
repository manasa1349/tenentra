# Technical Specification

## 1. Overview

This document describes the current technical implementation of Tenantra, a multi-tenant SaaS project and task management platform. It covers structure, configuration, runtime behavior, and deployment workflow.

---

## 2. Repository Structure

```text
multi-tenant-saas/
|- backend/
|- frontend/
|- database/
|- docs/
|- docker-compose.yml
|- submission.json
|- submission.yml
|- README.md
```

---

## 3. Backend Specification

### 3.1 Stack

- Node.js
- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)

### 3.2 Backend Layout

```text
backend/
|- src/
|  |- config/        # env + db pool
|  |- controllers/   # request handlers
|  |- middleware/    # auth, RBAC, tenant access, error handling
|  |- routes/        # endpoint registration
|  |- services/      # audit log helper
|  |- validators/    # auth/preferences validators
|  |- app.js
|  `- server.js
|- Dockerfile
|- entrypoint.sh
|- package.json
`- .env.example
```

### 3.3 Backend Responsibilities

- Authenticate users and issue JWT tokens.
- Enforce tenant isolation using `tenant_id` and route-level tenant guards.
- Enforce role-based permissions for tenant, project, task, and user operations.
- Provide paginated listing APIs for tenants, users, projects, and tasks.
- Track critical actions in `audit_logs`.
- Expose health endpoint with DB and seed-readiness checks.

---

## 4. Frontend Specification

### 4.1 Stack

- React (Vite)
- React Router
- Axios
- React Hot Toast
- Canvas Confetti
- React Spinners
- Custom CSS modules/files

### 4.2 Frontend Layout

```text
frontend/
|- src/
|  |- api/           # Axios client + API helpers
|  |- auth/          # auth context + auth pages
|  |- components/    # reusable UI components
|  |- pages/         # dashboard, home, tasks, projects, users, profile, settings
|  |- styles/        # global and page-level styles
|  |- App.jsx
|  `- main.jsx
|- public/
|- Dockerfile
|- vite.config.js
`- package.json
```

### 4.3 Frontend Responsibilities

- Public home experience at `/`.
- Authentication flows (`/login`, `/register`).
- Role-aware protected application routes.
- Responsive UI for mobile, tablet, and desktop.
- Interactive feedback (toast, loader, confetti where applicable).

---

## 5. Database Specification

### 5.1 Database Model

- PostgreSQL 15
- Shared database, shared schema model
- Tenant isolation through `tenant_id`

### 5.2 Initialization

Schema and seed scripts run automatically from:

```text
database/init/
|- 001_create_enums.sql
|- 002_create_tenants.sql
|- 003_create_users.sql
|- 004_create_projects.sql
|- 005_create_tasks.sql
|- 006_create_audit_logs.sql
|- 007_create_user_preferences.sql
`- seed_data.sql
```

### 5.3 Core Tables

- `tenants`
- `users`
- `projects`
- `tasks`
- `audit_logs`
- `user_preferences`

---

## 6. Environment and Runtime Configuration

### 6.1 Docker Compose Runtime

`docker-compose.yml` starts:

- `database` (PostgreSQL, port `5432`)
- `backend` (Express API, port `5000`)
- `frontend` (Vite app, port `3000`)

### 6.2 Key Environment Variables

Backend:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PORT`, `NODE_ENV`
- `FRONTEND_URL` (comma-separated allowed CORS origins)

Frontend:

- `VITE_API_URL`
- `VITE_API_PROXY_TARGET`

---

## 7. API Surface Summary

Base URL: `http://localhost:5000/api`

- Auth: `/auth/*`
- Tenant management: `/tenants/*`
- Projects: `/projects/*`
- Tasks: `/projects/:projectId/tasks`, `/tasks/:taskId*`
- User updates/deletion: `/users/:userId`
- Health: `/health`

Detailed endpoint behavior is documented in `docs/API.md`.

---

## 8. Local Run Procedure

1. Ensure Docker Desktop is running.
2. Run:

```bash
docker-compose up -d
```

3. Access:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

---

## 9. Validation Checklist

- Containers are healthy (`database`, `backend`, `frontend`).
- `/api/health` returns `status: ok`.
- Seed credentials can log in for all three roles.
- Tenant boundaries hold for project/task operations.
- Mobile/tablet/desktop layouts remain usable.

---

This technical specification reflects the current implementation state of Tenantra.
