# File Organization

Proper file and directory structure for maintainable and scalable frontend applications.

---

## Features vs. Components

### features/ Directory
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

### components/ Directory
**Purpose**: Truly reusable, generic UI components used across multiple features.
- UI primitives like buttons, inputs, modals, and layouts.
- Should NOT contain domain-specific logic.

---

## Directory Structure (Standard)

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

## Public API Pattern

Each feature should expose a clear public API through an `index.ts` file. This prevents deep imports and makes refactoring easier.

```typescript
// features/my-feature/index.ts
export { MyFeatureMain } from './components/MyFeatureMain';
export { useMyFeature } from './hooks/useMyFeature';
export type { MyFeatureData } from './types';
```

---

## Import Aliases

Use import aliases to keep imports clean and avoid deep relative paths.

| Alias | Resolves To | Use For |
|-------|-------------|---------|
| `@/` | `src/` | General absolute imports |
| `~components` | `src/components` | Reusable UI components |
| `~features` | `src/features` | Domain features |
| `~types` | `src/types` | Shared types |

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [component-patterns.md](component-patterns.md) - Component structure
- [routing-guide.md](routing-guide.md) - Route organization

