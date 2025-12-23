# Initialization Instructions

You are initializing a new project using the AI-Friendly Repository Template.

## Your Task

Guide user through project initialization by collecting information and generating configuration files.

## Initialization Steps

### Step 1: Collect Project Information

**See `init/INITIALIZATION.md` for complete field reference.**

Quick checklist:

| Category | Fields |
|----------|--------|
| Basic | name, description, version |
| Requirements | goals, domain, dataFlow, constraints |
| Frontend | framework, language, buildTool |
| Backend | framework, language, database |
| Structure | repoStructure, testStrategy |

### Step 2: Generate Files

Create both files in `init/`:

**init/project-profile.yaml:**
```yaml
name: project-name
description: Project description
version: 0.1.0

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

### Step 3: Sync Skill Stubs

Execute:
```bash
node .ai/scripts/sync-skills.js
```

### Step 4: Guide Customization

After sync runs, guide user to:
1. Review generated `.codex/skills/` and `.claude/skills/` stubs
2. Customize `.ai/skills/` for their project
3. Remove unneeded example skills
4. Add project-specific workflow skills
5. Add or refine `.ai/commands/` as needed

## Rules

- All fields are optional; use sensible defaults
- Keep conversation focused on essential information
- Generate both YAML and JSON profiles
- Always run `node .ai/scripts/sync-skills.js` after generating profile

## After Initialization

Direct user to root `AGENTS.md` for ongoing project instructions.

