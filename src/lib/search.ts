/**
 * Lowercases and strips accents so search matches regardless of how the
 * user types diacritics (ex: "jose" encontra "José", "ANDRE" encontra
 * "André").
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
