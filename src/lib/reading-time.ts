/**
 * Reading-time estimate for article bodies.
 *
 * The design surfaces a "N min" read estimate on cards, side rows and the
 * article byline. Content is bilingual, so we count CJK characters and
 * Latin words separately and blend them at language-appropriate speeds.
 */

const CJK = /[㐀-鿿豈-﫿぀-ヿ]/g;
// Latin/number word-ish runs once CJK + markdown noise is removed.
const WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

/** Strip the cheap markdown noise that would otherwise inflate the count. */
function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → keep text
    .replace(/<[^>]+>/g, ' ') // raw/JSX tags
    .replace(/[#>*_~|-]+/g, ' '); // residual syntax
}

/** Estimated reading time in whole minutes (floor of 1). */
export function readingMinutes(body: string | undefined): number {
  if (!body) return 1;
  const text = stripMarkdown(body);
  const cjk = (text.match(CJK) ?? []).length;
  const words = (text.replace(CJK, ' ').match(WORD) ?? []).length;
  // ~340 CJK chars/min, ~220 English words/min.
  const minutes = Math.ceil(cjk / 340 + words / 220);
  return Math.max(1, minutes);
}

/** Design-faithful label, e.g. "8 min" (kept in English across locales). */
export function readingLabel(body: string | undefined): string {
  return `${readingMinutes(body)} min`;
}
