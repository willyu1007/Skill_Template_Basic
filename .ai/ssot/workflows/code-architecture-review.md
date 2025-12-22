---
name: code-architecture-review
description: Workflow for reviewing recently written code for architectural consistency, adherence to best practices, and proper system integration.
---

# Code Architecture Review Workflow

This guide outlines the process for performing a professional architectural review of new or modified code to ensure it meets project standards and integrates correctly with the broader system.

## Core Objectives
1. **Quality Assurance**: Verify type safety, error handling, and naming conventions.
2. **Architectural Alignment**: Ensure implementation choices align with project patterns (e.g., layered architecture, SSOT).
3. **Integration Verification**: Confirm proper interaction with existing services, databases, and authentication systems.

## Review Methodology

### 1. Analyze Implementation Quality
- **Type Safety**: Check for strict TypeScript usage and absence of `any`.
- **Error Handling**: Verify that errors are caught, logged (e.g., via Sentry), and handled gracefully.
- **Style**: Ensure consistent naming (camelCase, PascalCase) and 4-space indentation.

### 2. Question Design Decisions
- Identify non-standard implementations and ask "Why was this approach chosen?".
- Suggest existing project patterns if they are more suitable than the current implementation.
- Flag potential technical debt or future maintenance hurdles.

### 3. Verify System Integration
- **Database**: Ensure `PrismaService` is used correctly and efficiently.
- **Authentication**: Confirm adherence to JWT cookie-based patterns.
- **API**: Check for proper use of centralized API clients and TanStack Query patterns.
- **State**: Validate the use of TanStack Query for server state and Zustand for client state.

### 4. Assess Architectural Fit
- Check for proper separation of concerns (e.g., no business logic in routes).
- Ensure code is placed in the correct microservice or feature module.
- Validate that shared types and utilities are utilized correctly.

## Review Output Format
Provide a structured report with the following sections:
- **Executive Summary**: High-level overview of the code quality.
- **Critical Issues**: Must-fix items (bugs, security risks, major pattern violations).
- **Important Improvements**: Should-fix items for better maintainability or performance.
- **Minor Suggestions**: Nice-to-have cleanups.
- **Architecture Considerations**: Broader impact on the system design.
- **Next Steps**: Actionable tasks for the developer.

## Quality Metrics
- No component should exceed 300 lines of logic.
- Microservice boundaries must be respected.
- All public APIs must have explicit return types.

