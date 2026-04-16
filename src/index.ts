import { readFileSync } from 'node:fs';
import { loadConfig } from './config.js';
import {
  type InlineComment,
  createOctokit,
  getPRFiles,
  matchesAnyGlob,
  postReview,
} from './github.js';
import { createAnthropic, reviewFiles } from './reviewer.js';

interface PullRequestEvent {
  pull_request?: {
    number: number;
    head: { sha: string };
  };
  repository?: {
    name: string;
    owner: { login: string };
  };
  number?: number;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function requireInput(name: string, fallbackEnv?: string): string {
  const upper = name.replace(/ /g, '_').toUpperCase();
  const v =
    process.env[`INPUT_${upper}`] ||
    process.env[`INPUT_${upper.replace(/-/g, '_')}`] ||
    (fallbackEnv ? process.env[fallbackEnv] : undefined);
  if (!v) throw new Error(`Missing required action input: ${name}`);
  return v;
}

async function main(): Promise<void> {
  const githubToken = requireInput('github-token', 'GITHUB_TOKEN');
  const anthropicApiKey = requireInput('anthropic-api-key', 'ANTHROPIC_API_KEY');
  const eventPath = requireEnv('GITHUB_EVENT_PATH');
  const configPath = process.env.INPUT_CONFIG_PATH || '.ai-reviewer.yml';

  const event = JSON.parse(readFileSync(eventPath, 'utf8')) as PullRequestEvent;
  const pr = event.pull_request;
  const repo = event.repository;
  if (!pr || !repo) {
    throw new Error('Event payload is not a pull_request event');
  }

  const config = loadConfig(configPath);
  const octokit = createOctokit(githubToken);
  const anthropic = createAnthropic(anthropicApiKey);

  const allFiles = await getPRFiles(octokit, repo.owner.login, repo.name, pr.number);
  const files = allFiles.filter((f) => !matchesAnyGlob(f.filename, config.exclude));

  if (files.length === 0) {
    console.log('No reviewable files after applying excludes.');
    return;
  }
  if (files.length > config.max_files) {
    throw new Error(
      `PR touches ${files.length} files, exceeds max_files=${config.max_files}. Aborting.`,
    );
  }

  console.log(`Reviewing ${files.length} file(s) with model ${config.model}…`);
  const reviews = await reviewFiles(anthropic, config, files);

  const inline: InlineComment[] = [];
  const summaryLines: string[] = [];
  for (const r of reviews) {
    if (r.summary) summaryLines.push(`- **${r.filename}**: ${r.summary}`);
    for (const c of r.comments) {
      inline.push({
        path: r.filename,
        line: c.line,
        body: `**${c.severity.toUpperCase()} · ${c.category}** — ${c.message}`,
      });
    }
  }

  const body =
    inline.length === 0
      ? 'Claude PR Auditor: no issues found above the configured severity threshold.'
      : `Claude PR Auditor found ${inline.length} issue(s):\n\n${summaryLines.join('\n')}`;

  await postReview(octokit, repo.owner.login, repo.name, pr.number, pr.head.sha, body, inline);
  console.log(`Posted review with ${inline.length} inline comment(s).`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error(msg);
  process.exit(1);
});
