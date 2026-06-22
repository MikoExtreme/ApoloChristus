// Parser de referências bíblicas em português: "Génesis 2", "Isaías 10:1",
// "1 Pedro 1:1-4". Os códigos de livro (GEN, ISA, 1PE, ...) seguem a
// convenção USFM usada em christianity-data-pipeline/fetchers/bible_fetcher.py.

export interface ParsedReference {
  book: string
  chapter: number
  verseStart?: number
  verseEnd?: number
}

// Nomes completos em português, normalizados (sem acentos, minúsculas) -> código.
// Cobre as variantes PT-PT/PT-BR mais comuns (ex: Génesis/Gênesis normalizam
// ambas para "genesis" depois de remover acentos).
const FULL_NAME_TO_CODE: Record<string, string> = {
  genesis: "GEN",
  exodo: "EXO",
  levitico: "LEV",
  numeros: "NUM",
  deuteronomio: "DEU",
  josue: "JOS",
  juizes: "JDG",
  rute: "RUT",
  "1 samuel": "1SA",
  "2 samuel": "2SA",
  "1 reis": "1KI",
  "2 reis": "2KI",
  "1 cronicas": "1CH",
  "2 cronicas": "2CH",
  esdras: "EZR",
  neemias: "NEH",
  ester: "EST",
  jo: "JOB",
  salmos: "PSA",
  salmo: "PSA",
  proverbios: "PRO",
  eclesiastes: "ECC",
  cantares: "SNG",
  "cantico dos canticos": "SNG",
  isaias: "ISA",
  jeremias: "JER",
  lamentacoes: "LAM",
  ezequiel: "EZK",
  daniel: "DAN",
  oseias: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadias: "OBA",
  jonas: "JON",
  miqueias: "MIC",
  naum: "NAM",
  habacuque: "HAB",
  sofonias: "ZEP",
  ageu: "HAG",
  zacarias: "ZEC",
  malaquias: "MAL",
  mateus: "MAT",
  marcos: "MRK",
  lucas: "LUK",
  joao: "JHN",
  atos: "ACT",
  romanos: "ROM",
  "1 corintios": "1CO",
  "2 corintios": "2CO",
  galatas: "GAL",
  efesios: "EPH",
  filipenses: "PHP",
  colossenses: "COL",
  "1 tessalonicenses": "1TH",
  "2 tessalonicenses": "2TH",
  "1 timoteo": "1TI",
  "2 timoteo": "2TI",
  tito: "TIT",
  filemom: "PHM",
  hebreus: "HEB",
  tiago: "JAS",
  "1 pedro": "1PE",
  "2 pedro": "2PE",
  "1 joao": "1JN",
  "2 joao": "2JN",
  "3 joao": "3JN",
  judas: "JUD",
  apocalipse: "REV",
}

// Abreviaturas (PT_BOOK_ABBREV em bible_fetcher.py) — comparação sensível a
// acentos para evitar colisão entre "jó" (Job) e "jo" (João).
const ABBREV_TO_CODE: Record<string, string> = {
  gn: "GEN",
  ex: "EXO",
  lv: "LEV",
  nm: "NUM",
  dt: "DEU",
  js: "JOS",
  jz: "JDG",
  rt: "RUT",
  "1sm": "1SA",
  "2sm": "2SA",
  "1rs": "1KI",
  "2rs": "2KI",
  "1cr": "1CH",
  "2cr": "2CH",
  ed: "EZR",
  ne: "NEH",
  et: "EST",
  jó: "JOB",
  sl: "PSA",
  pv: "PRO",
  ec: "ECC",
  ct: "SNG",
  is: "ISA",
  jr: "JER",
  lm: "LAM",
  ez: "EZK",
  dn: "DAN",
  os: "HOS",
  jl: "JOL",
  am: "AMO",
  ob: "OBA",
  jn: "JON",
  mq: "MIC",
  na: "NAM",
  hc: "HAB",
  sf: "ZEP",
  ag: "HAG",
  zc: "ZEC",
  ml: "MAL",
  mt: "MAT",
  mc: "MRK",
  lc: "LUK",
  jo: "JHN",
  atos: "ACT",
  rm: "ROM",
  "1co": "1CO",
  "2co": "2CO",
  gl: "GAL",
  ef: "EPH",
  fp: "PHP",
  cl: "COL",
  "1ts": "1TH",
  "2ts": "2TH",
  "1tm": "1TI",
  "2tm": "2TI",
  tt: "TIT",
  fm: "PHM",
  hb: "HEB",
  tg: "JAS",
  "1pe": "1PE",
  "2pe": "2PE",
  "1jo": "1JN",
  "2jo": "2JN",
  "3jo": "3JN",
  jd: "JUD",
  ap: "REV",
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g

function stripAccents(input: string): string {
  return input.normalize("NFD").replace(COMBINING_DIACRITICS, "")
}

function resolveBookCode(rawName: string): string | null {
  const trimmed = rawName.trim()
  if (ABBREV_TO_CODE[trimmed.toLowerCase()]) {
    return ABBREV_TO_CODE[trimmed.toLowerCase()]
  }
  const normalized = stripAccents(trimmed.toLowerCase()).replace(/\s+/g, " ").trim()
  return FULL_NAME_TO_CODE[normalized] ?? null
}

// Formatos aceites: "Livro Capítulo", "Livro Capítulo:Versículo",
// "Livro Capítulo:Versículo-Versículo".
const REFERENCE_PATTERN = /^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/

export function parseReference(input: string): ParsedReference | null {
  const match = REFERENCE_PATTERN.exec(input.trim())
  if (!match) return null

  const [, bookName, chapterStr, verseStartStr, verseEndStr] = match
  const book = resolveBookCode(bookName)
  if (!book) return null

  return {
    book,
    chapter: Number(chapterStr),
    verseStart: verseStartStr ? Number(verseStartStr) : undefined,
    verseEnd: verseEndStr ? Number(verseEndStr) : undefined,
  }
}
