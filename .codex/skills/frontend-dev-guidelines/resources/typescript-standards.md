# TypeScript Standards

TypeScript best practices for maintaining a robust, type-safe frontend codebase.

---

## Strict Mode Requirement

The project operates in **strict mode**. This is mandatory to prevent common runtime errors and ensure code quality.

- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictPropertyInitialization: true`

---

## The Rule Against `any`

Never use the `any` type. If you are dealing with data of an unknown shape, use `unknown` and implement type guards to safely narrow the type.

```typescript
// ❌ Bad
function process(data: any) { console.log(data.id); }

// ✅ Good
function process(data: unknown) {
    if (typeof data === 'object' && data !== null && 'id' in data) {
        console.log((data as { id: string }).id);
    }
}
```

---

## Explicit Types for Public APIs

Always define explicit return types for functions, especially those exported from features or services.

```typescript
// ✅ Good: Clear contract
export const fetchUser = async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
};
```

---

## Prop Interfaces

Every component should have a dedicated interface for its props, using JSDoc comments for documentation.

```typescript
interface ButtonProps {
    /** Label text to display */
    label: string;
    /** Importance of the action */
    variant?: 'primary' | 'secondary';
}
```

---

## Utility Types

Leverage built-in utility types to simplify complex type definitions:

- `Pick<T, K>`: Select specific fields from an interface.
- `Omit<T, K>`: Exclude specific fields.
- `Partial<T>`: Make all fields optional.
- `Record<K, V>`: Define object maps.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [component-patterns.md](component-patterns.md) - Using types in components
- [data-fetching.md](data-fetching.md) - Typing API interactions

