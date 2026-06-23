import { searchVersesPt } from "@/lib/supabase/queries/bible"
import { searchPatristics } from "@/lib/supabase/queries/patristics"
import { searchLexicon } from "@/lib/supabase/queries/lexicon"
import { searchApocrypha } from "@/lib/supabase/queries/apocrypha"
import { searchCreeds } from "@/lib/supabase/queries/creeds"
import { searchGlossary } from "@/lib/supabase/queries/glossary"
import type { SearchResult, SearchScope } from "@/types/content"

// Único sítio que sabe quais RPCs de pesquisa já existem — ver
// SEARCHABLE_SCOPES em types/content.ts para os scopes ainda sem
// função de pesquisa no backend.
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

  if (scope === "all" || scope === "apocrypha") {
    tasks.push(
      searchApocrypha(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "apocrypha-section",
            workId: r.work_id,
            sectionNum: r.section_num,
            text: r.text,
            workTitlePt: r.work_title_pt,
            workTitleEn: r.work_title_en,
            category: r.category,
            rank: r.rank,
          })
        )
      )
    )
  }

  if (scope === "all" || scope === "creeds") {
    tasks.push(
      searchCreeds(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "creed-section",
            workId: r.work_id,
            sectionNum: r.section_num,
            text: r.text,
            language: r.language,
            workTitle: r.work_title,
            workTitlePt: r.work_title_pt,
            rank: r.rank,
          })
        )
      )
    )
  }

  if (scope === "all" || scope === "glossary") {
    tasks.push(
      searchGlossary(query).then((rows) =>
        rows.map(
          (r): SearchResult => ({
            type: "glossary-term",
            term: r.term,
            source: r.source,
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
