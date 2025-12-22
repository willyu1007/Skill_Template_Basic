# Services and Repositories - Business Logic Layer

Guide to separating business logic (Services) from data access (Repositories).

---

## Service Layer

Services contain the 'what' and 'why' of your application. They are responsible for business rules and orchestrating operations.

### Responsibilities
- ✅ Business rules enforcement.
- ✅ Orchestrating multiple repositories or external services.
- ✅ Transaction management.
- ✅ Complex calculations and data transformations.

### Service Template (with Dependency Injection)
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

## Repository Pattern

Repositories abstract the 'how' of data access (e.g., Prisma queries, SQL).

### Responsibilities
- ✅ All direct ORM/Database operations.
- ✅ Query construction and optimization.
- ✅ Hiding database implementation details from services.

### Repository Template
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

## Design Principles

1. **Single Responsibility**: Each service/repository should focus on one domain entity or cohesive set of logic.
2. **No HTTP in Services**: Services should not accept `req` or `res` objects or return HTTP status codes.
3. **Dependency Injection**: Pass dependencies (like repositories) into services via the constructor to facilitate testing and loose coupling.
4. **Focused Repositories**: Keep repositories focused on data retrieval and storage; avoid adding business logic here.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [architecture-overview.md](architecture-overview.md) - Layered architecture
- [database-patterns.md](database-patterns.md) - ORM best practices

