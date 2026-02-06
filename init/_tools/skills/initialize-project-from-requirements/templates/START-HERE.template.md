# START HERE (Intake)

<!--
LLM:
- Single intake surface for progressive information capture.
- Only edit inside the BEGIN/END LLM blocks.

Rules:
- The user does NOT need to answer every question at once.
- Do not show explicit "mapping tables" to SSOT files here; just capture and organize inputs.
- When a stage starts, roll once:
  - Archive previous stage's "Current focus" + "Round inputs" into the Archive (<details>) section.
  - Clear "Current focus" + "Round inputs" for the new stage.
-->

language: {{language}}
stage: {{stage}}

## 0. Snapshot (LLM)
<!-- BEGIN LLM:SNAPSHOT -->
### Current focus
- (clear and update as you progress)

### Key inputs (rolling)
| Key | Value | Status (todo/confirmed/tbd) | Notes |
|---|---|---|---|
|  |  | todo |  |

### Questions (rolling, simplified)
- [ ] (add questions; the user can answer later)
<!-- END LLM:SNAPSHOT -->

## 1. Working Agreement (LLM)
<!-- BEGIN LLM:WORKING_AGREEMENT -->
- timeZone:
- asyncFirst: true
- responseSLA:
- decisionPolicy:
  - preStageA: editable
  - stageA: editable (keep required headings for validator)
  - stageB: editable (re-run validate)
  - stageC: editable (re-run apply)
<!-- END LLM:WORKING_AGREEMENT -->

## 2. Materials Register (LLM, no uploads)
<!-- BEGIN LLM:MATERIALS_REGISTER -->
| ID | Type | Link | Owner | Extracted summary | Written to | Status | Notes |
|---|---|---|---|---|---|---|---|
| M-001 | doc | https:// |  |  |  | todo |  |
<!-- END LLM:MATERIALS_REGISTER -->

## 3. Notes (LLM)
<!-- BEGIN LLM:PRE_STAGE_A_NOTES -->
### Round inputs (new inputs)
- (append as the user shares info)

### Archive (folded, append-only)
<details>
<summary>Stage A (archive)</summary>

- TBD

</details>
<!-- END LLM:PRE_STAGE_A_NOTES -->

## 4. Next (Read-only)
- See `init/INIT-BOARD.md`
