# Stage A - Requirements

## Goal

Produce a verifiable set of requirement documents under `init/stage-a-docs/`.

## Process

1. **Domain terminology alignment** (MUST ask, optional to complete)
   - Before collecting requirements, ask user if they want to align on domain terminology first
   - If yes, collect key terms and document in `domain-glossary.md`
   - If no/later, proceed and revisit if domain terms emerge during interview
2. **Requirements interview** using conversation prompts
3. **Document drafting** using templates
4. **Validation** using `check-docs` command

## Outputs

| File | Purpose |
|------|---------|
| `requirements.md` | Goals, non-goals, user journeys |
| `non-functional-requirements.md` | Performance, security, availability |
| `domain-glossary.md` | Key terms definitions (may be populated early or during interview) |
| `risk-open-questions.md` | Unresolved decisions |

## Definition of Done

- [ ] User was asked about domain terminology alignment (mandatory inquiry)
- [ ] `requirements.md` has explicit Goals (MUST) and Non-goals (OUT)
- [ ] User journeys have acceptance criteria
- [ ] `non-functional-requirements.md` has measurable targets or TBD items
- [ ] `domain-glossary.md` defines all domain terms (or documents that no special terms exist)
- [ ] `risk-open-questions.md` consolidates all TBD (owner + options + due)

## Commands

```bash
# Validate docs
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs

# Approve and advance to Stage B
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage A
```

## See also

- Templates: `init/skills/initialize-project-from-requirements/templates/`
- Full reference: `init/reference.md`
