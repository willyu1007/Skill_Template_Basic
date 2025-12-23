# Examples

## Complete Examples - Full Implementation

End-to-end examples showing how different layers and patterns interact.

---

### End-to-End Feature Example: User Registration

#### 1. Validation Schema
```typescript
// validators/user.ts
export const registerUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
});
```

#### 2. Repository
```typescript
// repositories/UserRepository.ts
export class UserRepository {
    async create(data: any) {
        return await prisma.user.create({ data });
    }
    async findByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    }
}
```

#### 3. Service
```typescript
// services/UserService.ts
export class UserService {
    constructor(private userRepository = new UserRepository()) {}

    async register(data: any) {
        const existing = await this.userRepository.findByEmail(data.email);
        if (existing) throw new ConflictError('User already exists');
        
        // Hash password, etc.
        return await this.userRepository.create(data);
    }
}
```

#### 4. Controller
```typescript
// controllers/UserController.ts
export class UserController extends BaseController {
    constructor(private userService = new UserService()) {
        super();
    }

    async register(req: Request, res: Response) {
        try {
            const validated = registerUserSchema.parse(req.body);
            const user = await this.userService.register(validated);
            this.handleSuccess(res, user, 'User registered', 201);
        } catch (error) {
            this.handleError(error, res, 'register');
        }
    }
}
```

---

### Refactoring Example: Bad to Good

#### Bad Pattern ❌
Logic scattered in route handlers.
```typescript
router.post('/user', async (req, res) => {
    const user = await prisma.user.create({ data: req.body });
    res.json(user);
});
```

#### Good Pattern ✅
Logic separated into layers for testability and reuse.
```typescript
router.post('/user', (req, res) => controller.register(req, res));
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Architecture overview - Layer definitions
- Testing guide - Testing these examples
