# Sentry Integration and Monitoring

Guide to error tracking and performance monitoring with Sentry.

---

## Core Principles

**Mandatory**: All errors that reach a controller's error handler or a top-level try-catch block MUST be captured by Sentry.

### Why Sentry?
- **Real-time Alerting**: Get notified immediately when errors occur in production.
- **Contextual Data**: Capture user IDs, request parameters, and stack traces to simplify debugging.
- **Performance Tracking**: Monitor transaction times and database query performance.

---

## Implementation Patterns

### Capturing Exceptions
```typescript
try {
    await someOperation();
} catch (error) {
    Sentry.captureException(error, {
        tags: { service: 'user-service', operation: 'someOperation' },
        extra: { userId: user.id }
    });
    throw error;
}
```

### Adding Breadcrumbs
Provide a timeline of events leading up to an error.
```typescript
Sentry.addBreadcrumb({
    category: 'auth',
    message: 'User logged in',
    level: 'info',
});
```

---

## Performance Monitoring

Use Sentry spans to track the duration of critical operations.

```typescript
await Sentry.startSpan({
    name: 'database.query',
    op: 'db.prisma'
}, async () => {
    return await prisma.user.findMany();
});
```

---

## Best Practices

1. **Scrub PII**: Never send sensitive data (passwords, tokens) to Sentry. Use `beforeSend` to mask or remove fields.
2. **Environment Aware**: Ensure the `environment` tag (development, staging, production) is correctly set.
3. **Trace IDs**: Include a `requestId` or `traceId` in error responses to help developers find the corresponding Sentry issue.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [async-and-errors.md](async-and-errors.md) - Error handling logic
- [configuration.md](configuration.md) - Sentry DSN configuration

