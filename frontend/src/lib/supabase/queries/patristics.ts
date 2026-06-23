import { supabase } from "@/lib/supabase/client"
import { toTsQueryInput } from "@/lib/supabase/queries/sanitize"
import { fetchAllRows } from "@/lib/supabase/queries/pagination"
import type {
  PatristicAuthorRow,
  PatristicPeriod,
  PatristicSectionRow,
  PatristicWorkRow,
  SearchPatristicsResult,
  VersesCitedByFathersResult,
} from "@/types/database.types"

export async function getPeriods(): Promise<PatristicPeriod[]> {
  const { data, error } = await supabase.from("patristic_authors").select("period")
  if (error) throw error
  const order: PatristicPeriod[] = ["apostolic", "ante_nicene", "nicene", "post_nicene", "medieval"]
  const present = new Set((data ?? []).map((row) => row.period))
  return order.filter((period) => present.has(period))
}

export async function getAuthorsByPeriod(period: PatristicPeriod): Promise<PatristicAuthorRow[]> {
  const { data, error } = await supabase
    .from("patristic_authors")
    .select("*")
    .eq("period", period)
    .order("name_pt")
  if (error) throw error
  return data ?? []
}

export async function getAuthorById(authorId: string): Promise<PatristicAuthorRow | null> {
  const { data, error } = await supabase.from("patristic_authors").select("*").eq("id", authorId).maybeSingle()
  if (error) throw error
  return data
}

export async function getWorksForAuthor(authorId: string): Promise<PatristicWorkRow[]> {
  const { data, error } = await supabase
    .from("patristic_works")
    .select("*")
    .eq("author_id", authorId)
    .order("title")
  if (error) throw error
  return data ?? []
}

export async function getWorkById(workId: string): Promise<PatristicWorkRow | null> {
  const { data, error } = await supabase.from("patristic_works").select("*").eq("id", workId).maybeSingle()
  if (error) throw error
  return data
}

// Algumas obras (homilias de Crisóstomo, "Enarrations" de Agostinho sobre
// os Salmos, etc.) têm mais de 1000 secções — acima do limite por omissão
// do PostgREST. Sem paginação explícita, a obra ficava cortada a meio
// silenciosamente (ex: Homilias de Crisóstomo sobre Mateus: 4484 secções,
// só as primeiras 1000 apareciam).
export async function getSectionsForWork(workId: string): Promise<PatristicSectionRow[]> {
  return fetchAllRows<PatristicSectionRow>((from, to) =>
    supabase.from("patristic_sections").select("*").eq("work_id", workId).order("section_num").range(from, to)
  )
}

// Nem todas as obras têm tradução PT — quando existe, é uma linha separada
// em patristic_works (language='pt') ligada à obra original por
// translated_from_work_id, em vez de uma coluna paralela como em creeds_confessions.
export async function getPtTranslationForWork(workId: string): Promise<PatristicWorkRow | null> {
  const { data, error } = await supabase
    .from("patristic_works")
    .select("*")
    .eq("translated_from_work_id", workId)
    .eq("language", "pt")
    .maybeSingle()
  if (error) throw error
  return data
}

export async function searchPatristics(query: string, lim = 20): Promise<SearchPatristicsResult[]> {
  const tsQuery = toTsQueryInput(query)
  if (!tsQuery) return []
  const { data, error } = await supabase.rpc("search_patristics", { query: tsQuery, lim })
  if (error) throw error
  return data ?? []
}

export async function getCitationsForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<VersesCitedByFathersResult[]> {
  const { data, error } = await supabase.rpc("verses_cited_by_fathers", {
    p_book: book,
    p_chapter: chapter,
    p_verse: verse,
  })
  if (error) throw error
  return data ?? []
}
