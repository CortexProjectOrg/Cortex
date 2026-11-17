# Temporary picomatch security patch

AINotes overrides every `picomatch` dependency with this private local fork. It retains the 4.0.7 public CommonJS API, including `posix.js` and `lib/*`. Vite, Vitest, Workbox, and their versions are unchanged. No install script or network download applies the patch; `npm ci --ignore-scripts` also installs the patched source.

## Source and scope

- Base: the unmodified npm `picomatch@4.0.7` archive, https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz.
- Archive integrity: `sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==`.
- Parser patch: [upstream candidate PR #256](https://github.com/micromatch/picomatch/pull/256), by Laila Vinson, pinned to commit `578a87fae0ffd1f2e5420ff4d52135eb9210d169`. Only that PR's `lib/parse.js` changes are applied, recorded in [security.patch](security.patch). This is an unmerged candidate, not an official release or maintainer-approved security fix.
- All other runtime source, the upstream README, and the MIT license are preserved. `package.json` identifies the private fork as `@ainotes/picomatch@4.0.7+ainotes.1` and removes upstream development-only scripts and dependencies. The direct development dependency anchors the local package for npm's optional-peer resolution; the override routes all transitive consumers to it.
- [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) lists versions through 4.0.7 as vulnerable, with no patched release as of November 17, 2026.

The parser removes redundant outer repetition around simple wildcard branches such as `+(*a)` and `*(a*)`. For complex wildcard branches that cannot safely be flattened, it uses the existing literal-matching safeguard. It also guards overlapping repeated words and embedded repetitions. Ordinary path globs and safe alternatives continue to work. Complex patterns such as `*(a*|b)` now match only their literal spelling by default; wildcard captures can cover the flattened body instead of the last repetition. The explicit upstream `maxExtglobRecursion: false` escape hatch remains unsafe and must not be used for untrusted patterns. This patch does not claim to make arbitrary regular expressions or every possible glob safe.

## Verification and maintenance

`tests/picomatch.test.ts` checks lockfile and installed dependency resolution, common build globs, matching compatibility, and hostile patterns in child processes with hard timeouts. These checks run in the existing `npm run check` CI job; the existing `npm audit --audit-level=moderate` gate remains enabled without advisory exclusions.

**Audit limitation:** npm audit has no advisory history for this private fork. A clean audit covers registry dependencies; it is not independent evidence that the fork is safe. The source patch and behavioral tests provide the mitigation evidence. Continue monitoring the upstream picomatch advisory while this override exists.

To reproduce, verify the archive integrity, extract 4.0.7, and run `git apply /path/to/security.patch` in the extracted package. Compare the resulting runtime files with this directory, normalizing line endings to LF; do not reformat the vendored source. The patched parser's SHA-256 is `62cc28487f07eadb03dbc7a9012da742c2ed438521852c0cc8cf7b7140ca412f`. The original package metadata can be obtained from the same archive.

Initial validation also ran the upstream 4.0.7 test suite with the candidate's added security cases and its intentional complex-pattern expectation change: 1,991 tests passed.

Once an official release fixes this advisory, remove the override, direct development dependency, and this directory; refresh the lockfile; replace the local-fork resolution assertions with the official patched version bounds; retain the behavioral regression tests; and run `npm ci`, `npm run format:check`, `npm run check`, and `npm audit --audit-level=moderate` before merging.
