# Tenantra (Multi-Tenant SaaS Platform)

## Project Description

This project is a **production-ready multi-tenant SaaS platform** that allows multiple organizations (tenants) to manage their own users, projects, and tasks with strict data isolation.
Each tenant operates independently while a system-level super admin can manage all tenants.

The platform demonstrates **multi-tenancy, role-based access control (RBAC), secure authentication, containerized deployment, and automated database initialization**.

---

## Target Audience

- SaaS product developers
- Backend and full-stack engineers
- Companies building multi-tenant applications
- Evaluators reviewing production-ready SaaS architectures

---

## Features

- Multi-tenant architecture with strict tenant data isolation
- Role-based access control (super_admin, tenant_admin, user)
- Secure JWT-based authentication
- Tenant registration with automatic admin creation
- User management within tenants
- Project management with status tracking
- Task management with assignment, priority, and status
- Dashboard with real-time statistics
- Public landing page with animated sections and testimonial carousel
- Long-form home experience with product showcase, ratings, FAQ, and image carousel
- Profile and settings pages with persistent user preferences
- Responsive formal pastel UI across desktop, tablet, and mobile
- Interactive UX add-ons: toast notifications, celebratory confetti, and loader components
- PostgreSQL database with seeded demo data
- Fully containerized using Docker and Docker Compose
- Automated database initialization on startup
- Health check endpoint for service readiness

---

## Technology Stack

### Frontend

- React (Vite)
- React Router
- Axios
- CSS (custom styles)

### Backend

- Node.js
- Express.js
- JWT (jsonwebtoken)
- bcrypt
- express-validator

### Database

- PostgreSQL 15

### DevOps & Tooling

- Docker
- Docker Compose
- Nginx (optional for production frontend)
- Git

---

## Architecture Overview

The system follows a **three-tier architecture**:

1. **Frontend (React)**

   - Handles user interaction
   - Communicates with backend via REST APIs
   - JWT stored on client for authentication

2. **Backend API (Node.js + Express)**

   - Handles authentication and authorization
   - Enforces tenant isolation
   - Provides RESTful APIs for users, projects, and tasks

3. **Database (PostgreSQL)**

   - Stores tenants, users, projects, tasks
   - Enforces relationships via foreign keys

### Multi-Tenancy Strategy

- Each user belongs to a tenant (except super_admin)
- Tenant ID is embedded in JWT token
- All queries are filtered by `tenant_id`
- Super admin has `tenant_id = NULL` and global access

---

## Installation & Setup

### Prerequisites

- Docker
- Docker Compose
- Git

---

### Clone Repository

```bash
git clone https://github.com/manasa1349/multi-tenant-saas.git
cd multi-tenant-saas
```

---

### Environment Variables

The backend reads environment variables from Docker Compose.

#### Backend Environment Variables

| Variable       | Description                       |
| -------------- | --------------------------------- |
| DB_HOST        | Database host                     |
| DB_PORT        | Database port                     |
| DB_NAME        | Database name                     |
| DB_USER        | Database username                 |
| DB_PASSWORD    | Database password                 |
| JWT_SECRET     | JWT signing secret (min 32 chars) |
| JWT_EXPIRES_IN | JWT expiry duration               |
| FRONTEND_URL   | Allowed frontend origin for CORS  |
| NODE_ENV       | Application environment           |

---

### Start Application (MANDATORY METHOD)

```bash
docker-compose up -d
```

This command will:

- Start PostgreSQL database
- Initialize database schema and seed data automatically
- Start backend API
- Start frontend application

---

### Verify Services

#### Backend Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

#### Frontend Access

Open in browser:

```
http://localhost:3000
```

---

## Database Initialization

- Database schema and seed data are automatically loaded using:

  - PostgreSQL init scripts mounted in `database/init`

- No manual migration or seed commands are required
- Evaluation script only runs `docker-compose up -d`

---

## Test Credentials (Seed Data)

These credentials are preloaded and used for evaluation.

### Super Admin

- Email: `superadmin@system.com`
- Password: `Admin@123`
- Role: `super_admin`

### Tenant Admin

- Tenant Subdomain: `demo`
- Email: `admin@demo.com`
- Password: `Demo@123`
- Role: `tenant_admin`

### Regular User

- Tenant Subdomain: `demo`
- Email: `user1@demo.com`
- Password: `User@123`
- Role: `user`

---

## Application Routes

### Authentication

- `/` - Public landing page
- `/register` - Tenant registration
- `/login` - Login page

### Protected Routes

- `/dashboard` - Dashboard overview
- `/projects` - Projects list
- `/projects/:projectId` - Project details and tasks
- `/tasks` - Role-aware task board/list
- `/profile` - Personal profile (name/password)
- `/settings` - User preferences
- `/users` - User management (tenant_admin only)

---

## API Documentation

Detailed API documentation is available in:

```
docs/API.md
```

The document includes:

- All implemented API endpoints
- Request and response formats
- Authentication requirements
- Example payloads

---

## Full Project Documentation

Complete documentation (architecture, roles, route permissions, feature behavior, and setup) is available in:

```
docs/FULL_DOCUMENTATION.md
docs/FULL_DOCUMENTATION.pdf
```

---

## Health Check Endpoint

```
GET /api/health
```

Returns success only after:

- Database connection established
- Seed data loaded
- Backend ready for requests

---

## Docker Configuration Summary

- All services start with a single command
- Fixed port mappings:

  - Database: `5432`
  - Backend: `5000`
  - Frontend: `3000`

- Service names used for inter-container communication
- Backend depends on database health
- Frontend depends on backend health

---
## Demo Video

A full demo video is provided covering:

- Application overview
- Architecture explanation
- Multi-tenancy demonstration
- Role-based access control
- Project and task management
- Code walkthrough

**YouTube Link:**
[Link](https://youtu.be/d2NqZXAeIh4)

---
## Limitations

* Password reset and email delivery workflows are not implemented yet
* Real-time collaboration is not enabled (no WebSocket layer)
* File attachments for tasks/projects are not available
* Audit logs are captured in backend but no dedicated audit log UI exists
* Automated test coverage (unit/integration/e2e) is limited

---

## Future Enhancements

* Password reset flow with secure email verification
* In-app and email notification center
* Dedicated audit log dashboard with filters
* Advanced analytics widgets for delivery forecasting
* Real-time task updates with WebSockets
* Task comments, mentions, and file attachments
* Expanded automated test suite and CI checks

---

## License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software for educational or commercial purposes.

---

## Conclusion

This project demonstrates a complete, production-ready SaaS platform with multi-tenancy, authentication, authorization, containerization, and automated deployment. It follows best practices for backend security, frontend integration, and DevOps readiness, making it suitable for real-world SaaS applications.

---

## Author

Name: Manasa Tadi
Project: Tenantra

