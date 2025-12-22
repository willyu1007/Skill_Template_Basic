# Data Fetching Patterns

Guide to efficient data retrieval, caching, and state synchronization using TanStack Query.

---

## Primary Pattern: useSuspenseQuery

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

## Cache-First Strategy

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

## Mutations and Invalidation

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

## API Service Layer

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

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [loading-and-error-states.md](loading-and-error-states.md) - UX for data fetching
- [typescript-standards.md](typescript-standards.md) - Typing API responses

