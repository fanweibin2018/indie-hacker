import { describe, it, expect } from 'vitest';
import { readingMinutes, readingLabel } from '@/lib/reading-time';

describe('readingMinutes', () => {
  it('floors at 1 minute for empty or tiny bodies', () => {
    expect(readingMinutes(undefined)).toBe(1);
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('hello world')).toBe(1);
  });

  it('counts English words at ~220 wpm', () => {
    const body = Array.from({ length: 660 }, () => 'word').join(' ');
    expect(readingMinutes(body)).toBe(3);
  });

  it('counts CJK characters at ~340 cpm', () => {
    const body = '需'.repeat(1020);
    expect(readingMinutes(body)).toBe(3);
  });

  it('ignores fenced code, inline code and markdown syntax', () => {
    const noisy = '## Heading\n\n`inline` text\n\n```\n' + 'x '.repeat(500) + '\n```';
    // Only "text" survives the strip, so it rounds up to a 1-minute read.
    expect(readingMinutes(noisy)).toBe(1);
  });
});

describe('readingLabel', () => {
  it('formats as "N min" (English unit across locales)', () => {
    expect(readingLabel('hello')).toBe('1 min');
    expect(readingLabel('需'.repeat(1020))).toBe('3 min');
  });
});
