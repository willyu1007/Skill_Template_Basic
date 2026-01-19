#!/usr/bin/env node
/**
 * init-pipeline.mjs
 *
 * Dependency-free helper for a 3-stage, verifiable init pipeline:
 *
 *   Stage A: requirements docs under `init/stage-a-docs/`
 *   Stage B: blueprint JSON at `init/project-blueprint.json`
 *   Stage C: minimal scaffold + skill pack manifest update + wrapper sync
 *
 * Commands:
 *   - start          Initialize state file and show next steps
 *   - status         Show current initialization progress
 *   - advance        Check current stage completion and prompt for next stage
 *   - validate       Validate a blueprint JSON (no writes)
 *   - check-docs     Validate Stage A docs (structure + template placeholders)
 *   - suggest-packs  Recommend skill packs from blueprint capabilities (warn-only by default)
 *   - scaffold       Plan or apply a minimal directory scaffold from the blueprint
 *   - apply          validate + (optional) check-docs + scaffold + configs + manifest update + wrapper sync
 *   - cleanup-init   Remove the `init/` bootstrap kit (opt-in, guarded)
 *
 * This script is intentionally framework-agnostic. It avoids generating code.
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
  node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs <command> [options]

Commands:
  start
    --repo-root <path>          Repo root (default: cwd)
    Initialize state file and show next steps.

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
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)

  check-docs
    --docs-root <path>          Stage A docs root (default: <repo-root>/init/stage-a-docs)
    --repo-root <path>          Repo root (default: cwd)
    --strict                    Treat warnings as errors (exit non-zero)
    --format <text|json>        Output format (default: text)

  suggest-packs
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)
    --write                      Add missing recommended packs into blueprint (safe-add only)

  scaffold
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually create directories/files (default: dry-run)

  apply
    --blueprint <path>          Blueprint JSON path (default: <repo-root>/init/project-blueprint.json)
    --repo-root <path>          Repo root (default: cwd)
    --providers <both|codex|claude|codex,claude>
                                Providers to sync (default: both)
    --require-stage-a           Run 'check-docs --strict' and fail if it does not pass
    --skip-configs              Skip generating config files (package.json, etc.)
    --skip-agent-builder        Remove .ai/skills/workflows/agent before wrapper sync (requires --i-understand)
    --cleanup-init              Remove <repo-root>/init after success (requires --i-understand)
    --i-understand              Required acknowledgement for destructive actions

  cleanup-init
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually remove init/ (default: dry-run)
    --archive                    Archive Stage A docs + blueprint to docs/project before cleanup
    --archive-docs               Archive Stage A docs only before cleanup
    --archive-blueprint          Archive blueprint only before cleanup
    --i-understand              Required acknowledgement (refuses without it)

  prune-agent-builder
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually remove .ai/skills/workflows/agent (default: dry-run)
    --sync-after                 Re-sync wrappers after pruning (default: true)
    --providers <both|codex|claude>
                                Providers to sync (default: both)
    --i-understand              Required acknowledgement (refuses without it)

Examples:
  node .../init-pipeline.mjs start
  node .../init-pipeline.mjs status
  node .../init-pipeline.mjs check-docs --docs-root init/stage-a-docs
  node .../init-pipeline.mjs validate --blueprint init/project-blueprint.json
  node .../init-pipeline.mjs approve --stage A
  node .../init-pipeline.mjs apply --blueprint init/project-blueprint.json --providers codex,claude
  node .../init-pipeline.mjs prune-agent-builder --apply --i-understand
  node .../init-pipeline.mjs cleanup-init --apply --i-understand --archive
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

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    die(`[error] Failed to read JSON: ${filePath}\n${e.message}`);
  }
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
  return path.join(repoRoot, 'init', '.init-state.json');
}

function stageKey(letter) {
  const l = String(letter || '').toLowerCase();
  if (!l) return '';
  return `stage-${l}`;
}

function normalizeStateShape(state) {
  if (!state || typeof state !== 'object') return state;

  // Migrate legacy camel-case stage keys -> kebab-case stage-* keys.
  for (const stageLetter of ['A', 'B', 'C']) {
    const legacyKey = `stage${stageLetter}`;
    const newKey = stageKey(stageLetter);
    if (state[legacyKey] && !state[newKey]) state[newKey] = state[legacyKey];
    if (state[legacyKey]) delete state[legacyKey];
  }

  return state;
}

function createInitialState() {
  return {
    version: 1,
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
      userApproved: false
    },
    history: []
  };
}

function loadState(repoRoot) {
  const statePath = getStatePath(repoRoot);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  try {
    return normalizeStateShape(JSON.parse(fs.readFileSync(statePath, 'utf8')));
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
      userApproved: !!stageStateC.userApproved
    }
  };
}

function printStatus(state, repoRoot) {
  const progress = getStageProgress(state);
  const stageNames = { A: 'Requirements', B: 'Blueprint', C: 'Scaffold', complete: 'Complete' };

  console.log('');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  Init Status                                            │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Current stage: Stage ${progress.stage} - ${stageNames[progress.stage] || progress.stage}`);
  console.log('│');

  if (progress.stage === 'A' || progress.stage === 'B' || progress.stage === 'C') {
    console.log('│  Stage A Progress:');
    console.log(`│    Must-ask: ${progress[stageKey('A')].mustAskAnswered}/${progress[stageKey('A')].mustAskTotal} complete`);
    console.log(`│    Docs written: ${progress[stageKey('A')].docsWritten}/${progress[stageKey('A')].docsTotal} complete`);
    console.log(`│    Validation: ${progress[stageKey('A')].validated ? '✓ validated' : '✗ not validated'}`);
    console.log(`│    User approval: ${progress[stageKey('A')].userApproved ? '✓ approved' : '✗ not approved'}`);
  }

  if (progress.stage === 'B' || progress.stage === 'C') {
    console.log('│');
    console.log('│  Stage B Progress:');
    console.log(`│    Drafted: ${progress[stageKey('B')].drafted ? '✓' : '✗'}`);
    console.log(`│    Validated: ${progress[stageKey('B')].validated ? '✓' : '✗'}`);
    console.log(`│    Packs reviewed: ${progress[stageKey('B')].packsReviewed ? '✓' : '✗'}`);
    console.log(`│    User approval: ${progress[stageKey('B')].userApproved ? '✓' : '✗'}`);
  }

  if (progress.stage === 'C' || progress.stage === 'complete') {
    console.log('│');
    console.log('│  Stage C Progress:');
    console.log(`│    Scaffold applied: ${progress[stageKey('C')].scaffoldApplied ? '✓' : '✗'}`);
    console.log(`│    Configs generated: ${progress[stageKey('C')].configsGenerated ? '✓' : '✗'}`);
    console.log(`│    Manifest updated: ${progress[stageKey('C')].manifestUpdated ? '✓' : '✗'}`);
    console.log(`│    Wrappers synced: ${progress[stageKey('C')].wrappersSynced ? '✓' : '✗'}`);
  }

  console.log('│');
  console.log('│  Next steps:');
  if (progress.stage === 'A') {
    if (!progress[stageKey('A')].validated) {
      console.log('│    1. Complete the interview and draft the docs');
      console.log('│    2. Run: check-docs --docs-root init/stage-a-docs');
    } else if (!progress[stageKey('A')].userApproved) {
      console.log('│    Ask the user to review Stage A docs');
      console.log('│    After approval run: approve --stage A');
    }
  } else if (progress.stage === 'B') {
    if (!progress[stageKey('B')].validated) {
      console.log('│    1. Create init/project-blueprint.json');
      console.log('│    2. Run: validate --blueprint init/project-blueprint.json');
    } else if (!progress[stageKey('B')].userApproved) {
      console.log('│    Ask the user to review the blueprint');
      console.log('│    After approval run: approve --stage B');
    }
  } else if (progress.stage === 'C') {
    if (!progress[stageKey('C')].wrappersSynced) {
      console.log('│    Run: apply --blueprint init/project-blueprint.json');
    } else if (!progress[stageKey('C')].userApproved) {
      console.log('│    Initialization ready for review');
      console.log('│    After approval run: approve --stage C');
    }
  } else if (progress.stage === 'complete') {
    console.log('│    Initialization complete!');
  }

  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('');
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
    backend: 'backend/',
    frontend: 'frontend/'
  };
}

function packOrder() {
  return ['workflows', 'standards', 'backend', 'frontend'];
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
  if (!packs.includes('workflows')) warnings.push('skills.packs does not include "workflows". This is usually required.');
  if (!packs.includes('standards')) warnings.push('skills.packs does not include "standards". This is usually recommended.');

  const ok = errors.length === 0;
  return { ok, errors, warnings, packs };
}

function recommendedPacksFromBlueprint(blueprint) {
  const rec = new Set(['workflows', 'standards']);
  const caps = blueprint.capabilities || {};

  if (caps.backend && caps.backend.enabled) rec.add('backend');
  if (caps.frontend && caps.frontend.enabled) rec.add('frontend');

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
    { re: /<[^>\n]{1,80}>/g, msg: 'template placeholder "<...>"' },
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
  conditionalBlock('API_STYLE', caps.api?.style, !!caps.api?.style);
  
  // Language-specific blocks
  const isNode = ['typescript', 'javascript'].includes(repo.language);
  const isPython = repo.language === 'python';
  const isGo = repo.language === 'go';
  
  conditionalBlock('IS_NODE', 'true', isNode);
  conditionalBlock('IS_PYTHON', 'true', isPython);
  conditionalBlock('IS_GO', 'true', isGo);
  
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
    structure = `├── apps/
│   ├── frontend/       # Frontend application
│   └── backend/        # Backend services
├── packages/
│   └── shared/         # Shared libraries
├── .ai/skills/         # AI skills (SSOT)
├── docs/               # Documentation
└── ops/                # DevOps configuration`;
  } else {
    structure = `├── src/
│   ├── frontend/       # Frontend code
│   └── backend/        # Backend code
├── .ai/skills/         # AI skills (SSOT)
├── docs/               # Documentation
└── ops/                # DevOps configuration`;
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

    // Shared packages are optional, but commonly needed
    results.push(ensureDir(path.join(repoRoot, 'packages', 'shared'), apply));
    results.push(writeFileIfMissing(
      path.join(repoRoot, 'packages', 'shared', 'README.md'),
      '# Shared package\n\nThis folder is a scaffold placeholder for shared types/utilities.\n',
      apply
    ));
  } else {
    results.push(ensureDir(path.join(repoRoot, 'src'), apply));

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

  let manifest;
  if (fs.existsSync(manifestPath)) {
    manifest = readJson(manifestPath);
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
  if (Array.isArray(skills.excludePrefixes)) manifest.excludePrefixes = uniq(skills.excludePrefixes);
  const excludeSkills = Array.isArray(skills.excludeSkillNames)
    ? skills.excludeSkillNames
    : (Array.isArray(skills.excludeSkills) ? skills.excludeSkills : null);
  if (excludeSkills) manifest.excludeSkills = uniq(excludeSkills);

  if (!apply) return { op: 'write', path: manifestPath, mode: 'dry-run', warnings, includePrefixes: manifest.includePrefixes };

  writeJson(manifestPath, manifest);
  return { op: 'write', path: manifestPath, mode: 'applied', warnings, includePrefixes: manifest.includePrefixes };
}

function syncWrappers(repoRoot, providers, apply) {
  const scriptPath = path.join(repoRoot, '.ai', 'scripts', 'sync-skills.mjs');
  if (!fs.existsSync(scriptPath)) {
    return { op: 'skip', path: scriptPath, reason: 'sync-skills.mjs not found' };
  }
  const providersArg = providers || 'both';
  const cmd = 'node';
  const args = [scriptPath, '--scope', 'current', '--providers', providersArg, '--mode', 'reset', '--yes'];

  if (!apply) return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'dry-run' };

  const res = childProcess.spawnSync(cmd, args, { stdio: 'inherit', cwd: repoRoot });
  if (res.status !== 0) {
    return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'failed', exitCode: res.status };
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
  const targetRoot = path.join(repoRoot, 'docs', 'project');
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
  const marker = path.join(initDir, '.init-kit');

  if (!fs.existsSync(initDir)) return { op: 'skip', path: initDir, reason: 'init/ not present' };
  if (!fs.existsSync(marker)) return { op: 'refuse', path: initDir, reason: 'missing init/.init-kit marker' };

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
  const blueprintPath = resolvePath(repoRoot, opts['blueprint'] || path.join('init', 'project-blueprint.json'));
  const docsRoot = resolvePath(repoRoot, opts['docs-root'] || path.join('init', 'stage-a-docs'));

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
      console.log('[info] Existing init state detected');
      printStatus(existingState, repoRoot);
      console.log('[info] To restart, delete init/.init-state.json first');
      process.exit(0);
    }

    const state = createInitialState();
    addHistoryEvent(state, 'init_started', 'Initialization started');
    saveState(repoRoot, state);

    console.log('[ok] Init state created: init/.init-state.json');
    printStatus(state, repoRoot);
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
      console.log(JSON.stringify(getStageProgress(state), null, 2));
    } else {
      printStatus(state, repoRoot);
    }
    process.exit(0);
  }

  // ========== advance ==========
  if (command === 'advance') {
    const state = loadState(repoRoot);
    if (!state) {
      die('[error] No init state detected. Run "start" first.');
    }

    const progress = getStageProgress(state);

    if (progress.stage === 'A') {
      if (!progress[stageKey('A')].validated) {
        die('[error] Stage A docs not validated yet. Run check-docs first.');
      }
      console.log('\n== Stage A -> B Checkpoint ==\n');
      console.log('Stage A docs validated.');
      console.log('Confirm the user reviewed and approved docs under init/stage-a-docs/.');
      console.log('\nIf confirmed, run the following to approve and advance:');
      console.log('  node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage A');
      process.exit(0);
    }

    if (progress.stage === 'B') {
      if (!progress[stageKey('B')].validated) {
        die('[error] Stage B blueprint not validated yet. Run validate first.');
      }
      console.log('\n== Stage B -> C Checkpoint ==\n');
      console.log('Stage B blueprint validated.');
      console.log('Confirm the user reviewed and approved init/project-blueprint.json.');
      console.log('\nIf confirmed, run the following to approve and advance:');
      console.log('  node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage B');
      process.exit(0);
    }

    if (progress.stage === 'C') {
      if (!progress[stageKey('C')].wrappersSynced) {
        die('[error] Stage C not complete yet. Run apply first.');
      }
      console.log('\n== Stage C Completion Checkpoint ==\n');
      console.log('Scaffold and skill packs applied.');
      console.log('Confirm the user reviewed the initialization result.');
      console.log('\nIf confirmed, run the following to finish initialization:');
      console.log('  node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage C');
      console.log('\nOptional: run cleanup-init --apply --i-understand --archive to archive and remove init/.');
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
      
      state[stageKey('A')].userApproved = true;
      state.stage = 'B';
      addHistoryEvent(state, 'stage_a_approved', 'User approved Stage A, advancing to Stage B');
      saveState(repoRoot, state);
      
      console.log('[ok] Stage A approved');
      console.log('[ok] Advanced to Stage B - Blueprint');
      console.log('\nNext: create init/project-blueprint.json');
      process.exit(0);
    }

    if (stageArg === 'B') {
      if (progress.stage !== 'B') {
        die(`[error] Current stage is ${progress.stage}. Cannot approve Stage B.`);
      }
      if (!progress[stageKey('B')].validated) {
        die('[error] Stage B blueprint not validated yet. Run validate first.');
      }
      
      state[stageKey('B')].userApproved = true;
      state.stage = 'C';
      addHistoryEvent(state, 'stage_b_approved', 'User approved Stage B, advancing to Stage C');
      saveState(repoRoot, state);
      
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
      
      state[stageKey('C')].userApproved = true;
      state.stage = 'complete';
      addHistoryEvent(state, 'stage_c_approved', 'User approved Stage C, initialization complete');
      saveState(repoRoot, state);
      
      console.log('[ok] Stage C approved');
      console.log('[ok] Initialization complete!');
      
      // Check whether agent_builder exists and inform the user
      const agentDir = path.join(repoRoot, '.ai', 'skills', 'workflows', 'agent');
      if (fs.existsSync(agentDir)) {
        console.log('\n┌─────────────────────────────────────────────────────────┐');
        console.log('│  ⚠️  Agent Builder Pack Detected                         │');
        console.log('├─────────────────────────────────────────────────────────┤');
        console.log('│  Found .ai/skills/workflows/agent.                      │');
        console.log('│  Agent Builder is a large workflow for building agents. │');
        console.log('│                                                         │');
        console.log('│  If your project does not need agents, consider removing│');
        console.log('│  it to reduce repo size and sync time.                  │');
        console.log('│                                                         │');
        console.log('│  Removal command:                                       │');
        console.log('│    node init/.../init-pipeline.mjs prune-agent-builder \\');
        console.log('│      --repo-root . --apply --i-understand              │');
        console.log('│                                                         │');
        console.log('│  Or keep it for future use.                             │');
        console.log('└─────────────────────────────────────────────────────────┘');
      }
      
      console.log('\nOptional: run cleanup-init --apply --i-understand --archive to archive and remove init/.');
      process.exit(0);
    }
  }

  if (command === 'validate') {
    const blueprint = readJson(blueprintPath);
    const v = validateBlueprint(blueprint);

    // Auto-update state if validation passes
    if (v.ok) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'B') {
        state[stageKey('B')].drafted = true;
        state[stageKey('B')].validated = true;
        addHistoryEvent(state, 'stage_b_validated', 'Stage B blueprint validated');
        saveState(repoRoot, state);
        console.log('[auto] State updated: stage-b.validated = true');
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
    printResult(result, format);
    process.exit(v.ok ? 0 : 1);
  }

  if (command === 'check-docs') {
    const strict = !!opts['strict'];
    const res = checkDocs(docsRoot);

    const ok = res.ok && (!strict || res.warnings.length === 0);
    const summary = ok
      ? `[ok] Stage A docs check passed: ${path.relative(repoRoot, docsRoot)}`
      : `[error] Stage A docs check failed: ${path.relative(repoRoot, docsRoot)}`;

    // Auto-update state if validation passes
    if (ok) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'A') {
        state[stageKey('A')].validated = true;
        state[stageKey('A')].docsWritten = {
          requirements: fs.existsSync(path.join(docsRoot, 'requirements.md')),
          nfr: fs.existsSync(path.join(docsRoot, 'non-functional-requirements.md')),
          glossary: fs.existsSync(path.join(docsRoot, 'domain-glossary.md')),
          riskQuestions: fs.existsSync(path.join(docsRoot, 'risk-open-questions.md'))
        };
        addHistoryEvent(state, 'stage_a_validated', 'Stage A docs validated');
        saveState(repoRoot, state);
        console.log('[auto] State updated: stage-a.validated = true');
      }
    }

    printResult({ ok, errors: res.errors, warnings: res.warnings, summary }, format);
    process.exit(ok ? 0 : 1);
  }

  if (command === 'suggest-packs') {
    const blueprint = readJson(blueprintPath);

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

    printResult(result, format);
    process.exit(v.ok ? 0 : 1);
  }

  if (command === 'scaffold') {
    const apply = !!opts['apply'];
    const blueprint = readJson(blueprintPath);

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
    process.exit(0);
  }

  if (command === 'apply') {
    const providers = opts['providers'] || 'both';
    const requireStageA = !!opts['require-stage-a'];
    const skipConfigs = !!opts['skip-configs'];
    const skipAgentBuilder = !!opts['skip-agent-builder'];
    const cleanup = !!opts['cleanup-init'];
    const archiveAll = !!opts['archive'];
    const archiveDocs = !!opts['archive-docs'];
    const archiveBlueprint = !!opts['archive-blueprint'];

    if (cleanup && !opts['i-understand']) {
      die('[error] --cleanup-init requires --i-understand');
    }
    if (skipAgentBuilder && !opts['i-understand']) {
      die('[error] --skip-agent-builder requires --i-understand');
    }
    if (!cleanup && (archiveAll || archiveDocs || archiveBlueprint)) {
      console.warn('[warn] Archive flags are ignored without --cleanup-init');
    }

    const blueprint = readJson(blueprintPath);

    // Validate blueprint
    const v = validateBlueprint(blueprint);
    if (!v.ok) die('[error] Blueprint validation failed. Fix errors and re-run.');

    // Stage A docs check (strict only when explicitly required)
    const docsCheckRes = checkDocs(docsRoot);
    if (requireStageA) {
      const strictOk = docsCheckRes.ok && docsCheckRes.warnings.length === 0;
      if (!strictOk) die('[error] Stage A docs check failed in strict mode. Fix docs and re-run.');
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

    // Generate config files (default: enabled)
    let configResults = [];
    if (!skipConfigs) {
      configResults = generateConfigFiles(repoRoot, blueprint, true);
      console.log('[ok] Config files generated.');
      for (const r of configResults) {
        const mode = r.mode ? ` (${r.mode})` : '';
        const reason = r.reason ? ` [${r.reason}]` : '';
        console.log(`  - ${r.action}: ${r.file}${mode}${reason}`);
      }
    }

    // Generate project-specific README.md
    const readmeResult = generateProjectReadme(repoRoot, blueprint, true);
    if (readmeResult.op === 'write' && readmeResult.mode === 'applied') {
      console.log('[ok] README.md generated from blueprint.');
    } else if (readmeResult.reason) {
      console.log(`[info] README.md: ${readmeResult.reason}`);
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
    const syncResult = syncWrappers(repoRoot, providers, true);
    if (syncResult.mode === 'failed') die(`[error] sync-skills.mjs failed with exit code ${syncResult.exitCode}`);

    // Auto-update state
    const state = loadState(repoRoot);
    if (state) {
      state[stageKey('C')].scaffoldApplied = true;
      state[stageKey('C')].configsGenerated = !skipConfigs;
      state[stageKey('C')].manifestUpdated = true;
      state[stageKey('C')].wrappersSynced = syncResult.mode === 'applied';
      addHistoryEvent(state, 'stage_c_applied', 'Stage C apply completed');
      saveState(repoRoot, state);
      console.log('[auto] State updated: stage-c.* = true');
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
          { archiveDocs: wantsArchiveDocs, archiveBlueprint: wantsArchiveBlueprint },
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
      console.log(`- Manifest updated: ${path.relative(repoRoot, manifestResult.path)}`);
      if (archiveResult) console.log(`- Archive: ${archiveResult.mode}`);
      if (pruneResult) console.log(`- Agent workflow prune: ${pruneResult.mode}`);
      console.log(`- Wrappers synced via: ${syncResult.cmd || '(skipped)'}`);
      if (cleanupResult) console.log(`- init/ cleanup: ${cleanupResult.mode}`);
    }

    process.exit(0);
  }

  if (command === 'cleanup-init') {
    if (!opts['i-understand']) die('[error] cleanup-init requires --i-understand');
    const apply = !!opts['apply'];
    const archiveAll = !!opts['archive'];
    const archiveDocs = !!opts['archive-docs'];
    const archiveBlueprint = !!opts['archive-blueprint'];
    const wantsArchiveDocs = archiveAll || archiveDocs;
    const wantsArchiveBlueprint = archiveAll || archiveBlueprint;

    let archiveResult = null;
    if (wantsArchiveDocs || wantsArchiveBlueprint) {
      archiveResult = archiveInitArtifacts(
        repoRoot,
        docsRoot,
        blueprintPath,
        { archiveDocs: wantsArchiveDocs, archiveBlueprint: wantsArchiveBlueprint },
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
      console.log('[info] Re-syncing skill wrappers...');
      syncResult = syncWrappers(repoRoot, providers, true);
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
    process.exit(0);
  }

  usage(1);
}

main();
