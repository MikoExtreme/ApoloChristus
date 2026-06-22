import { supabase } from "@/lib/supabase/client"
import type { CrossReferenceRow } from "@/types/database.types"

export async function getCrossReferencesForChapter(book: string, chapter: number): Promise<CrossReferenceRow[]> {
  const { data, error } = await supabase
    .from("cross_references")
    .select("*")
    .eq("source_book", book)
    .eq("source_ch", chapter)
    .order("votes", { ascending: false })
  if (error) throw error
  return data ?? []
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
