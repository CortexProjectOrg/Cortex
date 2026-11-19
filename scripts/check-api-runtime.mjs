import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Test emitted JavaScript with Node's resolver, without Vite/tsx masking invalid imports.
const root = fileURLToPath(new URL('../', import.meta.url));
const cache = resolve(root, 'node_modules/.cache');
await mkdir(cache, { recursive: true });
const output = await mkdtemp(join(cache, 'cortex-api-'));
if (!output.startsWith(cache + '/cortex-api-') && !output.startsWith(cache + '\\cortex-api-'))
  throw new Error('Unexpected runtime test directory.');
try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      '-p',
      'tsconfig.api.json',
      '--noEmit',
      'false',
      '--rootDir',
      '.',
      '--outDir',
      output
    ],
    { cwd: root, stdio: 'inherit' }
  );
  await writeFile(join(output, 'package.json'), '{"type":"module"}');
  await writeFile(
    join(output, 'smoke.mjs'),
    `
    import assert from 'node:assert/strict';
    import config from './api/auth/config.js';
    import verify from './api/auth/verify.js';
    import sync from './api/sync.js';
    import graph from './api/graph.js';
    process.env.GOOGLE_CLIENT_ID = 'runtime-test.apps.googleusercontent.com';
    const invoke = async (handler, method) => {
      const response = { code: 0, body: null, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
      await handler({ method, headers: { host: 'runtime.test' } }, response);
      return response;
    };
    const result = await invoke(config, 'GET');
    assert.equal(result.code, 200);
    assert.equal(result.body.clientId, process.env.GOOGLE_CLIENT_ID);
    assert.equal((await invoke(verify, 'POST')).code, 401);
    assert.equal((await invoke(sync, 'GET')).code, 401);
    assert.equal((await invoke(graph, 'POST')).code, 410);
    console.log('Compiled API handlers start and respond under native Node ESM.');
  `
  );
  execFileSync(process.execPath, [join(output, 'smoke.mjs')], { cwd: root, stdio: 'inherit' });
} finally {
  await rm(output, { recursive: true, force: true });
}
