import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const picomatch = require('picomatch');

describe('picomatch temporary security patch', () => {
  it('routes every locked consumer and optional peer to the patched package', () => {
    const patchedEntry = realpathSync(resolve(root, 'vendor/picomatch/index.js'));
    const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
    expect(lock.packages['node_modules/picomatch']).toMatchObject({
      resolved: 'vendor/picomatch',
      link: true
    });
    expect(require('picomatch/package.json')).toMatchObject({
      name: '@ainotes/picomatch',
      version: '4.0.7+ainotes.1',
      private: true
    });
    const consumers: string[] = [];
    for (const [location, entry] of Object.entries(lock.packages)) {
      const pkg = entry as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };
      if (pkg.dependencies?.picomatch || pkg.devDependencies?.picomatch || pkg.peerDependencies?.picomatch) {
        consumers.push(location);
        const consumerRequire = createRequire(resolve(root, location, 'package.json'));
        expect(realpathSync(consumerRequire.resolve('picomatch')), location).toBe(patchedEntry);
      }
      if (location.endsWith('/node_modules/picomatch')) {
        throw new Error(`Unexpected nested picomatch installation: ${location}`);
      }
    }
    expect(consumers).toEqual(
      expect.arrayContaining([
        'node_modules/vite',
        'node_modules/vitest',
        'node_modules/tinyglobby',
        'node_modules/fdir',
        'node_modules/@rollup/pluginutils'
      ])
    );
  });

  it('completes adversarial non-matches within a child-process deadline', () => {
    const script = `
      const assert = require('node:assert/strict');
      const matchers = [require(${JSON.stringify(require.resolve('picomatch'))}),
        require(${JSON.stringify(require.resolve('picomatch/posix'))})];
      const patterns = ['+(*)b', '+(*a)', '*(*a)', '+(*?a)', '+(a*b)c',
        '+(ab|abab)', '+(*a|b)', '+(@(*a)|b)', '+(@(*a))',
        '+(*(a)a)', '+(a*(a))', '+(a+(a))'];
      for (const pm of matchers) {
        for (const options of [{}, { dot: true }, { windows: true }, { capture: true }]) {
          for (const pattern of patterns) {
            const input = pattern.includes('ab|') ? 'ab'.repeat(10000) + '!' : 'a'.repeat(10000) + '!';
            assert.equal(pm(pattern, options)(input), false, pattern);
            assert.equal(pm.makeRe(pattern, options).test(input), false, pattern);
            assert.equal(pm.compileRe(pm.parse(pattern, options), options).test(input), false, pattern);
          }
        }
      }
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      timeout: 3000,
      encoding: 'utf8'
    });
    expect(result.error, result.error?.message).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
  });

  it('preserves common build globs and safe alternatives', () => {
    for (const [pattern, yes, no] of [
      ['**/*.{js,css,html,woff2}', 'assets/app.js', 'assets/app.ts'],
      ['**/*.test.{ts,tsx}', 'tests/paper.test.ts', 'src/paper.ts'],
      ['**/!(*.d).ts', 'src/paper.ts', 'src/paper.d.ts'],
      ['**/+(foo|bar).js', 'assets/foobar.js', 'assets/other.js'],
      ['**/file[0-9].js', 'assets/file2.js', 'assets/filex.js']
    ]) {
      expect(picomatch.isMatch(yes, pattern), pattern).toBe(true);
      expect(picomatch.isMatch(no, pattern), pattern).toBe(false);
    }
    expect(picomatch.isMatch('.hidden/file.ts', '**/*.ts')).toBe(false);
    expect(picomatch.isMatch('.hidden/file.ts', '**/*.ts', { dot: true })).toBe(true);
  });

  it('preserves simple wildcard matching across path and capture options', () => {
    const bodies = ['*', '*a', 'a*', '*?a', 'a*b', '*[ab]', '*[!b]', '*"a"', '*\\?'];
    const values = ['', 'a', 'b', 'ab', 'aa', 'aba', 'abab', 'aab', '.a', 'a/b', 'a\\b', '?a'];
    for (const options of [{}, { dot: true }, { windows: true }, { capture: true }, { bash: true }]) {
      for (const body of bodies) {
        for (const value of values) {
          for (const quantifier of ['+', '*']) {
            const pattern = `pre${quantifier}(${body})post`;
            const input = `pre${value}post`;
            // Only short, bounded inputs reach the unguarded reference behavior.
            expect(picomatch.isMatch(input, pattern, options), `${pattern}: ${input}`).toBe(
              picomatch.isMatch(input, pattern, { ...options, maxExtglobRecursion: false })
            );
          }
        }
      }
    }
    expect(picomatch.isMatch('c', '*(*a)c')).toBe(true);
    expect(picomatch.isMatch('c', '+(*a)c')).toBe(false);
    expect(picomatch.makeRe('+(*a)', { capture: true }).exec('aba')?.slice(1)).toEqual(['aba', 'ab']);
  });

  it('keeps escaped, quoted, and bracketed stars literal', () => {
    for (const pattern of ['+(\\*)', '+([*])', '+("*")']) {
      expect(picomatch.isMatch('**', pattern), pattern).toBe(true);
      expect(picomatch.isMatch('aa', pattern), pattern).toBe(false);
    }
  });

  it('literalizes ambiguous patterns that cannot be safely flattened', () => {
    for (const pattern of [
      '+(*a/b)',
      '+(*{a,b})',
      '+(@(*a))',
      '+(*a|b)',
      '*(a*|b)',
      '+(ab|abab)',
      '+(*(a)a)',
      '+(a*(a))',
      '+(a+(a))'
    ]) {
      expect(picomatch.isMatch(pattern, pattern), pattern).toBe(true);
      expect(picomatch.isMatch('aaaa!', pattern), pattern).toBe(false);
    }
  });
});
