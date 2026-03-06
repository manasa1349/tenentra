# API Documentation

## Base URL

`http://localhost:5000/api`

All APIs return:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

For protected endpoints, send:

`Authorization: Bearer <token>`

---

## Authentication APIs

### POST `/auth/register-tenant`
Register a tenant and its first tenant admin.

### POST `/auth/login`
Login as super admin or tenant user.

### GET `/auth/me`
Get current user profile and tenant metadata.

### PUT `/auth/me`
Update current user profile.

Supported payload fields:

```json
{
  "fullName": "New Name",
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

Notes:
- `fullName` update is optional.
- Password change requires both `currentPassword` and `newPassword`.

### GET `/auth/preferences`
Get current user preferences.

### PUT `/auth/preferences`
Update current user preferences.

```json
{
  "emailNotifications": true,
  "taskDueReminders": true,
  "weeklySummary": false,
  "defaultTaskView": "board"
}
```

### POST `/auth/logout`
Logout current user.

---

## Tenant APIs

### GET `/tenants`
Super admin only.

### GET `/tenants/:tenantId`
Super admin only.

### PUT `/tenants/:tenantId`
Super admin only.

---

## User Management APIs

### POST `/tenants/:tenantId/users`
Tenant admin only.

### GET `/tenants/:tenantId/users`
Tenant admin only.

### PUT `/users/:userId`
Tenant admin can update tenant users.
User can update their own `fullName` only.

### DELETE `/users/:userId`
Tenant admin only.

---

## Project APIs

### GET `/projects`
Authenticated users.

### GET `/projects/:projectId`
Authenticated users with tenant access.

### POST `/projects`
Tenant admin and super admin only.

### PUT `/projects/:projectId`
Tenant admin and super admin only.

### DELETE `/projects/:projectId`
Tenant admin and super admin only.

---

## Task APIs

### GET `/projects/:projectId/tasks`
Authenticated users.

Behavior:
- Tenant admin/super admin: can list tenant/project tasks.
- User: automatically limited to tasks assigned to self.

### POST `/projects/:projectId/tasks`
Tenant admin and super admin only.

### PATCH `/tasks/:taskId/status`
- Tenant admin/super admin: any task in tenant scope.
- User: only tasks assigned to self.

### PUT `/tasks/:taskId`
- Tenant admin/super admin: full task update.
- User: status-only update on tasks assigned to self.

### DELETE `/tasks/:taskId`
Tenant admin and super admin only.

---

## Health

### GET `/health`
Returns API + database readiness.

---

## Role Matrix

| Role         | Tenants | Users | Projects | Tasks |
|--------------|---------|-------|----------|-------|
| super_admin  | Full    | Cross-tenant visibility, no tenant user CRUD via user endpoint | Full | Full |
| tenant_admin | No      | Full in own tenant | Full in own tenant | Full in own tenant |
| user         | No      | Self profile only | Read-only | Assigned-task status updates only |

---

For product/architecture details, see:

- `docs/FULL_DOCUMENTATION.md`
- `docs/FULL_DOCUMENTATION.pdf`
