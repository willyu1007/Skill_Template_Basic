# Common Patterns

A collection of frequently used solutions for common UI and logic requirements.

---

## Authentication

Always use the provided authentication hook to access user state and permission logic.

```typescript
const { user, isAuthenticated, logout } = useAuth();
```

---

## Form Management

Use **React Hook Form** combined with **Zod** for all application forms.

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(mySchema),
});
```

---

## Data Grids

When implementing complex tables, use a standardized wrapper for the data grid component to ensure consistent features like filtering, pagination, and sorting.

### Pattern:
- Pass `rows` and `columns` as props.
- Handle loading and error states within the wrapper.
- Use specialized cell renderers for complex data types (e.g., dates, status chips).

---

## Modal and Dialogs

Follow a consistent pattern for dialogs to ensure accessibility and a uniform look:
- Include a title with an icon.
- Provide a clear "Close" button (X).
- Place primary actions on the right side of the footer.

---

## State Management

- **Server State**: Use TanStack Query (fetching, caching, synchronization).
- **Global UI State**: Use a lightweight store like Zustand.
- **Local State**: Use React's `useState` or `useReducer`.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [data-fetching.md](data-fetching.md) - Managing server state
- [styling-guide.md](styling-guide.md) - Consistent UI design

