import { Octokit } from '@octokit/rest';

export interface PRFile {
  filename: string;
  patch: string;
  status: string;
  sha: string;
}

export interface InlineComment {
  path: string;
  line: number;
  body: string;
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRFile[]> {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return files
    .filter((f) => f.status !== 'removed' && typeof f.patch === 'string')
    .map((f) => ({
      filename: f.filename,
      patch: f.patch ?? '',
      status: f.status,
      sha: f.sha,
    }));
}

export function matchesAnyGlob(path: string, patterns: readonly string[]): boolean {
  return patterns.some((p) => globToRegex(p).test(path));
}

function globToRegex(glob: string): RegExp {
  let re = '^';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i += 2;
        if (glob[i] === '/') i += 1;
        continue;
      }
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '.' || c === '+' || c === '(' || c === ')' || c === '|' || c === '^' || c === '$' || c === '{' || c === '}' || c === '[' || c === ']' || c === '\\') {
      re += `\\${c}`;
    } else {
      re += c;
    }
    i += 1;
  }
  re += '$';
  return new RegExp(re);
}

export interface HunkLine {
  newLine: number;
  type: 'add' | 'context';
}

export function getAddedLines(patch: string): Set<number> {
  const added = new Set<number>();
  if (!patch) return added;
  const lines = patch.split('\n');
  let newLine = 0;
  for (const line of lines) {
    const header = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (header) {
      const start = header[1];
      if (start === undefined) continue;
      newLine = Number.parseInt(start, 10);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.add(newLine);
      newLine += 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // deletion — newLine does not advance
    } else if (line.startsWith('\\')) {
      // "\ No newline at end of file"
    } else {
      // context line
      newLine += 1;
    }
  }
  return added;
}

export async function postReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string,
  body: string,
  comments: InlineComment[],
): Promise<void> {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    commit_id: headSha,
    event: 'COMMENT',
    body,
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      side: 'RIGHT',
      body: c.body,
    })),
  });
}
