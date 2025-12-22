# AI-Friendly Repository Template

This repository is a standardized, AI-friendly template designed to maximize the effectiveness of Large Language Models (LLMs) like Claude Code, OpenAI Codex, Cursor, and others. It uses a **Single Source of Truth (SSOT)** architecture with a unified Node.js adapter.

## Core Architecture

### Single Source of Truth (SSOT)
All AI instructions are maintained exclusively in `.ai/ssot/`:
- **Skills** (`.ai/ssot/skills/[name]/SKILL.md`): Coding patterns and guidelines.
- **Workflows** (`.ai/ssot/workflows/*.md`): Step-by-step processes for complex tasks.
- **Commands** (`.ai/ssot/commands/*.md`): Reusable task templates.

### Unified Adapter
A single Node.js script transforms SSOT into provider-specific artifacts:
```bash
# Generate artifacts for your chosen provider
node .ai/scripts/adapt.js [claude|codex|cursor|copilot|gemini]
```

This creates a `.[provider]/` directory (e.g., `.claude/`, `.codex/`) with the appropriate format.

## Directory Structure
```
.ai/
├── ssot/                      # SSOT - Edit here ONLY
│   ├── skills/                # Skill directories
│   │   ├── [skill-name]/
│   │   │   ├── SKILL.md       # Main skill file (< 500 lines)
│   │   │   └── resources/     # Reference files
│   │   └── skill-rules.json   # Trigger configuration
│   ├── workflows/             # Agent workflows
│   └── commands/              # Reusable commands
├── providers/                 # Adapter documentation
├── scripts/                   # Node.js scripts (cross-platform)
│   ├── adapt.js               # Main adapter script
│   ├── switch.js              # Provider switch wrapper
│   └── setup.js               # Interactive setup
└── templates/                 # Project templates

.[provider]/                   # Generated provider artifacts
├── skills/                    # (e.g., .claude/, .codex/, .cursor/)
├── agents/ or workflows/      # Claude uses "agents", others use "workflows" (Codex: not generated)
└── commands/                  # (Codex: not generated)
```

## Getting Started

### Prerequisites
- Node.js 14+ installed

### 1. Interactive Setup
```bash
node .ai/scripts/setup.js
```

### 2. Manual Provider Selection
```bash
# Generate artifacts for a specific provider
node .ai/scripts/adapt.js claude
```

### 3. Switch Providers
```bash
# Switch to a different provider (removes old, creates new)
node .ai/scripts/switch.js codex
```

## Supported Providers
| Provider | Command | Output Directory |
|----------|---------|------------------|
| Claude Code | `node .ai/scripts/adapt.js claude` | `.claude/` |
| OpenAI Codex | `node .ai/scripts/adapt.js codex` | `.codex/` |
| Cursor | `node .ai/scripts/adapt.js cursor` | `.cursor/` |
| GitHub Copilot | `node .ai/scripts/adapt.js copilot` | `.copilot/` |
| Google Gemini | `node .ai/scripts/adapt.js gemini` | `.gemini/` |

## Adding New Skills
1. Create `.ai/ssot/skills/[skill-name]/SKILL.md`.
2. Add reference files in `resources/` if needed.
3. Update `skill-rules.json` with trigger rules.
4. Run: `node .ai/scripts/adapt.js [your-provider]`.

## Skill File Format
```markdown
---
name: my-skill
description: Brief description with trigger keywords...
---

# My Skill

## Purpose
What this skill helps with.

## When to Use
Specific scenarios.

## Key Information
Guidance, patterns, examples.
```

**Best Practices**:
- Keep `SKILL.md` under 500 lines.
- Use `resources/` for detailed reference files.
- Include trigger keywords in `description`.

## Documentation Standards
- [Documentation Guidelines](docs/documentation-guidelines.md)
- [Naming Conventions](docs/naming-conventions.md)
