import { supabase } from "@/lib/supabase/client"
import type { ApologeticsArgumentRow, ApologeticsCategory } from "@/types/database.types"

export async function getArgumentsByCategory(category: ApologeticsCategory): Promise<ApologeticsArgumentRow[]> {
  const { data, error } = await supabase
    .from("apologetics_arguments")
    .select("*")
    .eq("category", category)
    .order("order_in_category")

  if (error) throw error
  return (data ?? []) as ApologeticsArgumentRow[]
}

export async function getArgumentCountsByCategory(): Promise<Record<ApologeticsCategory, number>> {
  const { data, error } = await supabase
    .from("apologetics_arguments")
    .select("category")

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.category] = (counts[row.category] ?? 0) + 1
  }
  return counts as Record<ApologeticsCategory, number>
}
