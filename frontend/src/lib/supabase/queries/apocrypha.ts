import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import { RESTRICTED_APOCRYPHA, isRestrictedApocryphon } from "@/lib/content/restrictedWorks"
import type { ApocryphalSectionRow, ApocryphalWorkRow, SearchApocryphaResult } from "@/types/database.types"

// Filtro PostgREST "id not in (...)" para esconder as obras com direitos de autor.
const NOT_RESTRICTED = `(${RESTRICTED_APOCRYPHA.join(",")})`

export async function getApocryphaCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("apocryphal_works")
    .select("category")
    .not("id", "in", NOT_RESTRICTED)
  if (error) throw error
  return [...new Set((data ?? []).map((row) => row.category))].sort()
}

export async function getWorksByCategory(category: string): Promise<ApocryphalWorkRow[]> {
  const { data, error } = await supabase
    .from("apocryphal_works")
    .select("*")
    .eq("category", category)
    .not("id", "in", NOT_RESTRICTED)
    .order("title_pt")
  if (error) throw error
  return data ?? []
}

export async function getWorkById(workId: string): Promise<ApocryphalWorkRow | null> {
  if (isRestrictedApocryphon(workId)) return null
  const { data, error } = await supabase.from("apocryphal_works").select("*").eq("id", workId).maybeSingle()
  if (error) throw error
  return data
}

export async function getPtTranslationForWork(workId: string): Promise<ApocryphalWorkRow | null> {
  if (isRestrictedApocryphon(workId)) return null
  const { data, error } = await supabase
    .from("apocryphal_works")
    .select("*")
    .eq("translated_from_work_id", workId)
    .eq("language", "pt")
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getSectionsForWork(workId: string): Promise<ApocryphalSectionRow[]> {
  if (isRestrictedApocryphon(workId)) return []
  const { data, error } = await supabase
    .from("apocryphal_sections")
    .select("*")
    .eq("work_id", workId)
    .order("section_num")
  if (error) throw error
  return data ?? []
}

export async function searchApocrypha(query: string, lim = 20): Promise<SearchApocryphaResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  // Pede margem extra porque os resultados de obras restritas são descartados.
  const { data, error } = await supabase.rpc("search_apocrypha", { query: tsQuery, lim: lim + 20 })
  if (error) throw error
  return (data ?? []).filter((row) => !isRestrictedApocryphon(row.work_id)).slice(0, lim)
}
