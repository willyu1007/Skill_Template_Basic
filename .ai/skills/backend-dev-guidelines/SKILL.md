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

Refer to [reference.md](reference.md) for more details.

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

## Supporting Files

For deep dives into specific topics, refer to:

- [reference.md](reference.md): Architecture, routing, services, validation, database, errors, testing, monitoring, configuration, and middleware guidance.
- [examples.md](examples.md): End-to-end implementation examples.

