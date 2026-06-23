import type { LexiconLanguage, Testament } from "@/types/database.types"

export type SearchScope =
  | "all"
  | "bible"
  | "patristics"
  | "apocrypha"
  | "creeds"
  | "glossary"
  | "lexicon"

// Scopes sem função de pesquisa full-text no backend ainda (ver
// lib/supabase/queries/search.ts) — usado para mostrar um estado
// explícito de "não disponível" em vez de uma lista vazia silenciosa.
export const SEARCHABLE_SCOPES: SearchScope[] = [
  "bible",
  "patristics",
  "lexicon",
  "apocrypha",
  "creeds",
  "glossary",
]

export type SearchResult =
  | {
      type: "verse"
      versionId: string
      testament: Testament
      book: string
      chapter: number
      verse: number
      text: string
      rank: number
    }
  | {
      type: "patristic-section"
      workId: string
      sectionNum: number
      text: string
      authorName: string
      workTitle: string
      rank: number
    }
  | {
      type: "lexicon-entry"
      eStrong: string
      dStrong: string
      language: LexiconLanguage
      word: string
      transliteration: string | null
      gloss: string | null
      definition: string | null
      rank: number
    }
  | {
      type: "apocrypha-section"
      workId: string
      sectionNum: number
      text: string
      workTitlePt: string
      workTitleEn: string
      category: string
      rank: number
    }
  | {
      type: "creed-section"
      workId: string
      sectionNum: number
      text: string
      language: string
      workTitle: string
      workTitlePt: string | null
      rank: number
    }
  | {
      type: "glossary-term"
      term: string
      source: string
      definition: string
      rank: number
    }
