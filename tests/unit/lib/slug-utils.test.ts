/**
 * Unit Tests for app/lib/slug-utils.ts
 *
 * TDD — tests written before implementation.
 * Covers: slugify(), validateSlug(), resolveUniqueHandle()
 */

import { createMockGraphQLResponse } from '../../setup';

// slugify and validateSlug are pure functions — no mocks needed.
// resolveUniqueHandle calls admin.graphql — mock that.

import { slugify, validateSlug, resolveUniqueHandle } from '../../../app/lib/slug-utils';

// ─── slugify ─────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('Build Your Own Kit')).toBe('build-your-own-kit');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('replaces underscores with hyphens', () => {
    expect(slugify('my_bundle_name')).toBe('my-bundle-name');
  });

  it('strips special characters', () => {
    expect(slugify('SUMMER SALE 2024!')).toBe('summer-sale-2024');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('hello--world')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  --hello--  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('truncates to 255 characters', () => {
    const long = 'a'.repeat(300);
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('handles input with only special chars', () => {
    const result = slugify('!!!');
    expect(result).toBe('');
  });

  it('handles numbers in input', () => {
    expect(slugify('Kit v2 2024')).toBe('kit-v2-2024');
  });
});

// ─── validateSlug ─────────────────────────────────────────────────────────────

describe('validateSlug', () => {
  it('returns null for a valid slug', () => {
    expect(validateSlug('build-your-own-kit')).toBeNull();
  });

  it('returns null for a single character slug', () => {
    expect(validateSlug('a')).toBeNull();
  });

  it('returns null for alphanumeric slug', () => {
    expect(validateSlug('kit2024')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateSlug('')).toBe('URL slug cannot be empty.');
  });

  it('returns error for slug exceeding 255 chars', () => {
    expect(validateSlug('a'.repeat(256))).toBe('URL slug must be 255 characters or fewer.');
  });

  it('returns error for uppercase characters', () => {
    expect(validateSlug('My-Bundle')).toBe('Only lowercase letters, numbers, and hyphens are allowed.');
  });

  it('returns error for underscore', () => {
    expect(validateSlug('my_bundle')).toBe('Only lowercase letters, numbers, and hyphens are allowed.');
  });

  it('returns error for leading hyphen', () => {
    expect(validateSlug('-leading')).toBe('Only lowercase letters, numbers, and hyphens are allowed.');
  });

  it('returns error for trailing hyphen', () => {
    expect(validateSlug('trailing-')).toBe('Only lowercase letters, numbers, and hyphens are allowed.');
  });

  it('returns error for spaces', () => {
    expect(validateSlug('hello world')).toBe('Only lowercase letters, numbers, and hyphens are allowed.');
  });

  it('returns null for slug with internal hyphens', () => {
    expect(validateSlug('a-b-c')).toBeNull();
  });
});

// ─── resolveUniqueHandle ──────────────────────────────────────────────────────

describe('resolveUniqueHandle', () => {
  function makeAdmin(matchingHandle?: string) {
    const admin = { graphql: jest.fn() };
    // If matchingHandle is provided, return it as an existing page
    admin.graphql.mockResolvedValue(
      createMockGraphQLResponse({
        pages: {
          edges: matchingHandle
            ? [{ node: { handle: matchingHandle } }]
            : []
        }
      })
    );
    return admin;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the handle unchanged when it is free', async () => {
    const admin = makeAdmin(); // no existing pages
    const result = await resolveUniqueHandle(admin, 'my-kit');
    expect(result).toEqual({ handle: 'my-kit', adjusted: false });
  });

  it('appends -2 when handle is taken', async () => {
    const admin = { graphql: jest.fn() };
    // First call: "my-kit" is taken; second call: "my-kit-2" is free
    admin.graphql
      .mockResolvedValueOnce(createMockGraphQLResponse({
        pages: { edges: [{ node: { handle: 'my-kit' } }] }
      }))
      .mockResolvedValueOnce(createMockGraphQLResponse({
        pages: { edges: [] }
      }));

    const result = await resolveUniqueHandle(admin, 'my-kit');
    expect(result).toEqual({ handle: 'my-kit-2', adjusted: true });
  });

  it('skips self when excludeCurrentHandle matches the existing page', async () => {
    const admin = makeAdmin('my-kit'); // "my-kit" exists but belongs to this bundle
    const result = await resolveUniqueHandle(admin, 'my-kit', 'my-kit');
    expect(result).toEqual({ handle: 'my-kit', adjusted: false });
  });

  it('increments suffix beyond -2 when -2 is also taken', async () => {
    const admin = { graphql: jest.fn() };
    // "my-kit" taken, "my-kit-2" taken, "my-kit-3" free
    admin.graphql
      .mockResolvedValueOnce(createMockGraphQLResponse({
        pages: { edges: [{ node: { handle: 'my-kit' } }] }
      }))
      .mockResolvedValueOnce(createMockGraphQLResponse({
        pages: { edges: [{ node: { handle: 'my-kit-2' } }] }
      }))
      .mockResolvedValueOnce(createMockGraphQLResponse({
        pages: { edges: [] }
      }));

    const result = await resolveUniqueHandle(admin, 'my-kit');
    expect(result).toEqual({ handle: 'my-kit-3', adjusted: true });
  });
});
