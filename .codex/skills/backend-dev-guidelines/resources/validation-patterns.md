# Validation Patterns - Input Validation with Zod

Guide to implementing type-safe input validation using Zod.

---

## Why Zod?

- **Type Safety**: Automatically infer TypeScript types from your schemas.
- **Runtime Validation**: Ensure incoming data matches expected formats at runtime.
- **Composable**: Build complex schemas by merging and extending smaller ones.

---

## Basic Schema Patterns

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

## Implementation Patterns

### Validation in Controllers (Recommended)
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

## Advanced Zod Patterns

### Refinements (Custom Validation)
```typescript
const passwordSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
```

### Transformations
```typescript
const stringToNumber = z.string().transform((val) => parseInt(val, 10));
```

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Using validation in controllers
- [async-and-errors.md](async-and-errors.md) - Error handling

