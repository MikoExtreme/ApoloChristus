import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type { LexiconEntryRow, LexiconLanguage, SearchLexiconResult } from "@/types/database.types"

export async function getEntriesByLanguage(language: LexiconLanguage, limit = 50): Promise<LexiconEntryRow[]> {
  const { data, error } = await supabase
    .from("lexicon_entries")
    .select("*")
    .eq("language", language)
    .order("e_strong")
    .limit(limit)
  if (error) throw error
  return data ?? []
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
