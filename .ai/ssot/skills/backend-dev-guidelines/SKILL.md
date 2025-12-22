---
name: backend-dev-guidelines
description: |
  Comprehensive backend development guide for Node.js, Express, and TypeScript.
  Use when creating routes, controllers, services, repositories, or middleware.
  Covers layered architecture (routes → controllers → services → repositories),
  Prisma database access, Sentry error tracking, Zod validation, configuration
  management, and async patterns.
---

# Backend Development Guidelines

## Purpose
Establish consistency and best practices across backend services using modern Node.js, Express, and TypeScript patterns.

## When to Use This Skill
Use this skill when:
- Creating or modifying API endpoints and route definitions.
- Implementing business logic in services or data access in repositories.
- Setting up middleware for authentication, validation, or error handling.
- Performing database operations using Prisma.
- Integrating error tracking (e.g., Sentry) or input validation (e.g., Zod).
- Configuring application settings or environment variables.

---

## Architecture Overview

### Layered Architecture
```
HTTP Request
    ↓
Routes (registration and middleware)
    ↓
Controllers (request parsing and response formatting)
    ↓
Services (business logic and orchestration)
    ↓
Repositories (data access abstraction)
    ↓
Database (Prisma/ORM)
```

**Key Principle:** Each layer has one distinct responsibility.

Refer to [architecture-overview.md](resources/architecture-overview.md) for more details.

---

## Core Principles

1. **Routes Only Route**: Routes should only register endpoints and middleware. Delegate all logic to controllers.
2. **Standardized Controllers**: All controllers should follow a consistent pattern (e.g., extending a `BaseController`) for uniform error and success handling.
3. **Centralized Error Tracking**: All caught errors should be sent to a tracking system (like Sentry) before being handled or rethrown.
4. **Type-Safe Configuration**: Use a centralized configuration object instead of direct `process.env` access.
5. **Rigorous Validation**: Validate all incoming request data using schemas (like Zod) before it reaches the service layer.
6. **Repository Pattern**: Abstract database operations behind repositories to keep services focused on business logic.
7. **Automated Testing**: Ensure services and critical logic are covered by unit and integration tests.

---

## Directory Structure
```
src/
├── config/              # Centralized configuration
├── controllers/         # Request handlers
├── services/            # Business logic
├── repositories/        # Data access
├── routes/              # Route definitions
├── middleware/          # Express middleware
├── types/               # TypeScript type definitions
├── validators/          # Validation schemas (e.g., Zod)
├── utils/               # Shared utilities
└── tests/               # Unit and integration tests
```

---

## Resource Files

For deep dives into specific topics, refer to:

- [architecture-overview.md](resources/architecture-overview.md): Detailed layered architecture and request lifecycle.
- [routing-and-controllers.md](resources/routing-and-controllers.md): Best practices for Express routes and controller implementation.
- [services-and-repositories.md](resources/services-and-repositories.md): Organizing business logic and data access.
- [validation-patterns.md](resources/validation-patterns.md): Input validation with Zod and DTO patterns.
- [database-patterns.md](resources/database-patterns.md): Efficient database access with Prisma.
- [async-and-errors.md](resources/async-and-errors.md): Handling asynchronous operations and custom error types.
- [testing-guide.md](resources/testing-guide.md): Strategies for unit and integration testing.
- [sentry-and-monitoring.md](resources/sentry-and-monitoring.md): Error tracking and performance monitoring.
- [configuration.md](resources/configuration.md): Managing application settings and environment variables.
- [middleware-guide.md](resources/middleware-guide.md): Creating custom Express middleware.
- [complete-examples.md](resources/complete-examples.md): Full end-to-end implementation examples.

