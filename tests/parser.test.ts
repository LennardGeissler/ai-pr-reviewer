import { describe, expect, it } from 'vitest';
import { parseReviewResponse } from '../src/parser.js';

describe('parseReviewResponse', () => {
  it('parses a valid JSON object', () => {
    const r = parseReviewResponse(
      '{"summary":"ok","comments":[{"line":3,"severity":"high","category":"bug","message":"oops"}]}',
    );
    expect(r.comments).toHaveLength(1);
    expect(r.comments[0]?.line).toBe(3);
  });

  it('tolerates markdown code fences', () => {
    const r = parseReviewResponse('```json\n{"summary":"s","comments":[]}\n```');
    expect(r.summary).toBe('s');
    expect(r.comments).toHaveLength(0);
  });

  it('extracts JSON surrounded by prose', () => {
    const r = parseReviewResponse('Here is my review: {"summary":"x","comments":[]} thanks');
    expect(r.summary).toBe('x');
  });

  it('throws on malformed input', () => {
    expect(() => parseReviewResponse('no json here')).toThrow();
  });

  it('rejects invalid severity', () => {
    expect(() =>
      parseReviewResponse(
        '{"comments":[{"line":1,"severity":"critical","category":"bug","message":"x"}]}',
      ),
    ).toThrow();
  });
});
