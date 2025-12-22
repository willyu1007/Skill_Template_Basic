# Performance Optimization

Guide to building high-performance React applications by minimizing re-renders and optimizing resource usage.

---

## Memoization Patterns

### useMemo
Use `useMemo` for expensive calculations that only need to re-run when their dependencies change.

```typescript
const sortedItems = useMemo(() => {
    return items.sort((a, b) => b.score - a.score);
}, [items]);
```

### useCallback
Use `useCallback` for event handlers that are passed as props to memoized child components.

```typescript
const handleAction = useCallback(() => {
    doSomething(id);
}, [id]);
```

### React.memo
Wrap pure functional components in `React.memo` to prevent re-renders when their props haven't changed.

```typescript
export const ListItem = React.memo(({ item }) => {
    return <div>{item.name}</div>;
});
```

---

## Component Re-initialization

Never define a component inside another component's render function. This causes the child component to be completely unmounted and remounted on every render of the parent.

```typescript
// ❌ Bad: InnerComponent recreated every time
function Parent() {
    const Inner = () => <div>Inner</div>;
    return <Inner />;
}

// ✅ Good: InnerComponent defined outside
const Inner = () => <div>Inner</div>;
function Parent() {
    return <Inner />;
}
```

---

## Debouncing and Throttling

Use debouncing for search inputs or any operation that shouldn't fire on every keystroke.

```typescript
const [debouncedValue] = useDebounce(inputValue, 300);
```

---

## Optimizing Bundle Size

- **Lazy Load** large libraries or components (see [component-patterns.md](component-patterns.md)).
- **Tree-shaking**: Use named imports for libraries that support it.
- **Dynamic Imports**: Import heavy modules (like PDF generators) only when the user triggers the action.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [component-patterns.md](component-patterns.md) - Lazy loading patterns
- [styling-guide.md](styling-guide.md) - Efficient styling

