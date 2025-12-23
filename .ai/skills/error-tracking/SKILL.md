---
name: error-tracking
description: |
  Add error tracking and performance monitoring to backend and frontend services.
  Use when implementing error handling, creating new controllers, instrumenting
  cron jobs, or tracking database performance. ALL ERRORS MUST BE CAPTURED - 
  no exceptions.
---

# Error Tracking Skill

## Purpose
Enforce comprehensive error tracking and performance monitoring across all services, ensuring that every failure is documented and actionable.

## When to Use This Skill
Use this skill when:
- Adding `try/catch` blocks to any code.
- Creating new controllers, routes, or API handlers.
- Instrumenting background tasks or cron jobs.
- Tracking database query performance or adding performance spans.
- Handling complex workflow or multi-step process errors.

---

## 🚨 CRITICAL RULE
**ALL ERRORS MUST BE CAPTURED** to a tracking system (e.g., Sentry). Never use `console.error` alone. Never swallow errors silently.

---

## Integration Patterns

### 1. Controller Error Handling
Use a base controller to standardize error reporting.

```typescript
// ✅ CORRECT - Automatically sends to tracking system
try {
    // ... logic
} catch (error) {
    this.handleError(error, 'methodName'); 
}
```

### 2. Manual Exception Capture
Capture exceptions manually when a base controller is not available.

```typescript
import * as Sentry from '@sentry/node';

try {
    // ... logic
} catch (error) {
    Sentry.captureException(error, {
        tags: { route: '/path', method: 'POST' },
        extra: { userId: '123' }
    });
    throw error;
}
```

### 3. Background Tasks & Cron Jobs
The tracking system MUST be initialized as the first operation in any background task.

```typescript
#!/usr/bin/env node
import './instrument'; // Initialize tracking FIRST
import * as Sentry from '@sentry/node';

async function main() {
    return await Sentry.startSpan({ name: 'job-name', op: 'cron' }, async () => {
        // Task logic
    });
}
```

### 4. Performance Spans
Wrap critical or slow operations in spans to track latency.

```typescript
const result = await Sentry.startSpan({
    name: 'operation.name',
    op: 'operation.type',
}, async () => {
    return await someAsyncOperation();
});
```

---

## Required Context for Errors

Always include the following context if available to simplify debugging:
- **User ID**: The ID of the user who triggered the error.
- **Service Name**: Which microservice or module failed.
- **Environment**: (e.g., development, staging, production).
- **Operation Details**: Specific parameters, entity IDs, or workflow codes.

---

## Implementation Checklist

- [ ] **Import Helper**: Ensure the tracking library or project-specific helper is imported.
- [ ] **Capture All Paths**: Every potential failure point in a `try/catch` should capture the error.
- [ ] **Add Context**: Include relevant IDs and tags.
- [ ] **No Sensitive Data**: Ensure passwords, tokens, or PII are NOT included in the error context.
- [ ] **Test the Flow**: Trigger a test error to verify it appears in the monitoring dashboard.

---

## Related Skills
- [backend-dev-guidelines](../backend-dev-guidelines/SKILL.md) - Using error tracking in controllers.
- [route-tester](../route-tester/SKILL.md) - Verifying error responses during API tests.

