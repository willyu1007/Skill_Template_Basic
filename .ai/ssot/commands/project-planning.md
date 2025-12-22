---
name: project-planning
description: Create a comprehensive strategic plan with a structured task breakdown for a new feature or refactor.
arguments:
  goal: Description of the project or feature to be planned (e.g., "implement user auth", "refactor db layer").
---

# Project Planning Command

Use this command to generate a professional implementation plan and the necessary task tracking structure.

## Execution Steps

### 1. Analysis and Discovery
- Analyze the user's goal and determine the required scope.
- Examine the codebase to understand the current implementation and constraints.

### 2. Plan Generation
Create a comprehensive plan including:
- **Executive Summary**: High-level goal.
- **Current State Analysis**: What exists now.
- **Proposed Future State**: The target architecture.
- **Implementation Phases**: Logical stages of development.
- **Detailed Tasks**: Actionable items with clear acceptance criteria.
- **Risk Assessment**: Potential issues and mitigation strategies.
- **Success Metrics**: How to know it's done.

### 3. Task Management Setup
- Create a directory: `dev/active/[task-name]/`.
- Generate three core files:
  - `[task-name]-plan.md`: The full comprehensive plan.
  - `[task-name]-context.md`: Technical context, files, and dependencies.
  - `[task-name]-tasks.md`: A checklist for tracking progress.
- Include a "Last Updated" timestamp in each file.

## Quality Standards
- Plans must be actionable and self-contained.
- Use precise technical language.
- Account for edge cases and potential regressions.
- Reference existing project standards (`.ai/ssot/skills/`).

## Persistence
This command ensures that project knowledge and task status survive context resets by persisting them in the `dev/` directory.

