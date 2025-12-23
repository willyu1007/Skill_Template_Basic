# Reference

## File Organization

Proper file and directory structure for maintainable and scalable frontend applications.

---

### Features vs. Components

#### features/ Directory
**Purpose**: Domain-specific code organized by business functionality.
- Feature-specific components, hooks, API calls, and types.
- Encapsulates everything related to a single business domain (e.g., `auth`, `profile`, `projects`).

**Structure:**
```
features/
  my-feature/
    api/              # API service layer
    components/       # Feature-specific UI components
    hooks/            # Custom hooks for the feature
    types/            # TypeScript type definitions
    utils/            # Helper functions
    index.ts          # Public API for the feature
```

#### components/ Directory
**Purpose**: Truly reusable, generic UI components used across multiple features.
- UI primitives like buttons, inputs, modals, and layouts.
- Should NOT contain domain-specific logic.

---

### Directory Structure (Standard)

```
src/
├── components/          # Shared reusable UI components
├── features/            # Feature-based organization
│   ├── auth/
│   ├── profile/
│   └── dashboard/
├── hooks/               # Shared custom hooks
├── layouts/             # Application layout wrappers
├── pages/               # Route-level page components
├── services/            # Shared API clients and logic
├── styles/              # Global styles and theme
├── types/               # Shared TypeScript types
└── utils/               # Shared utility functions
```

---

### Public API Pattern

Each feature should expose a clear public API through an `index.ts` file. This prevents deep imports and makes refactoring easier.

```typescript
// features/my-feature/index.ts
export { MyFeatureMain } from './components/MyFeatureMain';
export { useMyFeature } from './hooks/useMyFeature';
export type { MyFeatureData } from './types';
```

---

### Import Aliases

Use import aliases to keep imports clean and avoid deep relative paths.

| Alias | Resolves To | Use For |
|-------|-------------|---------|
| `@/` | `src/` | General absolute imports |
| `~components` | `src/components` | Reusable UI components |
| `~features` | `src/features` | Domain features |
| `~types` | `src/types` | Shared types |

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Component patterns - Component structure
- Routing guide - Route organization

---

## Component Patterns

Best practices for building React components with type safety and performance in mind.

---

### Functional Components (React.FC)

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

### Lazy Loading

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

### Component Structure Template

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

### Communication Patterns

- **Props Down**: Pass data and configuration to child components.
- **Events Up**: Use callback functions to communicate actions back to parents.
- **Avoid Prop Drilling**: Use React Context or state management libraries (like Zustand or TanStack Query) for deep nesting.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- File organization - Where to put components
- Performance - Memoization best practices

---

## Data Fetching Patterns

Guide to efficient data retrieval, caching, and state synchronization using TanStack Query.

---

### Primary Pattern: useSuspenseQuery

Prefer `useSuspenseQuery` for fetching data in modern components. It integrates seamlessly with React Suspense boundaries, eliminating the need for manual `isLoading` checks.

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { featureApi } from '../api/featureApi';

export const DataDisplay: React.FC<{ id: string }> = ({ id }) => {
    const { data } = useSuspenseQuery({
        queryKey: ['item', id],
        queryFn: () => featureApi.getItem(id),
    });

    return <div>{data.name}</div>;
};
```

---

### Cache-First Strategy

Always try to leverage the existing cache before making fresh network requests.

```typescript
const { data } = useSuspenseQuery({
    queryKey: ['item', id],
    queryFn: async () => {
        // 1. Check cache manually if needed
        const cachedData = queryClient.getQueryData(['items']);
        // ... find item in cached list ...
        
        // 2. Fallback to API call
        return await featureApi.getItem(id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

### Mutations and Invalidation

Use `useMutation` for any operation that modifies server data (POST, PUT, DELETE). Always invalidate relevant queries on success to keep the UI in sync.

```typescript
const mutation = useMutation({
    mutationFn: (newData) => featureApi.updateItem(id, newData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
        showSuccess('Update successful');
    },
});
```

---

### API Service Layer

Centralize API calls within a feature's `api/` directory.

```typescript
// features/my-feature/api/myFeatureApi.ts
import apiClient from '@/lib/apiClient';

export const myFeatureApi = {
    getItem: async (id: string) => {
        const { data } = await apiClient.get(`/endpoint/${id}`);
        return data;
    },
    // ... other methods
};
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Loading and error states - UX for data fetching
- TypeScript standards - Typing API responses

---

## Styling Guide

Guide to consistent and maintainable UI styling using MUI and modern CSS patterns.

---

### Decision Threshold for Style Location

- **< 100 Lines**: Define styles object at the top of the component file.
- **> 100 Lines**: Extract styles to a separate `{ComponentName}.styles.ts` file in the same directory.

---

### The `sx` Prop (MUI)

Use the `sx` prop for most styling needs in MUI-based projects. It provides access to the theme and supports responsive values.

```typescript
import { Box, Typography } from '@mui/material';

export const MyStyledComponent: React.FC = () => {
    return (
        <Box sx={{
            p: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: (theme) => theme.shape.borderRadius,
            display: { xs: 'block', md: 'flex' }, // Responsive
        }}>
            <Typography variant="h6">Styled Content</Typography>
        </Box>
    );
};
```

---

### MUI v7 Grid System

When using MUI v7+, use the `size` prop instead of the legacy `xs`, `sm`, etc., props.

```typescript
// ✅ Good (v7 syntax)
<Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}>
        Column Content
    </Grid>
</Grid>
```

---

### Best Practices

1. **Use Theme Constants**: Prefer `primary.main`, `secondary.light`, and `text.secondary` over hardcoded hex values.
2. **Standard Spacing**: Use the `theme.spacing()` utility (e.g., `p: 2` which is `16px`).
3. **Flexbox over Floats**: Use `Box` with `display: 'flex'` for layouts.
4. **Single Quotes**: Use single quotes for all style strings (project standard).
5. **No `makeStyles`**: The `makeStyles` pattern is deprecated; use `sx` or `styled()`.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Component patterns - Integrating styles in components
- Performance - Minimizing re-renders from styles

---

## Routing Guide

Implementation of application navigation using modern, type-safe routing libraries (e.g., TanStack Router).

---

### Folder-Based Routing

Organize routes using a directory structure that reflects the URL paths.

```
src/routes/
  __root.tsx          # Root layout and context
  index.tsx           # Home page (/)
  profile/
    index.tsx         # Profile page (/profile)
    $userId.tsx       # Dynamic user profile (/profile/:userId)
  settings/           # Settings feature routes
```

---

### Route Components and Lazy Loading

Code-split every major route to ensure fast initial page loads.

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const MyPage = lazy(() => import('@/features/my-feature/components/MyPage'));

export const Route = createFileRoute('/my-path')({
    component: () => (
        <Suspense fallback={<LoadingSpinner />}>
            <MyPage />
        </Suspense>
    ),
});
```

---

### Navigation Patterns

#### Declarative Links
```typescript
import { Link } from '@tanstack/react-router';

<Link to="/profile/$userId" params={{ userId: '123' }}>
    View Profile
</Link>
```

#### Programmatic Navigation
```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
const handleAction = () => {
    navigate({ to: '/dashboard' });
};
```

---

### Protecting Routes

Use loader functions or specialized wrapper components to handle authentication and authorization.

```typescript
export const Route = createFileRoute('/admin')({
    beforeLoad: ({ context }) => {
        if (!context.auth.isAuthenticated) {
            throw redirect({ to: '/login' });
        }
    },
});
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- File organization - Routing folder structure
- Loading and error states - Handling transition states

---

## TypeScript Standards

TypeScript best practices for maintaining a robust, type-safe frontend codebase.

---

### Strict Mode Requirement

The project operates in **strict mode**. This is mandatory to prevent common runtime errors and ensure code quality.

- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictPropertyInitialization: true`

---

### The Rule Against `any`

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

### Explicit Types for Public APIs

Always define explicit return types for functions, especially those exported from features or services.

```typescript
// ✅ Good: Clear contract
export const fetchUser = async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
};
```

---

### Prop Interfaces

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

### Utility Types

Leverage built-in utility types to simplify complex type definitions:

- `Pick<T, K>`: Select specific fields from an interface.
- `Omit<T, K>`: Exclude specific fields.
- `Partial<T>`: Make all fields optional.
- `Record<K, V>`: Define object maps.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Component patterns - Using types in components
- Data fetching - Typing API interactions

---

## Performance Optimization

Guide to building high-performance React applications by minimizing re-renders and optimizing resource usage.

---

### Memoization Patterns

#### useMemo
Use `useMemo` for expensive calculations that only need to re-run when their dependencies change.

```typescript
const sortedItems = useMemo(() => {
    return items.sort((a, b) => b.score - a.score);
}, [items]);
```

#### useCallback
Use `useCallback` for event handlers that are passed as props to memoized child components.

```typescript
const handleAction = useCallback(() => {
    doSomething(id);
}, [id]);
```

#### React.memo
Wrap pure functional components in `React.memo` to prevent re-renders when their props haven't changed.

```typescript
export const ListItem = React.memo(({ item }) => {
    return <div>{item.name}</div>;
});
```

---

### Component Re-initialization

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

### Debouncing and Throttling

Use debouncing for search inputs or any operation that shouldn't fire on every keystroke.

```typescript
const [debouncedValue] = useDebounce(inputValue, 300);
```

---

### Optimizing Bundle Size

- **Lazy Load** large libraries or components (see Component patterns).
- **Tree-shaking**: Use named imports for libraries that support it.
- **Dynamic Imports**: Import heavy modules (like PDF generators) only when the user triggers the action.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Component patterns - Lazy loading patterns
- Styling guide - Efficient styling

---

## Loading and Error States

Critical guide to managing user experience during asynchronous operations.

---

### ⚠️ Critical Rule: No Early Returns

Never use early returns for loading states (e.g., `if (isLoading) return <Spinner />`). This causes the entire component to be replaced, resulting in jarring layout shifts and poor UX.

#### Preferred Patterns:
1. **React Suspense**: Wrap lazy components in a `Suspense` boundary with a fallback.
2. **Skeleton Screens**: Render a placeholder that matches the layout of the final content.
3. **Loading Overlays**: Use a semi-transparent overlay if the content area must remain visible but inactive.

---

### Suspense boundaries

Use `Suspense` to handle the loading state of one or more components.

```typescript
<Suspense fallback={<ListSkeleton />}>
    <DataGrid />
</Suspense>
```

---

### Error Boundaries

Wrap your application or individual features in Error Boundaries to catch runtime errors and provide a fallback UI.

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorMessage />}>
    <MyFeature />
</ErrorBoundary>
```

---

### User Feedback (Snackbar)

For non-blocking feedback (e.g., "Post saved successfully" or "Failed to delete item"), use a standardized notification system like MUI Snackbar.

```typescript
const { showSuccess, showError } = useMuiSnackbar();

const handleSave = async () => {
    try {
        await saveAction();
        showSuccess('Saved successfully');
    } catch (e) {
        showError('An error occurred while saving');
    }
};
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Data fetching - Integration with queries
- Component patterns - Suspense best practices

---

## Common Patterns

A collection of frequently used solutions for common UI and logic requirements.

---

### Authentication

Always use the provided authentication hook to access user state and permission logic.

```typescript
const { user, isAuthenticated, logout } = useAuth();
```

---

### Form Management

Use **React Hook Form** combined with **Zod** for all application forms.

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(mySchema),
});
```

---

### Data Grids

When implementing complex tables, use a standardized wrapper for the data grid component to ensure consistent features like filtering, pagination, and sorting.

#### Pattern:
- Pass `rows` and `columns` as props.
- Handle loading and error states within the wrapper.
- Use specialized cell renderers for complex data types (e.g., dates, status chips).

---

### Modal and Dialogs

Follow a consistent pattern for dialogs to ensure accessibility and a uniform look:
- Include a title with an icon.
- Provide a clear "Close" button (X).
- Place primary actions on the right side of the footer.

---

### State Management

- **Server State**: Use TanStack Query (fetching, caching, synchronization).
- **Global UI State**: Use a lightweight store like Zustand.
- **Local State**: Use React's `useState` or `useReducer`.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Data fetching - Managing server state
- Styling guide - Consistent UI design
