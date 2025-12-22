---
name: documentation-maintenance
description: Workflow for maintaining a high-quality, up-to-date documentation system across the project, including developer guides, API references, and system architecture diagrams.
---

# Documentation Maintenance Workflow

This guide details the process for ensuring project documentation remains accurate, comprehensive, and helpful for both human developers and AI assistants.

## Core Responsibilities
1. **SSOT Enforcement**: Maintain the Single Source of Truth for skills, workflows, and guidelines.
2. **Context Integrity**: Ensure all documentation is accurate and reflects the current state of the codebase.
3. **AI-Friendliness**: Optimize documentation for retrieval and understanding by Large Language Models.

## Maintenance Workflow

### 1. Audit and Review
- Regularly audit existing documents in `.ai/ssot/` and `docs/`.
- Identify outdated information, broken links, or missing critical details.
- Review recent significant changes in the codebase that require documentation updates.

### 2. Update and Expand
- Update core guides when project patterns or library versions change.
- Create new resource files in `.ai/ssot/skills/` for newly established patterns.
- Ensure all technical guides follow the established project style and terminology.

### 3. Structural Integrity
- Maintain a clear and logical directory structure for documentation.
- Use progressive disclosure (keeping main guides concise while linking to detailed resources).
- Ensure cross-references between related documents are accurate.

## Documentation Standards
- **Language**: English only.
- **Format**: Standard Markdown with clean frontmatter for structured files.
- **Completeness**: Every core skill must have its own directory with a `SKILL.md` and a `resources/` folder.
- **Clarity**: Use code examples and diagrams (Mermaid or similar) to illustrate complex concepts.

## Output Format for Documentation Tasks
- **Changes Made**: Summary of updated or new documents.
- **Rationale**: Why the updates were necessary.
- **Verification**: How the new documentation was validated (e.g., checking internal links, reviewing for clarity).

