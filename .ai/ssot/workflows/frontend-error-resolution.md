---
name: frontend-error-resolution
description: Workflow for diagnosing and fixing frontend-specific issues, including React component errors, styling bugs, routing problems, and data fetching failures.
---

# Frontend Error Resolution Workflow

This guide provides a structured approach for debugging and resolving common frontend issues in React-based applications.

## Core Process

### 1. Diagnosis
- Gather error messages from the browser console, network tab, and Sentry.
- Identify the affected component and its location in the file tree.
- Determine if the issue is a UI bug, a logic error, or a data fetching problem.

### 2. Styling and UI Fixes
- For styling issues, inspect elements using browser DevTools.
- Verify the usage of MUI `sx` props or theme variables.
- Ensure responsiveness across different screen sizes.

### 3. Logic and State Debugging
- Trace the flow of props and state within the component hierarchy.
- Use `console.log` or React DevTools to inspect current state and hook values.
- Verify that `useMemo`, `useCallback`, and `useEffect` dependencies are correctly specified.

### 4. Data Fetching and Integration
- Check the network tab for failed API requests.
- Verify TanStack Query configuration (query keys, fetcher functions).
- Ensure loading and error states are handled correctly (using `Suspense` and `ErrorBoundary` patterns).

## Common Issue Patterns
- **Infinite Re-renders**: Check `useEffect` dependencies or state updates inside the render body.
- **Missing Data**: Verify API endpoints and data transformations.
- **Styling Overrides**: Ensure proper specificity and correct usage of MUI theme.
- **Memory Leaks**: Check for uncleaned listeners or timers in `useEffect` cleanup functions.

## Verification
- Confirm the fix by interacting with the UI in the browser.
- Run frontend-specific tests if available.
- Ensure the project compiles without TypeScript errors in the affected modules.

