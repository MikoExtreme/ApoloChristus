import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type {
  CreedConfessionRow,
  CreedConfessionSectionRow,
  CreedSectionLanguage,
  SearchCreedsResult,
} from "@/types/database.types"

export async function getCreeds(): Promise<CreedConfessionRow[]> {
  const { data, error } = await supabase.from("creeds_confessions").select("*").order("tradition")
  if (error) throw error
  return data ?? []
}

export async function getCreedById(workId: string): Promise<CreedConfessionRow | null> {
  const { data, error } = await supabase.from("creeds_confessions").select("*").eq("id", workId).maybeSingle()
  if (error) throw error
  return data
}

export async function getSectionsForWork(
  workId: string,
  language: CreedSectionLanguage = "en"
): Promise<CreedConfessionSectionRow[]> {
  const { data, error } = await supabase
    .from("creeds_confessions_sections")
    .select("*")
    .eq("work_id", workId)
    .eq("language", language)
    .order("section_num")
  if (error) throw error
  return data ?? []
}

export async function searchCreeds(query: string, lim = 20): Promise<SearchCreedsResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_creeds", { query: tsQuery, lim })
  if (error) throw error
  return data ?? []
}
