import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import { compareByCanonicalOrder } from "@/features/bible/lib/bookOrder"
import type { BibleVersionRow, ConcordanceResult, SearchVersesPtResult, Testament, VerseRow } from "@/types/database.types"

export async function getBibleVersions(): Promise<BibleVersionRow[]> {
  const { data, error } = await supabase.from("bible_versions").select("*").order("language")
  if (error) throw error
  return data ?? []
}

export interface BookSummary {
  book: string
  testament: Testament
}

export async function getBooksForVersion(versionId: string): Promise<BookSummary[]> {
  // Todo o livro tem um versículo 1 no seu primeiro capítulo — filtrar por
  // isso devolve uma linha por livro (dezenas, não dezenas de milhar), em
  // vez de trazer TODOS os versículos da versão só para extrair nomes de
  // livro (isso truncava silenciosamente no limite de 1000 linhas do
  // PostgREST). A maioria dos livros começa no capítulo 1; ESG (adições
  // gregas a Ester) é a exceção conhecida — começa no capítulo 10 (ver
  // DEUTEROCANONICAL_START_CHAPTER em bible_fetcher.py) — por isso também
  // se inclui o capítulo 10 no filtro.
  const { data, error } = await supabase
    .from("verses")
    .select("book, testament")
    .eq("version_id", versionId)
    .in("chapter", [1, 10])
    .eq("verse", 1)
  if (error) throw error

  const seen = new Map<string, BookSummary>()
  for (const row of data ?? []) {
    if (!seen.has(row.book)) seen.set(row.book, row)
  }
  return [...seen.values()].sort((a, b) => compareByCanonicalOrder(a.book, b.book))
}

export async function getChapterCount(versionId: string, book: string): Promise<number> {
  const { data, error } = await supabase
    .from("verses")
    .select("chapter")
    .eq("version_id", versionId)
    .eq("book", book)
    .order("chapter", { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.chapter ?? 0
}

export async function getChapter(versionId: string, book: string, chapter: number): Promise<VerseRow[]> {
  const { data, error } = await supabase
    .from("verses")
    .select("*")
    .eq("version_id", versionId)
    .eq("book", book)
    .eq("chapter", chapter)
    .order("verse")
  if (error) throw error
  return data ?? []
}

export async function searchVersesPt(
  query: string,
  version?: string,
  lim = 20
): Promise<SearchVersesPtResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_verses_pt", {
    query: tsQuery,
    version: version ?? null,
    lim,
  })
  if (error) throw error
  return data ?? []
}

export async function getConcordance(word: string, version?: string): Promise<ConcordanceResult[]> {
  const tsQuery = toTsQueryInput(word)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("concordance", { word: tsQuery, version: version ?? null })
  if (error) throw error
  return data ?? []
}
