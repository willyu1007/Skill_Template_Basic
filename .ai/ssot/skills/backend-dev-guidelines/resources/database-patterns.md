# Database Patterns - Prisma Best Practices

Guide to efficient and safe database access using Prisma ORM.

---

## Core Principles

1. **Use Repositories**: Abstract Prisma calls behind a repository layer.
2. **Select only what you need**: Use the `select` clause to limit returned fields and reduce memory/bandwidth usage.
3. **Avoid N+1 Queries**: Use `include` or batching to fetch related data in a single query.
4. **Handle known errors**: Use Prisma's error codes to provide meaningful feedback (e.g., P2002 for unique constraint violation).

---

## Query Optimization

### Using `select`
```typescript
// ✅ Good: Only fetches ID and email
const users = await prisma.user.findMany({
    select: { id: true, email: true }
});
```

### Using `include`
```typescript
// ✅ Good: Fetches user and their posts in one query
const userWithPosts = await prisma.user.findUnique({
    where: { id: userId },
    include: { posts: true }
});
```

---

## Transaction Management

Use `$transaction` for operations that must succeed or fail as a single unit.

```typescript
const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const profile = await tx.profile.create({ data: { userId: user.id } });
    return { user, profile };
});
```

---

## Error Handling

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

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [services-and-repositories.md](services-and-repositories.md) - Repository pattern details
- [async-and-errors.md](async-and-errors.md) - Error handling strategies

