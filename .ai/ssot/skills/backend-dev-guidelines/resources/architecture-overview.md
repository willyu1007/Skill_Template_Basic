# Architecture Overview - Backend Services

This document describes the layered architecture pattern used to build maintainable and scalable backend services.

---

## Layered Architecture Pattern

### The Four Layers

1. **Routes**:
   - Define endpoints and register middleware.
   - Delegate request handling to controllers.
   - **Constraint**: No business logic or data access.

2. **Controllers**:
   - Handle HTTP request/response concerns.
   - Parse parameters, query strings, and bodies.
   - Invoke validation schemas.
   - Call service methods and format the response.
   - **Constraint**: Delegate business rules to services.

3. **Services**:
   - Implement core business logic and rules.
   - Orchestrate multiple repositories if necessary.
   - Handle transactions.
   - **Constraint**: No knowledge of HTTP or specific data storage implementations.

4. **Repositories**:
   - Abstract data access (e.g., Prisma, SQL queries).
   - Optimize queries and implement caching.
   - **Constraint**: No business logic; focused on CRUD and data retrieval.

---

## Request Lifecycle

1. **Incoming Request**: Client sends an HTTP request.
2. **Routing**: Express matches the path and executes registered middleware (Auth, Logging, etc.).
3. **Controller Handling**: The route handler calls a controller method.
4. **Validation**: The controller validates the input using a schema (e.g., Zod).
5. **Business Logic**: The controller calls a service method with the validated data.
6. **Data Access**: The service calls one or more repository methods to interact with the database.
7. **Response Flow**: Data returns from Repository → Service → Controller.
8. **Final Response**: The controller sends the formatted response (JSON, Status Code) back to the client.

---

## Separation of Concerns

| Layer | Responsible For | Should NOT |
|-------|-----------------|------------|
| **Routes** | Registration, Middleware | Business logic, Data access |
| **Controllers** | Parsing, Validation, Response | Complex business rules, DB queries |
| **Services** | Logic, Orchestration, Rules | Request/Response types, direct ORM usage |
| **Repositories** | ORM calls, Query optimization | HTTP concerns, Business rules |

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Deep dive into Layer 1 & 2
- [services-and-repositories.md](services-and-repositories.md) - Deep dive into Layer 3 & 4

