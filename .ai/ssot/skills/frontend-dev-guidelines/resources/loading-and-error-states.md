# Loading and Error States

Critical guide to managing user experience during asynchronous operations.

---

## ⚠️ Critical Rule: No Early Returns

Never use early returns for loading states (e.g., `if (isLoading) return <Spinner />`). This causes the entire component to be replaced, resulting in jarring layout shifts and poor UX.

### Preferred Patterns:
1. **React Suspense**: Wrap lazy components in a `Suspense` boundary with a fallback.
2. **Skeleton Screens**: Render a placeholder that matches the layout of the final content.
3. **Loading Overlays**: Use a semi-transparent overlay if the content area must remain visible but inactive.

---

## Suspense boundaries

Use `Suspense` to handle the loading state of one or more components.

```typescript
<Suspense fallback={<ListSkeleton />}>
    <DataGrid />
</Suspense>
```

---

## Error Boundaries

Wrap your application or individual features in Error Boundaries to catch runtime errors and provide a fallback UI.

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorMessage />}>
    <MyFeature />
</ErrorBoundary>
```

---

## User Feedback (Snackbar)

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

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [data-fetching.md](data-fetching.md) - Integration with queries
- [component-patterns.md](component-patterns.md) - Suspense best practices

