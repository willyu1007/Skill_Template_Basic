# Dev Docs Reference

Extended specifications for the Dev Docs Pattern.

## Problem

Context resets cause loss of: implementation decisions, file purposes, task progress, technical constraints, decision rationale.

Dev Docs persist critical information in three structured files.

## File Specifications

### plan.md

| Attribute | Value |
|-----------|-------|
| Purpose | Strategic implementation roadmap |
| Update | When scope changes |

**Required Sections:**

| Section | Content |
|---------|---------|
| Summary | What, why, scope (1 paragraph) |
| Phases | Numbered phases with time estimates |
| Tasks | Actionable items with acceptance criteria |

**Optional:** Current State, Future State, Risks, Success Metrics, Dependencies

### context.md

| Attribute | Value |
|-----------|-------|
| Purpose | Current state snapshot for session resumption |
| Update | After every major milestone |

**Required Sections:**

| Section | Content |
|---------|---------|
| SESSION PROGRESS | Dated status: completed, in-progress, blockers |
| Key Files | Critical files with purposes |
| Quick Resume | Numbered steps to continue |

**Optional:** Important Decisions, Technical Constraints, Related Links

### tasks.md

| Attribute | Value |
|-----------|-------|
| Purpose | Progress tracking checklist |
| Update | After each task completion |

**Status Indicators:**

| Symbol | Meaning |
|--------|---------|
| ✅ | Phase complete |
| 🟡 | Phase in progress |
| ⏳ | Phase not started |

**Format:** `- [x] Done` / `- [ ] Pending (CURRENT)`

## Workflow

### Task Lifecycle

| Phase | Action |
|-------|--------|
| Start | Create `dev/active/[task]/` with 3 files |
| Work | Update tasks.md on completion |
| Milestone | Update context.md SESSION PROGRESS |
| Scope Change | Update plan.md |
| Complete | Move to `dev/archive/` |

### Context Reset Recovery

1. Read context.md → current state
2. Read tasks.md → next work
3. Read plan.md → strategy
4. Follow Quick Resume

## Best Practices

### Task Descriptions

| Quality | Example |
|---------|---------|
| Bad | "Fix authentication" |
| Good | "Implement JWT validation in `AuthMiddleware.ts` → Acceptance: tokens validated, errors to Sentry" |

**Components:** Action verb + Specific location + Acceptance criteria

### SESSION PROGRESS

Update after: task completion, important decisions, blockers discovered, session end.

### Context Focus

**Include:** Current state, relevant files, resume steps
**Exclude:** Historical narrative, completed details, future speculation

### Task Granularity

Each task should be: completable in 1-2 hours, independently testable, clearly defined.

## Examples

See [examples/](examples/) for complete samples:
- [auth-implementation/](examples/auth-implementation/) - User authentication task
