import { z } from 'zod';

export const ReviewCommentSchema = z.object({
  line: z.number().int().positive(),
  severity: z.enum(['low', 'medium', 'high']),
  category: z.enum(['bug', 'security', 'performance', 'logic', 'other']),
  message: z.string().min(1),
});

export const ReviewResponseSchema = z.object({
  comments: z.array(ReviewCommentSchema).default([]),
  summary: z.string().default(''),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

export function parseReviewResponse(text: string): ReviewResponse {
  const json = extractJson(text);
  return ReviewResponseSchema.parse(json);
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in model response: ${truncate(text)}`);
  }
  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (err) {
    throw new Error(
      `Failed to parse model JSON: ${(err as Error).message}. Raw: ${truncate(text)}`,
    );
  }
}

function truncate(s: string): string {
  return s.length > 300 ? `${s.slice(0, 300)}…` : s;
}
