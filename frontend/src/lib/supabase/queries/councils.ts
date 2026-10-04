import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import type { CouncilRow, CouncilCanonRow, SearchCouncilsResult } from "@/types/database.types"

export async function getCouncils(): Promise<CouncilRow[]> {
  const { data, error } = await supabase
    .from("councils")
    .select("*")
  if (error) throw error
  // year is stored as TEXT — sort numerically in JS
  return (data ?? []).sort((a, b) => parseInt(a.year ?? "0") - parseInt(b.year ?? "0"))
}

export async function getCouncilById(councilId: string): Promise<CouncilRow | null> {
  const { data, error } = await supabase
    .from("councils")
    .select("*")
    .eq("id", councilId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCanonsForCouncil(
  councilId: string,
  language: "en" | "pt" = "en"
): Promise<CouncilCanonRow[]> {
  const { data, error } = await supabase
    .from("council_canons")
    .select("*")
    .eq("council_id", councilId)
    .eq("language", language)
    .order("canon_num")
  if (error) throw error
  return data ?? []
}

export async function searchCouncils(query: string, lim = 20): Promise<SearchCouncilsResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_councils", { query: tsQuery, lim })
  if (error) throw error
  return data ?? []
}
