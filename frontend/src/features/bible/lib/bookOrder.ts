// Ordem canónica dos códigos de livro (USFM), igual à usada em
// christianity-data-pipeline/fetchers/bible_fetcher.py (CANONICAL_BOOKS +
// DEUTEROCANONICAL_BOOKS). A tabela `verses` não guarda posição canónica,
// só a ordem de inserção (id) — por isso ordenamos no frontend.
export const CANONICAL_BOOK_ORDER = [
  // Antigo Testamento
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  // Deuterocanónicos
  "1ES", "2ES", "TOB", "JDT", "WIS", "SIR", "BAR", "BEL", "ESG", "MAN",
  "1MA", "2MA", "S3Y", "SUS",
  // Novo Testamento
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
  "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS",
  "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
] as const

export function compareByCanonicalOrder(a: string, b: string): number {
  const ai = CANONICAL_BOOK_ORDER.indexOf(a as (typeof CANONICAL_BOOK_ORDER)[number])
  const bi = CANONICAL_BOOK_ORDER.indexOf(b as (typeof CANONICAL_BOOK_ORDER)[number])
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}
