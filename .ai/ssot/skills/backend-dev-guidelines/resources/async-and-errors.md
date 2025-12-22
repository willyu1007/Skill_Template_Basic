# Async Patterns and Error Handling

Guide to handling asynchronous operations and implementing robust error handling.

---

## Async/Await Best Practices

### 1. Always use try-catch
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

### 2. Prefer async/await over `.then()`
Async/await is more readable and makes error handling more straightforward.

### 3. Parallel execution with `Promise.all`
Use `Promise.all` for independent operations to improve performance.

```typescript
const [users, posts] = await Promise.all([
    userService.getAll(),
    postService.getAll()
]);
```

---

## Custom Error Types

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

## Global Error Handling

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

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Error handling in controllers
- [sentry-and-monitoring.md](sentry-and-monitoring.md) - Error tracking

