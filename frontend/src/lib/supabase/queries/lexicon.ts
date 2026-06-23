import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type { LexiconEntryRow, LexiconLanguage, SearchLexiconResult } from "@/types/database.types"

const PAGE_SIZE = 60

export interface LexiconPage {
  entries: LexiconEntryRow[]
  total: number
}

// Léxico hebraico tem ~8700 entradas e o grego ~5600 — paginação real
// (não um limite fixo) é obrigatória, ao contrário de getPlaces() em
// geography.ts que pagina para CARREGAR TUDO de uma vez (útil para o mapa).
// Aqui queremos uma página de cada vez, com contagem total para a UI.
export async function getEntriesByLanguage(language: LexiconLanguage, page = 0): Promise<LexiconPage> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from("lexicon_entries")
    .select("*", { count: "exact" })
    .eq("language", language)
    .order("e_strong")
    .range(from, to)
  if (error) throw error
  return { entries: data ?? [], total: count ?? 0 }
}

export async function getEntryByDStrong(dStrong: string): Promise<LexiconEntryRow | null> {
  const { data, error } = await supabase.from("lexicon_entries").select("*").eq("d_strong", dStrong).maybeSingle()
  if (error) throw error
  return data
}

export async function searchLexicon(query: string, lim = 20): Promise<SearchLexiconResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_lexicon", { query: tsQuery, lim })
  if (error) throw error
  return data ?? []
}
