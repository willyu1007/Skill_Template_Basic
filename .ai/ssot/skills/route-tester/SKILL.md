---
name: route-tester
description: |
  Test authenticated API routes using cookie-based or header-based authentication.
  Use when validating endpoints, debugging authentication issues, or performing
  manual API testing with tools like curl or specialized test scripts.
---

# Route Tester Skill

## Purpose
Provide patterns and methods for testing authenticated routes in backend services, focusing on cookie-based JWT authentication and common debugging workflows.

## When to Use This Skill
Use this skill when:
- Testing new API endpoints for correctness.
- Validating route functionality after architectural changes.
- Debugging authentication or authorization issues (e.g., 401 or 403 errors).
- Verifying request/response data shapes for POST, PUT, and DELETE operations.
- Checking database changes resulting from API calls.

---

## Authentication Overview

Most services in this template use:
- **SSO Provider**: (e.g., Keycloak or Auth0).
- **Cookie-based JWT**: Authentication tokens are stored in cookies (e.g., `refresh_token` or `access_token`).
- **Signing**: Tokens are signed using a secret defined in the service configuration.

---

## Testing Methods

### Method 1: Specialized Test Scripts (Recommended)
Use project-specific scripts (e.g., `scripts/test-auth-route.js`) to handle authentication complexity automatically.

**Usage:**
```bash
# Basic GET request
node scripts/test-auth-route.js http://localhost:3000/api/endpoint

# POST request with JSON data
node scripts/test-auth-route.js http://localhost:3000/api/endpoint POST '{"key":"value"}'
```

### Method 2: Manual curl with Token
Extract a valid token and use it directly with `curl`.

```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -b "auth_token=<TOKEN>" \
  -d '{"key": "value"}'
```

### Method 3: Mock Authentication (Development Only)
In development environments, you can often bypass the SSO provider using mock headers.

```bash
curl -H "X-Mock-Auth: true" \
     -H "X-Mock-User: test-user" \
     -H "X-Mock-Roles: admin" \
     http://localhost:3000/api/protected-endpoint
```

---

## Testing Checklist

- [ ] **Identify the Service**: Determine the service and port (e.g., Users on 3000).
- [ ] **Verify Route Prefix**: Check `app.ts` for any global route prefixes (e.g., `/api/v1`).
- [ ] **Prepare Request Body**: Ensure JSON data matches the expected validation schema.
- [ ] **Determine Auth Method**: Choose between a real token or mock authentication.
- [ ] **Execute Test**: Run the script or `curl` command.
- [ ] **Verify Response**: Check status codes (2xx for success, 4xx/5xx for errors).
- [ ] **Check Database**: Verify that the expected data was created or modified in the database.

---

## Troubleshooting Failed Tests

- **401 Unauthorized**: Token expired, incorrect cookie name, or JWT secret mismatch.
- **403 Forbidden**: User lacks the required roles or permissions for the resource.
- **404 Not Found**: Incorrect URL, missing prefix, or the route is not registered in `app.ts`.
- **500 Internal Error**: Check service logs and error tracking (e.g., Sentry) for details.

---

## Related Skills
- [backend-dev-guidelines](../backend-dev-guidelines/SKILL.md) - Routing and controller patterns.
- [error-tracking](../error-tracking/SKILL.md) - Checking for captured errors during tests.

