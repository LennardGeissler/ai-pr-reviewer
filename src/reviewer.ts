import Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config.js';
import { meetsSeverity } from './config.js';
import { type PRFile, getAddedLines } from './github.js';
import { type ReviewComment, parseReviewResponse } from './parser.js';
import { buildSystemPrompt, buildUserMessage } from './prompt.js';

export interface FileReview {
  filename: string;
  comments: ReviewComment[];
  summary: string;
}

export function createAnthropic(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function reviewFile(
  client: Anthropic,
  config: Config,
  file: PRFile,
): Promise<FileReview> {
  const system = buildSystemPrompt(config.custom_instructions);
  const response = await client.messages.create({
    model: config.model,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: buildUserMessage(file.filename, file.patch),
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const parsed = parseReviewResponse(text);
  const addedLines = getAddedLines(file.patch);

  const filtered = parsed.comments.filter(
    (c) => addedLines.has(c.line) && meetsSeverity(c.severity, config.severity_threshold),
  );

  return {
    filename: file.filename,
    comments: filtered,
    summary: parsed.summary,
  };
}

export async function reviewFiles(
  client: Anthropic,
  config: Config,
  files: PRFile[],
): Promise<FileReview[]> {
  const results: FileReview[] = [];
  const queue = [...files];
  const workers = Array.from(
    { length: Math.min(config.max_concurrency, files.length) },
    async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) return;
        const review = await reviewFile(client, config, file);
        results.push(review);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
