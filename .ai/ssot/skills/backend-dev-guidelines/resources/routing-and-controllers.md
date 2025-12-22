# Routing and Controllers - Best Practices

Guide to implementing clean route definitions and controller patterns.

---

## Routes: Routing Only

### The Golden Rule
**Routes should ONLY:**
- ✅ Define route paths.
- ✅ Register middleware (Auth, Logging, etc.).
- ✅ Delegate to controllers.

**Routes should NEVER:**
- ❌ Contain business logic.
- ❌ Access the database directly.
- ❌ Implement validation logic (use schemas + controller).
- ❌ Format complex responses.

### Clean Route Pattern
```typescript
// routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new UserController();

// ✅ CLEAN: Route definition and delegation
router.get('/:id',
    authMiddleware,
    async (req, res) => controller.getUser(req, res)
);

router.post('/',
    authMiddleware,
    async (req, res) => controller.createUser(req, res)
);

export default router;
```

---

## BaseController Pattern

Using a `BaseController` ensures consistent error handling, standardized response formats, and built-in integration with monitoring tools.

### Example BaseController
```typescript
import { Response } from 'express';
import * as Sentry from '@sentry/node';

export abstract class BaseController {
    /**
     * Standardized success response
     */
    protected handleSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
        res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    /**
     * Standardized error handling with Sentry integration
     */
    protected handleError(error: unknown, res: Response, context: string, statusCode = 500): void {
        // Log to monitoring service
        Sentry.captureException(error, { tags: { operation: context } });

        res.status(statusCode).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
                code: statusCode,
            },
        });
    }
}
```

---

## HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | OK - Successful GET or PUT. |
| 201 | Created - Successful POST. |
| 204 | No Content - Successful DELETE. |
| 400 | Bad Request - Validation or input error. |
| 401 | Unauthorized - Missing or invalid authentication. |
| 403 | Forbidden - Authenticated but lacks permissions. |
| 404 | Not Found - Resource does not exist. |
| 500 | Internal Server Error - Unexpected server-side failure. |

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [services-and-repositories.md](services-and-repositories.md) - Business logic layer
- [validation-patterns.md](validation-patterns.md) - Input validation

