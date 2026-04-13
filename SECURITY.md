# Security Policy

## Supported Versions

Only the latest minor release receives security updates during the v0.x phase.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | yes       |
| < 0.1   | no        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately via GitHub's [Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (Security tab → Report a vulnerability).

Include:
- A description of the issue and its impact
- Steps to reproduce, or a proof-of-concept
- Affected versions
- Any suggested mitigation

You should receive an acknowledgement within 5 business days. We aim to release a fix or mitigation within 30 days of a confirmed report, depending on severity.

## Scope

In scope:
- The Action code in this repository (`src/`, `dist/`, `action.yml`)
- Documentation that could mislead users into insecure configurations

Out of scope:
- Vulnerabilities in upstream dependencies (report those to the respective projects; we will track via Dependabot)
- Issues caused by users granting excessive token permissions in their own workflows
- Prompt-injection attacks against the LLM itself — these are a known limitation and documented in the README. We welcome reports of *novel* injection vectors that bypass the documented mitigations.

## Disclosure

Coordinated disclosure preferred. Once a fix is released, we will publish a GitHub Security Advisory crediting the reporter (unless anonymity is requested).
