# Technical Specification

## 1. Overview

This document provides the technical implementation details for the multi-tenant SaaS Project & Task Management platform. It defines the project structure, development setup, environment configuration, and execution workflow. The purpose of this document is to ensure consistent development, deployment, and evaluation across environments.

---

## 2. Project Structure

### 2.1 Root Directory Structure

```
multi-tenant-saas/
│
├── backend/
├── frontend/
├── database/
├── docs/
├── docker-compose.yml
├── submission.json
├── .env
└── README.md
```

Each directory serves a clearly defined purpose and separates concerns between application layers.

---

## 3. Backend Project Structure

**Location:** `backend/`

```
backend/
├── src/
│   ├── controllers/     # Request handling logic
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, RBAC, tenant isolation
│   ├── services/        # Business logic layer
│   ├── models/          # Database query abstractions
│   ├── utils/           # Helper utilities (JWT, hashing)
│   ├── config/          # Environment & DB configuration
│   └── app.js           # Express app initialization
│
├── migrations/          # SQL migration files
├── seeds/               # Seed data SQL files
├── Dockerfile           # Backend Docker configuration
├── package.json
└── package-lock.json
```

### Backend Responsibilities

* Enforce tenant isolation using `tenant_id`
* Implement JWT authentication and RBAC
* Enforce subscription plan limits
* Provide RESTful APIs with consistent responses
* Perform audit logging for critical actions

---

## 4. Frontend Project Structure

**Location:** `frontend/`

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Application pages
│   ├── services/        # API service layer
│   ├── context/         # Auth and user context
│   ├── routes/          # Protected route definitions
│   ├── utils/           # Utility helpers
│   └── App.js
│
├── public/
├── Dockerfile           # Frontend Docker configuration
├── package.json
└── package-lock.json
```

### Frontend Responsibilities

* Handle authentication flow
* Manage protected routes
* Render role-based UI components
* Consume backend APIs securely
* Display user-friendly error messages

---

## 5. Database Structure

**Location:** `database/`

```
database/
├── migrations/          # Ordered SQL migrations
└── seeds/               # Initial seed data
```

### Database Design Notes

* PostgreSQL is used as the relational database
* All tenant-owned tables include a `tenant_id`
* Migrations run automatically on container startup
* Seed data is inserted automatically after migrations

---

## 6. Environment Configuration

All environment variables are defined in the `.env` file and are committed to the repository using development-safe values.

### Required Environment Variables

```
# Database
POSTGRES_DB=saas_db
POSTGRES_USER=saas_user
POSTGRES_PASSWORD=saas_password
DB_HOST=database
DB_PORT=5432

# Backend
BACKEND_PORT=5000
JWT_SECRET=dev_jwt_secret
JWT_EXPIRES_IN=24h

# Frontend
REACT_APP_API_BASE_URL=http://backend:5000
```

---

## 7. Development Setup Guide

### 7.1 Prerequisites

* Node.js (v18 or later)
* Docker & Docker Compose
* Git

### 7.2 Installation Steps

1. Clone the repository
2. Navigate to the project root directory
3. Ensure Docker is running
4. Start all services using:

```
docker-compose up -d
```

This command starts the database, backend, and frontend services automatically.

---

## 8. Running the Application

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:5000](http://localhost:5000)
* Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 9. Testing Guidelines

* API testing can be performed using Postman or Swagger
* Authentication token must be included for protected routes
* Cross-tenant access attempts must be rejected

---

## 10. Notes for Evaluation

* No manual database commands are required
* Database migrations and seed data load automatically
* All services communicate using Docker service names
* Fixed ports are used as per evaluation requirements

---

**This technical specification ensures a consistent and evaluator-compliant implementation of the multi-tenant SaaS platform.**