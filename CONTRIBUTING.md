# Contributing

Thanks for your interest in improving AI PR Reviewer.

## Development setup

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Node 20+ is required.

## Before opening a PR

1. `npm run lint` — Biome check passes.
2. `npm run typecheck` — no TS errors.
3. `npm test` — all tests green.
4. `npm run build` — commit the updated `dist/` bundle. CI rejects PRs where `dist/` is out of date.

## Commit style

Short imperative subject (`Fix: …`, `Add: …`, `Update: …`). Explain the *why* in the body when the change is non-obvious.

## Reporting bugs

Open a GitHub issue with:
- Action version (or commit SHA)
- Workflow snippet that reproduces the issue
- Expected vs. actual behavior
- Relevant log output (redact tokens)

For security issues, see [SECURITY.md](SECURITY.md) — do not open a public issue.

## Scope

This Action focuses on bug, security, and performance review. Style/formatting feedback is intentionally out of scope — use Biome/Prettier/ESLint for that.
