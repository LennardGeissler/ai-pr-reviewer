import { describe, expect, it } from 'vitest';
import { getAddedLines, matchesAnyGlob } from '../src/github.js';

describe('getAddedLines', () => {
  it('returns added line numbers from a single hunk', () => {
    const patch = [
      '@@ -1,3 +1,4 @@',
      ' line1',
      '+added2',
      ' line3',
      '+added4',
    ].join('\n');
    const added = getAddedLines(patch);
    expect([...added].sort((a, b) => a - b)).toEqual([2, 4]);
  });

  it('handles multiple hunks and deletions', () => {
    const patch = [
      '@@ -1,2 +1,2 @@',
      '-old',
      '+new',
      ' ctx',
      '@@ -10,2 +10,3 @@',
      ' ctx10',
      '+new11',
      ' ctx12',
    ].join('\n');
    const added = getAddedLines(patch);
    expect([...added].sort((a, b) => a - b)).toEqual([1, 11]);
  });

  it('ignores no-newline markers', () => {
    const patch = ['@@ -1 +1 @@', '-a', '+b', '\\ No newline at end of file'].join('\n');
    const added = getAddedLines(patch);
    expect([...added]).toEqual([1]);
  });

  it('returns empty set for empty patch', () => {
    expect(getAddedLines('').size).toBe(0);
  });
});

describe('matchesAnyGlob', () => {
  it('matches **/*.lock', () => {
    expect(matchesAnyGlob('a/b/c.lock', ['**/*.lock'])).toBe(true);
    expect(matchesAnyGlob('pkg.lock', ['**/*.lock'])).toBe(true);
    expect(matchesAnyGlob('a/b/c.txt', ['**/*.lock'])).toBe(false);
  });

  it('matches dist/**', () => {
    expect(matchesAnyGlob('dist/index.js', ['dist/**'])).toBe(true);
    expect(matchesAnyGlob('src/dist.ts', ['dist/**'])).toBe(false);
  });
});
