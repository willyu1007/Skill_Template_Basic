---
name: context-update
description: Update development documentation and task status before a context reset or session end to ensure continuity.
arguments:
  context: Optional - specific focus areas or tasks to highlight.
---

# Context Update Command

Use this command when approaching context limits or ending a session to capture the current state for seamless continuation.

## Execution Steps

### 1. Update Active Tasks
For each active task in the `dev/active/` directory:
- Update `[task-name]-context.md`:
  - Current implementation state.
  - Key decisions made during this session.
  - Files modified and the rationale.
  - Blockers or discovered issues.
  - Next immediate actions.
  - Last Updated timestamp.
- Update `[task-name]-tasks.md`:
  - Mark completed tasks with ✅.
  - Add newly discovered tasks.
  - Update statuses for in-progress items.

### 2. Capture Session Intelligence
Document any:
- Complex problems solved.
- Architectural decisions.
- Tricky bugs and their fixes.
- Newly discovered integration points.
- Performance optimizations.

### 3. Document Unfinished Work
- Detailed state of partially completed features.
- Commands that need to be executed upon restart.
- Temporary workarounds that require permanent fixes.

### 4. Create Handoff Notes
- Exact file and line currently being edited.
- Goal of the current changes.
- Uncommitted changes requiring attention.
- Verification commands.

## Priority
Focus on capturing information that is difficult to reconstruct from the code alone.

