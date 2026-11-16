import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

// High-confidence repository guard; deployment secret inventories remain an operator task.
const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8'
})
  .split('\0')
  .filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{60,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/
];
const failures = [];
for (const path of new Set(paths)) {
  if (/\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) {
    failures.push(path);
    continue;
  }
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    continue;
  }
  if (patterns.some((pattern) => pattern.test(text))) failures.push(path);
}
if (failures.length) {
  console.error('Review possible secrets in:\n' + failures.join('\n'));
  process.exitCode = 1;
} else
  console.log('No recognized credentials or non-example environment files found in tracked/unignored files.');
