# Middleware Guide - Express Middleware Patterns

Guide to creating and organizing custom Express middleware for cross-cutting concerns.

---

## Common Middleware Types

1. **Authentication**: Verify user identity (e.g., checking JWTs).
2. **Authorization**: Verify user permissions for specific resources.
3. **Logging & Audit**: Track request metadata and user actions.
4. **Validation**: Validate request bodies or parameters (see [validation-patterns.md](validation-patterns.md)).
5. **Error Handling**: Standardize error responses (see [async-and-errors.md](async-and-errors.md)).

---

## Pattern Implementation

### Authentication Middleware Example
```typescript
// middleware/auth.ts
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Verify token...
    next();
}
```

### Context Storage (AsyncLocalStorage)
Use `AsyncLocalStorage` to share request-scoped data (like user IDs) across services without passing it as an argument everywhere.

```typescript
import { AsyncLocalStorage } from 'async_hooks';
export const requestStore = new AsyncLocalStorage<Map<string, any>>();

export function contextMiddleware(req: Request, res: Response, next: NextFunction) {
    const store = new Map();
    store.set('userId', req.user?.id);
    requestStore.run(store, () => next());
}
```

---

## Middleware Ordering

The order in which middleware is registered in `app.ts` is critical:

1. **Security Headers**: (e.g., Helmet).
2. **Body Parsers**: (e.g., `express.json()`).
3. **Monitoring**: (e.g., Sentry request handler).
4. **Authentication**: Establish user identity.
5. **Routes**: Feature-specific logic.
6. **Error Handler**: MUST be registered last.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Registering middleware in routes
- [async-and-errors.md](async-and-errors.md) - Error boundary middleware

