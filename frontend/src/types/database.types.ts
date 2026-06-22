// Tipos escritos à mão a partir de christianity-data-pipeline/models/schema.sql.
// TODO: substituir por tipos gerados quando alguém correr, com a sessão
// Supabase autenticada:
//   supabase login
//   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// (não corrido nesta sessão — exige login interativo do utilizador)

export type License = "public_domain" | "check_rights" | "licensed"
export type Testament = "OT" | "NT"
export type PatristicPeriod = "apostolic" | "ante_nicene" | "nicene" | "post_nicene" | "medieval"
export type GlossarySource = "easton" | "smith" | "hastings" | "hitchcock" | "schaff"
export type LexiconLanguage = "hebrew" | "aramaic" | "greek" | "name"
export type InterlinearLanguage = "hebrew" | "greek"
export type CreedType = "creed" | "confession" | "catechism"

export type BibleVersionRow = {
  id: string
  name: string
  language: string
  license: License
  source_url: string | null
  created_at: string
}

export type VerseRow = {
  id: number
  version_id: string
  testament: Testament
  book: string
  chapter: number
  verse: number
  text: string
  is_deuterocanonical: boolean
}

export type CrossReferenceRow = {
  id: number
  source_book: string
  source_ch: number
  source_v: number
  target_book: string
  target_ch: number
  target_v: number
  votes: number
}

export type PatristicAuthorRow = {
  id: string
  name_pt: string
  name_en: string
  period: PatristicPeriod
  dates: string | null
  tradition: string | null
  created_at: string
}

export type PatristicWorkRow = {
  id: string
  author_id: string
  title: string
  source_url: string | null
  language: string
  license: License
  created_at: string
}

export type PatristicSectionRow = {
  id: number
  work_id: string
  section_num: number
  text: string
}

export type ApocryphalWorkRow = {
  id: string
  title_pt: string
  title_en: string
  category: string
  tradition: string | null
  date_estimate: string | null
  source_url: string | null
  language: string
  license: License
  created_at: string
}

export type ApocryphalSectionRow = {
  id: number
  work_id: string
  section_num: number
  text: string
}

export type CreedConfessionRow = {
  id: string
  title: string
  title_pt: string | null
  type: CreedType
  tradition: string | null
  year: string | null
  source_url: string | null
  language: string
  license: License
  source_url_pt: string | null
  license_pt: License | null
  created_at: string
}

export type CreedSectionLanguage = "en" | "pt"

export type CreedConfessionSectionRow = {
  id: number
  work_id: string
  section_num: number
  text: string
  language: CreedSectionLanguage
}

export type GlossaryTermRow = {
  id: number
  term: string
  source: GlossarySource
  definition: string
  scripture_refs: string[] | null
  license: License
}

export type BiblicalPlaceRow = {
  id: number
  name: string
  root_name: string | null
  lat: number
  lon: number
  is_approximate: boolean
  verses: string[] | null
  comment: string | null
  license: License
  source_url: string | null
  confidence_pct: number | null
  sources: string[] | null
}

export type LexiconEntryRow = {
  id: number
  e_strong: string
  d_strong: string
  u_strong: string | null
  language: LexiconLanguage
  word: string
  transliteration: string | null
  morph: string | null
  gloss: string | null
  definition: string | null
  license: License
  source_url: string | null
}

export type InterlinearWordRow = {
  id: number
  book: string
  chapter: number
  verse: number
  word_position: number
  language: InterlinearLanguage
  original_word: string
  transliteration: string | null
  gloss: string | null
  strong_numbers: string[] | null
  grammar: string | null
  license: License
  source_url: string | null
}

export type PatristicCitationRow = {
  id: number
  section_id: number
  book: string
  chapter: number
  verse: number
}

// ---- Retornos das funções RPC (ver schema.sql, secção 4) ----

export type SearchVersesPtResult = {
  version_id: string
  testament: Testament
  book: string
  chapter: number
  verse: number
  text: string
  rank: number
}

export type SearchPatristicsResult = {
  work_id: string
  section_num: number
  text: string
  author_name: string
  work_title: string
  rank: number
}

export type ConcordanceResult = {
  version_id: string
  testament: Testament
  book: string
  chapter: number
  verse: number
  text: string
}

export type SearchLexiconResult = {
  e_strong: string
  d_strong: string
  language: LexiconLanguage
  word: string
  transliteration: string | null
  gloss: string | null
  definition: string | null
  rank: number
}

export type VersesCitedByFathersResult = {
  author_id: string
  author_name: string
  period: PatristicPeriod
  work_id: string
  work_title: string
  section_num: number
  section_text: string
}

type TableDef<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

type FunctionDef<Args, Returns> = {
  Args: Args
  Returns: Returns
}

export type Database = {
  public: {
    Tables: {
      bible_versions: TableDef<BibleVersionRow>
      verses: TableDef<VerseRow>
      cross_references: TableDef<CrossReferenceRow>
      patristic_authors: TableDef<PatristicAuthorRow>
      patristic_works: TableDef<PatristicWorkRow>
      patristic_sections: TableDef<PatristicSectionRow>
      apocryphal_works: TableDef<ApocryphalWorkRow>
      apocryphal_sections: TableDef<ApocryphalSectionRow>
      creeds_confessions: TableDef<CreedConfessionRow>
      creeds_confessions_sections: TableDef<CreedConfessionSectionRow>
      glossary_terms: TableDef<GlossaryTermRow>
      biblical_places: TableDef<BiblicalPlaceRow>
      lexicon_entries: TableDef<LexiconEntryRow>
      interlinear_words: TableDef<InterlinearWordRow>
      patristic_citations: TableDef<PatristicCitationRow>
    }
    Views: Record<string, never>
    Functions: {
      search_verses_pt: FunctionDef<
        { query: string; version?: string | null; lim?: number },
        SearchVersesPtResult[]
      >
      search_patristics: FunctionDef<{ query: string; lim?: number }, SearchPatristicsResult[]>
      concordance: FunctionDef<{ word: string; version?: string | null }, ConcordanceResult[]>
      search_lexicon: FunctionDef<{ query: string; lim?: number }, SearchLexiconResult[]>
      verses_cited_by_fathers: FunctionDef<
        { p_book: string; p_chapter: number; p_verse: number },
        VersesCitedByFathersResult[]
      >
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
