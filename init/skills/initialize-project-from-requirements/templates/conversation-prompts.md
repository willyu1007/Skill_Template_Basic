# Conversation Prompts (Stage A requirements interview)

## Conclusions (read first)

- Use this as a **question bank** for Stage A. Ask the **MUST-ask** set first, then use **branch modules** based on the project's capabilities.
- Every answer MUST be written into a file artifact:
  - Stage A docs under `docs/project/` (human-readable SSOT for intent)
  - Stage B blueprint at `docs/project/project-blueprint.json` (machine-readable SSOT for scaffolding / pack selection)
- If the user cannot decide, record it as **TBD** in `docs/project/risk-open-questions.md` with:
  - owner, options, and decision due.

## A. MUST-ask (minimal set)

Ask these before writing the first draft of `docs/project/requirements.md`:

1. **One-line purpose**
   - "In one sentence, what problem does this project solve, for whom, and what is the main outcome?"

2. **Primary user roles**
   - "Who are the primary users (2–5 roles)?"
   - "Who is NOT a user?"

3. **In-scope MUST requirements (3–10)**
   - "List the MUST-have capabilities. Each MUST should be testable."

4. **Out-of-scope (explicit OUT)**
   - "List what we will NOT do in this version."

5. **Top user journeys (2–5)**
   - "Describe the top user journeys end-to-end."
   - For each journey: "What is the acceptance criterion (AC)?"

6. **Constraints**
   - "Hard constraints (compliance, security, platforms, deadlines, budget, integrations)?"
   - "Any non-negotiable tech constraints?"

7. **Success metrics**
   - "How do we measure success? (business + product + reliability)"

## B. Branch modules (ask only if relevant)

### B1. API module (if the project exposes or consumes APIs)

Ask if the project has `capabilities.api.style != "none"` or has external integrations.

- API style: REST / GraphQL / event-driven / internal only
- Authentication: none / session / JWT / OAuth2 / API key
- Error model: "How should errors be represented (codes, messages, trace IDs)?"
- Pagination / filtering / sorting conventions
- Versioning and backward compatibility expectations
- Rate limiting / abuse controls (if public)

Write to:
- Stage A: `docs/project/requirements.md` (high-level)
- Stage B: `capabilities.api.*`

### B2. Database module (if persistent data exists)

Ask if `capabilities.database.enabled == true`.

- DB kind: postgres / mysql / sqlite / document / key-value / managed service / TBD
- Data size expectations (orders of magnitude)
- Consistency expectations (strong/eventual)
- Migration strategy expectations (migrations / schema-less / TBD)
- Backup / restore requirements

Write to:
- Stage A: `docs/project/non-functional-requirements.md` + `requirements.md` (entities)
- Stage B: `capabilities.database.*`

### B3. BPMN / process module (if business workflows matter)

Ask if `capabilities.bpmn.enabled == true`.

- Process boundaries: start/end triggers
- Swimlanes: which roles/systems act
- Happy path + exception paths
- Manual steps vs automated steps
- Audit needs (who did what, when)

Write to:
- Stage A: `docs/project/requirements.md` + `risk-open-questions.md`
- Optional future artifact: `docs/context/process/*.bpmn`

### B4. CI / quality module (if the project will be maintained)

Ask if `quality.ci.enabled == true` or `quality.testing.enabled == true`.

- CI provider constraints (if any)
- What is the minimal quality gate? (lint, typecheck, unit tests, build)
- Required environments / matrix (node versions, OS)
- Test levels needed (unit/integration/e2e)
- Release cadence expectations

Write to:
- Stage A: `docs/project/non-functional-requirements.md`
- Stage B: `quality.*`

### B5. Tech Stack module (MUST-ask for new projects)

Ask these to populate `repo.language`, `repo.packageManager`, and `capabilities.*.framework` in the blueprint.

**Primary programming language**
- "What is the primary programming language? (typescript, javascript, python, go, java, dotnet, other)"
- If the user is unsure, suggest based on project requirements (e.g., TypeScript for full-stack web apps, Python for data-heavy projects, Go for high-performance services)

**Package manager**
- "Which package manager will you use? (npm, pnpm, yarn, pip, poetry, go, maven, gradle, dotnet, other)"
- If the user is unsure, suggest based on language:
  - TypeScript/JavaScript: pnpm (recommended), npm, or yarn
  - Python: poetry (recommended) or pip
  - Go: go (built-in)
  - Java: maven or gradle
  - .NET: dotnet (built-in)

**Frontend framework** (if `capabilities.frontend.enabled == true`)
- "Which frontend framework will you use? (react, vue, angular, svelte, nextjs, remix, other)"
- If the user is unsure, suggest based on project scale and team preferences

**Backend framework** (if `capabilities.backend.enabled == true`)
- "Which backend framework will you use? (express, fastify, nestjs, fastapi, spring, gin, fiber, other)"
- If the user is unsure, suggest based on language and requirements:
  - Node.js: express (simple), fastify (performance), nestjs (structure)
  - Python: fastapi (modern APIs), django (full-featured), flask (lightweight)
  - Go: gin (popular), fiber (express-like), echo (lightweight)
  - Java: spring boot (enterprise)

**Template coverage note**
- If the selected language/framework combination has a template in `templates/scaffold-configs/`, inform the user that base config files will be auto-generated.
- If no template exists, explain that you will provide guidance on what config files are needed based on the selected tech stack, and suggest creating them manually or with framework-specific tooling.

Write to:
- Stage B: `repo.language`, `repo.packageManager`, `capabilities.frontend.framework`, `capabilities.backend.framework`
- Stage A: `docs/project/non-functional-requirements.md` (tech stack section, if needed for documentation)

## C. Answer → Artifact mapping cheat sheet

Use this mapping to avoid "knowledge floating in chat":

- Scope (MUST/OUT) → `docs/project/requirements.md` (`## Goals`, `## Non-goals`)
- User journeys + AC → `docs/project/requirements.md` (`## Users and user journeys`)
- Constraints/NFR → `docs/project/non-functional-requirements.md`
- Tech stack decisions → `docs/project/project-blueprint.json` (`repo.language`, `repo.packageManager`, `capabilities.*.framework`)
- Glossary terms/entities → `docs/project/domain-glossary.md`
- TBD decisions/risks → `docs/project/risk-open-questions.md`
- Repo layout/pack selection decisions → `docs/project/project-blueprint.json`

## Verification

- After the interview, run Stage A validation:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js check-docs --docs-root docs/project
```
