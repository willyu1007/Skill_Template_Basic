# AI-Friendly Repository Template

A starter kit for creating LLM-optimized codebases with Single Source of Truth (SSOT) architecture.

## Quick Start

| For | Action |
|-----|--------|
| **AI Assistants** | Read `init/AGENTS.md` → Initialize project |
| **Humans** | Read `init/README.md` → Follow quick start |

## What's Inside

```
init/                      # ← START HERE
├── README.md              # Template overview & quick start
├── AGENTS.md              # AI initialization instructions
└── INITIALIZATION.md      # Detailed field reference

.ai/ssot/                  # Single Source of Truth
├── skills/                # Coding patterns & guidelines
├── workflows/             # Step-by-step processes
└── commands/              # Reusable templates

.ai/scripts/               # Adapter scripts
├── adapt.js               # Generate provider artifacts
└── switch.js              # Switch providers

dev/                       # Development documentation
├── README.md              # Dev Docs Pattern guide
├── active/                # Current tasks
└── archive/               # Completed tasks
```

## Supported Providers

| Provider | Command |
|----------|---------|
| Claude Code | `node .ai/scripts/adapt.js claude` |
| OpenAI Codex | `node .ai/scripts/adapt.js codex` |
| Cursor | `node .ai/scripts/adapt.js cursor` |
| GitHub Copilot | `node .ai/scripts/adapt.js copilot` |
| Google Gemini | `node .ai/scripts/adapt.js gemini` |

## Documentation

- [Initialization Guide](init/README.md)
- [Dev Docs Pattern](dev/README.md)
- [Documentation Guidelines](docs/documentation-guidelines.md)
- [Naming Conventions](docs/naming-conventions.md)
