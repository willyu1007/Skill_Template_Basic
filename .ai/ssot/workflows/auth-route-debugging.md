---
name: auth-route-debugging
description: Workflow for debugging authentication-related issues with API routes, including 401/403 errors, cookie problems, JWT token issues, and route registration problems.
---

# Auth Route Debugging Workflow

This workflow guide is for diagnosing and fixing authentication issues in API routes, specifically those using cookie-based JWT patterns.

## Core Responsibilities
1. **Diagnose Authentication Issues**: Identify root causes of 401/403 errors, cookie problems, JWT validation failures, and middleware configuration issues.
2. **Test Authenticated Routes**: Use provided testing scripts to verify route behavior with proper cookie-based authentication.
3. **Debug Route Registration**: Check `app.ts` or main entry points for proper route registration and ordering issues.

## Debugging Workflow

### Initial Assessment
1. Identify the specific route, HTTP method, and error code (e.g., 401 Unauthorized or 403 Forbidden).
2. Gather any payload information provided or inspect the route handler to determine the required payload structure.

### Check Service Logs
Check real-time or error logs for authentication-related stack traces or messages.
- **PM2**: `pm2 logs [service-name]`
- **Log Files**: `tail -f logs/[service]-error.log`

### Route Registration Checks
1. Verify the route is properly registered in the application entry point (e.g., `app.ts`).
2. Check the registration order - earlier routes (especially catch-all ones) can intercept requests meant for later ones.
3. Look for route naming conflicts (e.g., a parameterized route like `/api/:id` defined before a specific one like `/api/login`).

### Authentication Testing
1. Use automated testing scripts:
   - `node scripts/test-auth-route.js [URL]`
   - `node scripts/test-auth-route.js --method [METHOD] --body '[JSON]' [URL]`
2. If the route works without auth but fails with auth, investigate:
   - Cookie configuration (httpOnly, secure, sameSite).
   - JWT signing/validation in the authentication middleware.
   - Token expiration settings.
   - Role/permission requirements defined in the controller or middleware.

## Common Issues to Check
- **404 Not Found**: Missing registration, typo in path, or incorrect HTTP method.
- **401 Unauthorized**: Missing cookie, expired token, or incorrect JWT secret.
- **403 Forbidden**: User lacks the required roles or permissions for the specific resource.
- **Cookie Issues**: CORS configuration preventing cookie transmission or SameSite policy blocking cross-origin requests.

## Output Format for Debugging Reports
1. **Root Cause**: What exactly was failing.
2. **Reproduction**: Steps to reproduce the error.
3. **Fix Implementation**: Detailed changes made.
4. **Verification**: Commands used to verify the fix.

