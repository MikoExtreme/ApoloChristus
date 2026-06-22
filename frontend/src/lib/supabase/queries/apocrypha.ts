import { supabase } from "@/lib/supabase/client"
import type { ApocryphalSectionRow, ApocryphalWorkRow } from "@/types/database.types"

export async function getApocryphaCategories(): Promise<string[]> {
  const { data, error } = await supabase.from("apocryphal_works").select("category")
  if (error) throw error
  return [...new Set((data ?? []).map((row) => row.category))].sort()
}

export async function getWorksByCategory(category: string): Promise<ApocryphalWorkRow[]> {
  const { data, error } = await supabase
    .from("apocryphal_works")
    .select("*")
    .eq("category", category)
    .order("title_pt")
  if (error) throw error
  return data ?? []
}

export async function getWorkById(workId: string): Promise<ApocryphalWorkRow | null> {
  const { data, error } = await supabase.from("apocryphal_works").select("*").eq("id", workId).maybeSingle()
  if (error) throw error
  return data
}

export async function getSectionsForWork(workId: string): Promise<ApocryphalSectionRow[]> {
  const { data, error } = await supabase
    .from("apocryphal_sections")
    .select("*")
    .eq("work_id", workId)
    .order("section_num")
  if (error) throw error
  return data ?? []
}
