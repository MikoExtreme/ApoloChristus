import { supabase } from "@/lib/supabase/client"
import { fetchAllRows } from "@/lib/supabase/queries/pagination"
import type { InterlinearWordRow } from "@/types/database.types"

// Concordância sobre o texto original: todas as ocorrências de um número
// Strong's. Não precisa de função RPC nova — `strong_numbers` já é um
// array Postgres, e o PostgREST suporta o operador "contains" (cs)
// diretamente via .contains(). Palavras muito comuns (ex: "e", "ser")
// podem facilmente exceder 1000 ocorrências, por isso pagina-se.
export async function getOccurrencesByStrong(strongNumber: string): Promise<InterlinearWordRow[]> {
  return fetchAllRows<InterlinearWordRow>((from, to) =>
    supabase
      .from("interlinear_words")
      .select("*")
      .contains("strong_numbers", [strongNumber])
      .order("book")
      .order("chapter")
      .order("verse")
      .range(from, to)
  )
}

// Capítulos longos (ex: Salmo 119, 176 versículos) podem facilmente
// exceder 1000 palavras no hebraico/grego original, por isso pagina-se.
export async function getWordsForChapter(book: string, chapter: number): Promise<InterlinearWordRow[]> {
  return fetchAllRows<InterlinearWordRow>((from, to) =>
    supabase
      .from("interlinear_words")
      .select("*")
      .eq("book", book)
      .eq("chapter", chapter)
      .order("verse")
      .order("word_position")
      .range(from, to)
  )
}

export async function getWordsForVerse(book: string, chapter: number, verse: number): Promise<InterlinearWordRow[]> {
  const { data, error } = await supabase
    .from("interlinear_words")
    .select("*")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .order("word_position")
  if (error) throw error
  return data ?? []
}
