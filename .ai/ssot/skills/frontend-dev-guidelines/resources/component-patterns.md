# Component Patterns

Best practices for building React components with type safety and performance in mind.

---

## Functional Components (React.FC)

Always use the `React.FC<Props>` pattern for consistent component signatures and type safety.

```typescript
import React from 'react';

interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
    return (
        <div>
            <h1>{title}</h1>
            {onAction && <button onClick={onAction}>Click Me</button>}
        </div>
    );
};
```

---

## Lazy Loading

Code-split heavy components or route-level pages to improve initial load time.

```typescript
import React, { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

export const Dashboard: React.FC = () => {
    return (
        <Suspense fallback={<div>Loading chart...</div>}>
            <HeavyChart />
        </Suspense>
    );
};
```

---

## Component Structure Template

Maintain a consistent order of elements within your component files:

1. **Imports**: Grouped by (React, Third-party, Aliases, Relative).
2. **Prop Interface**: Defined with JSDoc comments.
3. **Styles**: If using CSS-in-JS or MUI `sx`.
4. **Component Definition**: Using `React.FC`.
5. **Hooks**: (Context, Data fetching, Local state, Memoized values, Effects).
6. **Event Handlers**: Wrapped in `useCallback` when passed to children.
7. **Render Logic**: JSX output.
8. **Export**: Default export at the bottom.

---

## Communication Patterns

- **Props Down**: Pass data and configuration to child components.
- **Events Up**: Use callback functions to communicate actions back to parents.
- **Avoid Prop Drilling**: Use React Context or state management libraries (like Zustand or TanStack Query) for deep nesting.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [file-organization.md](file-organization.md) - Where to put components
- [performance.md](performance.md) - Memoization best practices

