# Initialization Instructions

You are initializing a new project using the AI-Friendly Repository Template.

## Your Task

Guide user through project initialization by collecting information and generating configuration files.

## Initialization Steps

### Step 1: Ask Provider

Ask which LLM provider they use:
- `claude` - Claude Code
- `codex` - OpenAI Codex
- `cursor` - Cursor
- `copilot` - GitHub Copilot
- `gemini` - Google Gemini

### Step 2: Collect Project Information

**See `init/INITIALIZATION.md` for complete field reference.**

Quick checklist:

| Category | Fields |
|----------|--------|
| Basic | name, description, version |
| Requirements | goals, domain, dataFlow, constraints |
| Frontend | framework, language, buildTool |
| Backend | framework, language, database |
| Structure | repoStructure, testStrategy |

### Step 3: Generate Files

Create both files in `init/`:

**init/project-profile.yaml:**
```yaml
name: project-name
description: Project description
version: 0.1.0
provider: [chosen-provider]

requirements:
  goals: [collected goals]
  domain: [business domain]
  dataFlow: [data flow description]
  constraints: [constraints list]

development:
  frontend:
    framework: [React|Vue|Angular|Svelte|None]
    language: [TypeScript|JavaScript]
    buildTool: [Vite|Webpack|Next.js|Nuxt]
  backend:
    framework: [Express|Fastify|NestJS|Django|FastAPI|None]
    language: [TypeScript|Python|Go|Java]
    database: [PostgreSQL|MySQL|MongoDB|SQLite]
  repoStructure: [monolith|monorepo|multi-repo]
  testStrategy: [unit|integration|e2e|none]

generated: [ISO timestamp]
```

**init/project-profile.json:** Same content in JSON format.

### Step 4: Run Adapter

Execute:
```bash
node .ai/scripts/adapt.js [provider]
```

### Step 5: Guide Customization

After adapter runs, guide user to:
1. Review generated `.[provider]/` directory
2. Customize `.ai/ssot/skills/` for their project
3. Remove unneeded example skills
4. Add project-specific workflows

## Rules

- All fields are optional; use sensible defaults
- Keep conversation focused on essential information
- Generate both YAML and JSON profiles
- Always run adapter after generating profile

## After Initialization

Direct user to root `AGENTS.md` for ongoing project instructions.

