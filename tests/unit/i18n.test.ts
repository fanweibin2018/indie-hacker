import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations, getLocalizedPath } from '@/i18n/ui';

describe('i18n', () => {
  it('detects en from /en/ paths, zh otherwise', () => {
    expect(getLangFromUrl(new URL('https://x.com/en/build/'))).toBe('en');
    expect(getLangFromUrl(new URL('https://x.com/build/'))).toBe('zh');
  });
  it('returns translated strings with fallback to key', () => {
    const t = useTranslations('en');
    expect(t('nav.resources')).toBe('Resources');
    expect(t('missing.key')).toBe('missing.key');
  });
  it('localizes a path for a target lang', () => {
    expect(getLocalizedPath('/build/', 'en')).toBe('/en/build/');
    expect(getLocalizedPath('/en/build/', 'zh')).toBe('/build/');
    expect(getLocalizedPath('/build/', 'zh')).toBe('/build/');
  });
});
