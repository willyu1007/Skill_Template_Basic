---
name: typescript-error-resolution
description: Workflow for systematically identifying and fixing TypeScript compilation errors in frontend and backend projects.
---

# TypeScript Error Resolution Workflow

This guide provides a systematic process for resolving TypeScript compilation errors efficiently while maintaining code integrity.

## Core Process

### 1. Information Gathering
- Retrieve the latest error information from the compiler or CI/CD logs.
- Identify which sub-projects or modules are affected.
- Note the specific `tsc` commands required for each project (e.g., `npx tsc --noEmit`).

### 2. Error Analysis
- Group errors by type:
  - **Missing Imports**: Incorrect paths or missing dependencies.
  - **Type Mismatches**: Function signature changes or incompatible interface implementations.
  - **Property Errors**: Missing fields in objects or interfaces.
- Prioritize errors that cause "cascading" failures (e.g., fixing a shared type definition may resolve dozens of individual component errors).

### 3. Fixing Strategy
- **Minimal Fixes**: Focus on resolving the error without refactoring unrelated code.
- **Root Cause**: Prefer updating the underlying type or interface over using `@ts-ignore` or `any`.
- **Batch Processing**: Use multi-file editing tools to fix identical patterns (like renamed types) across the codebase.

### 4. Verification
- After making changes, run the appropriate `tsc` command for the affected project.
- If errors persist, repeat the analysis and fixing steps.
- Report a summary of fixed errors once the project compiles successfully.

## Common Error Patterns and Solutions

### Missing Imports
- **Check Paths**: Verify relative or alias paths (`@/`, `~components/`).
- **Check Exports**: Ensure the target file actually exports the symbol.
- **Dependencies**: Verify the package is installed in `package.json`.

### Type Mismatches
- Compare the provided data against the required interface or type definition.
- Add proper type annotations to function parameters or variable declarations.

### Property Does Not Exist
- Check for typos in field names.
- Update the relevant interface to include the missing property if it is intentional.

## Recommended Tooling
- **Real-time Logs**: `pm2 logs [service]`
- **Batch Check**: Run a workspace-wide TypeScript check to ensure no regressions were introduced.

