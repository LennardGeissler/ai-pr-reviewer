# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Issue and pull request templates.
- Contributor Covenant Code of Conduct.
- Contributing guide.
- Release automation workflow that tags major versions on release.
- OpenSSF Scorecard workflow.

### Changed
- Moved internal planning document to `docs/plan.md`.
- README points to the real repository slug instead of the `your-org` placeholder.

### Fixed
- CI lint step unblocked by running the Biome formatter across the source tree.

## [0.1.0] - 2026-04-13

### Added
- Initial release.
- GitHub Action that reviews pull requests with Claude and posts inline comments.
- Configurable via `.ai-reviewer.yml` (model, `max_files`, `exclude`, `severity_threshold`, `custom_instructions`).
- System-prompt prompt caching to reduce per-PR cost.
- Documented security considerations for fork PRs, prompt injection, and token scope.

[Unreleased]: https://github.com/LennardGeissler/ai-pr-reviewer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/LennardGeissler/ai-pr-reviewer/releases/tag/v0.1.0
