# AI PR Reviewer

[![CI](https://github.com/LennardGeissler/ai-pr-reviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/LennardGeissler/ai-pr-reviewer/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/LennardGeissler/ai-pr-reviewer/badge)](https://securityscorecards.dev/viewer/?uri=github.com/LennardGeissler/ai-pr-reviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Self-hosted GitHub Action that reviews pull requests with Claude. Bring your own Anthropic API key.

## Quickstart

```yaml
# .github/workflows/ai-review.yml
name: AI Review
on:
  pull_request:
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: LennardGeissler/ai-pr-reviewer@v0.1.0
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Configuration

Optional `.ai-reviewer.yml` in repo root:

```yaml
model: claude-sonnet-4-6
max_files: 20
exclude:
  - "**/*.lock"
  - "dist/**"
severity_threshold: medium   # low | medium | high
custom_instructions: |
  We use Vitest, do not suggest Jest patterns.
```

## Cost

Typical PR: $0.01–0.05 depending on diff size. Uses prompt caching for the system prompt.

## Why this exists

- Self-hosted, no third-party service sees your code besides Anthropic.
- MIT-licensed, your key, your cost.
- Focus on bugs/security/performance, not style.

## Security considerations

Read this before deploying to a repo that accepts pull requests from forks or untrusted contributors.

- **Fork PRs**: GitHub does not expose secrets to workflows triggered by `pull_request` from forks. The Action will fail without `ANTHROPIC_API_KEY`. Do NOT switch to `pull_request_target` unless you fully understand the risks — that trigger runs with a write-scoped token in the context of the base branch and is a known supply-chain attack vector.
- **Prompt injection**: PR diffs are untrusted input. A malicious contributor can embed text like `// IGNORE PREVIOUS INSTRUCTIONS` in their code to manipulate the review. The system prompt instructs Claude to treat the diff as inert data and to flag injection attempts as HIGH severity, but no LLM mitigation is bulletproof. Treat the bot's output as advisory, never auto-merge based on it.
- **Cost control**: `max_files` (default 20) caps PR size. There is no per-file token limit yet — a single huge diff can still cost more than expected. Monitor your Anthropic usage dashboard and set a billing alert.
- **Token scope**: The default `${{ github.token }}` has the minimum permissions declared in your workflow. Keep `permissions:` to `contents: read` and `pull-requests: write` — nothing more.
- **Data handling**: Your PR diffs are sent to the Anthropic API. Review [Anthropic's data usage policy](https://www.anthropic.com/legal/privacy) before using on proprietary code.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT.
