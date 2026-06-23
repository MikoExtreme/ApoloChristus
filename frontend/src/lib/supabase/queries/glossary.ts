import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type { GlossaryTermRow, SearchGlossaryResult } from "@/types/database.types"

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

const TERMS_PAGE_SIZE = 60

export interface GlossaryTermsPage {
  terms: GlossaryTermRow[]
  total: number
}

// Sem .limit() isto cai no máximo por omissão do PostgREST (1000 linhas) —
// algumas letras (ex: "A" com 2200+ termos) já ultrapassavam isso e eram
// cortadas silenciosamente. Paginação real, com contagem total para a UI.
export async function getTermsByLetter(letter: string, page = 0): Promise<GlossaryTermsPage> {
  const from = page * TERMS_PAGE_SIZE
  const to = from + TERMS_PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from("glossary_terms")
    .select("*", { count: "exact" })
    .ilike("term", `${letter}%`)
    .order("term")
    .range(from, to)
  if (error) throw error
  return { terms: data ?? [], total: count ?? 0 }
}

// Pesquisa global (com rank, para misturar com outros scopes em "all") —
// searchGlossaryTerms() acima é para a pesquisa local da página do Glossário.
export async function searchGlossary(query: string, lim = 20): Promise<SearchGlossaryResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_glossary", { query: tsQuery, lim })
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
