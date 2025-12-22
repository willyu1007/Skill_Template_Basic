# Auth Implementation - Plan

## Summary

Add JWT-based authentication to the API. Users can register, login, and access protected routes.

## Phases

### Phase 1: Database (1h)

- 1.1: Add User model with Prisma → Acceptance: migration runs
- 1.2: Add password hashing → Acceptance: bcrypt integrated

### Phase 2: Auth Routes (2h)

- 2.1: POST /auth/register → Acceptance: creates user, returns token
- 2.2: POST /auth/login → Acceptance: validates, returns token
- 2.3: GET /auth/me → Acceptance: returns user from token

### Phase 3: Middleware (1h)

- 3.1: Create authMiddleware → Acceptance: validates JWT, attaches user
- 3.2: Protect routes → Acceptance: unauthorized returns 401

## Risks

- Token expiration handling: implement refresh tokens in Phase 4
- Password reset: out of scope for initial implementation

