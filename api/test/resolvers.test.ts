import { describe, it, expect } from 'vitest';
import { resolvers } from '../src/graphql/resolvers.js';

describe('currentTime resolver', () => {
  it('returns a valid ISO 8601 string', () => {
    const result = resolvers.Query.currentTime();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(result).toISOString()).not.toThrow();
  });

  it('returns a time within the last second', () => {
    const before = Date.now();
    const result = resolvers.Query.currentTime();
    const after = Date.now();
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
    expect(resultMs).toBeLessThanOrEqual(after);
  });
});
