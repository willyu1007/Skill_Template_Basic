# AI Agents & Workflows

This document provides an overview of the available AI workflows (agents) in this repository. All workflow definitions are maintained in the **Single Source of Truth (SSOT)** at `.ai/ssot/workflows/`.

## Available Workflows

### Development & Debugging
| Workflow | Description | Path |
|----------|-------------|------|
| `auth-route-debugging` | Diagnose 401/403 errors and JWT issues | `.ai/ssot/workflows/auth-route-debugging.md` |
| `auth-route-testing` | End-to-end API route verification | `.ai/ssot/workflows/auth-route-testing.md` |
| `frontend-error-resolution` | Debug React components and styling | `.ai/ssot/workflows/frontend-error-resolution.md` |
| `typescript-error-resolution` | Fix `tsc` compilation errors | `.ai/ssot/workflows/typescript-error-resolution.md` |

### Architecture & Quality
| Workflow | Description | Path |
|----------|-------------|------|
| `code-architecture-review` | Review code for pattern consistency | `.ai/ssot/workflows/code-architecture-review.md` |
| `code-refactoring` | Safely reorganize code with zero breakage | `.ai/ssot/workflows/code-refactoring.md` |
| `implementation-plan-review` | Analyze plans for technical soundness | `.ai/ssot/workflows/implementation-plan-review.md` |

### Maintenance & Research
| Workflow | Description | Path |
|----------|-------------|------|
| `documentation-maintenance` | Keep SSOT and guides accurate | `.ai/ssot/workflows/documentation-maintenance.md` |
| `technical-research` | Deep-dive into complex problems | `.ai/ssot/workflows/technical-research.md` |

## Usage Guidelines

### How to Invoke
Request the AI assistant to "use the `[workflow-name]` workflow" or "follow the `[workflow-name]` agent guide".

### Rules
- AI assistants **MUST** follow the steps defined in the workflow files exactly.
- AI assistants **SHOULD** provide a structured report upon completion.
- If a workflow requires database access, the AI **MUST** verify persistence for write operations.

## Creating New Workflows
1. Create a new markdown file in `.ai/ssot/workflows/` following kebab-case naming.
2. Include `name` and `description` in the YAML frontmatter.
3. Define `Purpose`, `Steps`, and `Output Format` sections.
4. Run `./.ai/scripts/switch.ps1` to update provider routing indices.

## Reference
- **Source**: `.ai/ssot/workflows/`
- **Documentation Guidelines**: `docs/documentation-guidelines.md`
- **Naming Conventions**: `docs/naming-conventions.md`
