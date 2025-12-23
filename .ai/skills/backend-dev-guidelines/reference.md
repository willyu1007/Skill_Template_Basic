# Reference

## Architecture Overview - Backend Services

This document describes the layered architecture pattern used to build maintainable and scalable backend services.

---

### Layered Architecture Pattern

#### The Four Layers

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

### Request Lifecycle

1. **Incoming Request**: Client sends an HTTP request.
2. **Routing**: Express matches the path and executes registered middleware (Auth, Logging, etc.).
3. **Controller Handling**: The route handler calls a controller method.
4. **Validation**: The controller validates the input using a schema (e.g., Zod).
5. **Business Logic**: The controller calls a service method with the validated data.
6. **Data Access**: The service calls one or more repository methods to interact with the database.
7. **Response Flow**: Data returns from Repository → Service → Controller.
8. **Final Response**: The controller sends the formatted response (JSON, Status Code) back to the client.

---

### Separation of Concerns

| Layer | Responsible For | Should NOT |
|-------|-----------------|------------|
| **Routes** | Registration, Middleware | Business logic, Data access |
| **Controllers** | Parsing, Validation, Response | Complex business rules, DB queries |
| **Services** | Logic, Orchestration, Rules | Request/Response types, direct ORM usage |
| **Repositories** | ORM calls, Query optimization | HTTP concerns, Business rules |

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Routing and controllers - Deep dive into Layer 1 & 2
- Services and repositories - Deep dive into Layer 3 & 4

---

## Routing and Controllers - Best Practices

Guide to implementing clean route definitions and controller patterns.

---

### Routes: Routing Only

#### The Golden Rule
**Routes should ONLY:**
- ✅ Define route paths.
- ✅ Register middleware (Auth, Logging, etc.).
- ✅ Delegate to controllers.

**Routes should NEVER:**
- ❌ Contain business logic.
- ❌ Access the database directly.
- ❌ Implement validation logic (use schemas + controller).
- ❌ Format complex responses.

#### Clean Route Pattern
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

### BaseController Pattern

Using a `BaseController` ensures consistent error handling, standardized response formats, and built-in integration with monitoring tools.

#### Example BaseController
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

### HTTP Status Codes

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

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Services and repositories - Business logic layer
- Validation patterns - Input validation

---

## Services and Repositories - Business Logic Layer

Guide to separating business logic (Services) from data access (Repositories).

---

### Service Layer

Services contain the 'what' and 'why' of your application. They are responsible for business rules and orchestrating operations.

#### Responsibilities
- ✅ Business rules enforcement.
- ✅ Orchestrating multiple repositories or external services.
- ✅ Transaction management.
- ✅ Complex calculations and data transformations.

#### Service Template (with Dependency Injection)
```typescript
// services/UserService.ts
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
    constructor(private userRepository = new UserRepository()) {}

    async getUser(id: string) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    async create(data: CreateUserDTO) {
        const exists = await this.userRepository.findByEmail(data.email);
        if (exists) throw new ConflictError('User already exists');
        return await this.userRepository.save(data);
    }
}
```

---

### Repository Pattern

Repositories abstract the 'how' of data access (e.g., Prisma queries, SQL).

#### Responsibilities
- ✅ All direct ORM/Database operations.
- ✅ Query construction and optimization.
- ✅ Hiding database implementation details from services.

#### Repository Template
```typescript
// repositories/UserRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
    async findById(id: string) {
        return await prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    }

    async save(data: any) {
        return await prisma.user.create({ data });
    }
}
```

---

### Design Principles

1. **Single Responsibility**: Each service/repository should focus on one domain entity or cohesive set of logic.
2. **No HTTP in Services**: Services should not accept `req` or `res` objects or return HTTP status codes.
3. **Dependency Injection**: Pass dependencies (like repositories) into services via the constructor to facilitate testing and loose coupling.
4. **Focused Repositories**: Keep repositories focused on data retrieval and storage; avoid adding business logic here.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Architecture overview - Layered architecture
- Database patterns - ORM best practices

---

## Validation Patterns - Input Validation with Zod

Guide to implementing type-safe input validation using Zod.

---

### Why Zod?

- **Type Safety**: Automatically infer TypeScript types from your schemas.
- **Runtime Validation**: Ensure incoming data matches expected formats at runtime.
- **Composable**: Build complex schemas by merging and extending smaller ones.

---

### Basic Schema Patterns

```typescript
import { z } from 'zod';

// Primitive schemas
const emailSchema = z.string().email();
const ageSchema = z.number().int().min(18);

// Object schema
export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    role: z.enum(['admin', 'user']),
    age: z.number().optional(),
});

// Inferring TypeScript type (DTO)
export type CreateUserDTO = z.infer<typeof createUserSchema>;
```

---

### Implementation Patterns

#### Validation in Controllers (Recommended)
Perform validation as early as possible in the request lifecycle.

```typescript
// controllers/UserController.ts
async createUser(req: Request, res: Response) {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const user = await this.userService.create(validatedData);
        this.handleSuccess(res, user, 'User created', 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return this.handleError(error, res, 'createUser', 400);
        }
        this.handleError(error, res, 'createUser');
    }
}
```

---

### Advanced Zod Patterns

#### Refinements (Custom Validation)
```typescript
const passwordSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
```

#### Transformations
```typescript
const stringToNumber = z.string().transform((val) => parseInt(val, 10));
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Routing and controllers - Using validation in controllers
- Async and errors - Error handling

---

## Database Patterns - Prisma Best Practices

Guide to efficient and safe database access using Prisma ORM.

---

### Core Principles

1. **Use Repositories**: Abstract Prisma calls behind a repository layer.
2. **Select only what you need**: Use the `select` clause to limit returned fields and reduce memory/bandwidth usage.
3. **Avoid N+1 Queries**: Use `include` or batching to fetch related data in a single query.
4. **Handle known errors**: Use Prisma's error codes to provide meaningful feedback (e.g., P2002 for unique constraint violation).

---

### Query Optimization

#### Using `select`
```typescript
// ✅ Good: Only fetches ID and email
const users = await prisma.user.findMany({
    select: { id: true, email: true }
});
```

#### Using `include`
```typescript
// ✅ Good: Fetches user and their posts in one query
const userWithPosts = await prisma.user.findUnique({
    where: { id: userId },
    include: { posts: true }
});
```

---

### Transaction Management

Use `$transaction` for operations that must succeed or fail as a single unit.

```typescript
const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const profile = await tx.profile.create({ data: { userId: user.id } });
    return { user, profile };
});
```

---

### Error Handling

Map Prisma error codes to application-specific error types.

```typescript
try {
    return await prisma.user.create({ data });
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            throw new ConflictError('Email already exists');
        }
    }
    throw error;
}
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Services and repositories - Repository pattern details
- Async and errors - Error handling strategies

---

## Async Patterns and Error Handling

Guide to handling asynchronous operations and implementing robust error handling.

---

### Async/Await Best Practices

#### 1. Always use try-catch
All async operations that can fail should be wrapped in a try-catch block.

```typescript
async function fetchData() {
    try {
        const response = await api.get('/data');
        return response.data;
    } catch (error) {
        // Log and handle error
        throw new AppError('Failed to fetch data');
    }
}
```

#### 2. Prefer async/await over `.then()`
Async/await is more readable and makes error handling more straightforward.

#### 3. Parallel execution with `Promise.all`
Use `Promise.all` for independent operations to improve performance.

```typescript
const [users, posts] = await Promise.all([
    userService.getAll(),
    postService.getAll()
]);
```

---

### Custom Error Types

Use custom error classes to distinguish between different failure modes.

```typescript
export class AppError extends Error {
    constructor(public message: string, public statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}
```

---

### Global Error Handling

Use a centralized error middleware in Express to catch all unhandled errors.

```typescript
// middleware/errorBoundary.ts
export function errorBoundary(error: Error, req: Request, res: Response, next: NextFunction) {
    const statusCode = (error as AppError).statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            message: error.message || 'Internal Server Error',
            name: error.name
        }
    });
}
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Routing and controllers - Error handling in controllers
- Sentry and monitoring - Error tracking

---

## Testing Guide - Backend Testing Strategies

Guide to implementing effective unit and integration tests for backend services.

---

### Unit Testing

Unit tests focus on individual classes or functions in isolation. Mock external dependencies (like repositories) to ensure tests are fast and predictable.

#### Example: Service Unit Test
```typescript
// tests/UserService.test.ts
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';

jest.mock('../repositories/UserRepository');

describe('UserService', () => {
    let userService: UserService;
    let mockRepo: jest.Mocked<UserRepository>;

    beforeEach(() => {
        mockRepo = new UserRepository() as any;
        userService = new UserService(mockRepo);
    });

    it('should throw error if user not found', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(userService.getUser('123')).rejects.toThrow('User not found');
    });
});
```

---

### Integration Testing

Integration tests verify that different parts of the system work together, including interactions with the real database.

#### Principles
- Use a dedicated test database or clear data after each test.
- Verify end-to-end flows through multiple layers.
- Test both happy paths and edge cases.

---

### Mocking Strategies

- **Mocks**: Replace complex dependencies with predictable substitutes.
- **Stubs**: Provide canned responses to calls made during the test.
- **Spies**: Record information about how a function was called (e.g., arguments, number of calls).

---

### Coverage Targets

Aim for balanced coverage:
- **Critical Logic**: 100% coverage.
- **Services/Business Rules**: 80%+ coverage.
- **Overall Project**: 70%+ coverage.

Use `npm test -- --coverage` to generate reports.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Services and repositories - Testable service patterns
- Complete examples - Full testing examples

---

## Sentry Integration and Monitoring

Guide to error tracking and performance monitoring with Sentry.

---

### Core Principles

**Mandatory**: All errors that reach a controller's error handler or a top-level try-catch block MUST be captured by Sentry.

#### Why Sentry?
- **Real-time Alerting**: Get notified immediately when errors occur in production.
- **Contextual Data**: Capture user IDs, request parameters, and stack traces to simplify debugging.
- **Performance Tracking**: Monitor transaction times and database query performance.

---

### Implementation Patterns

#### Capturing Exceptions
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

#### Adding Breadcrumbs
Provide a timeline of events leading up to an error.
```typescript
Sentry.addBreadcrumb({
    category: 'auth',
    message: 'User logged in',
    level: 'info',
});
```

---

### Performance Monitoring

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

### Best Practices

1. **Scrub PII**: Never send sensitive data (passwords, tokens) to Sentry. Use `beforeSend` to mask or remove fields.
2. **Environment Aware**: Ensure the `environment` tag (development, staging, production) is correctly set.
3. **Trace IDs**: Include a `requestId` or `traceId` in error responses to help developers find the corresponding Sentry issue.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Async and errors - Error handling logic
- Configuration - Sentry DSN configuration

---

## Configuration Management

Guide to managing application settings and environment variables using a centralized, type-safe pattern.

---

### Centralized Configuration (UnifiedConfig)

Never access `process.env` directly in your business logic. Instead, use a centralized configuration object.

#### Benefits
- **Type Safety**: IDE autocompletion and compile-time checks for all settings.
- **Validation**: Ensure all required settings are present at startup.
- **Defaults**: Provide sensible default values for development.
- **Testability**: Easily mock configurations in unit tests.

---

### Pattern Implementation

#### 1. Define the Interface
```typescript
// config/types.ts
export interface AppConfig {
    database: { host: string; port: number };
    server: { port: number };
    sentry: { dsn: string };
}
```

#### 2. Load and Validate
```typescript
// config/index.ts
export const config: AppConfig = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
    },
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
    }
};

// Simple validation
if (!config.sentry.dsn) {
    console.warn('SENTRY_DSN is not set. Monitoring is disabled.');
}
```

---

### Secret Management

- **DO NOT commit secrets**: Keep `.env` or `config.ini` files in your `.gitignore`.
- **Environment Variables**: Use environment variables for production secrets.
- **Fallback**: Provide dummy values or meaningful warnings for local development.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Sentry and monitoring - Using config for DSN
- Architecture overview - Overall project structure

---

## Middleware Guide - Express Middleware Patterns

Guide to creating and organizing custom Express middleware for cross-cutting concerns.

---

### Common Middleware Types

1. **Authentication**: Verify user identity (e.g., checking JWTs).
2. **Authorization**: Verify user permissions for specific resources.
3. **Logging & Audit**: Track request metadata and user actions.
4. **Validation**: Validate request bodies or parameters (see Validation patterns).
5. **Error Handling**: Standardize error responses (see Async and errors).

---

### Pattern Implementation

#### Authentication Middleware Example
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

#### Context Storage (AsyncLocalStorage)
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

### Middleware Ordering

The order in which middleware is registered in `app.ts` is critical:

1. **Security Headers**: (e.g., Helmet).
2. **Body Parsers**: (e.g., `express.json()`).
3. **Monitoring**: (e.g., Sentry request handler).
4. **Authentication**: Establish user identity.
5. **Routes**: Feature-specific logic.
6. **Error Handler**: MUST be registered last.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Routing and controllers - Registering middleware in routes
- Async and errors - Error boundary middleware
