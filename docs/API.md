# API Documentation

Multi-Tenant SaaS Project Management Platform

---

## Base URL

```
http://localhost:5000/api
```

All endpoints return responses in the following standard format:

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

Authentication is handled using **JWT (JSON Web Tokens)**.

* JWT must be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

* JWT payload includes:

```json
{
  "userId": "uuid",
  "tenantId": "uuid | null",
  "role": "super_admin | tenant_admin | user"
}
```

---

## AUTHENTICATION APIs

---

### 1. Register Tenant

**POST** `/auth/register-tenant`

Registers a new tenant and creates a tenant admin.

**Auth Required:** No

**Request Body**

```json
{
  "tenantName": "Demo Company",
  "subdomain": "demo",
  "adminFullName": "Demo Admin",
  "adminEmail": "admin@demo.com",
  "adminPassword": "Demo@123"
}
```

**Response**

```json
{
  "success": true,
  "message": "Tenant registered successfully"
}
```

---

### 2. Login

**POST** `/auth/login`

Authenticates a user.

**Auth Required:** No

**Request Body**

```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "role": "tenant_admin",
      "tenantId": "uuid"
    },
    "token": "jwt_token",
    "expiresIn": 86400
  }
}
```

---

### 3. Get Current User

**GET** `/auth/me`

Returns authenticated user details.

**Auth Required:** Yes

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@demo.com",
    "fullName": "Demo Admin",
    "role": "tenant_admin",
    "tenantId": "uuid"
  }
}
```

---

## TENANT APIs (SUPER ADMIN)

---

### 4. List Tenants

**GET** `/tenants`

**Auth Required:** Yes (super_admin)

**Response**

```json
{
  "success": true,
  "data": {
    "tenants": []
  }
}
```

---

### 5. Get Tenant Details

**GET** `/tenants/:tenantId`

**Auth Required:** Yes (super_admin)

---

### 6. Update Tenant

**PUT** `/tenants/:tenantId`

**Auth Required:** Yes (super_admin)

---

## USER MANAGEMENT APIs

---

### 7. List Users by Tenant

**GET** `/tenants/:tenantId/users`

**Auth Required:** Yes (tenant_admin)

**Response**

```json
{
  "success": true,
  "data": {
    "users": []
  }
}
```

---

### 8. Create User

**POST** `/tenants/:tenantId/users`

**Auth Required:** Yes (tenant_admin)

**Request Body**

```json
{
  "email": "user1@demo.com",
  "fullName": "Demo User",
  "password": "User@123",
  "role": "user"
}
```

---

### 9. Update User

**PUT** `/users/:userId`

**Auth Required:** Yes (tenant_admin)

---

### 10. Delete User

**DELETE** `/users/:userId`

**Auth Required:** Yes (tenant_admin)

---

## PROJECT MANAGEMENT APIs

---

### 11. List Projects

**GET** `/projects`

**Auth Required:** Yes

---

### 12. Create Project

**POST** `/projects`

**Auth Required:** Yes (tenant_admin)

**Request Body**

```json
{
  "name": "Project Alpha",
  "description": "Demo project",
  "status": "active"
}
```

---

### 13. Get Project Details

**GET** `/projects/:projectId`

**Auth Required:** Yes

---

### 14. Update Project

**PUT** `/projects/:projectId`

**Auth Required:** Yes (tenant_admin)

---

### 15. Delete Project

**DELETE** `/projects/:projectId`

**Auth Required:** Yes (tenant_admin)

---

## TASK MANAGEMENT APIs

---

### 16. List Tasks by Project

**GET** `/projects/:projectId/tasks`

**Auth Required:** Yes

---

### 17. Create Task

**POST** `/projects/:projectId/tasks`

**Auth Required:** Yes

**Request Body**

```json
{
  "title": "Design Homepage",
  "description": "UI design",
  "priority": "high",
  "assignedTo": "userId"
}
```

---

### 18. Update Task

**PUT** `/tasks/:taskId`

**Auth Required:** Yes

---

### 19. Update Task Status

**PATCH** `/tasks/:taskId/status`

**Auth Required:** Yes

**Request Body**

```json
{
  "status": "completed"
}
```

---

### 20. Delete Task

**DELETE** `/tasks/:taskId`

**Auth Required:** Yes

---

## HEALTH CHECK API

---

### 21. Health Check

**GET** `/health`

**Auth Required:** No

**Response**

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## Authorization Rules Summary

| Role         | Permissions                   |
| ------------ | ----------------------------- |
| super_admin  | Manage all tenants            |
| tenant_admin | Manage users, projects, tasks |
| user         | View assigned tasks           |

---