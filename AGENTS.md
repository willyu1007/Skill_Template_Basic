# AI Assistant Instructions

This is an **AI-Friendly Repository Template** - a starter kit for creating LLM-optimized codebases.

## First Time?

**Read `init/AGENTS.md` for initialization instructions.**

## Project Type

Template repository. Users clone this to start new AI-friendly projects.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `init/` | **Start here** - Initialization instructions and output |
| `.ai/ssot/` | Single Source of Truth - edit skills/workflows here |
| `.ai/scripts/` | Adapter scripts (Node.js) |
| `.ai/templates/` | Templates and examples |
| `.[provider]/` | Generated artifacts for chosen provider |
| `dev/` | Working documentation for complex tasks |

## Common Tasks

### Add New Skill

1. Create `.ai/ssot/skills/[skill-name]/SKILL.md`
2. Add `resources/` subdirectory if needed
3. Run `node .ai/scripts/adapt.js [provider]`

### Add New Workflow

1. Create `.ai/ssot/workflows/[workflow-name].md`
2. Include YAML frontmatter with `name` and `description`
3. Run `node .ai/scripts/adapt.js [provider]`

### Switch Provider

```bash
node .ai/scripts/switch.js [new-provider]
```

## Available Workflows

| Workflow | Description |
|----------|-------------|
| `auth-route-debugging` | Diagnose 401/403 errors and JWT issues |
| `auth-route-testing` | End-to-end API route verification |
| `frontend-error-resolution` | Debug React components and styling |
| `typescript-error-resolution` | Fix `tsc` compilation errors |
| `code-architecture-review` | Review code for pattern consistency |
| `code-refactoring` | Safely reorganize code |
| `documentation-maintenance` | Keep documentation accurate |
| `technical-research` | Deep-dive into complex problems |

Workflow files: `.ai/ssot/workflows/`

## Rules

- Always edit `.ai/ssot/` (SSOT), never edit `.[provider]/` directly
- Keep SKILL.md files under 500 lines
- Use `resources/` for detailed reference content
- Follow progressive disclosure pattern
