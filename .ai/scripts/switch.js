#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const provider = process.argv[2]?.toLowerCase();

if (!provider) {
  console.log('Usage: node switch.js <provider>');
  console.log('Valid providers: claude, codex, cursor, copilot, gemini');
  process.exit(1);
}

console.log(`Switching to ${provider} provider...`);

const adaptScript = path.join(__dirname, 'adapt.js');
execSync(`node "${adaptScript}" ${provider}`, { stdio: 'inherit' });



