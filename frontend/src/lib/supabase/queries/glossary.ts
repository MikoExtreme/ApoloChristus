import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type { GlossaryTermRow } from "@/types/database.types"

// Pesquisa direta no glossário via o índice de texto já existente
// (search_vec) — não precisa de função RPC nova, .textSearch() do
// supabase-js já fala diretamente com o operador @@ do Postgres.
export async function searchGlossaryTerms(query: string, limit = 30): Promise<GlossaryTermRow[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .textSearch("search_vec", tsQuery, { config: "english" })
    .order("term")
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getTermsByLetter(letter: string): Promise<GlossaryTermRow[]> {
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .ilike("term", `${letter}%`)
    .order("term")
  if (error) throw error
  return data ?? []
}

export async function getEntriesForTerm(term: string): Promise<GlossaryTermRow[]> {
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .eq("term", term)
    .order("source")
  if (error) throw error
  return data ?? []
}
