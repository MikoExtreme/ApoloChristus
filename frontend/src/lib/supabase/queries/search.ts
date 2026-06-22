import { searchVersesPt } from "@/lib/supabase/queries/bible"
import { searchPatristics } from "@/lib/supabase/queries/patristics"
import { searchLexicon } from "@/lib/supabase/queries/lexicon"
import type { SearchResult, SearchScope } from "@/types/content"

// Único sítio que sabe quais RPCs de pesquisa já existem (verses,
// patristics, lexicon) vs. quais ainda faltam no backend (apócrifos,
// credos, glossário — ver SEARCHABLE_SCOPES em types/content.ts).
// Quando essas funções existirem, só este ficheiro muda.
export async function runSearch(scope: SearchScope, query: string): Promise<SearchResult[]> {
  const tasks: Promise<SearchResult[]>[] = []

  if (scope === "all" || scope === "bible") {
    tasks.push(
      searchVersesPt(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "verse",
            versionId: r.version_id,
            testament: r.testament,
            book: r.book,
            chapter: r.chapter,
            verse: r.verse,
            text: r.text,
            rank: r.rank,
          })
        )
      )
    )
  }

  if (scope === "all" || scope === "patristics") {
    tasks.push(
      searchPatristics(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "patristic-section",
            workId: r.work_id,
            sectionNum: r.section_num,
            text: r.text,
            authorName: r.author_name,
            workTitle: r.work_title,
            rank: r.rank,
          })
        )
      )
    )
  }

  if (scope === "all" || scope === "lexicon") {
    tasks.push(
      searchLexicon(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "lexicon-entry",
            eStrong: r.e_strong,
            dStrong: r.d_strong,
            language: r.language,
            word: r.word,
            transliteration: r.transliteration,
            gloss: r.gloss,
            definition: r.definition,
            rank: r.rank,
          })
        )
      )
    )
  }

  const settled = await Promise.all(tasks)
  return settled.flat()
}
