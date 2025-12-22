# Project Initialization Reference

Complete field reference for project initialization.

## Basic Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | Project name (kebab-case) | `my-saas-app` |
| `description` | string | Yes | One-line description | `A SaaS platform for...` |
| `version` | string | No | Initial version | `0.1.0` |
| `provider` | enum | Yes | LLM provider | `codex` |

## Requirements

| Field | Type | Description |
|-------|------|-------------|
| `goals` | string/list | Project objectives and success criteria |
| `domain` | string | Business domain and key entities |
| `dataFlow` | string | Main data flow (input → process → output) |
| `constraints` | list | Complexity constraints |

### Constraints Examples

- Performance requirements (latency, throughput)
- Compliance requirements (GDPR, HIPAA)
- Multi-tenant architecture
- Offline support
- Real-time features

## Development Configuration

### Frontend

| Field | Options | Default |
|-------|---------|---------|
| `framework` | React, Vue, Angular, Svelte, None | None |
| `language` | TypeScript, JavaScript | TypeScript |
| `buildTool` | Vite, Webpack, Next.js, Nuxt | Vite |

### Backend

| Field | Options | Default |
|-------|---------|---------|
| `framework` | Express, Fastify, NestJS, Django, FastAPI, None | None |
| `language` | TypeScript, Python, Go, Java | TypeScript |
| `database` | PostgreSQL, MySQL, MongoDB, SQLite | PostgreSQL |

### Repository

| Field | Options | Default |
|-------|---------|---------|
| `repoStructure` | monolith, monorepo, multi-repo | monolith |
| `testStrategy` | unit, integration, e2e, none | unit |

## Output Files

### project-profile.yaml

```yaml
name: my-project
description: Project description here
version: 0.1.0
provider: codex

requirements:
  goals: |
    - Build a scalable API
    - Support 1000 concurrent users
  domain: E-commerce platform with products, orders, users
  dataFlow: User request → API Gateway → Services → Database
  constraints:
    - Response time < 200ms
    - GDPR compliance

development:
  frontend:
    framework: React
    language: TypeScript
    buildTool: Vite
  backend:
    framework: Express
    language: TypeScript
    database: PostgreSQL
  repoStructure: monolith
  testStrategy: unit, integration

generated: 2025-01-15T10:30:00Z
```

### project-profile.json

```json
{
  "name": "my-project",
  "description": "Project description here",
  "version": "0.1.0",
  "provider": "codex",
  "requirements": {
    "goals": ["Build a scalable API", "Support 1000 concurrent users"],
    "domain": "E-commerce platform with products, orders, users",
    "dataFlow": "User request → API Gateway → Services → Database",
    "constraints": ["Response time < 200ms", "GDPR compliance"]
  },
  "development": {
    "frontend": {
      "framework": "React",
      "language": "TypeScript",
      "buildTool": "Vite"
    },
    "backend": {
      "framework": "Express",
      "language": "TypeScript",
      "database": "PostgreSQL"
    },
    "repoStructure": "monolith",
    "testStrategy": ["unit", "integration"]
  },
  "generated": "2025-01-15T10:30:00Z"
}
```

## Conversation Flow

Suggested order for collecting information:

1. **Provider** - Which AI assistant?
2. **Name & Description** - What is this project?
3. **Goals** - What should it achieve?
4. **Domain** - What business problem does it solve?
5. **Tech Stack** - Frontend and backend choices
6. **Constraints** - Any special requirements?

Keep it conversational; don't ask all questions at once.

