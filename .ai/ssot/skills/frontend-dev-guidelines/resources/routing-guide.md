# Routing Guide

Implementation of application navigation using modern, type-safe routing libraries (e.g., TanStack Router).

---

## Folder-Based Routing

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

## Route Components and Lazy Loading

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

## Navigation Patterns

### Declarative Links
```typescript
import { Link } from '@tanstack/react-router';

<Link to="/profile/$userId" params={{ userId: '123' }}>
    View Profile
</Link>
```

### Programmatic Navigation
```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
const handleAction = () => {
    navigate({ to: '/dashboard' });
};
```

---

## Protecting Routes

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

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [file-organization.md](file-organization.md) - Routing folder structure
- [loading-and-error-states.md](loading-and-error-states.md) - Handling transition states

