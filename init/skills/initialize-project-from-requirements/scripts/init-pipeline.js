#!/usr/bin/env node
/**
 * init-pipeline.js
 *
 * Dependency-free helper for a 3-stage, verifiable init pipeline:
 *
 *   Stage A: requirements docs under `docs/project/`
 *   Stage B: blueprint JSON at `docs/project/project-blueprint.json`
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

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

function usage(exitCode = 0) {
  const msg = `
Usage:
  node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js <command> [options]

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

  validate
    --blueprint <path>          Blueprint JSON path (required)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)

  check-docs
    --docs-root <path>          Stage A docs root (default: <repo-root>/docs/project)
    --repo-root <path>          Repo root (default: cwd)
    --strict                    Treat warnings as errors (exit non-zero)
    --format <text|json>        Output format (default: text)

  suggest-packs
    --blueprint <path>          Blueprint JSON path (required)
    --repo-root <path>          Repo root (default: cwd)
    --format <text|json>        Output format (default: text)
    --write                      Add missing recommended packs into blueprint (safe-add only)

  scaffold
    --blueprint <path>          Blueprint JSON path (required)
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually create directories/files (default: dry-run)

  apply
    --blueprint <path>          Blueprint JSON path (required)
    --repo-root <path>          Repo root (default: cwd)
    --providers <both|codex|claude|codex,claude>
                                Providers to sync (default: both)
    --require-stage-a           Run 'check-docs --strict' and fail if it does not pass
    --skip-configs              Skip generating config files (package.json, etc.)
    --cleanup-init              Remove <repo-root>/init after success (requires --i-understand)
    --i-understand              Required acknowledgement for destructive actions

  cleanup-init
    --repo-root <path>          Repo root (default: cwd)
    --apply                      Actually remove init/ (default: dry-run)
    --i-understand              Required acknowledgement (refuses without it)

Examples:
  node .../init-pipeline.js start
  node .../init-pipeline.js status
  node .../init-pipeline.js check-docs --docs-root docs/project
  node .../init-pipeline.js validate --blueprint docs/project/project-blueprint.json
  node .../init-pipeline.js apply --blueprint docs/project/project-blueprint.json --providers codex,claude
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

function createInitialState() {
  return {
    version: 1,
    stage: 'A',
    createdAt: new Date().toISOString(),
    stageA: {
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
    stageB: {
      drafted: false,
      validated: false,
      packsReviewed: false,
      userApproved: false
    },
    stageC: {
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
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
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
  const stageA = state.stageA || {};
  const stageB = state.stageB || {};
  const stageC = state.stageC || {};

  const mustAskKeys = Object.keys(stageA.mustAsk || {});
  const mustAskAnswered = mustAskKeys.filter(k => stageA.mustAsk[k]?.answered).length;

  const docsKeys = ['requirements', 'nfr', 'glossary', 'riskQuestions'];
  const docsWritten = docsKeys.filter(k => stageA.docsWritten?.[k]).length;

  return {
    stage: state.stage,
    stageA: {
      mustAskTotal: mustAskKeys.length,
      mustAskAnswered,
      docsTotal: docsKeys.length,
      docsWritten,
      validated: !!stageA.validated,
      userApproved: !!stageA.userApproved
    },
    stageB: {
      drafted: !!stageB.drafted,
      validated: !!stageB.validated,
      packsReviewed: !!stageB.packsReviewed,
      userApproved: !!stageB.userApproved
    },
    stageC: {
      scaffoldApplied: !!stageC.scaffoldApplied,
      configsGenerated: !!stageC.configsGenerated,
      manifestUpdated: !!stageC.manifestUpdated,
      wrappersSynced: !!stageC.wrappersSynced,
      userApproved: !!stageC.userApproved
    }
  };
}

function printStatus(state, repoRoot) {
  const progress = getStageProgress(state);
  const stageNames = { A: '需求 (Requirements)', B: '蓝图 (Blueprint)', C: '脚手架 (Scaffold)', complete: '完成' };

  console.log('');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  初始化状态 (Init State)                                │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  当前阶段: Stage ${progress.stage} - ${stageNames[progress.stage] || progress.stage}`);
  console.log('│');

  if (progress.stage === 'A' || progress.stage === 'B' || progress.stage === 'C') {
    console.log('│  Stage A 进度:');
    console.log(`│    必问问题: ${progress.stageA.mustAskAnswered}/${progress.stageA.mustAskTotal} 已完成`);
    console.log(`│    文档撰写: ${progress.stageA.docsWritten}/${progress.stageA.docsTotal} 已完成`);
    console.log(`│    验证状态: ${progress.stageA.validated ? '✓ 已验证' : '✗ 未验证'}`);
    console.log(`│    用户确认: ${progress.stageA.userApproved ? '✓ 已确认' : '✗ 未确认'}`);
  }

  if (progress.stage === 'B' || progress.stage === 'C') {
    console.log('│');
    console.log('│  Stage B 进度:');
    console.log(`│    蓝图起草: ${progress.stageB.drafted ? '✓' : '✗'}`);
    console.log(`│    蓝图验证: ${progress.stageB.validated ? '✓' : '✗'}`);
    console.log(`│    技能包审查: ${progress.stageB.packsReviewed ? '✓' : '✗'}`);
    console.log(`│    用户确认: ${progress.stageB.userApproved ? '✓' : '✗'}`);
  }

  if (progress.stage === 'C' || progress.stage === 'complete') {
    console.log('│');
    console.log('│  Stage C 进度:');
    console.log(`│    脚手架创建: ${progress.stageC.scaffoldApplied ? '✓' : '✗'}`);
    console.log(`│    配置文件: ${progress.stageC.configsGenerated ? '✓' : '✗'}`);
    console.log(`│    清单更新: ${progress.stageC.manifestUpdated ? '✓' : '✗'}`);
    console.log(`│    Wrapper同步: ${progress.stageC.wrappersSynced ? '✓' : '✗'}`);
  }

  console.log('│');
  console.log('│  下一步:');
  if (progress.stage === 'A') {
    if (!progress.stageA.validated) {
      console.log('│    1. 完成需求访谈并撰写文档');
      console.log('│    2. 运行: check-docs --docs-root docs/project');
    } else if (!progress.stageA.userApproved) {
      console.log('│    请用户审查 Stage A 文档并确认');
      console.log('│    确认后运行: advance');
    }
  } else if (progress.stage === 'B') {
    if (!progress.stageB.validated) {
      console.log('│    1. 创建 docs/project/project-blueprint.json');
      console.log('│    2. 运行: validate --blueprint docs/project/project-blueprint.json');
    } else if (!progress.stageB.userApproved) {
      console.log('│    请用户审查蓝图并确认');
      console.log('│    确认后运行: advance');
    }
  } else if (progress.stage === 'C') {
    if (!progress.stageC.wrappersSynced) {
      console.log('│    运行: apply --blueprint docs/project/project-blueprint.json');
    } else if (!progress.stageC.userApproved) {
      console.log('│    初始化基本完成，请用户确认');
      console.log('│    确认后可选运行: cleanup-init --apply --i-understand');
    }
  } else if (progress.stage === 'complete') {
    console.log('│    初始化已完成！');
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
  let templateName = mappings[key] || mappings[language] || null;

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
    backend: 'backend/',
    frontend: 'frontend/',
    data: 'data/',
    diagrams: 'diagrams/',
    ops: 'ops/',
    scaffold: 'scaffold/'
  };
}

function packOrder() {
  return ['workflows', 'backend', 'frontend', 'data', 'diagrams', 'ops', 'scaffold'];
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

  const ok = errors.length === 0;
  return { ok, errors, warnings, packs };
}

function recommendedPacksFromBlueprint(blueprint) {
  const rec = new Set(['workflows']);
  const caps = blueprint.capabilities || {};
  const q = blueprint.quality || {};

  if (caps.backend && caps.backend.enabled) rec.add('backend');
  if (caps.frontend && caps.frontend.enabled) rec.add('frontend');

  if (caps.database && caps.database.enabled) rec.add('data');
  if (caps.bpmn && caps.bpmn.enabled) rec.add('diagrams');

  if ((q.ci && q.ci.enabled) || (q.devops && q.devops.containerize)) rec.add('ops');

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

function planScaffold(repoRoot, blueprint, apply) {
  const results = [];
  const repo = blueprint.repo || {};
  const caps = blueprint.capabilities || {};
  const layout = repo.layout;

  // Always ensure docs directory exists (Stage A/B will live here)
  results.push(ensureDir(path.join(repoRoot, 'docs'), apply));
  results.push(ensureDir(path.join(repoRoot, 'docs', 'project'), apply));

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
    manifest = { version: 1, collections: { current: { includePrefixes: [], excludePrefixes: [], excludeSkillNames: [] } } };
  }

  if (!manifest.collections) manifest.collections = {};
  if (!manifest.collections.current) manifest.collections.current = {};
  const current = manifest.collections.current;

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

  current.includePrefixes = uniq(includePrefixes);

  // Optional excludes
  const skills = blueprint.skills || {};
  if (Array.isArray(skills.excludePrefixes)) current.excludePrefixes = uniq(skills.excludePrefixes);
  if (Array.isArray(skills.excludeSkillNames)) current.excludeSkillNames = uniq(skills.excludeSkillNames);

  if (!apply) return { op: 'write', path: manifestPath, mode: 'dry-run', warnings, includePrefixes: current.includePrefixes };

  writeJson(manifestPath, manifest);
  return { op: 'write', path: manifestPath, mode: 'applied', warnings, includePrefixes: current.includePrefixes };
}

function syncWrappers(repoRoot, providers, apply) {
  const scriptPath = path.join(repoRoot, '.ai', 'scripts', 'sync-skills.js');
  if (!fs.existsSync(scriptPath)) {
    return { op: 'skip', path: scriptPath, reason: 'sync-skills.js not found' };
  }
  const providersArg = providers || 'both';
  const cmd = 'node';
  const args = [scriptPath, '--scope', 'current', '--providers', providersArg];

  if (!apply) return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'dry-run' };

  const res = childProcess.spawnSync(cmd, args, { stdio: 'inherit', cwd: repoRoot });
  if (res.status !== 0) {
    return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'failed', exitCode: res.status };
  }
  return { op: 'run', cmd: `${cmd} ${args.join(' ')}`, mode: 'applied' };
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
  const blueprintPath = resolvePath(repoRoot, opts['blueprint']);
  const docsRoot = resolvePath(repoRoot, opts['docs-root'] || path.join('docs', 'project'));

  // ========== start ==========
  if (command === 'start') {
    const existingState = loadState(repoRoot);
    if (existingState) {
      console.log('[info] 检测到已存在的初始化状态');
      printStatus(existingState, repoRoot);
      console.log('[info] 如需重新开始，请先删除 init/.init-state.json');
      process.exit(0);
    }

    const state = createInitialState();
    addHistoryEvent(state, 'init_started', 'Initialization started');
    saveState(repoRoot, state);

    console.log('[ok] 初始化状态已创建: init/.init-state.json');
    printStatus(state, repoRoot);
    process.exit(0);
  }

  // ========== status ==========
  if (command === 'status') {
    const state = loadState(repoRoot);
    if (!state) {
      console.log('[info] 未检测到初始化状态');
      console.log('[info] 运行 "start" 命令开始初始化');
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
      die('[error] 未检测到初始化状态，请先运行 "start" 命令');
    }

    const progress = getStageProgress(state);

    if (progress.stage === 'A') {
      if (!progress.stageA.validated) {
        die('[error] Stage A 文档尚未验证，请先运行 check-docs');
      }
      console.log('\n== Stage A → B 检查点 ==\n');
      console.log('Stage A 文档已验证通过。');
      console.log('请确认用户已审查并批准 docs/project/ 下的需求文档。');
      console.log('\n如果用户已确认，请手动更新状态：');
      console.log('  将 init/.init-state.json 中 stageA.userApproved 设为 true');
      console.log('  将 stage 设为 "B"');
      process.exit(0);
    }

    if (progress.stage === 'B') {
      if (!progress.stageB.validated) {
        die('[error] Stage B 蓝图尚未验证，请先运行 validate');
      }
      console.log('\n== Stage B → C 检查点 ==\n');
      console.log('Stage B 蓝图已验证通过。');
      console.log('请确认用户已审查并批准 docs/project/project-blueprint.json。');
      console.log('\n如果用户已确认，请手动更新状态：');
      console.log('  将 init/.init-state.json 中 stageB.userApproved 设为 true');
      console.log('  将 stage 设为 "C"');
      process.exit(0);
    }

    if (progress.stage === 'C') {
      if (!progress.stageC.wrappersSynced) {
        die('[error] Stage C 尚未完成，请先运行 apply');
      }
      console.log('\n== Stage C 完成检查点 ==\n');
      console.log('初始化已完成！');
      console.log('\n可选：运行 cleanup-init --apply --i-understand 删除 init/ 目录');
      
      state.stage = 'complete';
      state.stageC.userApproved = true;
      addHistoryEvent(state, 'init_completed', 'Initialization completed');
      saveState(repoRoot, state);
      process.exit(0);
    }

    console.log('[info] 初始化已完成');
    process.exit(0);
  }

  if (command === 'validate') {
    if (!blueprintPath) die('[error] --blueprint is required for validate');
    const blueprint = readJson(blueprintPath);
    const v = validateBlueprint(blueprint);

    // Auto-update state if validation passes
    if (v.ok) {
      const state = loadState(repoRoot);
      if (state && state.stage === 'B') {
        state.stageB.drafted = true;
        state.stageB.validated = true;
        addHistoryEvent(state, 'stage_b_validated', 'Stage B blueprint validated');
        saveState(repoRoot, state);
        console.log('[auto] 状态已更新: stageB.validated = true');
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
        state.stageA.validated = true;
        state.stageA.docsWritten = {
          requirements: fs.existsSync(path.join(docsRoot, 'requirements.md')),
          nfr: fs.existsSync(path.join(docsRoot, 'non-functional-requirements.md')),
          glossary: fs.existsSync(path.join(docsRoot, 'domain-glossary.md')),
          riskQuestions: fs.existsSync(path.join(docsRoot, 'risk-open-questions.md'))
        };
        addHistoryEvent(state, 'stage_a_validated', 'Stage A docs validated');
        saveState(repoRoot, state);
        console.log('[auto] 状态已更新: stageA.validated = true');
      }
    }

    printResult({ ok, errors: res.errors, warnings: res.warnings, summary }, format);
    process.exit(ok ? 0 : 1);
  }

  if (command === 'suggest-packs') {
    if (!blueprintPath) die('[error] --blueprint is required for suggest-packs');
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
    if (!blueprintPath) die('[error] --blueprint is required for scaffold');
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
    if (!blueprintPath) die('[error] --blueprint is required for apply');
    const providers = opts['providers'] || 'both';
    const requireStageA = !!opts['require-stage-a'];
    const skipConfigs = !!opts['skip-configs'];
    const cleanup = !!opts['cleanup-init'];

    if (cleanup && !opts['i-understand']) {
      die('[error] --cleanup-init requires --i-understand');
    }

    const blueprint = readJson(blueprintPath);

    // Validate blueprint
    const v = validateBlueprint(blueprint);
    if (!v.ok) die('[error] Blueprint validation failed. Fix errors and re-run.');

    // Stage A docs check (strict only when explicitly required)
    const stageARes = checkDocs(docsRoot);
    if (requireStageA) {
      const strictOk = stageARes.ok && stageARes.warnings.length === 0;
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

    // Manifest update
    const manifestResult = updateManifest(repoRoot, blueprint, true);
    if (manifestResult.warnings && manifestResult.warnings.length > 0) {
      for (const w of manifestResult.warnings) console.warn(`[warn] ${w}`);
    }

    // Sync wrappers
    const syncResult = syncWrappers(repoRoot, providers, true);
    if (syncResult.mode === 'failed') die(`[error] sync-skills.js failed with exit code ${syncResult.exitCode}`);

    // Auto-update state
    const state = loadState(repoRoot);
    if (state) {
      state.stageC.scaffoldApplied = true;
      state.stageC.configsGenerated = !skipConfigs;
      state.stageC.manifestUpdated = true;
      state.stageC.wrappersSynced = syncResult.mode === 'applied';
      addHistoryEvent(state, 'stage_c_applied', 'Stage C apply completed');
      saveState(repoRoot, state);
      console.log('[auto] 状态已更新: stageC.* = true');
    }

    // Optional cleanup
    let cleanupResult = null;
    if (cleanup) {
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
        stageA: stageARes,
        scaffold: scaffoldPlan,
        configs: configResults,
        manifest: manifestResult,
        sync: syncResult,
        cleanup: cleanupResult
      }, null, 2));
    } else {
      console.log('[ok] Apply completed.');
      console.log(`- Blueprint: ${path.relative(repoRoot, blueprintPath)}`);
      console.log(`- Docs root: ${path.relative(repoRoot, docsRoot)}`);
      if (!stageARes.ok) console.log('[warn] Stage A docs check had errors; consider re-running with --require-stage-a.');
      if (stageARes.warnings.length > 0) console.log('[warn] Stage A docs check has warnings; ensure TBD/TODO items are tracked.');
      console.log(`- Manifest updated: ${path.relative(repoRoot, manifestResult.path)}`);
      console.log(`- Wrappers synced via: ${syncResult.cmd || '(skipped)'}`);
      if (cleanupResult) console.log(`- init/ cleanup: ${cleanupResult.mode}`);
    }

    process.exit(0);
  }

  if (command === 'cleanup-init') {
    if (!opts['i-understand']) die('[error] cleanup-init requires --i-understand');
    const apply = !!opts['apply'];

    const res = cleanupInit(repoRoot, apply);
    if (format === 'json') {
      console.log(JSON.stringify({ ok: true, result: res }, null, 2));
    } else {
      if (!apply) {
        console.log(`[plan] ${res.op}: ${path.relative(repoRoot, res.path || '')} (${res.mode})`);
        if (res.note) console.log(`Note: ${res.note}`);
      } else {
        console.log(`[ok] ${res.op}: ${path.relative(repoRoot, res.path || '')} (${res.mode})`);
        if (res.note) console.log(`Note: ${res.note}`);
      }
    }
    process.exit(0);
  }

  usage(1);
}

main();
