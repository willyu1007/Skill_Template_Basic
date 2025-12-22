# AI-Friendly Repository Template

A starter kit for creating LLM-optimized codebases with Single Source of Truth (SSOT) architecture.

## What This Template Provides

| Component | Location | Description |
|-----------|----------|-------------|
| Skills | `.ai/ssot/skills/` | Coding patterns and guidelines |
| Workflows | `.ai/ssot/workflows/` | Step-by-step processes |
| Commands | `.ai/ssot/commands/` | Reusable task templates |
| Adapters | `.ai/scripts/` | Provider conversion scripts |

## Supported Providers

| Provider | Command |
|----------|---------|
| Claude Code | `node .ai/scripts/adapt.js claude` |
| OpenAI Codex | `node .ai/scripts/adapt.js codex` |
| Cursor | `node .ai/scripts/adapt.js cursor` |
| GitHub Copilot | `node .ai/scripts/adapt.js copilot` |
| Google Gemini | `node .ai/scripts/adapt.js gemini` |

## Quick Start

### Option 1: AI-Assisted (Recommended)

1. Open project with your AI assistant
2. AI reads `init/AGENTS.md` and guides initialization
3. Follow prompts to provide project information
4. AI generates profile and runs adapter

### Option 2: Manual

```bash
# 1. Run adapter for your provider
node .ai/scripts/adapt.js [provider]

# 2. Create project profile manually
# See init/project-profile-template.yaml
```

## Directory Structure

```
.ai/
├── ssot/                  # Single Source of Truth (edit here)
│   ├── skills/            # Skill definitions
│   ├── workflows/         # Workflow definitions
│   └── commands/          # Command definitions
├── scripts/               # Node.js adapter scripts
└── templates/             # Templates and examples

init/                      # Initialization (you are here)
├── README.md              # This file
├── AGENTS.md              # AI assistant instructions
├── INITIALIZATION.md      # Detailed initialization workflow
└── project-profile.*      # Generated after initialization

dev/                       # Development documentation
├── README.md              # Dev Docs Pattern guide
├── active/                # Current tasks
└── archive/               # Completed tasks

.[provider]/               # Generated (e.g., .claude/, .codex/)
```

## After Initialization

1. **Customize Skills**: Edit `.ai/ssot/skills/` for your project
2. **Add Workflows**: Create project-specific workflows in `.ai/ssot/workflows/`
3. **Re-run Adapter**: `node .ai/scripts/adapt.js [provider]` to sync changes

## Documentation

- [Dev Docs Pattern](../dev/README.md) - Context persistence across sessions
- [Documentation Guidelines](../docs/documentation-guidelines.md)
- [Naming Conventions](../docs/naming-conventions.md)

