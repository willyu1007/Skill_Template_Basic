# Examples

## Complete Examples

Full working examples demonstrating the integration of all frontend guidelines.

---

### Example 1: Standard Feature Component

This example showcases a component with data fetching, memoization, and standardized styling.

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { featureApi } from '../api/featureApi';
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';

interface ProfileProps {
    userId: string;
}

export const UserProfile: React.FC<ProfileProps> = ({ userId }) => {
    const { showSuccess } = useMuiSnackbar();
    
    const { data: user } = useSuspenseQuery({
        queryKey: ['user', userId],
        queryFn: () => featureApi.getUser(userId),
    });

    const fullName = useMemo(() => `${user.firstName} ${user.lastName}`, [user]);

    const handleAction = useCallback(() => {
        showSuccess(`Action triggered for ${fullName}`);
    }, [fullName, showSuccess]);

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h5">{fullName}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleAction}>
                    Trigger Action
                </Button>
            </Box>
        </Paper>
    );
};
```

---

### Example 2: Feature index.ts (Public API)

```typescript
// src/features/profile/index.ts
export { UserProfile } from './components/UserProfile';
export { useProfileData } from './hooks/useProfileData';
export type { UserProfileData } from './types';
```

---

### Example 3: Route with Suspense

```typescript
// src/routes/profile/$userId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { ProfileSkeleton } from '~components/Skeletons';

const UserProfile = lazy(() => import('~features/profile').then(m => ({ default: m.UserProfile })));

export const Route = createFileRoute('/profile/$userId')({
    component: () => {
        const { userId } = Route.useParams();
        return (
            <Suspense fallback={<ProfileSkeleton />}>
                <UserProfile userId={userId} />
            </Suspense>
        );
    },
});
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main guide
- Component patterns - Best practices applied here
- Data fetching - Data retrieval applied here
