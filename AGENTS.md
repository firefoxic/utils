# AGENTS.md

## Project

Single-package TypeScript library (`@firefoxic/utils`) exposing `getProjectRoot` and `setGitHubEnvVar`. Built with tsrs (a Rust port of tsc), linted with oxlint, tested with Node's built-in test runner. No test files exist yet.

## Commands

- `make help` — list targets.
- `make check` — typecheck (`tsrs`).
- `make lint` / `make fix` — oxlint (`--fix` for the latter).
- `make test` — `node --test`.
- `make build` — `rm -rf dist` then `tsrs -p tsconfig.build.json`.
- `make verify` — `check lint test build`; this is what CI runs.
- `make release` — `verify` plus `pnpm dlx @firefoxic/release-it`.
- Single test file: `node --test path/to/file.test.ts` (Node 26 strips types).
- Minimum focused verification after edits: `make lint && make check`.

## Toolchain

- Use pnpm, not npm/yarn. `pnpm install` runs `prepare`, which sets `core.hooksPath .githooks`.
- Dev engines auto-download Node >=26.13 / pnpm >=12.19 if missing (`devEngines.onFail: download`). Runtime requires Node >=22.18.
- `tsrs` is not on `PATH` globally; the Makefile prepends `node_modules/.bin`. Invoke via `make` or `./node_modules/.bin/tsrs`.
- Pre-commit hook (`.githooks/pre-commit`) runs `git stash -ku` then `make lint && make test`. Untracked files are stashed, so they are not linted/tested by the hook.
- CI: `.github/workflows/test.yaml` runs `make verify` on pushes to `main` and all PRs. `.github/workflows/release.yaml` runs `make release` on pushes to `release`/`release-*`.

## Structure

- `src/` — library source (kebab-case files). `src/index.ts` re-exports the public API.
- `dist/` — build output, gitignored and published. Never edit by hand.
- `tsconfig.build.json` excludes `src/**/*.test.*` from the build.
- `pnpm-workspace.yaml` configures pnpm behavior (allowBuilds, lockfile), not a multi-package workspace.

## Code conventions

- `.editorconfig`: tabs, LF, trim trailing whitespace, final newline (except `*.md` keeps trailing whitespace and `*.svg` has no final newline). YAML uses 2 spaces.
- TypeScript: NodeNext module resolution; imports must include the `.ts` extension (rewritten to `.js` on build via `rewriteRelativeImportExtensions`). `verbatimModuleSyntax`, `erasableSyntaxOnly` (no runtime-emitting constructs such as enums), strict null checks, `noUncheckedIndexedAccess`.
- Oxlint extends `@firefoxic/oxlint-config`.

## Gotchas

- `getProjectRoot()` returns `""` (not `"/"`) when `CI` or `REPO_NAME` is unset, because callers append `/` (`${getProjectRoot()}/`). Do not "fix" it to return `"/"`.
- `setGitHubEnvVar` is async; it no-ops outside CI and throws when `GITHUB_ENV` is unset. It only appends to `GITHUB_ENV`.
- No tests exist yet; `node --test` reports 0 and exits 0. Add tests as `*.test.ts`.
- Use `tmp/` for scratch work; it is gitignored and must never be committed.
