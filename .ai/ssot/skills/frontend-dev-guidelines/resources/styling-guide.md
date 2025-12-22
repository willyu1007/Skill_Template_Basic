# Styling Guide

Guide to consistent and maintainable UI styling using MUI and modern CSS patterns.

---

## Decision Threshold for Style Location

- **< 100 Lines**: Define styles object at the top of the component file.
- **> 100 Lines**: Extract styles to a separate `{ComponentName}.styles.ts` file in the same directory.

---

## The `sx` Prop (MUI)

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

## MUI v7 Grid System

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

## Best Practices

1. **Use Theme Constants**: Prefer `primary.main`, `secondary.light`, and `text.secondary` over hardcoded hex values.
2. **Standard Spacing**: Use the `theme.spacing()` utility (e.g., `p: 2` which is `16px`).
3. **Flexbox over Floats**: Use `Box` with `display: 'flex'` for layouts.
4. **Single Quotes**: Use single quotes for all style strings (project standard).
5. **No `makeStyles`**: The `makeStyles` pattern is deprecated; use `sx` or `styled()`.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [component-patterns.md](component-patterns.md) - Integrating styles in components
- [performance.md](performance.md) - Minimizing re-renders from styles

