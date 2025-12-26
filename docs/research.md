# Research Document

## 1. Multi-Tenancy Analysis

### Overview

Multi-tenancy is a core architectural concept in Software-as-a-Service (SaaS) platforms, where a single application instance serves multiple independent organizations (tenants). Each tenant must experience the system as if it were isolated, even though infrastructure and application logic may be shared. Choosing the correct multi-tenancy approach is critical for scalability, security, maintainability, and cost efficiency.

This section analyzes three commonly used multi-tenancy approaches and justifies the approach selected for this project.

### Multi-Tenancy Approaches Comparison

| Approach                              | Description                                                                                                             | Pros                                                                                                                               | Cons                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Shared Database + Shared Schema**   | All tenants share the same database and schema. Tenant data is differentiated using a `tenant_id` column in each table. | • Lowest infrastructure cost<br>• Simple deployment and scaling<br>• Easy to manage migrations<br>• Efficient resource utilization | • High risk if tenant isolation is incorrectly enforced<br>• Requires strict query discipline<br>• More complex authorization logic |
| **Shared Database + Separate Schema** | Single database, but each tenant has its own schema within the database.                                                | • Better logical isolation than shared schema<br>• Reduced risk of cross-tenant data leaks<br>• Easier per-tenant backup           | • Schema management becomes complex<br>• Harder to run migrations at scale<br>• Increased operational overhead                      |
| **Separate Database per Tenant**      | Each tenant has its own dedicated database instance.                                                                    | • Strongest data isolation<br>• Simplified compliance and security audits<br>• Easy tenant-level backup/restore                    | • High infrastructure cost<br>• Difficult to manage at scale<br>• Complex provisioning and monitoring                               |

### Chosen Approach and Justification

This project adopts the **Shared Database + Shared Schema (with tenant_id)** approach.

The primary reasons for choosing this approach are:

1. **Scalability**: The system is expected to support multiple tenants with varying sizes. A shared schema approach allows onboarding new tenants instantly without provisioning new databases or schemas.
2. **Cost Efficiency**: Using a single database minimizes infrastructure cost, which aligns well with SaaS economics, especially for free and pro subscription tiers.
3. **Operational Simplicity**: Database migrations, backups, and monitoring can be managed centrally without tenant-specific procedures.
4. **Evaluator Constraints**: The project explicitly requires tenant_id-based isolation, making this approach the most aligned with evaluation expectations.

To mitigate the inherent risks of this approach, strict safeguards are implemented:

- Every table (except super_admin users) includes a `tenant_id` column.
- All queries are scoped by `tenant_id` at the API and database level.
- Role-based access control (RBAC) ensures users cannot access resources outside their permissions.
- Extensive audit logging detects suspicious or unauthorized activity.

With these controls in place, the shared schema model provides a strong balance between scalability, security, and maintainability.

---

## 2. Technology Stack Justification

### Backend Framework: Node.js with Express.js

Node.js with Express.js is chosen as the backend framework for this project.

**Reasons for Selection:**

- Non-blocking, event-driven architecture ideal for I/O-heavy applications
- Large ecosystem of middleware for authentication, validation, and logging
- Easy integration with PostgreSQL and JWT-based authentication
- Strong community support and mature tooling

**Alternatives Considered:**

- **Django**: Offers built-in features but is more opinionated and heavier for REST APIs
- **Spring Boot**: Powerful but introduces significant boilerplate and complexity

Express provides the flexibility needed to implement custom multi-tenancy, RBAC, and subscription enforcement logic.

### Frontend Framework: React

React is used for building the frontend user interface.

**Reasons for Selection:**

- Component-based architecture simplifies UI reuse
- Large ecosystem and community support
- Seamless integration with REST APIs
- Supports role-based conditional rendering

**Alternatives Considered:**

- **Angular**: Steeper learning curve and heavier framework
- **Vue.js**: Lightweight but smaller ecosystem compared to React

React offers the best balance between flexibility, maintainability, and industry relevance.

### Database: PostgreSQL

PostgreSQL is selected as the relational database.

**Reasons for Selection:**

- Strong support for relational integrity and constraints
- Advanced indexing and query optimization
- Native support for JSON, UUIDs, and ENUMs
- ACID compliance for transaction safety

**Alternatives Considered:**

- **MySQL**: Lacks some advanced features and stricter constraints
- **MongoDB**: Schema-less nature increases risk in multi-tenant isolation

### Authentication Method: JWT (JSON Web Tokens)

JWT is used for stateless authentication.

**Reasons for Selection:**

- Stateless and scalable
- No server-side session storage required
- Easy to integrate with frontend applications
- Industry-standard approach for APIs

**Alternatives Considered:**

- **Session-based authentication**: Requires server-side storage and increases complexity
- **OAuth-only**: Overkill for internal SaaS authentication

### Deployment & Containerization: Docker & Docker Compose

Docker is used to containerize the application.

**Reasons for Selection:**

- Ensures environment consistency
- Simplifies deployment and evaluation
- Enables one-command startup using docker-compose
- Isolates services cleanly (database, backend, frontend)

---

## 3. Security Considerations

### Key Security Measures for Multi-Tenant Systems

1. **Strict Tenant Isolation**: Every database query is scoped by `tenant_id` to prevent cross-tenant access.
2. **Role-Based Access Control (RBAC)**: APIs enforce permissions based on user roles (super_admin, tenant_admin, user).
3. **Password Hashing**: All passwords are hashed using bcrypt with appropriate salt rounds.
4. **JWT Security**: Tokens are signed, time-limited (24-hour expiry), and verified on every protected request.
5. **Audit Logging**: All sensitive actions are logged in the `audit_logs` table for traceability.

### Data Isolation Strategy

Data isolation is enforced at multiple layers:

- Database schema includes `tenant_id` in all tenant-owned tables
- API middleware validates tenant context before processing requests
- Role checks ensure users can only act within their tenant scope

### Authentication & Authorization Approach

Authentication is handled using JWTs issued at login. Authorization is enforced using middleware that validates:

- Token authenticity
- User role
- Tenant association

Super admin users are treated as a special case with `tenant_id = NULL` and elevated permissions.

### Password Hashing Strategy

Passwords are never stored in plaintext. bcrypt is used with industry-recommended salt rounds to ensure resistance against brute-force and rainbow table attacks.

### API Security Measures

- Input validation on all endpoints
- Proper HTTP status codes and error handling
- Prevention of SQL injection via parameterized queries
- CORS configured to allow only trusted frontend origins

---

**This research establishes the architectural, technological, and security foundation for the multi-tenant SaaS platform.**
