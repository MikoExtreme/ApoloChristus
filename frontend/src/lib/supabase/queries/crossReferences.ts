import { supabase } from "@/lib/supabase/client"
import { fetchAllRows } from "@/lib/supabase/queries/pagination"
import type { CrossReferenceRow } from "@/types/database.types"

// Salmo 119 (o capítulo mais longo da Bíblia) tem 1677 referências cruzadas
// — acima do limite de 1000 do PostgREST. Sem paginação, só as 1000 mais
// votadas apareciam, perdendo ~677 referências reais silenciosamente.
export async function getCrossReferencesForChapter(book: string, chapter: number): Promise<CrossReferenceRow[]> {
  return fetchAllRows<CrossReferenceRow>((from, to) =>
    supabase
      .from("cross_references")
      .select("*")
      .eq("source_book", book)
      .eq("source_ch", chapter)
      .order("votes", { ascending: false })
      .range(from, to)
  )
}

export async function getCrossReferencesForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<CrossReferenceRow[]> {
  const { data, error } = await supabase
    .from("cross_references")
    .select("*")
    .eq("source_book", book)
    .eq("source_ch", chapter)
    .eq("source_v", verse)
    .order("votes", { ascending: false })
  if (error) throw error
  return data ?? []
}
