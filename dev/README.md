# Dev Docs Pattern

Persistent documentation for maintaining project context across AI sessions.

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| Plan | `[task]-plan.md` | Implementation strategy and phases |
| Context | `[task]-context.md` | Current state and key decisions |
| Tasks | `[task]-tasks.md` | Progress checklist |

## Structure

```
dev/
├── active/[task-name]/    # Current work
│   ├── [task]-plan.md
│   ├── [task]-context.md
│   └── [task]-tasks.md
└── archive/               # Completed tasks
```

## When to Use

**Use:** Complex tasks (>2 hours), multi-session work, large refactoring
**Skip:** Simple fixes, single-file changes, trivial updates

## For AI Assistants

### On Context Reset

1. Read `[task]-context.md` first (current state)
2. Check `[task]-tasks.md` (progress)
3. Reference `[task]-plan.md` (strategy)

### During Work

- Update `SESSION PROGRESS` in context.md after each milestone
- Check off completed tasks immediately
- Add discovered tasks to tasks.md

---

## File Templates

### plan.md Template

```markdown
# [Task Name] - Plan

## Summary
[One paragraph: what and why]

## Phases

### Phase 1: [Name] (estimate)
- Task 1.1: [Action] → Acceptance: [criteria]
- Task 1.2: [Action] → Acceptance: [criteria]

### Phase 2: [Name] (estimate)
...

## Risks
- [Risk]: [Mitigation]
```

### context.md Template

```markdown
# [Task Name] - Context

## SESSION PROGRESS (YYYY-MM-DD)

### ✅ COMPLETED
- [What was done]

### 🟡 IN PROGRESS
- [Current work]
- File: [path]

### ⚠️ BLOCKERS
- [Issues]

## Key Files
- `path/file.ts`: [Purpose]

## Quick Resume
1. [First step to continue]
2. [Next step]
```

### tasks.md Template

```markdown
# [Task Name] - Tasks

## Phase 1: [Name] ✅
- [x] Task completed
- [x] Another completed

## Phase 2: [Name] 🟡
- [x] Done
- [ ] In progress (CURRENT)
- [ ] Pending

## Phase 3: [Name] ⏳
- [ ] Not started
```

---

## Reference

| Resource | Path |
|----------|------|
| Detailed Specs | [.ai/templates/dev-docs/REFERENCE.md](../.ai/templates/dev-docs/REFERENCE.md) |
| Examples | [.ai/templates/dev-docs/examples/](../.ai/templates/dev-docs/examples/) |
