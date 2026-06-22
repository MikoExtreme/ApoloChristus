import { supabase } from "@/lib/supabase/client"
import { fetchAllRows } from "@/lib/supabase/queries/pagination"
import type { BiblicalPlaceRow } from "@/types/database.types"

// ~1232 locais — acima do limite de 1000 linhas por pedido do PostgREST,
// por isso pagina-se explicitamente (ver pagination.ts).
export async function getPlaces(): Promise<BiblicalPlaceRow[]> {
  return fetchAllRows<BiblicalPlaceRow>((from, to) =>
    supabase.from("biblical_places").select("*").order("name").range(from, to)
  )
}

export async function getPlaceByName(name: string): Promise<BiblicalPlaceRow | null> {
  const { data, error } = await supabase.from("biblical_places").select("*").eq("name", name).maybeSingle()
  if (error) throw error
  return data
}
