---
name: frontend-dev-guidelines
description: |
  Comprehensive frontend development guide for React, TypeScript, and MUI.
  Use when creating components, pages, forms, or working with data fetching,
  routing, styling, or performance optimization. Covers component patterns,
  file organization, state management, and MUI best practices.
---

# Frontend Development Guidelines

## Purpose
Establish consistency and best practices across frontend applications using React, TypeScript, and modern UI libraries.

## When to Use This Skill
Use this skill when:
- Creating new React components or pages.
- Implementing data fetching logic (e.g., TanStack Query).
- Designing application layouts or styling components.
- Setting up or modifying application routing.
- Optimizing performance or handling complex state.
- Ensuring TypeScript standards and type safety.

---

## Core Principles

1. **Component Modularity**: Build small, reusable components with clear responsibilities.
2. **Type Safety**: Use TypeScript for all props, states, and API responses.
3. **Declarative UI**: Focus on describing "what" the UI should look like for a given state.
4. **Performance First**: Minimize unnecessary re-renders and optimize bundle sizes.
5. **Consistent Styling**: Use a unified styling system (e.g., MUI or CSS-in-JS) and follow project-specific theme guidelines.
6. **Robust Error Handling**: Implement error boundaries and user-friendly loading/error states.

---

## Directory Structure
```
src/
├── components/          # Shared reusable UI components
├── features/            # Feature-based organization (Components, Hooks, Types)
├── hooks/               # Shared custom hooks
├── layouts/             # Application layout wrappers
├── pages/               # Route-level page components
├── services/            # API clients and data fetching logic
├── styles/              # Global styles and theme definitions
├── types/               # Shared TypeScript type definitions
└── utils/               # Shared utility functions
```

---

## Resource Files

For deep dives into specific topics, refer to:

- [file-organization.md](resources/file-organization.md): Scalable directory structures and feature patterns.
- [component-patterns.md](resources/component-patterns.md): Best practices for React components and hooks.
- [data-fetching.md](resources/data-fetching.md): Efficient data retrieval and caching strategies.
- [styling-guide.md](resources/styling-guide.md): Consistent UI design and styling patterns.
- [routing-guide.md](resources/routing-guide.md): Application navigation and route management.
- [typescript-standards.md](resources/typescript-standards.md): Ensuring type safety and best practices.
- [performance.md](resources/performance.md): Minimizing re-renders and optimizing performance.
- [loading-and-error-states.md](resources/loading-and-error-states.md): Handling UX for async operations.
- [common-patterns.md](resources/common-patterns.md): Collection of frequently used frontend solutions.
- [complete-examples.md](resources/complete-examples.md): Full end-to-end component and feature examples.

