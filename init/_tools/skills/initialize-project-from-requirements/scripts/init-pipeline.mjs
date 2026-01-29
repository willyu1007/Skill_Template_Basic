#!/usr/bin/env node
/**
 * init-pipeline.mjs
 *
 * Dependency-free helper for a 3-stage, verifiable init pipeline:
 *
 *   Stage A: requirements docs under `init/_work/stage-a-docs/`
 *   Stage B: blueprint JSON at `init/_work/project-blueprint.json`
 *   Stage C: minimal scaffold + skill pack manifest update + wrapper sync
 *
 * Commands:
 *   - start          Initialize state file and show next steps
 *   - set-language   Set the working language in init state (free-form)
 *   - status         Show current initialization progress
 *   - advance        Check current stage completion and prompt for next stage
 *   - validate       Validate a blueprint JSON (no writes)
 *   - check-docs     Validate Stage A docs (structure + template placeholders)
 *   - suggest-packs  Recommend skill packs from blueprint capabilities (warn-only by default)
 *   - scaffold       Plan or apply a minimal directory scaffold from the blueprint
 *   - apply          validate + (optional) check-docs + scaffold + configs + manifest update + wrapper sync
 *   - cleanup-init   Remove the `init/` bootstrap kit (opt-in, guarded)
 *   - review-skill-retention  Mark Stage C skill retention as reviewed
 *   - update-intake  Update init/START-HERE.md (intake doc; LLM-maintained blocks)
 *   - update-board   Update init/INIT-BOARD.md (LLM-owned; pipeline updates only the machine snapshot block)
 *   - update-root-docs  Generate/update root README.md and AGENTS.md from the blueprint
 *
 * This script is intentionally framework-agnostic. It avoids generating code.
 *
 * Code Structure (for maintainers):
 * ---------------------------------
 *   - Utilities & CLI: usage, parseArgs, file I/O helpers
 *   - State management: init/_work/.init-state.json + progress calculations
 *   - Entry docs:
 *     - init/START-HERE.md is template-driven; preserves LLM blocks
 *     - init/INIT-BOARD.md is LLM-owned; updates only MACHINE_SNAPSHOT block
 *   - Docs validation: check-docs (Stage A)
 *   - Blueprint & packs: validate + suggest-packs (Stage B)
 *   - Scaffold + configs + docs: scaffold/apply/update-root-docs (Stage C)
 *   - Manifest + wrappers: sync-manifest.json + sync-skills.mjs
 *   - Cleanup & archive: cleanup-init
 *   - Main CLI: command dispatch and execution
 *
 * Modularization Note:
 *   The script is intentionally kept as a single file for bootstrap simplicity.
 *   If it grows significantly (>4000 lines), consider splitting into:
 *   - lib/state.mjs, lib/entry-docs.mjs, lib/blueprint.mjs, lib/scaffold.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage(exitCode = 0) {
  const msg = `
Usage:
  node init/_tools/init.mjs <command> [options]

Canonical:
  node init/_tools/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs <command> [options]

Commands:
  start
    --repo-root <path>          Repo root (default: cwd)
    Initialize state file and show next steps.

  set-language
    --language <string>         Working language (free-form; required)
    --repo-root <path>          Repo root (default: cwd)
    Write state.language and (copy-if-missing) create entry docs.

  status
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)
    Show current initialization progress.

  advance
    --repo-root <path>          Repo root (default: cwd)
    Check current stage completion and prompt for next stage.

  approve
    --stage <A|B|C>             Stage to approve (required)
    --repo-root <path>          Repo root (default: cwd)
    Approve current stage and advance to next stage (after user review).

  validate
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)

  check-docs
    --docs-root <path>          Stage A docs root (default: <repo-root>/init/_work/stage-a-docs)
    --repo-root <path>          Repo root (default: cwd)
    --strict                    Treat warnings as errors (exit non-zero)
    --format <text|json>        Output format (default: text)

  suggest-packs
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)
    --write                      Add missing recommended packs into blueprint (safe-add only)

  scaffold
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually create directories/files (default: dry-run)

  apply
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)
    --providers <both|codex|claude|codex,claude>
                                Providers to sync (default: both)
    --require-stage-a           Run 'check-docs' and fail if it has errors
    --require-stage-a-strict    Run 'check-docs --strict' and fail if it does not pass
    --skip-configs              Skip generating config files (package.json, etc.)
    --skip-readme               Skip generating root README.md from blueprint
    --skip-root-agents          Skip updating root AGENTS.md from blueprint
    --skip-agent-builder        Remove .ai/skills/workflows/agent before wrapper sync (requires --i-understand)
    --cleanup-init              Remove <repo-root>/init after success (requires --i-understand)
    --archive                   Archive Stage A docs + blueprint before cleanup (requires --cleanup-init)
    --archive-docs              Archive Stage A docs only before cleanup (requires --cleanup-init)
    --archive-blueprint         Archive blueprint only before cleanup (requires --cleanup-init)
    --archive-dir <path>        Archive destination (default: docs/project/overview)
    --i-understand              Required acknowledgement for destructive actions

  cleanup-init
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually remove init/ (default: dry-run)
    --archive                    Archive Stage A docs + blueprint to docs/project/overview before cleanup
    --archive-docs               Archive Stage A docs only before cleanup
    --archive-blueprint          Archive blueprint only before cleanup
    --archive-dir <path>        Archive destination (default: docs/project/overview)
    --i-understand              Required acknowledgement (refuses without it)

  review-skill-retention
    --repo-root <path>          Repo root (default: cwd)
    Mark Stage C skill retention as reviewed (required before approving Stage C).

  update-intake
    --repo-root <path>          Repo root (default: cwd)
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --docs-root <path>          Stage A docs root (default: <repo-root>/init/_work/stage-a-docs)
    --path <path>               Entry doc path (default: <repo-root>/init/START-HERE.md)
    --apply                      Actually write the doc (default: dry-run)
    Update the intake doc. Preserves LLM blocks.

  update-board
    --repo-root <path>          Repo root (default: cwd)
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --docs-root <path>          Stage A docs root (default: <repo-root>/init/_work/stage-a-docs)
    --path <path>               Board doc path (default: <repo-root>/init/INIT-BOARD.md)
    --apply                      Actually write the board (default: dry-run)
    Update init/INIT-BOARD.md by refreshing only its MACHINE_SNAPSHOT block (the rest is LLM-owned).

  update-root-docs
    --repo-root <path>          Repo root (default: cwd)
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/_work/project-blueprint.json)
    --apply                      Actually write root docs (default: dry-run)
    --skip-readme               Skip generating root README.md
    --skip-root-agents          Skip updating root AGENTS.md
    Update root README.md and/or AGENTS.md from the blueprint.

  prune-agent-builder
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually remove .ai/skills/workflows/agent (default: dry-run)
    --sync-after                 Re-sync wrappers after pruning (default: true)
    --providers <both|codex|claude>
                                Providers to sync (default: both)
    --i-understand              Required acknowledgement (refuses without it)

Examples:
  node init/_tools/init.mjs start
  node init/_tools/init.mjs set-language --language "zh-CN"
  node init/_tools/init.mjs status
  node init/_tools/init.mjs check-docs --docs-root init/_work/stage-a-docs
  node init/_tools/init.mjs validate --blueprint init/_work/project-blueprint.json
  node init/_tools/init.mjs approve --stage A
  node init/_tools/init.mjs apply --blueprint init/_work/project-blueprint.json --providers codex,claude
  node init/_tools/init.mjs review-skill-retention
  node init/_tools/init.mjs update-intake --apply
  node init/_tools/init.mjs update-board --apply
  node init/_tools/init.mjs update-root-docs --apply
  node init/_tools/init.mjs prune-agent-builder --apply --i-understand
  node init/_tools/init.mjs cleanup-init --apply --i-understand --archive
`;
  console.log(msg.trim());
  process.exit(exitCode);
}

function die(msg, exitCode = 1) {
  console.error(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') usage(0);

  const command = args.shift();
  const opts = {};
  const positionals = [];

  while (args.length > 0) {
    const token = args.shift();
    if (token === '-h' || token === '--help') usage(0);

    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (args.length > 0 && !args[0].startsWith('--')) {
        opts[key] = args.shift();
      } else {
        opts[key] = true;
      }
    } else {
      positionals.push(token);
    }
  }

  return { command, opts, positionals };
}

function resolvePath(base, p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.resolve(base, p);
}

const INIT_WORK_DEFAULT_REL = path.join('init', '_work');
const STAGE_A_DOCS_DEFAULT_REL = path.join(INIT_WORK_DEFAULT_REL, 'stage-a-docs');
const BLUEPRINT_DEFAULT_REL = path.join(INIT_WORK_DEFAULT_REL, 'project-blueprint.json');
const INIT_STATE_DEFAULT_REL = path.join(INIT_WORK_DEFAULT_REL, '.init-state.json');

function resolveDocsRoot(repoRoot, provided) {
  if (provided) return resolvePath(repoRoot, provided);
  return path.join(repoRoot, STAGE_A_DOCS_DEFAULT_REL);
}

function resolveBlueprintPath(repoRoot, provided) {
  if (provided) return resolvePath(repoRoot, provided);
  return path.join(repoRoot, BLUEPRINT_DEFAULT_REL);
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(stripUtf8Bom(raw));
  } catch (e) {
    die(`[error] Failed to read JSON: ${filePath}\n${e.message}`);
  }
}

function readBlueprintOrDie(repoRoot, blueprintPath) {
  if (!fs.existsSync(blueprintPath)) {
    const rel = toPosixPath(path.relative(repoRoot, blueprintPath));
    const cmdStart = 'node init/_tools/init.mjs start --repo-root .';
    die(
      [
        `[error] Blueprint not found: ${rel}`,
        `[hint] Run: ${cmdStart}`,
        '[hint] Or provide a custom path via: --blueprint <path>'
      ].join('\n')
    );
  }
  return readJson(blueprintPath);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

// ============================================================================
// State Management
// ============================================================================

const SCRIPT_DIR = __dirname;
const TEMPLATES_DIR = path.join(SCRIPT_DIR, '..', 'templates');

function getStatePath(repoRoot) {
  return path.join(repoRoot, INIT_STATE_DEFAULT_REL);
}

function stageKey(letter) {
  const l = String(letter || '').toLowerCase();
  if (!l) return '';
  return `stage-${l}`;
}

function createInitialState() {
  return {
    version: 1,
    language: null,
    stage: 'A',
    createdAt: new Date().toISOString(),
    [stageKey('A')]: {
      mustAsk: {
        onePurpose: { asked: false, answered: false, writtenTo: null },
        userRoles: { asked: false, answered: false, writtenTo: null },
        mustRequirements: { asked: false, answered: false, writtenTo: null },
        outOfScope: { asked: false, answered: false, writtenTo: null },
        userJourneys: { asked: false, answered: false, writtenTo: null },
        constraints: { asked: false, answered: false, writtenTo: null },
        successMetrics: { asked: false, answered: false, writtenTo: null }
      },
      docsWritten: {
        requirements: false,
        nfr: false,
        glossary: false,
        riskQuestions: false
      },
      validated: false,
      userApproved: false
    },
    [stageKey('B')]: {
      drafted: false,
      validated: false,
      packsReviewed: false,
      userApproved: false
    },
    [stageKey('C')]: {
      scaffoldApplied: false,
      configsGenerated: false,
      manifestUpdated: false,
      wrappersSynced: false,
      skillRetentionReviewed: false,
      userApproved: false
    },
    history: []
  };
}

function normalizeLanguageValue(value) {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

function getStateLanguage(state) {
  if (!state || typeof state !== 'object') return null;
  return normalizeLanguageValue(state.language);
}

function stripUtf8Bom(s) {
  if (s == null) return '';
  let str = String(s);
  while (str.charCodeAt(0) === 0xfeff) str = str.slice(1);
  return str;
}

function loadState(repoRoot) {
  const statePath = getStatePath(repoRoot);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  try {
    return JSON.parse(stripUtf8Bom(fs.readFileSync(statePath, 'utf8')));
  } catch (e) {
    console.error(`[warn] Failed to parse state file: ${e.message}`);
    return null;
  }
}

function saveState(repoRoot, state) {
  const statePath = getStatePath(repoRoot);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function addHistoryEvent(state, event, details) {
  state.history = state.history || [];
  state.history.push({
    timestamp: new Date().toISOString(),
    event,
    details
  });
}

function getStageProgress(state) {
  const stageStateA = state[stageKey('A')] || {};
  const stageStateB = state[stageKey('B')] || {};
  const stageStateC = state[stageKey('C')] || {};

  const mustAskKeys = Object.keys(stageStateA.mustAsk || {});
  const mustAskAnswered = mustAskKeys.filter(k => stageStateA.mustAsk[k]?.answered).length;

  const docsKeys = ['requirements', 'nfr', 'glossary', 'riskQuestions'];
  const docsWritten = docsKeys.filter(k => stageStateA.docsWritten?.[k]).length;

  return {
    stage: state.stage,
    [stageKey('A')]: {
      mustAskTotal: mustAskKeys.length,
      mustAskAnswered,
      docsTotal: docsKeys.length,
      docsWritten,
      validated: !!stageStateA.validated,
      userApproved: !!stageStateA.userApproved
    },
    [stageKey('B')]: {
      drafted: !!stageStateB.drafted,
      validated: !!stageStateB.validated,
      packsReviewed: !!stageStateB.packsReviewed,
      userApproved: !!stageStateB.userApproved
    },
    [stageKey('C')]: {
      scaffoldApplied: !!stageStateC.scaffoldApplied,
      configsGenerated: !!stageStateC.configsGenerated,
      manifestUpdated: !!stageStateC.manifestUpdated,
      wrappersSynced: !!stageStateC.wrappersSynced,
      skillRetentionReviewed: !!stageStateC.skillRetentionReviewed,
      userApproved: !!stageStateC.userApproved
    }
  };
}

function printStatus(state, repoRoot, { docsRoot, blueprintPath } = {}) {
  const progress = getStageProgress(state);
  const language = getStateLanguage(state);

  const stageNames = { A: 'Requirements', B: 'Blueprint', C: 'Scaffold', complete: 'Complete' };
  const docsRel = docsRoot ? toPosixPath(path.relative(repoRoot, docsRoot)) : toPosixPath(STAGE_A_DOCS_DEFAULT_REL);
  const bpRel = blueprintPath ? toPosixPath(path.relative(repoRoot, blueprintPath)) : toPosixPath(BLUEPRINT_DEFAULT_REL);

  console.log('');
  console.log('== Init Status ==');
  console.log(`Current stage: ${progress.stage} - ${stageNames[progress.stage] || progress.stage}`);
  console.log(`Language: ${language || '(not set)'}`);

  if (!language) {
    console.log('');
    console.log('Entry docs (init/START-HERE.md, init/INIT-BOARD.md) are created only after language is set.');
    console.log('Next:');
    console.log('  node init/_tools/init.mjs set-language --language \"<your language>\" --repo-root .');
  }

  if (progress.stage === 'A' || progress.stage === 'B' || progress.stage === 'C') {
    console.log('');
    console.log('Stage A:');
    console.log(`  Must-ask: ${progress[stageKey('A')].mustAskAnswered}/${progress[stageKey('A')].mustAskTotal}`);
    console.log(`  Docs written: ${progress[stageKey('A')].docsWritten}/${progress[stageKey('A')].docsTotal}`);
    console.log(`  Validated: ${progress[stageKey('A')].validated ? 'yes' : 'no'}`);
    console.log(`  User approved: ${progress[stageKey('A')].userApproved ? 'yes' : 'no'}`);
  }

  if (progress.stage === 'B' || progress.stage === 'C') {
    console.log('');
    console.log('Stage B:');
    console.log(`  Drafted: ${progress[stageKey('B')].drafted ? 'yes' : 'no'}`);
    console.log(`  Validated: ${progress[stageKey('B')].validated ? 'yes' : 'no'}`);
    console.log(`  Packs reviewed: ${progress[stageKey('B')].packsReviewed ? 'yes' : 'no'}`);
    console.log(`  User approved: ${progress[stageKey('B')].userApproved ? 'yes' : 'no'}`);
  }

  if (progress.stage === 'C' || progress.stage === 'complete') {
    console.log('');
    console.log('Stage C:');
    console.log(`  Scaffold applied: ${progress[stageKey('C')].scaffoldApplied ? 'yes' : 'no'}`);
    console.log(`  Configs generated: ${progress[stageKey('C')].configsGenerated ? 'yes' : 'no'}`);
    console.log(`  Manifest updated: ${progress[stageKey('C')].manifestUpdated ? 'yes' : 'no'}`);
    console.log(`  Wrappers synced: ${progress[stageKey('C')].wrappersSynced ? 'yes' : 'no'}`);
    console.log(`  Skill retention reviewed: ${progress[stageKey('C')].skillRetentionReviewed ? 'yes' : 'no'}`);
  }

  console.log('');
  console.log('Next steps:');
  if (progress.stage === 'A') {
    if (!progress[stageKey('A')].validated) {
      console.log('- Complete the interview and draft Stage A docs.');
      console.log(`- Run: node init/_tools/init.mjs check-docs --docs-root ${docsRel} --repo-root .`);
    } else if (!progress[stageKey('A')].userApproved) {
      console.log('- Ask the user to review Stage A docs.');
      console.log('- After approval run: node init/_tools/init.mjs approve --stage A --repo-root .');
    }
  } else if (progress.stage === 'B') {
    if (!progress[stageKey('B')].validated) {
      console.log(`- Create ${bpRel}`);
      console.log(`- Run: node init/_tools/init.mjs validate --blueprint ${bpRel} --repo-root .`);
    } else if (!progress[stageKey('B')].userApproved) {
      console.log('- Ask the user to review the blueprint.');
      console.log('- After approval run: node init/_tools/init.mjs approve --stage B --repo-root .');
    }
  } else if (progress.stage === 'C') {
    if (!progress[stageKey('C')].wrappersSynced) {
      console.log(`- Run: node init/_tools/init.mjs apply --blueprint ${bpRel} --repo-root .`);
    } else if (!progress[stageKey('C')].skillRetentionReviewed) {
      console.log('- Review skill retention (keep vs prune).');
      console.log('- Then run: node init/_tools/init.mjs review-skill-retention --repo-root .');
    } else if (!progress[stageKey('C')].userApproved) {
      console.log('- Initialization ready for review.');
      console.log('- After approval run: node init/_tools/init.mjs approve --stage C --repo-root .');
    }
  } else if (progress.stage === 'complete') {
    console.log('- Initialization complete!');
  }

  console.log('');
}

// ============================================================================
// Entry docs: START-HERE.md (manual) + INIT-BOARD.md (generated)
// ============================================================================

const START_HERE_DEFAULT_REL = path.join('init', 'START-HERE.md');
const INIT_BOARD_DEFAULT_REL = path.join('init', 'INIT-BOARD.md');

const INIT_KIT_MARKER_DEFAULT_REL = path.join('init', '_tools', '.init-kit');

function toPosixPath(p) {
  return String(p || '').replace(/\\/g, '/');
}

// ============================================================================
// START-HERE.md (Intake Doc)
// ============================================================================

const START_HERE_BLOCK_TYPES = ["LLM", "MANUAL"];
const START_HERE_BLOCK_TYPE_PRIMARY = "LLM";

function startHeereMarker(type, id, which) {
  return "<!-- " + which + " " + type + ":" + id + " -->";
}

function extractStartHeereBlockInner(content, type, id) {
  const begin = startHeereMarker(type, id, "BEGIN");
  const end = startHeereMarker(type, id, "END");

  const beginIdx = content.indexOf(begin);
  if (beginIdx === -1) return null;
  const afterBegin = beginIdx + begin.length;
  const endIdx = content.indexOf(end, afterBegin);
  if (endIdx === -1) return null;
  return content.slice(afterBegin, endIdx);
}

function extractStartHeereBlockInnerAnyType(content, id) {
  for (const type of START_HERE_BLOCK_TYPES) {
    const inner = extractStartHeereBlockInner(content, type, id);
    if (inner != null) return inner;
  }
  return null;
}

function normalizeBlockInner(inner) {
  if (inner == null) return "\n";
  let s = String(inner);
  if (!s.startsWith("\n")) s = "\n" + s;
  if (!s.endsWith("\n")) s = s + "\n";
  return s;
}

function renderStartHeereBlock(type, id, inner) {
  const begin = startHeereMarker(type, id, "BEGIN");
  const end = startHeereMarker(type, id, "END");
  return begin + normalizeBlockInner(inner) + end;
}

function getStartHereTemplateContent(language, stage) {
  const templatePath = path.join(TEMPLATES_DIR, "START-HERE.template.md");
  let template;
  if (fs.existsSync(templatePath)) {
    template = stripUtf8Bom(fs.readFileSync(templatePath, "utf8"));
  } else {
    template = [
      "# START HERE (Intake)",
      "",
      "<!--",
      "LLM:",
      "- This is the single intake surface for progressive information capture.",
      "- Only edit inside the BEGIN/END LLM blocks.",
      "",
      "Rules:",
      "- The user does NOT need to answer every question at once.",
      "- Do not show explicit mapping tables here; capture and organize inputs.",
      "- When a stage starts, roll once: archive prior stage focus + this round into <details>, then clear.",
      "-->",
      "",
      "language: {{language}}",
      "stage: {{stage}}",
      "",
      "## 0. Snapshot (LLM)",
      "<!-- BEGIN LLM:SNAPSHOT -->",
      "### Current focus",
      "- (clear and update as you progress)",
      "",
      "### Key inputs (rolling)",
      "| Key | Value | Status (todo/confirmed/tbd) | Notes |",
      "|---|---|---|---|",
      "|  |  | todo |  |",
      "",
      "### Questions (rolling, simplified)",
      "- [ ] (add questions; the user can answer later)",
      "<!-- END LLM:SNAPSHOT -->",
      "",
      "## 1. Working Agreement (LLM)",
      "<!-- BEGIN LLM:WORKING_AGREEMENT -->",
      "- timeZone:",
      "- asyncFirst: true",
      "- responseSLA:",
      "- decisionPolicy:",
      "  - preStageA: editable",
      "  - stageA: editable (keep required headings for validator)",
      "  - stageB: editable (re-run validate)",
      "  - stageC: editable (re-run apply)",
      "<!-- END LLM:WORKING_AGREEMENT -->",
      "",
      "## 2. Materials Register (LLM, no uploads)",
      "<!-- BEGIN LLM:MATERIALS_REGISTER -->",
      "| ID | Type | Link | Owner | Extracted summary | Written to | Status | Notes |",
      "|---|---|---|---|---|---|---|---|",
      "| M-001 | doc | https:// |  |  |  | todo |  |",
      "<!-- END LLM:MATERIALS_REGISTER -->",
      "",
      "## 3. Notes (LLM)",
      "<!-- BEGIN LLM:PRE_STAGE_A_NOTES -->",
      "### This round (new inputs)",
      "- (append as the user shares info)",
      "",
      "### Archive (folded, append-only)",
      "<details>",
      "<summary>Stage A (archive)</summary>",
      "",
      "- TBD",
      "",
      "</details>",
      "<!-- END LLM:PRE_STAGE_A_NOTES -->",
      "",
      "## 4. Next (Read-only)",
      "- See `init/INIT-BOARD.md`",
      ""
    ].join("\n");
  }

  return template
    .replace(/\{\{\s*language\s*\}\}/g, String(language || ""))
    .replace(/\{\{\s*stage\s*\}\}/g, String(stage || ""));
}

function upsertStartHeereBlock(content, id, inner) {
  const type = START_HERE_BLOCK_TYPE_PRIMARY;
  const begin = startHeereMarker(type, id, "BEGIN");
  const end = startHeereMarker(type, id, "END");

  const text = String(content || "");
  const beginIdx = text.indexOf(begin);
  const rendered = renderStartHeereBlock(type, id, inner);
  if (beginIdx === -1) {
    const nl = text.includes("\r\n") ? "\r\n" : "\n";
    const trimmed = text.trimEnd();
    return trimmed ? trimmed + nl + nl + rendered + nl : rendered + nl;
  }

  const afterBegin = beginIdx + begin.length;
  const endIdx = text.indexOf(end, afterBegin);
  if (endIdx === -1) return text;

  return text.slice(0, beginIdx) + rendered + text.slice(endIdx + end.length);
}

function updateStartHeereDoc({ repoRoot, docsRoot, blueprintPath, intakePath, sourcePath, apply }) {
  const targetPath = intakePath || path.join(repoRoot, START_HERE_DEFAULT_REL);

  const existingPath =
    fs.existsSync(targetPath)
      ? targetPath
      : (sourcePath && fs.existsSync(sourcePath) ? sourcePath : null);
  const existing = existingPath ? fs.readFileSync(existingPath, "utf8") : null;

  const state = loadState(repoRoot);
  const languageValue = getStateLanguage(state);
  if (!languageValue) {
    return { ok: true, op: "write", path: targetPath, mode: "skipped", reason: "language not set" };
  }

  const stage = (state && state.stage) ? String(state.stage) : "A";
  const template = getStartHereTemplateContent(languageValue, stage);

  const blockIds = ["SNAPSHOT", "WORKING_AGREEMENT", "MATERIALS_REGISTER", "PRE_STAGE_A_NOTES"];

  const defaults = {};
  for (const id of blockIds) {
    defaults[id] = extractStartHeereBlockInnerAnyType(template, id) || "\n";
  }

  const blocks = {};
  for (const id of blockIds) {
    const extracted = existing ? extractStartHeereBlockInnerAnyType(existing, id) : null;
    blocks[id] = extracted != null ? extracted : defaults[id];
  }

  let content = template;
  for (const id of blockIds) {
    content = upsertStartHeereBlock(content, id, blocks[id]);
  }

  const targetExisting = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : null;
  const nl = targetExisting && targetExisting.includes("\r\n") ? "\r\n" : "\n";
  const hasBom = !!(targetExisting && targetExisting.charCodeAt(0) === 0xfeff);

  let next = String(content).replace(/\r\n/g, "\n").split("\n").join(nl);
  next = ensureTrailingNewline(next, nl);
  if (hasBom && next.charCodeAt(0) !== 0xfeff) next = "\ufeff" + next;

  const existingNormalized = targetExisting ? ensureTrailingNewline(targetExisting, nl) : null;
  if (existingNormalized && next === existingNormalized) {
    return { ok: true, op: "write", path: targetPath, mode: "skipped", reason: "no change" };
  }

  if (!apply) return { ok: true, op: "write", path: targetPath, mode: "dry-run" };

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, next, "utf8");
  return { ok: true, op: "write", path: targetPath, mode: "applied" };
}
const INIT_BOARD_MACHINE_SNAPSHOT_START = '<!-- INIT-BOARD:MACHINE_SNAPSHOT:START -->';
const INIT_BOARD_MACHINE_SNAPSHOT_END = '<!-- INIT-BOARD:MACHINE_SNAPSHOT:END -->';

function getStateUpdatedAt(state) {
  if (!state || typeof state !== 'object') return null;
  const history = Array.isArray(state.history) ? state.history : [];
  let latest = null;
  for (const item of history) {
    const ts = item && typeof item.timestamp === 'string' ? item.timestamp : null;
    if (!ts) continue;
    if (!latest || ts > latest) latest = ts;
  }
  if (latest) return latest;
  return typeof state.createdAt === 'string' ? state.createdAt : null;
}

function getInitBoardTemplateContent({ language }) {
  const templatePath = path.join(TEMPLATES_DIR, 'INIT-BOARD.template.md');
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8').replace(/\{\{\s*language\s*\}\}/g, language || '');
  }

  // Fallback template (ASCII-only). The board is LLM-owned; the pipeline updates only the machine snapshot block.
  return [
    '# INIT BOARD (LLM-owned)',
    '',
    '<!--',
    'LLM: Maintain this file in the user\'s chosen language and preferred layout.',
    'Pipeline: Updates ONLY the MACHINE_SNAPSHOT block below.',
    'Do not edit inside the MACHINE_SNAPSHOT markers.',
    '-->',
    '',
    `language: ${language || ''}`,
    '',
    '## Current',
    '- (LLM) Summarize current stage, current focus, and what is blocked.',
    '',
    '## Next',
    '- (LLM) List the next 1-3 actions.',
    '',
    INIT_BOARD_MACHINE_SNAPSHOT_START,
    '```json',
    '{',
    '  \"note\": \"machine snapshot will be injected here\"',
    '}',
    '```',
    INIT_BOARD_MACHINE_SNAPSHOT_END,
    ''
  ].join('\n');
}

function ensureFileExistsWithContent(filePath, content, apply) {
  if (fs.existsSync(filePath)) return { ok: true, op: 'skip', path: filePath, mode: 'skipped', reason: 'exists' };
  if (!apply) return { ok: true, op: 'write', path: filePath, mode: 'dry-run' };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return { ok: true, op: 'write', path: filePath, mode: 'applied' };
}

function ensureTrailingNewline(text, nl = '\n') {
  const s = String(text || '');
  if (s.endsWith('\r\n') || s.endsWith('\n')) return s;
  return s + nl;
}

function upsertTextBetweenMarkers(content, startMarker, endMarker, inner) {
  const text = String(content || '');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';

  const normalizedInner = String(inner || '')
    .replace(/\r\n/g, '\n')
    .trimEnd()
    .split('\n')
    .join(nl);

  const startIdx = text.indexOf(startMarker);
  const endIdx = text.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = text.slice(0, startIdx + startMarker.length);
    const after = text.slice(endIdx);
    return `${before}${nl}${normalizedInner}${nl}${after}`;
  }

  // Markers missing: append the block to preserve existing layout.
  const trimmed = text.trimEnd();
  if (!trimmed) {
    return [startMarker, normalizedInner, endMarker, ''].join(nl);
  }
  return [trimmed, '', startMarker, normalizedInner, endMarker, ''].join(nl);
}

function updateInitBoardDoc({ repoRoot, docsRoot, blueprintPath, boardPath, apply }) {
  const targetPath = boardPath || path.join(repoRoot, INIT_BOARD_DEFAULT_REL);

  const statePath = getStatePath(repoRoot);
  const state = loadState(repoRoot);
  const language = getStateLanguage(state);
  if (!language) {
    return { ok: true, op: 'write', path: targetPath, mode: 'skipped', reason: 'language not set' };
  }

  const ensure = ensureFileExistsWithContent(targetPath, getInitBoardTemplateContent({ language }), apply);
  if (!ensure.ok) return ensure;

  const progress = state ? getStageProgress(state) : null;
  const snapshot = {
    statePath: toPosixPath(path.relative(repoRoot, statePath)),
    stateUpdatedAt: getStateUpdatedAt(state),
    language,
    stage: state ? state.stage : null,
    progress,
    paths: {
      docsRoot: toPosixPath(path.relative(repoRoot, docsRoot)),
      blueprintPath: toPosixPath(path.relative(repoRoot, blueprintPath)),
      startHere: toPosixPath(START_HERE_DEFAULT_REL),
      initBoard: toPosixPath(INIT_BOARD_DEFAULT_REL)
    },
    files: {
      docsRootExists: fs.existsSync(docsRoot),
      blueprintExists: fs.existsSync(blueprintPath)
    }
  };

  const snapshotInner = ['```json', JSON.stringify(snapshot, null, 2), '```'].join('\n');

  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  const next = upsertTextBetweenMarkers(existing, INIT_BOARD_MACHINE_SNAPSHOT_START, INIT_BOARD_MACHINE_SNAPSHOT_END, snapshotInner);

  const nl = existing.includes('\r\n') ? '\r\n' : '\n';
  const nextNormalized = ensureTrailingNewline(next, nl);
  const existingNormalized = ensureTrailingNewline(existing, nl);

  if (nextNormalized === existingNormalized) {
    return { ok: true, op: 'write', path: targetPath, mode: 'skipped', reason: 'no change' };
  }
  if (!apply) return { ok: true, op: 'write', path: targetPath, mode: 'dry-run' };

  fs.writeFileSync(targetPath, nextNormalized, 'utf8');
  return { ok: true, op: 'write', path: targetPath, mode: 'applied' };
}

function tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, options = {}) {
  try {
    const apply = options.apply == null ? true : !!options.apply;
    const silent = !!options.silent;

    const state = loadState(repoRoot);
    const language = getStateLanguage(state);
    if (!language) return;

    // Keep the intake doc in a consistent shape (preserve LLM blocks).
    const startHerePath = path.join(repoRoot, START_HERE_DEFAULT_REL);
    updateStartHeereDoc({ repoRoot, docsRoot, blueprintPath, intakePath: startHerePath, sourcePath: null, apply });

    const res = updateInitBoardDoc({
      repoRoot,
      docsRoot,
      blueprintPath,
      boardPath: path.join(repoRoot, INIT_BOARD_DEFAULT_REL),
      apply
    });
    if (!silent && res && res.mode === 'applied') {
      console.log(`[auto] INIT-BOARD updated: ${path.relative(repoRoot, res.path || '')}`);
    }
  } catch (e) {
    console.warn(`[warn] Failed to auto-update INIT-BOARD: ${e.message}`);
  }
}

// ============================================================================
// Config File Generation
// ============================================================================

function getConfigTemplateDir(language, packageManager) {
  // Map language + packageManager to template directory
  const mappings = {
    'typescript-pnpm': 'typescript-pnpm',
    'typescript-npm': 'typescript-pnpm',  // fallback
    'typescript-yarn': 'typescript-pnpm', // fallback
    'javascript-pnpm': 'typescript-pnpm', // fallback
    'javascript-npm': 'typescript-pnpm',  // fallback
    'go-go': 'go',
    'go': 'go',
    'cpp-xmake': 'cpp-xmake',
    'c-xmake': 'cpp-xmake',
    'cpp': 'cpp-xmake',
    'c': 'cpp-xmake',
    'react-native': 'react-native-typescript'
  };

  const key = `${language}-${packageManager}`.toLowerCase();
  let templateName = mappings[key] || mappings[language.toLowerCase()] || null;

  if (!templateName) return null;

  const dir = path.join(TEMPLATES_DIR, 'scaffold-configs', templateName);
  return fs.existsSync(dir) ? dir : null;
}

function renderTemplate(content, variables) {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key.replace(/\./g, '\\.')}\\}\\}`, 'g');
    result = result.replace(pattern, value != null ? String(value) : '');
  }
  return result;
}

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function generateConfigFiles(repoRoot, blueprint, apply) {
  const results = [];
  const repo = blueprint.repo || {};
  const language = (repo.language || 'typescript').toLowerCase();
  const packageManager = (repo.packageManager || 'pnpm').toLowerCase();
  const layout = repo.layout || 'single';

  const templateDir = getConfigTemplateDir(language, packageManager);
  if (!templateDir) {
    results.push({ file: '(none)', action: 'skip', reason: `no templates for ${language}-${packageManager}` });
    return results;
  }

  const variables = flattenObject(blueprint);
  
  let templateFiles;
  try {
    templateFiles = fs.readdirSync(templateDir).filter(f => f.endsWith('.template'));
  } catch (e) {
    results.push({ file: templateDir, action: 'error', reason: e.message });
    return results;
  }

  for (const templateFile of templateFiles) {
    const targetName = templateFile.replace('.template', '');
    const templatePath = path.join(templateDir, templateFile);
    const targetPath = path.join(repoRoot, targetName);

    // Skip workspace file for single layout
    if ((targetName === 'pnpm-workspace.yaml' || targetName === 'pnpm-workspace.yml') && layout !== 'monorepo') {
      results.push({ file: targetName, action: 'skip', reason: 'not monorepo' });
      continue;
    }

    // Skip if file exists
    if (fs.existsSync(targetPath)) {
      results.push({ file: targetName, action: 'skip', reason: 'exists' });
      continue;
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const rendered = renderTemplate(templateContent, variables);

    if (apply) {
      fs.writeFileSync(targetPath, rendered, 'utf8');
      results.push({ file: targetName, action: 'write', mode: 'applied' });
    } else {
      results.push({ file: targetName, action: 'write', mode: 'dry-run' });
    }
  }

  return results;
}

function packPrefixMap() {
  return {
    workflows: 'workflows/',
    standards: 'standards/',
    testing: 'testing/',
    backend: 'backend/',
    frontend: 'frontend/'
  };
}

function packOrder() {
  return ['workflows', 'standards', 'testing', 'backend', 'frontend'];
}

function normalizePackList(packs) {
  const cleaned = (packs || [])
    .filter((p) => typeof p === 'string')
    .map((p) => p.trim())
    .filter(Boolean);

  const order = packOrder();
  const ordered = [];
  for (const p of order) {
    if (cleaned.includes(p)) ordered.push(p);
  }
  for (const p of cleaned) {
    if (!ordered.includes(p)) ordered.push(p);
  }
  return uniq(ordered);
}

function validateBlueprint(blueprint) {
  const errors = [];
  const warnings = [];

  if (!blueprint || typeof blueprint !== 'object') {
    errors.push('Blueprint must be a JSON object.');
    return { ok: false, errors, warnings };
  }

  if (!Number.isInteger(blueprint.version) || blueprint.version < 1) {
    errors.push('Blueprint.version must be an integer >= 1.');
  }

  const project = blueprint.project || {};
  if (!project.name || typeof project.name !== 'string') errors.push('project.name is required (string).');
  if (!project.description || typeof project.description !== 'string') errors.push('project.description is required (string).');

  const repo = blueprint.repo || {};
  const validLayouts = ['single', 'monorepo'];
  if (!repo.layout || !validLayouts.includes(repo.layout)) {
    errors.push(`repo.layout is required and must be one of: ${validLayouts.join(', ')}`);
  }
  if (!repo.language || typeof repo.language !== 'string') {
    errors.push('repo.language is required (string).');
  }

  // Capabilities sanity checks (warn-only unless obviously inconsistent)
  const caps = blueprint.capabilities || {};
  if (caps.database && caps.database.enabled) {
    if (!caps.database.kind || typeof caps.database.kind !== 'string') warnings.push('capabilities.database.enabled=true but capabilities.database.kind is missing.');
  }
  if (caps.api && caps.api.style && typeof caps.api.style !== 'string') warnings.push('capabilities.api.style should be a string.');
  if (caps.bpmn && typeof caps.bpmn.enabled !== 'boolean') warnings.push('capabilities.bpmn.enabled should be boolean when present.');

  const skills = blueprint.skills || {};
  if (skills.packs && !Array.isArray(skills.packs)) errors.push('skills.packs must be an array of strings when present.');

  const packs = normalizePackList(skills.packs || []);
  const known = packPrefixMap();
  for (const p of packs) {
    if (!known[p]) warnings.push(`skills.packs includes unknown pack "${p}". It will be ignored by manifest update unless a prefix mapping exists.`);
  }
  if (!packs.includes('workflows')) warnings.push('skills.packs does not include "workflows". This is usually required.');
  if (!packs.includes('standards')) warnings.push('skills.packs does not include "standards". This is usually recommended.');

  const ok = errors.length === 0;
  return { ok, errors, warnings, packs };
}

function recommendedPacksFromBlueprint(blueprint) {
  const rec = new Set(['workflows', 'standards']);
  const caps = blueprint.capabilities || {};
  const quality = blueprint.quality || {};

  if (caps.backend && caps.backend.enabled) rec.add('backend');
  if (caps.frontend && caps.frontend.enabled) rec.add('frontend');
  if (quality.testing && quality.testing.enabled) rec.add('testing');

  // Optional packs can be added explicitly via blueprint.skills.packs.

  const ordered = [];
  for (const p of packOrder()) {
    if (rec.has(p)) ordered.push(p);
  }
  return ordered;
}

function checkPackInstall(repoRoot, pack) {
  const prefix = packPrefixMap()[pack];
  if (!prefix) return { pack, installed: false, reason: 'unknown-pack' };

  const dir = path.join(repoRoot, '.ai', 'skills', prefix.replace(/\/$/, ''));
  if (!fs.existsSync(dir)) return { pack, installed: false, reason: `missing ${path.relative(repoRoot, dir)}` };
  return { pack, installed: true };
}

function printResult(result, format) {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  // text
  if (result.summary) console.log(result.summary);
  if (result.errors && result.errors.length > 0) {
    console.log('\nErrors:');
    for (const e of result.errors) console.log(`- ${e}`);
  }
  if (result.warnings && result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of result.warnings) console.log(`- ${w}`);
  }
}

const HTML_TAG_NAMES = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'kbd',
  'li',
  'ol',
  'p',
  'pre',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul'
]);

function isMarkdownAutolinkAngle(inner) {
  const v = inner.trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true;
  if (lower.startsWith('mailto:')) return true;
  if (lower.startsWith('tel:')) return true;
  // CommonMark also supports <email@domain> autolinks.
  if (!/\s/.test(v) && v.includes('@')) return true;
  return false;
}

function isHtmlTagAngle(inner) {
  let v = inner.trim();
  if (!v) return false;
  if (v.startsWith('!--')) return true; // <!-- ... -->
  if (v.startsWith('?xml')) return true;
  if (v.startsWith('!doctype')) return true;

  // Normalize forms like </tag>, <tag/>, <tag ...>, <tag .../>
  if (v.startsWith('/')) v = v.slice(1).trim();
  if (v.endsWith('/')) v = v.slice(0, -1).trim();

  const m = v.match(/^([a-zA-Z][a-zA-Z0-9-]*)\b/);
  if (!m) return false;
  const tag = m[1].toLowerCase();
  return HTML_TAG_NAMES.has(tag);
}

function findAngleBracketTemplatePlaceholders(content) {
  const hits = [];
  const re = /<([^>\n]{1,80})>/g;
  for (const match of content.matchAll(re)) {
    const inner = match[1] ?? '';
    if (isMarkdownAutolinkAngle(inner)) continue;
    if (isHtmlTagAngle(inner)) continue;
    hits.push(match[0]);
  }
  return hits;
}

function checkDocs(docsRoot) {
  const errors = [];
  const warnings = [];

  const required = [
    { name: 'requirements.md', mustContain: ['# Requirements', '## Conclusions', '## Goals', '## Non-goals'] },
    { name: 'non-functional-requirements.md', mustContain: ['# Non-functional Requirements', '## Conclusions'] },
    { name: 'domain-glossary.md', mustContain: ['# Domain Glossary', '## Terms'] },
    { name: 'risk-open-questions.md', mustContain: ['# Risks and Open Questions', '## Open questions'] }
  ];

  const placeholderPatterns = [
    { re: /^\s*[-*]\s*\.\.\.\s*$/gm, msg: 'placeholder bullet "- ..."' },
    { re: /:\s*\.\.\.\s*$/gm, msg: 'placeholder value ": ..."' }
  ];

  for (const spec of required) {
    const fp = path.join(docsRoot, spec.name);
    if (!fs.existsSync(fp)) {
      errors.push(`Missing required Stage A doc: ${path.relative(process.cwd(), fp)}`);
      continue;
    }
    const content = fs.readFileSync(fp, 'utf8');

    for (const needle of spec.mustContain) {
      if (!content.includes(needle)) {
        errors.push(`${spec.name} is missing required section/heading: "${needle}"`);
      }
    }

    const anglePlaceholders = findAngleBracketTemplatePlaceholders(content);
    if (anglePlaceholders.length > 0) {
      errors.push(`${spec.name} still contains template placeholder "<...>". Replace all template placeholders.`);
    }

    for (const pat of placeholderPatterns) {
      const hits = content.match(pat.re);
      if (hits && hits.length > 0) {
        errors.push(`${spec.name} still contains ${pat.msg}. Replace all template placeholders.`);
      }
    }

    // Soft signals
    if (content.includes('TODO') || content.includes('FIXME')) {
      warnings.push(`${spec.name} contains TODO/FIXME markers. Ensure they are tracked in risk-open-questions.md or removed.`);
    }
    if (/\bTBD\b/i.test(content)) {
      warnings.push(`${spec.name} contains TBD items. Ensure each TBD is linked to an owner/options/decision due.`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function ensureDir(dirPath, apply) {
  if (fs.existsSync(dirPath)) return { op: 'skip', path: dirPath, reason: 'exists' };
  if (!apply) return { op: 'mkdir', path: dirPath, mode: 'dry-run' };
  fs.mkdirSync(dirPath, { recursive: true });
  return { op: 'mkdir', path: dirPath, mode: 'applied' };
}

function writeFileIfMissing(filePath, content, apply) {
  if (fs.existsSync(filePath)) return { op: 'skip', path: filePath, reason: 'exists' };
  if (!apply) return { op: 'write', path: filePath, mode: 'dry-run' };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return { op: 'write', path: filePath, mode: 'applied' };
}

/**
 * Generates a project-specific README.md from the blueprint.
 * Replaces the template README with project information.
 */
function generateProjectReadme(repoRoot, blueprint, apply) {
  const readmePath = path.join(repoRoot, 'README.md');
  const templatePath = path.join(TEMPLATES_DIR, 'README.template.md');
  
  if (!fs.existsSync(templatePath)) {
    return { op: 'skip', path: readmePath, reason: 'template not found' };
  }
  
  let template = fs.readFileSync(templatePath, 'utf8');
  
  const project = blueprint.project || {};
  const repo = blueprint.repo || {};
  const caps = blueprint.capabilities || {};
  
  // Simple mustache-like replacement
  function replace(key, value) {
    template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  
  function conditionalBlock(key, value, show) {
    const regex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
    if (show && value) {
      template = template.replace(regex, (_, content) => content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value));
    } else {
      template = template.replace(regex, '');
    }
  }
  
  // Basic replacements
  replace('PROJECT_NAME', project.name || 'my-project');
  replace('PROJECT_DESCRIPTION', project.description || 'Project description');
  replace('LANGUAGE', repo.language || 'typescript');
  replace('PACKAGE_MANAGER', repo.packageManager || 'pnpm');
  replace('REPO_LAYOUT', repo.layout || 'single');
  
  // Conditional blocks
  conditionalBlock('DOMAIN', project.domain, !!project.domain);
  conditionalBlock('FRONTEND_FRAMEWORK', caps.frontend?.framework, caps.frontend?.enabled);
  conditionalBlock('BACKEND_FRAMEWORK', caps.backend?.framework, caps.backend?.enabled);
  conditionalBlock('DATABASE_KIND', caps.database?.kind, caps.database?.enabled);
  conditionalBlock('API_STYLE', caps.api?.style, !!caps.api?.style && caps.api.style !== 'none');
  
  // Language-specific blocks
  const isNode = ['typescript', 'javascript'].includes(repo.language);
  const isPython = repo.language === 'python';
  const isGo = repo.language === 'go';
  
  conditionalBlock('IS_NODE', 'true', isNode);
  conditionalBlock('IS_PYTHON', 'true', isPython);
  conditionalBlock('IS_GO', 'true', isGo);

  const hasInitKit = fs.existsSync(path.join(repoRoot, INIT_KIT_MARKER_DEFAULT_REL));
  conditionalBlock('HAS_INIT_KIT', 'true', hasInitKit);
  
  // Install and dev commands based on package manager
  const installCommands = {
    pnpm: 'pnpm install',
    npm: 'npm install',
    yarn: 'yarn',
    pip: 'pip install -r requirements.txt',
    poetry: 'poetry install',
    go: 'go mod download'
  };
  
  const devCommands = {
    pnpm: 'pnpm dev',
    npm: 'npm run dev',
    yarn: 'yarn dev',
    pip: 'python main.py',
    poetry: 'poetry run python main.py',
    go: 'go run .'
  };
  
  const testCommands = {
    pnpm: 'pnpm test',
    npm: 'npm test',
    yarn: 'yarn test',
    pip: 'pytest',
    poetry: 'poetry run pytest',
    go: 'go test ./...'
  };
  
  const pm = repo.packageManager || 'pnpm';
  replace('INSTALL_COMMAND', installCommands[pm] || installCommands.pnpm);
  replace('DEV_COMMAND', devCommands[pm] || devCommands.pnpm);
  replace('TEST_COMMAND', testCommands[pm] || testCommands.pnpm);
  
  // Project structure based on layout
  let structure;
  if (repo.layout === 'monorepo') {
    structure = `apps/
  frontend/        # Frontend application (if enabled)
  backend/         # Backend services (if enabled)
packages/
  shared/          # Shared libraries
.ai/               # Skills, scripts, LLM governance
dev-docs/          # Development task docs (complex work)
docs/              # Documentation (archive init docs here if desired)
init/              # Bootstrap-only init kit (optional to remove)`;
  } else {
    structure = `src/
  frontend/        # Frontend code (if enabled)
  backend/         # Backend code (if enabled)
.ai/               # Skills, scripts, LLM governance
dev-docs/          # Development task docs (complex work)
docs/              # Documentation (archive init docs here if desired)
init/              # Bootstrap-only init kit (optional to remove)`;
  }
  replace('PROJECT_STRUCTURE', structure);
  
  // Clean up any remaining empty conditional blocks
  template = template.replace(/\{\{#\w+\}\}[\s\S]*?\{\{\/\w+\}\}/g, '');
  template = template.replace(/\{\{\w+\}\}/g, '');
  
  // Clean up multiple empty lines
  template = template.replace(/\n{3,}/g, '\n\n');
  
  if (!apply) {
    return { op: 'write', path: readmePath, mode: 'dry-run' };
  }
  
  fs.writeFileSync(readmePath, template, 'utf8');
  return { op: 'write', path: readmePath, mode: 'applied' };
}

function generateProjectAgents(repoRoot, blueprint, apply) {
  const agentsPath = path.join(repoRoot, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    return { op: 'skip', path: agentsPath, reason: 'AGENTS.md not found' };
  }

  const project = blueprint.project || {};
  const repo = blueprint.repo || {};
  const caps = blueprint.capabilities || {};

  const projectLine = `**${project.name || 'my-project'}** - ${project.description || 'Project description'}`;
  let content = fs.readFileSync(agentsPath, 'utf8');

  // Update the short descriptor line (template repos usually have this).
  if (content.includes('**AI-Friendly Repository Template**')) {
    content = content.replace(/^\*\*AI-Friendly Repository Template\*\*.*$/m, projectLine);
  }

  // Project Type section
  const projectTypeBody = [
    `${project.name || 'my-project'} - ${project.description || 'Project description'}`,
    project.domain ? `Domain: ${project.domain}` : null
  ].filter(Boolean).join('\n');

  const projectTypeRe = /^## Project Type\s*\n[\s\S]*?(?=^##\s|\Z)/m;
  if (projectTypeRe.test(content)) {
    content = content.replace(projectTypeRe, `## Project Type\n\n${projectTypeBody}\n\n`);
  }

  // Tech Stack section (insert after Project Type if missing)
  const techStackLines = [
    '## Tech Stack',
    '',
    '| Category | Value |',
    '|----------|-------|',
    `| Language | ${repo.language || 'TBD'} |`,
    `| Package Manager | ${repo.packageManager || 'TBD'} |`,
    `| Layout | ${repo.layout || 'TBD'} |`,
    caps.frontend && caps.frontend.enabled ? `| Frontend | ${caps.frontend.framework || 'TBD'} |` : null,
    caps.backend && caps.backend.enabled ? `| Backend | ${caps.backend.framework || 'TBD'} |` : null,
    caps.database && caps.database.enabled ? `| Database | ${caps.database.kind || 'TBD'} |` : null,
    caps.api && caps.api.style && caps.api.style !== 'none'
      ? `| API | ${caps.api.style}${caps.api.auth ? ` (${caps.api.auth})` : ''} |`
      : null,
    ''
  ].filter(Boolean);
  const techStackSection = techStackLines.join('\n') + '\n';

  const techStackRe = /^## Tech Stack\s*\n[\s\S]*?(?=^##\s|\Z)/m;
  if (techStackRe.test(content)) {
    content = content.replace(techStackRe, techStackSection);
  } else if (projectTypeRe.test(content)) {
    content = content.replace(projectTypeRe, (match) => match.trimEnd() + '\n\n' + techStackSection + '\n');
  }

  // Key Directories table: upsert common project paths
  const keyDirsRe = /^## Key Directories\s*\n[\s\S]*?(?=^##\s|\Z)/m;
  const keyDirsMatch = content.match(keyDirsRe);
  if (keyDirsMatch) {
    const section = keyDirsMatch[0];
    const lines = section.split(/\r?\n/);

    const headerIdx = lines.findIndex((l) => l.trim() === '| Directory | Purpose |');
    const sepIdx = headerIdx >= 0 ? headerIdx + 1 : -1;

    if (headerIdx >= 0 && sepIdx < lines.length) {
      let rowEnd = sepIdx + 1;
      while (rowEnd < lines.length && lines[rowEnd].trim().startsWith('|')) rowEnd++;

      const rows = lines.slice(sepIdx + 1, rowEnd);
      const parsed = rows.map((line) => {
        const m = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/);
        if (!m) return null;
        return { dir: m[1].trim(), purpose: m[2].trim() };
      }).filter(Boolean);

      const desired = [];
      const hasInit = fs.existsSync(path.join(repoRoot, 'init'));
      if (hasInit) desired.push({ dir: '`init/`', purpose: 'Bootstrap init kit (remove after init if desired)' });

      if ((repo.layout || '').toLowerCase() === 'monorepo') {
        desired.push({ dir: '`apps/`', purpose: 'Application entry points (monorepo)' });
        if (caps.frontend && caps.frontend.enabled) desired.push({ dir: '`apps/frontend/`', purpose: 'Frontend application' });
        if (caps.backend && caps.backend.enabled) desired.push({ dir: '`apps/backend/`', purpose: 'Backend service(s)' });
        desired.push({ dir: '`packages/`', purpose: 'Shared packages/libraries' });
      } else {
        desired.push({ dir: '`src/`', purpose: 'Application code' });
        if (caps.frontend && caps.frontend.enabled) desired.push({ dir: '`src/frontend/`', purpose: 'Frontend code' });
        if (caps.backend && caps.backend.enabled) desired.push({ dir: '`src/backend/`', purpose: 'Backend code' });
      }

      desired.push({ dir: '`docs/project/overview/`', purpose: 'Project overview + archived init SSOT (optional; created by cleanup-init --archive)' });

      const desiredByDir = new Map(desired.map((d) => [d.dir, d]));
      const seen = new Set();

      const updatedRows = parsed.map((r) => {
        const d = desiredByDir.get(r.dir);
        if (!d) return r;
        seen.add(r.dir);
        return { dir: r.dir, purpose: d.purpose };
      });

      for (const d of desired) {
        if (!seen.has(d.dir)) updatedRows.push({ dir: d.dir, purpose: d.purpose });
      }

      const rebuiltRows = updatedRows.map((r) => `| ${r.dir} | ${r.purpose} |`);
      const newSectionLines = [
        ...lines.slice(0, sepIdx + 1),
        ...rebuiltRows,
        ...lines.slice(rowEnd)
      ];

      const newSection = newSectionLines.join('\n');
      content = content.replace(section, newSection);
    }
  }

  // Normalize spacing (avoid runaway blank lines)
  content = content.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

  if (!apply) return { op: 'write', path: agentsPath, mode: 'dry-run' };

  fs.writeFileSync(agentsPath, content, 'utf8');
  return { op: 'write', path: agentsPath, mode: 'applied' };
}

function ensureInitTemplates(docsRoot, blueprintPath, apply) {
  const results = [];
  results.push(ensureDir(docsRoot, apply));

  const docTemplates = [
    { template: 'requirements.template.md', target: 'requirements.md' },
    { template: 'non-functional-requirements.template.md', target: 'non-functional-requirements.md' },
    { template: 'domain-glossary.template.md', target: 'domain-glossary.md' },
    { template: 'risk-open-questions.template.md', target: 'risk-open-questions.md' }
  ];

  for (const { template, target } of docTemplates) {
    const templatePath = path.join(TEMPLATES_DIR, template);
    if (!fs.existsSync(templatePath)) {
      results.push({ op: 'skip', path: templatePath, reason: 'missing template' });
      continue;
    }
    const content = fs.readFileSync(templatePath, 'utf8');
    results.push(writeFileIfMissing(path.join(docsRoot, target), content, apply));
  }

  const blueprintTemplatePath = path.join(TEMPLATES_DIR, 'project-blueprint.example.json');
  if (fs.existsSync(blueprintTemplatePath)) {
    const blueprintContent = fs.readFileSync(blueprintTemplatePath, 'utf8');
    results.push(writeFileIfMissing(blueprintPath, blueprintContent, apply));
  } else {
    results.push({ op: 'skip', path: blueprintTemplatePath, reason: 'missing template' });
  }

  return results;
}

function planScaffold(repoRoot, blueprint, apply) {
  const results = [];
  const repo = blueprint.repo || {};
  const caps = blueprint.capabilities || {};
  const layout = repo.layout;

  if (layout === 'monorepo') {
    results.push(ensureDir(path.join(repoRoot, 'apps'), apply));
    results.push(ensureDir(path.join(repoRoot, 'packages'), apply));
    results.push(writeFileIfMissing(
      path.join(repoRoot, 'apps', 'README.md'),
      '# Apps\n\nApp entry points for this monorepo.\n',
      apply
    ));
    results.push(writeFileIfMissing(
      path.join(repoRoot, 'packages', 'README.md'),
      '# Packages\n\nShared packages/libraries for this monorepo.\n',
      apply
    ));

    if (caps.frontend && caps.frontend.enabled) {
      results.push(ensureDir(path.join(repoRoot, 'apps', 'frontend'), apply));
      results.push(writeFileIfMissing(
        path.join(repoRoot, 'apps', 'frontend', 'README.md'),
        '# Frontend app\n\nThis folder is a scaffold placeholder. Populate it based on your selected frontend stack.\n',
        apply
      ));
    }

    if (caps.backend && caps.backend.enabled) {
      results.push(ensureDir(path.join(repoRoot, 'apps', 'backend'), apply));
      results.push(writeFileIfMissing(
        path.join(repoRoot, 'apps', 'backend', 'README.md'),
        '# Backend app\n\nThis folder is a scaffold placeholder. Populate it based on your selected backend stack.\n',
        apply
      ));
    }

    // Shared packages reduce clutter when there is only a single app.
    const needsSharedPackage = !!(caps.frontend && caps.frontend.enabled) && !!(caps.backend && caps.backend.enabled);
    if (needsSharedPackage) {
      results.push(ensureDir(path.join(repoRoot, 'packages', 'shared'), apply));
      results.push(writeFileIfMissing(
        path.join(repoRoot, 'packages', 'shared', 'README.md'),
        '# Shared package\n\nThis folder is a scaffold placeholder for shared types/utilities.\n',
        apply
      ));
    }
  } else {
    results.push(ensureDir(path.join(repoRoot, 'src'), apply));
    results.push(writeFileIfMissing(
      path.join(repoRoot, 'src', 'README.md'),
      '# src\n\nApplication source code.\n',
      apply
    ));

    if (caps.frontend && caps.frontend.enabled) {
      results.push(ensureDir(path.join(repoRoot, 'src', 'frontend'), apply));
      results.push(writeFileIfMissing(
        path.join(repoRoot, 'src', 'frontend', 'README.md'),
        '# Frontend\n\nThis folder is a scaffold placeholder. Populate it based on your selected frontend stack.\n',
        apply
      ));
    }

    if (caps.backend && caps.backend.enabled) {
      results.push(ensureDir(path.join(repoRoot, 'src', 'backend'), apply));
      results.push(writeFileIfMissing(
        path.join(repoRoot, 'src', 'backend', 'README.md'),
        '# Backend\n\nThis folder is a scaffold placeholder. Populate it based on your selected backend stack.\n',
        apply
      ));
    }
  }

  return results;
}

function updateManifest(repoRoot, blueprint, apply) {
  const manifestPath = path.join(repoRoot, '.ai', 'skills', '_meta', 'sync-manifest.json');
  const prefixMap = packPrefixMap();

  let prevCanonical = null;
  let manifest;
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(stripUtf8Bom(raw));
      prevCanonical = JSON.stringify(manifest, null, 2) + '\n';
    } catch (e) {
      die(`[error] Failed to read sync manifest JSON: ${toPosixPath(path.relative(repoRoot, manifestPath))}\n${e.message}`);
    }
  } else {
    manifest = { version: 1, includePrefixes: [], includeSkills: [], excludePrefixes: [], excludeSkills: [] };
  }

  // Normalize to the sync-skills.mjs manifest schema (top-level arrays).
  // If older schemas exist, we migrate best-effort to keep sync deterministic.
  const legacyCurrent = manifest && manifest.collections && manifest.collections.current ? manifest.collections.current : null;
  if (!Array.isArray(manifest.includePrefixes) && legacyCurrent && Array.isArray(legacyCurrent.includePrefixes)) {
    manifest.includePrefixes = legacyCurrent.includePrefixes;
  }
  if (!Array.isArray(manifest.excludePrefixes) && legacyCurrent && Array.isArray(legacyCurrent.excludePrefixes)) {
    manifest.excludePrefixes = legacyCurrent.excludePrefixes;
  }
  if (!Array.isArray(manifest.excludeSkills) && legacyCurrent && Array.isArray(legacyCurrent.excludeSkillNames)) {
    manifest.excludeSkills = legacyCurrent.excludeSkillNames;
  }
  if (!Array.isArray(manifest.includePrefixes)) manifest.includePrefixes = [];
  if (!Array.isArray(manifest.includeSkills)) manifest.includeSkills = [];
  if (!Array.isArray(manifest.excludePrefixes)) manifest.excludePrefixes = [];
  if (!Array.isArray(manifest.excludeSkills)) manifest.excludeSkills = [];

  const packs = normalizePackList((blueprint.skills && blueprint.skills.packs) || []);
  const includePrefixes = [];
  const warnings = [];

  for (const p of packs) {
    const pref = prefixMap[p];
    if (!pref) {
      warnings.push(`Unknown pack "${p}" (no prefix mapping). Ignoring for manifest.includePrefixes.`);
      continue;
    }
    includePrefixes.push(pref);
  }

  manifest.includePrefixes = uniq(includePrefixes);

  // Optional excludes
  const skills = blueprint.skills || {};
  const includeSkills = Array.isArray(skills.includeSkillNames)
    ? skills.includeSkillNames
    : (Array.isArray(skills.includeSkills) ? skills.includeSkills : null);
  if (includeSkills) manifest.includeSkills = uniq(includeSkills);
  if (Array.isArray(skills.excludePrefixes)) manifest.excludePrefixes = uniq(skills.excludePrefixes);
  const excludeSkills = Array.isArray(skills.excludeSkillNames)
    ? skills.excludeSkillNames
    : (Array.isArray(skills.excludeSkills) ? skills.excludeSkills : null);
  if (excludeSkills) manifest.excludeSkills = uniq(excludeSkills);

  if (!apply) return { op: 'write', path: manifestPath, mode: 'dry-run', warnings, includePrefixes: manifest.includePrefixes };

  const nextCanonical = JSON.stringify(manifest, null, 2) + '\n';
  if (prevCanonical != null && nextCanonical === prevCanonical) {
    return { op: 'write', path: manifestPath, mode: 'skipped', reason: 'no change', warnings, includePrefixes: manifest.includePrefixes };
  }

  writeJson(manifestPath, manifest);
  return { op: 'write', path: manifestPath, mode: 'applied', warnings, includePrefixes: manifest.includePrefixes };
}

function tailText(text, maxChars = 4000) {
  const s = String(text || '');
  if (s.length <= maxChars) return s;
  return `...(truncated ${s.length - maxChars} chars)\n` + s.slice(-maxChars);
}

function syncWrappers(repoRoot, providers, apply, options = {}) {
  const scriptPath = path.join(repoRoot, '.ai', 'scripts', 'sync-skills.mjs');
  if (!fs.existsSync(scriptPath)) {
    return { op: 'skip', path: scriptPath, reason: 'sync-skills.mjs not found' };
  }
  const providersArg = providers || 'both';
  const cmd = 'node';
  const args = [scriptPath, '--scope', 'current', '--providers', providersArg, '--mode', 'reset', '--yes'];

  if (!apply) return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'dry-run' };

  const stdio = options.stdio === 'pipe' ? 'pipe' : 'inherit';
  const res = childProcess.spawnSync(cmd, args, { stdio, cwd: repoRoot, encoding: stdio === 'pipe' ? 'utf8' : undefined });
  if (res.status !== 0) {
    return {
      op: 'run',
      cmd: `${cmd} ${args.join(' ')}`,
      mode: 'failed',
      exitCode: res.status,
      stdout: stdio === 'pipe' ? tailText(res.stdout) : undefined,
      stderr: stdio === 'pipe' ? tailText(res.stderr) : undefined
    };
  }
  return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'applied' };
}

function pruneAgentBuilder(repoRoot, apply) {
  const agentDir = path.join(repoRoot, '.ai', 'skills', 'workflows', 'agent');
  if (!fs.existsSync(agentDir)) return { op: 'skip', path: agentDir, reason: 'agent workflow not present' };
  if (!apply) return { op: 'rm', path: agentDir, mode: 'dry-run' };
  try {
    fs.rmSync(agentDir, { recursive: true, force: true });
    return { op: 'rm', path: agentDir, mode: 'applied' };
  } catch (e) {
    return { op: 'rm', path: agentDir, mode: 'failed', error: e.message };
  }
}

function copyFile(src, dest, apply) {
  if (!fs.existsSync(src)) return { op: 'copy', src, dest, mode: 'skip', reason: 'missing source' };
  if (!apply) return { op: 'copy', src, dest, mode: 'dry-run' };
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return { op: 'copy', src, dest, mode: 'applied' };
  } catch (e) {
    return { op: 'copy', src, dest, mode: 'failed', error: e.message };
  }
}

function archiveInitArtifacts(repoRoot, docsRoot, blueprintPath, options, apply) {
  const targetRoot = resolvePath(repoRoot, (options && options.archiveDir) || path.join('docs', 'project', 'overview'));
  const actions = [];
  const errors = [];

  if (options.archiveDocs) {
    const docNames = [
      'requirements.md',
      'non-functional-requirements.md',
      'domain-glossary.md',
      'risk-open-questions.md'
    ];
    for (const name of docNames) {
      const src = path.join(docsRoot, name);
      const dest = path.join(targetRoot, name);
      const res = copyFile(src, dest, apply);
      actions.push(res);
      if (res.mode === 'skip') errors.push(`Missing Stage A doc: ${path.relative(repoRoot, src)}`);
      if (res.mode === 'failed') errors.push(`Failed to archive doc: ${path.relative(repoRoot, src)} (${res.error})`);
    }
  }

  if (options.archiveBlueprint) {
    const dest = path.join(targetRoot, 'project-blueprint.json');
    const res = copyFile(blueprintPath, dest, apply);
    actions.push(res);
    if (res.mode === 'skip') errors.push(`Missing blueprint: ${path.relative(repoRoot, blueprintPath)}`);
    if (res.mode === 'failed') errors.push(`Failed to archive blueprint: ${path.relative(repoRoot, blueprintPath)} (${res.error})`);
  }

  return {
    op: 'archive',
    mode: apply ? 'applied' : 'dry-run',
    targetRoot,
    actions,
    errors
  };
}

function cleanupInit(repoRoot, apply) {
  const initDir = path.join(repoRoot, 'init');
  const markerDefault = path.join(repoRoot, INIT_KIT_MARKER_DEFAULT_REL);

  if (!fs.existsSync(initDir)) return { op: 'skip', path: initDir, reason: 'init/ not present' };
  if (!fs.existsSync(markerDefault)) return { op: 'refuse', path: initDir, reason: 'missing init/_tools/.init-kit marker' };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const trashDir = path.join(repoRoot, `.init-trash-${ts}`);

  if (!apply) {
    return { op: 'rm', path: initDir, mode: 'dry-run', note: `will move to ${path.basename(trashDir)} then delete` };
  }

  // Move first (reduces risk if delete fails on Windows due to open file handles)
  fs.renameSync(initDir, trashDir);

  try {
    fs.rmSync(trashDir, { recursive: true, force: true });
    return { op: 'rm', path: initDir, mode: 'applied' };
  } catch (e) {
    return {
      op: 'rm',
      path: initDir,
      mode: 'partial',
      note: `renamed to ${path.basename(trashDir)} but could not delete automatically: ${e.message}`
    };
  }
}

function main() {
  const { command, opts } = parseArgs(process.argv);
  const format = (opts['format'] || 'text').toLowerCase();

  const repoRoot = path.resolve(opts['repo-root'] || process.cwd());
  const docsRoot = resolveDocsRoot(repoRoot, opts['docs-root']);
  const blueprintPath = resolveBlueprintPath(repoRoot, opts['blueprint']);
  const statePath = getStatePath(repoRoot);

  // ========== start ==========
  if (command === 'start') {
    const templateResults = ensureInitTemplates(docsRoot, blueprintPath, true);
    const created = templateResults.filter((r) => r.mode === 'applied');
    if (created.length > 0) {
      console.log('[ok] Init templates created:');
      for (const r of created) {
        console.log(`  - ${path.relative(repoRoot, r.path || r.dst || '')}`);
      }
    } else {
      console.log('[info] Init templates already exist');
    }

    const existingState = loadState(repoRoot);
    if (existingState) {
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
      console.log('[info] Existing init state detected');
      printStatus(existingState, repoRoot, { docsRoot, blueprintPath });
      console.log(`[info] To restart, delete ${toPosixPath(path.relative(repoRoot, statePath))} first`);
      process.exit(0);
    }

    const state = createInitialState();
    addHistoryEvent(state, 'init_started', 'Initialization started');
    saveState(repoRoot, state);

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
    console.log(`[ok] Init state created: ${toPosixPath(path.relative(repoRoot, statePath))}`);
    printStatus(state, repoRoot, { docsRoot, blueprintPath });
    process.exit(0);
  }

  // ========== set-language ==========
  if (command === 'set-language') {
    const raw = opts['language'] ?? opts['lang'] ?? opts['value'];
    const language = normalizeLanguageValue(raw);
    if (!language) {
      die('[error] --language is required (non-empty).');
    }

    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }

    if (getStateLanguage(state) !== language) {
      state.language = language;
      addHistoryEvent(state, 'language_set', `Language set: ${language}`);
      saveState(repoRoot, state);
    }

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
    console.log(`[ok] Language set: ${language}`);
    process.exit(0);
  }

  // ========== status ==========
  if (command === 'status') {
    const state = loadState(repoRoot);
    if (!state) {
      console.log('[info] No init state detected');
      console.log('[info] Run "start" to begin initialization');
      process.exit(0);
    }

    if (format === 'json') {
      // Keep stdout JSON-only (auto-update may create/refresh entry docs).
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: true });
      console.log(JSON.stringify(getStageProgress(state), null, 2));
    } else {
      printStatus(state, repoRoot, { docsRoot, blueprintPath });
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
    }
    process.exit(0);
  }

  // ========== update-intake ==========
  if (command === 'update-intake') {
    const apply = !!opts['apply'];
    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }
    if (!getStateLanguage(state)) {
      die('[error] Language not set. Run: node init/_tools/init.mjs set-language --language "<your language>" --repo-root .');
    }

    const intakePath = resolvePath(repoRoot, opts['path'] || START_HERE_DEFAULT_REL);

    const res = updateStartHeereDoc({
      repoRoot,
      docsRoot,
      blueprintPath,
      intakePath,
      sourcePath: null,
      apply
    });

    if (apply && res.ok) {
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    }

    if (format === 'json') {
      console.log(JSON.stringify(res, null, 2));
    } else {
      const rel = toPosixPath(path.relative(repoRoot, res.path || intakePath));
      console.log(apply ? `[ok] START-HERE updated: ${rel}` : `[plan] START-HERE update planned (dry-run): ${rel}`);
    }
    process.exit(res.ok ? 0 : 1);
  }

  // ========== update-board ==========
  if (command === 'update-board') {
    const apply = !!opts['apply'];
    const boardPath = resolvePath(repoRoot, opts['path'] || INIT_BOARD_DEFAULT_REL);
    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }
    if (!getStateLanguage(state)) {
      die('[error] Language not set. Run: node init/_tools/init.mjs set-language --language "<your language>" --repo-root .');
    }

    if (apply) {
      const startHerePath = path.join(repoRoot, START_HERE_DEFAULT_REL);
      updateStartHeereDoc({ repoRoot, docsRoot, blueprintPath, intakePath: startHerePath, sourcePath: null, apply: true });
    }

    const res = updateInitBoardDoc({
      repoRoot,
      docsRoot,
      blueprintPath,
      boardPath,
      apply
    });

    if (format === 'json') {
      console.log(JSON.stringify(res, null, 2));
    } else {
      const rel = toPosixPath(path.relative(repoRoot, res.path || boardPath));
      console.log(apply ? `[ok] INIT-BOARD updated: ${rel}` : `[plan] INIT-BOARD update planned (dry-run): ${rel}`);
    }
    process.exit(res.ok ? 0 : 1);
  }

  // ========== advance ==========
  if (command === 'advance') {
    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);

    const progress = getStageProgress(state);

    if (progress.stage === 'A') {
      if (!progress[stageKey('A')].validated) {
        die('[error] Stage A docs not validated yet. Run check-docs first.');
      }
      console.log('\n== Stage A -> B Checkpoint ==\n');
      console.log('Stage A docs validated.');
      console.log(`Confirm the user reviewed and approved docs under ${toPosixPath(path.relative(repoRoot, docsRoot))}/`);
      console.log('\nIf confirmed, run the following to approve and advance:');
      console.log('  node init/_tools/init.mjs approve --stage A');
      process.exit(0);
    }

    if (progress.stage === 'B') {
      if (!progress[stageKey('B')].validated) {
        die('[error] Stage B blueprint not validated yet. Run validate first.');
      }
      if (!progress[stageKey('B')].packsReviewed) {
        console.log('\n== Stage B Pack Review Checkpoint ==\n');
        console.log('Stage B blueprint validated, but skill pack selection has not been reviewed yet.');
        console.log('Review recommended packs (and optionally write safe-adds) by running:');
        console.log('  node init/_tools/init.mjs suggest-packs --repo-root .');
        console.log('\nAfter reviewing packs, you may approve Stage B:');
        console.log('  node init/_tools/init.mjs approve --stage B');
        process.exit(0);
      }
      console.log('\n== Stage B -> C Checkpoint ==\n');
      console.log('Stage B blueprint validated.');
      console.log(`Confirm the user reviewed and approved ${toPosixPath(path.relative(repoRoot, blueprintPath))}.`);
      console.log('\nIf confirmed, run the following to approve and advance:');
      console.log('  node init/_tools/init.mjs approve --stage B');
      process.exit(0);
    }

    if (progress.stage === 'C') {
      if (!progress[stageKey('C')].wrappersSynced) {
        die('[error] Stage C not complete yet. Run apply first.');
      }
      if (!progress[stageKey('C')].skillRetentionReviewed) {
        console.log('\n== Stage C Skill Retention Review Checkpoint ==\n');
        console.log('Scaffold and skill wrappers are generated.');
        console.log('Before approving Stage C, review which skills to keep vs prune.');
        console.log('\nWhen done, mark review complete by running:');
        console.log('  node init/_tools/init.mjs review-skill-retention');
        process.exit(0);
      }

      console.log('\n== Stage C Completion Checkpoint ==\n');
      console.log('Scaffold and skill packs applied.');
      console.log('Confirm the user reviewed the initialization result.');
      console.log('\n[IMPORTANT] Root docs updated from blueprint:');
      console.log('- AGENTS.md: Project Type, Tech Stack, Key Directories');
      console.log('- README.md: Title, description, tech stack, structure');
      console.log('\nPlease verify:');
      console.log('- AGENTS.md "Project Type" shows your project name (NOT "Template repository")');
      console.log('- Tech Stack and Key Directories match your blueprint choices');
      console.log('\nIf confirmed, run the following to finish initialization:');
      console.log('  node init/_tools/init.mjs approve --stage C');
      console.log('\nNext steps:');
      console.log('- Review: README.md and AGENTS.md (verify project-specific content)');
      console.log('- Optional: regenerate root docs:');
      console.log('  node init/_tools/init.mjs update-root-docs --apply');
      console.log('- Optional: archive and remove init/:');
      console.log('  node init/_tools/init.mjs cleanup-init --apply --i-understand --archive');
      process.exit(0);
    }

    console.log('[info] Initialization complete');
    process.exit(0);
  }

  // ========== approve ==========
  if (command === 'approve') {
    const stageArg = (opts['stage'] || '').toUpperCase();
    if (!['A', 'B', 'C'].includes(stageArg)) {
      die('[error] --stage is required. Valid values: A, B, C');
    }

    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }

    const progress = getStageProgress(state);

    if (stageArg === 'A') {
      if (progress.stage !== 'A') {
        die(`[error] Current stage is ${progress.stage}. Cannot approve Stage A.`);
      }
      if (!progress[stageKey('A')].validated) {
        die('[error] Stage A docs not validated yet. Run check-docs first.');
      }

      // Re-check docs to avoid stale state if files changed after validation.
      const docsCheck = checkDocs(docsRoot);
      if (!docsCheck.ok) {
        die(
          [
            '[error] Stage A docs are not currently valid. Fix docs and re-run check-docs.',
            ...docsCheck.errors.map((e) => `- ${e}`)
          ].join('\n')
        );
      }
      
      state[stageKey('A')].userApproved = true;
      state.stage = 'B';
      addHistoryEvent(state, 'stage_a_approved', 'User approved Stage A, advancing to Stage B');
      saveState(repoRoot, state);
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
      
      console.log('[ok] Stage A approved');
      console.log('[ok] Advanced to Stage B - Blueprint');
      console.log(`\nNext: create ${toPosixPath(path.relative(repoRoot, blueprintPath))}`);
      process.exit(0);
    }

    if (stageArg === 'B') {
      if (progress.stage !== 'B') {
        die(`[error] Current stage is ${progress.stage}. Cannot approve Stage B.`);
      }
      if (!progress[stageKey('B')].validated) {
        die('[error] Stage B blueprint not validated yet. Run validate first.');
      }
      if (!progress[stageKey('B')].packsReviewed) {
        die('[error] Stage B skill packs have not been reviewed yet. Run suggest-packs first.');
      }

      // Re-check blueprint to avoid stale state if file changed after validation.
      const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);
      const v = validateBlueprint(blueprint);
      if (!v.ok) {
        die(
          [
            '[error] Blueprint is not currently valid. Fix errors and re-run validate.',
            ...v.errors.map((e) => `- ${e}`)
          ].join('\n')
        );
      }
      
      state[stageKey('B')].userApproved = true;
      state.stage = 'C';
      addHistoryEvent(state, 'stage_b_approved', 'User approved Stage B, advancing to Stage C');
      saveState(repoRoot, state);
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
      
      console.log('[ok] Stage B approved');
      console.log('[ok] Advanced to Stage C - Scaffold');
      console.log('\nNext: run apply to create the scaffold');
      process.exit(0);
    }

    if (stageArg === 'C') {
      if (progress.stage !== 'C') {
        die(`[error] Current stage is ${progress.stage}. Cannot approve Stage C.`);
      }
      if (!progress[stageKey('C')].wrappersSynced) {
        die('[error] Stage C not complete yet. Run apply first.');
      }
      if (!progress[stageKey('C')].skillRetentionReviewed) {
        die('[error] Skill retention has not been reviewed yet. Run review-skill-retention first.');
      }
      
      state[stageKey('C')].userApproved = true;
      state.stage = 'complete';
      addHistoryEvent(state, 'stage_c_approved', 'User approved Stage C, initialization complete');
      saveState(repoRoot, state);
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath);
      
      console.log('[ok] Stage C approved');
      console.log('[ok] Initialization complete!');
      
      // Check whether agent-builder exists and inform the user
      const agentDir = path.join(repoRoot, '.ai', 'skills', 'workflows', 'agent');
      if (fs.existsSync(agentDir)) {
        console.log('\n[info] Agent Builder pack detected');
        console.log('- Found: .ai/skills/workflows/agent');
        console.log('- If not needed, remove it to reduce repo size and sync time:');
        console.log('  node init/_tools/init.mjs prune-agent-builder --repo-root . --apply --i-understand');
      }
      
      console.log('\n[IMPORTANT] Root docs have been updated from the blueprint:');
      console.log('- AGENTS.md: Project Type, Tech Stack, Key Directories');
      console.log('- README.md: Title, description, tech stack, structure');
      console.log('Please verify these files contain project-specific content.');
      
      console.log('\nNext steps:');
      console.log('- Verify: AGENTS.md shows your project info (not "Template repository")');
      console.log('- Optional: archive and remove init/:');
      console.log('  node init/_tools/init.mjs cleanup-init --apply --i-understand --archive');
      process.exit(0);
    }
  }

  if (command === 'validate') {
    const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);
    const v = validateBlueprint(blueprint);

    // Auto-update state if validation passes
    if (v.ok) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'B') {
        const stageB =
          state[stageKey('B')] && typeof state[stageKey('B')] === 'object' ? state[stageKey('B')] : {};
        const prevDrafted = !!stageB.drafted;
        const prevValidated = !!stageB.validated;

        stageB.drafted = true;
        stageB.validated = true;
        state[stageKey('B')] = stageB;

        if (!prevDrafted || !prevValidated) {
          addHistoryEvent(state, 'stage_b_validated', 'Stage B blueprint validated');
          saveState(repoRoot, state);
          if (format !== 'json') {
            console.log('[auto] State updated: stage-b.validated = true');
          }
        }
      }
    } else {
      // If previously validated, mark as not validated to avoid stale state.
      const state = loadState(repoRoot);
      if (state && state.stage === 'B') {
        const stageB =
          state[stageKey('B')] && typeof state[stageKey('B')] === 'object' ? state[stageKey('B')] : {};
        const prevValidated = !!stageB.validated;
        if (prevValidated) {
          stageB.validated = false;
          state[stageKey('B')] = stageB;
          addHistoryEvent(state, 'stage_b_invalidated', 'Stage B blueprint validation failed (state marked not validated)');
          saveState(repoRoot, state);
          if (format !== 'json') {
            console.log('[auto] State updated: stage-b.validated = false');
          }
        }
      }
    }

    const result = {
      ok: v.ok,
      packs: v.packs,
      errors: v.errors,
      warnings: v.warnings,
      summary: v.ok
        ? `[ok] Blueprint is valid: ${path.relative(repoRoot, blueprintPath)}`
        : `[error] Blueprint validation failed: ${path.relative(repoRoot, blueprintPath)}`
    };
    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    printResult(result, format);
    process.exit(v.ok ? 0 : 1);
  }

  if (command === 'check-docs') {
    const strict = !!opts['strict'];
    const res = checkDocs(docsRoot);

    const passed = res.ok;
    const ok = passed && (!strict || res.warnings.length === 0);
    const summary = ok
      ? `[ok] Stage A docs check passed: ${path.relative(repoRoot, docsRoot)}`
      : `[error] Stage A docs check failed: ${path.relative(repoRoot, docsRoot)}`;

    // Auto-update state if validation passes
    if (passed) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'A') {
        const stageA =
          state[stageKey('A')] && typeof state[stageKey('A')] === 'object' ? state[stageKey('A')] : {};
        const prevValidated = !!stageA.validated;
        let changed = false;

        if (!prevValidated) {
          stageA.validated = true;
          changed = true;
        }

        const nextDocsWritten = {
          requirements: fs.existsSync(path.join(docsRoot, 'requirements.md')),
          nfr: fs.existsSync(path.join(docsRoot, 'non-functional-requirements.md')),
          glossary: fs.existsSync(path.join(docsRoot, 'domain-glossary.md')),
          riskQuestions: fs.existsSync(path.join(docsRoot, 'risk-open-questions.md'))
        };
        const prevDocsWritten =
          stageA.docsWritten && typeof stageA.docsWritten === 'object' ? stageA.docsWritten : null;
        const docsWrittenChanged =
          !prevDocsWritten ||
          !!prevDocsWritten.requirements !== nextDocsWritten.requirements ||
          !!prevDocsWritten.nfr !== nextDocsWritten.nfr ||
          !!prevDocsWritten.glossary !== nextDocsWritten.glossary ||
          !!prevDocsWritten.riskQuestions !== nextDocsWritten.riskQuestions;
        if (docsWrittenChanged) {
          stageA.docsWritten = nextDocsWritten;
          changed = true;
        }

        // The pipeline is file-based; treat a validated Stage A as "must-ask answered".
        // This keeps the board/status verifiable without requiring manual state edits.
        const mustAsk = stageA.mustAsk || {};
        const reqRel = toPosixPath(path.relative(repoRoot, path.join(docsRoot, 'requirements.md')));
        const nfrRel = toPosixPath(path.relative(repoRoot, path.join(docsRoot, 'non-functional-requirements.md')));
        const writtenToByKey = {
          onePurpose: reqRel,
          userRoles: reqRel,
          mustRequirements: reqRel,
          outOfScope: reqRel,
          userJourneys: reqRel,
          constraints: nfrRel,
          successMetrics: reqRel
        };
        for (const key of Object.keys(writtenToByKey)) {
          const prev = mustAsk[key] && typeof mustAsk[key] === 'object' ? mustAsk[key] : {};
          const next = {
            ...prev,
            asked: true,
            answered: true,
            writtenTo: prev.writtenTo || writtenToByKey[key] || reqRel
          };
          if (prev.asked !== true || prev.answered !== true || prev.writtenTo !== next.writtenTo) {
            changed = true;
          }
          mustAsk[key] = next;
        }
        stageA.mustAsk = mustAsk;
        state[stageKey('A')] = stageA;

        if (changed) {
          if (!prevValidated) {
            addHistoryEvent(state, 'stage_a_validated', 'Stage A docs validated');
          }
          saveState(repoRoot, state);
          if (format !== 'json') {
            console.log('[auto] State updated: stage-a.validated = true');
          }
        }
      }
    } else {
      // If previously validated, mark as not validated to avoid stale state.
      const state = loadState(repoRoot);
      if (state && state.stage === 'A') {
        const stageA =
          state[stageKey('A')] && typeof state[stageKey('A')] === 'object' ? state[stageKey('A')] : {};
        const prevValidated = !!stageA.validated;
        if (prevValidated) {
          stageA.validated = false;
          state[stageKey('A')] = stageA;
          addHistoryEvent(state, 'stage_a_invalidated', 'Stage A docs validation failed (state marked not validated)');
          saveState(repoRoot, state);
          if (format !== 'json') {
            console.log('[auto] State updated: stage-a.validated = false');
          }
        }
      }
    }

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    printResult({ ok, errors: res.errors, warnings: res.warnings, summary }, format);
    process.exit(ok ? 0 : 1);
  }

  if (command === 'suggest-packs') {
    const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);

    const v = validateBlueprint(blueprint);
    const rec = recommendedPacksFromBlueprint(blueprint);
    const current = normalizePackList((blueprint.skills && blueprint.skills.packs) || []);
    const missing = rec.filter((p) => !current.includes(p));
    const extra = current.filter((p) => !rec.includes(p));

    const installChecks = rec.map((p) => checkPackInstall(repoRoot, p)).filter((x) => !x.installed);
    const warnings = [];
    for (const c of installChecks) warnings.push(`Recommended pack "${c.pack}" is not installed (${c.reason}).`);

    const result = {
      ok: v.ok,
      recommended: rec,
      current,
      missing,
      extra,
      warnings,
      errors: v.errors,
      summary: `[info] Packs: current=${current.join(', ') || '(none)'} | recommended=${rec.join(', ')}`
    };

    if (opts['write']) {
      if (!v.ok) die('[error] Cannot write packs: blueprint validation failed.');
      const next = normalizePackList([...current, ...missing]);
      blueprint.skills = blueprint.skills || {};
      blueprint.skills.packs = next;
      writeJson(blueprintPath, blueprint);
      result.wrote = { path: path.relative(repoRoot, blueprintPath), packs: next };
      result.summary += `\n[write] Added missing recommended packs into blueprint.skills.packs`;
    }

    if (v.ok) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'B') {
        const stageB =
          state[stageKey('B')] && typeof state[stageKey('B')] === 'object' ? state[stageKey('B')] : {};
        const prevDrafted = !!stageB.drafted;
        const prevReviewed = !!stageB.packsReviewed;

        stageB.drafted = true;
        stageB.packsReviewed = true;
        state[stageKey('B')] = stageB;

        if (!prevDrafted || !prevReviewed) {
          addHistoryEvent(state, 'stage_b_packs_reviewed', 'Stage B packs reviewed via suggest-packs');
          saveState(repoRoot, state);
          if (format !== 'json') {
            console.log('[auto] State updated: stage-b.packsReviewed = true');
          }
        }
      }
    }

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    printResult(result, format);
    process.exit(v.ok ? 0 : 1);
  }

  if (command === 'scaffold') {
    const apply = !!opts['apply'];
    const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);

    const v = validateBlueprint(blueprint);
    if (!v.ok) die('[error] Blueprint is not valid; refusing to scaffold.');

    const plan = planScaffold(repoRoot, blueprint, apply);
    const summary = apply
      ? `[ok] Scaffold applied under repo root: ${repoRoot}`
      : `[plan] Scaffold dry-run under repo root: ${repoRoot}`;

    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, summary, plan }, null, 2));
    } else {
      console.log(summary);
      for (const item of plan) {
        const mode = item.mode ? ` (${item.mode})` : '';
        const reason = item.reason ? ` [${item.reason}]` : '';
        console.log(`- ${item.op}: ${path.relative(repoRoot, item.path || '')}${mode}${reason}`);
      }
    }

    if (apply) {
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    }
    process.exit(0);
  }

  if (command === 'apply') {
    const providers = opts['providers'] || 'both';
    const requireStageA = !!opts['require-stage-a'] || !!opts['require-stage-a-strict'];
    const requireStageAStrict = !!opts['require-stage-a-strict'];
    const skipConfigs = !!opts['skip-configs'];
    const skipReadme = !!opts['skip-readme'];
    const skipRootAgents = !!opts['skip-root-agents'];
    const skipAgentBuilder = !!opts['skip-agent-builder'];
    const cleanup = !!opts['cleanup-init'];
    const archiveAll = !!opts['archive'];
    const archiveDocs = !!opts['archive-docs'];
    const archiveBlueprint = !!opts['archive-blueprint'];
    const archiveDir = opts['archive-dir'];

    if (cleanup && !opts['i-understand']) {
      die('[error] --cleanup-init requires --i-understand');
    }
    if (skipAgentBuilder && !opts['i-understand']) {
      die('[error] --skip-agent-builder requires --i-understand');
    }
    if (!cleanup && (archiveAll || archiveDocs || archiveBlueprint)) {
      console.warn('[warn] Archive flags are ignored without --cleanup-init');
    }

    const stateForGate = loadState(repoRoot);
    if (stateForGate && stateForGate.stage !== 'C') {
      die(
        [
          `[error] Current stage is ${stateForGate.stage}. apply is only valid in Stage C.`,
          '[hint] After user approval, run: node init/_tools/init.mjs approve --stage B',
          '[hint] Or use: node init/_tools/init.mjs scaffold --apply  (minimal directories only)'
        ].join('\n')
      );
    }

    const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);

    // Validate blueprint
    const v = validateBlueprint(blueprint);
    if (!v.ok) die('[error] Blueprint validation failed. Fix errors and re-run.');

    // Stage A docs check (optional gating)
    const docsCheckRes = checkDocs(docsRoot);
    if (requireStageA) {
      const ok = docsCheckRes.ok && (!requireStageAStrict || docsCheckRes.warnings.length === 0);
      if (!ok) {
        const docsRel = toPosixPath(path.relative(repoRoot, docsRoot));
        const cmd = [
          'node init/_tools/init.mjs check-docs',
          `--docs-root ${docsRel}`,
          requireStageAStrict ? '--strict' : null
        ].filter(Boolean).join(' ');
        die(
          [
            requireStageAStrict
              ? '[error] Stage A docs check failed in strict mode. Fix docs and re-run.'
              : '[error] Stage A docs check failed. Fix docs and re-run.',
            `[hint] Run: ${cmd}`
          ].join('\n')
        );
      }
    }

    // Suggest packs (warn-only)
    const rec = recommendedPacksFromBlueprint(blueprint);
    const current = normalizePackList((blueprint.skills && blueprint.skills.packs) || []);
    const missing = rec.filter((p) => !current.includes(p));
    if (missing.length > 0) {
      console.warn(`[warn] Blueprint.skills.packs is missing recommended packs: ${missing.join(', ')}`);
      console.warn(`[warn] Run: suggest-packs --blueprint ${path.relative(repoRoot, blueprintPath)} --write  (or edit blueprint.skills.packs manually)`);
    }

    // Scaffold directories
    const scaffoldPlan = planScaffold(repoRoot, blueprint, true);
    if (format !== 'json') {
      console.log('[ok] Scaffold updated.');
      for (const item of scaffoldPlan) {
        const mode = item.mode ? ` (${item.mode})` : '';
        const reason = item.reason ? ` [${item.reason}]` : '';
        console.log(`  - ${item.op}: ${path.relative(repoRoot, item.path || '')}${mode}${reason}`);
      }
    }

    // Generate config files (default: enabled)
    let configResults = [];
    if (!skipConfigs) {
      configResults = generateConfigFiles(repoRoot, blueprint, true);
      if (format !== 'json') {
        console.log('[ok] Config files generated.');
        for (const r of configResults) {
          const mode = r.mode ? ` (${r.mode})` : '';
          const reason = r.reason ? ` [${r.reason}]` : '';
          console.log(`  - ${r.action}: ${r.file}${mode}${reason}`);
        }
      }
    }

    // Generate/update root docs from the blueprint
    let readmeResult = null;
    if (!skipReadme) {
      readmeResult = generateProjectReadme(repoRoot, blueprint, true);
      if (format !== 'json') {
        if (readmeResult.op === 'write' && readmeResult.mode === 'applied') {
          console.log('[ok] README.md generated from blueprint.');
        } else if (readmeResult.reason) {
          console.log(`[info] README.md: ${readmeResult.reason}`);
        }
      }
    }

    let agentsResult = null;
    if (!skipRootAgents) {
      agentsResult = generateProjectAgents(repoRoot, blueprint, true);
      if (format !== 'json') {
        if (agentsResult.op === 'write' && agentsResult.mode === 'applied') {
          console.log('[ok] AGENTS.md updated from blueprint.');
        } else if (agentsResult.reason) {
          console.log(`[info] AGENTS.md: ${agentsResult.reason}`);
        }
      }
    }

    // Manifest update
    const manifestResult = updateManifest(repoRoot, blueprint, true);
    if (manifestResult.warnings && manifestResult.warnings.length > 0) {
      for (const w of manifestResult.warnings) console.warn(`[warn] ${w}`);
    }

    // Optional prune of heavy workflow skills
    let pruneResult = null;
    if (skipAgentBuilder) {
      pruneResult = pruneAgentBuilder(repoRoot, true);
      if (pruneResult.mode === 'failed') die(`[error] Failed to prune agent workflow: ${pruneResult.error}`);
    }

    // Sync wrappers
    const syncResult = syncWrappers(repoRoot, providers, true, { stdio: format === 'json' ? 'pipe' : 'inherit' });
    if (syncResult.mode === 'failed') die(`[error] sync-skills.mjs failed with exit code ${syncResult.exitCode}`);

    // Auto-update state
    const state = loadState(repoRoot);
    if (state && state.stage === 'C') {
      const stageC =
        state[stageKey('C')] && typeof state[stageKey('C')] === 'object' ? state[stageKey('C')] : {};

      let changed = false;
      const skillsChanged =
        (manifestResult && manifestResult.mode === 'applied') ||
        (pruneResult && pruneResult.mode === 'applied');

      if (stageC.scaffoldApplied !== true) {
        stageC.scaffoldApplied = true;
        changed = true;
      }

      if (typeof stageC.configsGenerated !== 'boolean') {
        stageC.configsGenerated = false;
        changed = true;
      }
      if (!skipConfigs && stageC.configsGenerated !== true) {
        stageC.configsGenerated = true;
        changed = true;
      }

      if (stageC.manifestUpdated !== true) {
        stageC.manifestUpdated = true;
        changed = true;
      }

      if (typeof stageC.wrappersSynced !== 'boolean') {
        stageC.wrappersSynced = false;
        changed = true;
      }
      if (syncResult && syncResult.mode === 'applied' && stageC.wrappersSynced !== true) {
        stageC.wrappersSynced = true;
        changed = true;
      }

      if (typeof stageC.skillRetentionReviewed !== 'boolean') {
        stageC.skillRetentionReviewed = false;
        changed = true;
      }
      if (skillsChanged && stageC.skillRetentionReviewed === true) {
        stageC.skillRetentionReviewed = false;
        changed = true;
      }

      state[stageKey('C')] = stageC;
      if (changed) {
        const detail = skillsChanged
          ? 'Stage C apply completed (skills changed; retention review required)'
          : 'Stage C apply completed';
        addHistoryEvent(state, 'stage_c_applied', detail);
        saveState(repoRoot, state);
        if (format !== 'json') {
          console.log('[auto] State updated: stage-c progress updated');
        }
      }
    }

    if (!cleanup) {
      tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });
    }

    // Optional cleanup
    let archiveResult = null;
    let cleanupResult = null;
    if (cleanup) {
      const wantsArchiveDocs = archiveAll || archiveDocs;
      const wantsArchiveBlueprint = archiveAll || archiveBlueprint;
      if (wantsArchiveDocs || wantsArchiveBlueprint) {
        archiveResult = archiveInitArtifacts(
          repoRoot,
          docsRoot,
          blueprintPath,
          { archiveDocs: wantsArchiveDocs, archiveBlueprint: wantsArchiveBlueprint, archiveDir },
          true
        );
        if (archiveResult.errors.length > 0) {
          die(`[error] Archive failed:\n- ${archiveResult.errors.join('\n- ')}`);
        }
      }
      cleanupResult = cleanupInit(repoRoot, true);
      if (cleanupResult.mode === 'partial') {
        console.warn(`[warn] cleanup-init partially completed: ${cleanupResult.note}`);
      }
    }

    if (format === 'json') {
      console.log(JSON.stringify({
        ok: true,
        blueprint: path.relative(repoRoot, blueprintPath),
        docsRoot: path.relative(repoRoot, docsRoot),
        [stageKey('A')]: docsCheckRes,
        scaffold: scaffoldPlan,
        configs: configResults,
        readme: readmeResult,
        agents: agentsResult,
        manifest: manifestResult,
        archive: archiveResult,
        pruneAgentBuilder: pruneResult,
        sync: syncResult,
        cleanup: cleanupResult
      }, null, 2));
    } else {
      console.log('[ok] Apply completed.');
      console.log(`- Blueprint: ${path.relative(repoRoot, blueprintPath)}`);
      console.log(`- Docs root: ${path.relative(repoRoot, docsRoot)}`);
      if (!docsCheckRes.ok) console.log('[warn] Stage A docs check had errors; consider re-running with --require-stage-a.');
      if (docsCheckRes.warnings.length > 0) console.log('[warn] Stage A docs check has warnings; ensure TBD/TODO items are tracked.');
      console.log(`- Manifest: ${manifestResult.mode || manifestResult.op} (${path.relative(repoRoot, manifestResult.path)})`);
      if (archiveResult) console.log(`- Archive: ${archiveResult.mode}`);
      if (pruneResult) console.log(`- Agent workflow prune: ${pruneResult.mode}`);
      console.log(`- Wrappers synced via: ${syncResult.cmd || '(skipped)'}`);
      if (cleanupResult) console.log(`- init/ cleanup: ${cleanupResult.mode}`);
      
      // Explicit prompt about root docs updates
      if (readmeResult || agentsResult) {
        console.log('\n[IMPORTANT] Root docs updated from blueprint:');
        if (readmeResult && readmeResult.op === 'write') {
          console.log('- README.md: project title, description, tech stack, structure');
        }
        if (agentsResult && agentsResult.op === 'write') {
          console.log('- AGENTS.md: Project Type, Tech Stack, Key Directories');
        }
        console.log('Please verify these contain project-specific content (not template placeholders).');
      }
      
      console.log('\nNext:');
      console.log('  node init/_tools/init.mjs advance');
    }

    process.exit(0);
  }

  if (command === 'cleanup-init') {
    if (!opts['i-understand']) die('[error] cleanup-init requires --i-understand');
    const apply = !!opts['apply'];
    const archiveAll = !!opts['archive'];
    const archiveDocs = !!opts['archive-docs'];
    const archiveBlueprint = !!opts['archive-blueprint'];
    const archiveDir = opts['archive-dir'];
    const wantsArchiveDocs = archiveAll || archiveDocs;
    const wantsArchiveBlueprint = archiveAll || archiveBlueprint;

    let archiveResult = null;
    if (wantsArchiveDocs || wantsArchiveBlueprint) {
      archiveResult = archiveInitArtifacts(
        repoRoot,
        docsRoot,
        blueprintPath,
        { archiveDocs: wantsArchiveDocs, archiveBlueprint: wantsArchiveBlueprint, archiveDir },
        apply
      );
      if (apply && archiveResult.errors.length > 0) {
        die(`[error] Archive failed:\n- ${archiveResult.errors.join('\n- ')}`);
      }
    }

    const res = cleanupInit(repoRoot, apply);
    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, archive: archiveResult, result: res }, null, 2));
    } else {
      if (!apply) {
        console.log(`[plan] ${res.op}: ${path.relative(repoRoot, res.path || '')} (${res.mode})`);
        if (res.note) console.log(`Note: ${res.note}`);
        if (archiveResult) {
          console.log(`[plan] archive: ${path.relative(repoRoot, archiveResult.targetRoot)} (${archiveResult.mode})`);
        }
      } else {
        console.log(`[ok] ${res.op}: ${path.relative(repoRoot, res.path || '')} (${res.mode})`);
        if (res.note) console.log(`Note: ${res.note}`);
        if (archiveResult) {
          console.log(`[ok] archive: ${path.relative(repoRoot, archiveResult.targetRoot)} (${archiveResult.mode})`);
        }
      }
    }
    process.exit(0);
  }

  // ========== review-skill-retention ==========
  if (command === 'review-skill-retention') {
    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }

    const progress = getStageProgress(state);
    if (progress.stage !== 'C') {
      die(`[error] Current stage is ${progress.stage}. review-skill-retention is only valid in Stage C.`);
    }
    if (!progress[stageKey('C')].wrappersSynced) {
      die('[error] Stage C not complete yet. Run apply first.');
    }

    const stageC =
      state[stageKey('C')] && typeof state[stageKey('C')] === 'object' ? state[stageKey('C')] : {};
    const prevReviewed = !!stageC.skillRetentionReviewed;
    stageC.skillRetentionReviewed = true;
    state[stageKey('C')] = stageC;

    if (!prevReviewed) {
      addHistoryEvent(state, 'stage_c_skill_retention_reviewed', 'Skill retention reviewed');
      saveState(repoRoot, state);
    }
    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply: true, silent: format === 'json' });

    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, stage: 'C', skillRetentionReviewed: true, alreadyReviewed: prevReviewed }, null, 2));
    } else {
      console.log(prevReviewed ? '[info] Skill retention already marked as reviewed.' : '[ok] Stage C skill retention review marked as complete.');
      console.log('Next:');
      console.log('  node init/_tools/init.mjs advance');
    }

    process.exit(0);
  }

  // ========== update-root-docs ==========
  if (command === 'update-root-docs') {
    const apply = !!opts['apply'];
    const skipReadme = !!opts['skip-readme'];
    const skipRootAgents = !!opts['skip-root-agents'];

    const blueprint = readBlueprintOrDie(repoRoot, blueprintPath);
    const v = validateBlueprint(blueprint);
    if (!v.ok) die('[error] Blueprint validation failed. Fix errors and re-run.');

    const readmeResult = skipReadme
      ? { op: 'skip', path: path.join(repoRoot, 'README.md'), reason: '--skip-readme' }
      : generateProjectReadme(repoRoot, blueprint, apply);

    const agentsResult = skipRootAgents
      ? { op: 'skip', path: path.join(repoRoot, 'AGENTS.md'), reason: '--skip-root-agents' }
      : generateProjectAgents(repoRoot, blueprint, apply);

    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, readme: readmeResult, agents: agentsResult }, null, 2));
    } else {
      console.log(apply ? '[ok] Root docs updated.' : '[plan] Root docs update planned (dry-run).');
      console.log(`- README.md: ${readmeResult.mode || readmeResult.reason || readmeResult.op}`);
      console.log(`- AGENTS.md: ${agentsResult.mode || agentsResult.reason || agentsResult.op}`);
      
      if (apply) {
        console.log('\n[IMPORTANT] Updated sections from blueprint:');
        if (readmeResult.op === 'write') {
          console.log('- README.md: project title, description, tech stack, structure');
        }
        if (agentsResult.op === 'write') {
          console.log('- AGENTS.md: Project Type, Tech Stack, Key Directories');
        }
        console.log('Please verify these contain project-specific content (not "Template repository").');
      }
    }

    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply, silent: format === 'json' });

    process.exit(0);
  }

  // ========== prune-agent-builder ==========
  if (command === 'prune-agent-builder') {
    if (!opts['i-understand']) die('[error] prune-agent-builder requires --i-understand');
    const apply = !!opts['apply'];
    const syncAfter = opts['sync-after'] !== 'false' && opts['sync-after'] !== false;
    const providers = opts['providers'] || 'both';

    const agentDir = path.join(repoRoot, '.ai', 'skills', 'workflows', 'agent');
    
    if (!fs.existsSync(agentDir)) {
      if (format === 'json') {
        console.log(JSON.stringify({ ok: true, result: { op: 'skip', path: agentDir, reason: 'not present' } }, null, 2));
      } else {
        console.log('[info] Agent Builder directory not found; nothing to remove');
        console.log(`  Path: ${path.relative(repoRoot, agentDir)}`);
      }
      process.exit(0);
    }

    const pruneResult = pruneAgentBuilder(repoRoot, apply);
    
    let syncResult = null;
    if (apply && syncAfter && pruneResult.mode === 'applied') {
      if (format !== 'json') {
        console.log('[info] Re-syncing skill wrappers...');
      }
      syncResult = syncWrappers(repoRoot, providers, true, { stdio: format === 'json' ? 'pipe' : 'inherit' });
    }

    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, prune: pruneResult, sync: syncResult }, null, 2));
    } else {
      if (!apply) {
        console.log(`[plan] ${pruneResult.op}: ${path.relative(repoRoot, pruneResult.path || '')} (${pruneResult.mode})`);
        if (syncAfter) {
          console.log('[plan] Will re-sync wrappers after removal');
        }
      } else {
        console.log(`[ok] ${pruneResult.op}: ${path.relative(repoRoot, pruneResult.path || '')} (${pruneResult.mode})`);
        if (syncResult) {
          console.log(`[ok] Wrappers sync: ${syncResult.mode}`);
        }
      }
    }
    tryAutoUpdateInitBoardDoc(repoRoot, docsRoot, blueprintPath, { apply, silent: format === 'json' });
    process.exit(0);
  }

  usage(1);
}

main();
