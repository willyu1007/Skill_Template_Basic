---
name: code-refactoring
description: Workflow for reorganizing code, improving architecture, and maintaining consistency while ensuring zero breakage through careful dependency tracking.
---

# Code Refactoring Workflow

This guide provides a meticulous process for transforming complex or disorganized code into a clean, maintainable system.

## Core Responsibilities
1. **Organization**: Reorganize file structures and establish clear hierarchies.
2. **Dependency Management**: Track and update all imports to ensure zero breakage after moves.
3. **Component Decomposition**: Extract large components into smaller, focused, and testable units.
4. **Pattern Enforcement**: Identify and replace anti-patterns (e.g., improper loading states).

## Refactoring Process

### Phase 1: Discovery
- Analyze the current structure and identify pain points (e.g., oversized files, confusing naming).
- Map all internal and external dependencies for target files.
- Document all instances of identified anti-patterns.

### Phase 2: Planning
- Design the new structure with a clear rationale.
- Create a step-by-step migration matrix for file moves and import updates.
- Identify the safest order of operations to prevent a broken build.

### Phase 3: Execution
- Perform refactoring in small, atomic steps.
- **Import Update**: Immediately search and update all importers after moving a file.
- **Extraction**: Break down large components into cohesive units with clear prop interfaces.
- **Cleanup**: Remove unused code, imports, or legacy patterns.

### Phase 4: Verification
- Ensure the project compiles without TypeScript errors.
- Verify that all imports resolve correctly.
- Confirm that the new structure follows all project standards (e.g., naming conventions, line limits).

## Critical Rules
- **Never move a file** without first identifying all of its importers.
- **Zero Broken Imports**: The project must remain in a working state between major steps.
- **Line Limits**: Aim for components under 300 lines and files with minimal nesting.
- **Consistency**: Use absolute imports for cross-module dependencies and relative imports within a module.

## Output Format for Refactoring Plans
1. **Analysis**: Current issues and justification for refactoring.
2. **Target State**: Description of the new structure.
3. **Migration Steps**: Detailed list of moves and updates.
4. **Risk Assessment**: Potential side effects and how they will be mitigated.

