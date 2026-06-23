import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getBibleVersions, getBooksForVersion } from "@/lib/supabase/queries/bible"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import { isVersionCompatibleWithTestament } from "@/features/bible/lib/versionRestrictions"
import { useChapter, useChapterCount } from "@/features/bible/hooks/useChapter"
import { useInterlinear } from "@/features/bible/hooks/useInterlinear"
import { useCrossReferences } from "@/features/bible/hooks/useCrossReferences"
import { useReaderStore } from "@/features/bible/store/useReaderStore"
import { useReadingHistoryStore } from "@/features/bible/store/useReadingHistoryStore"
import { ReaderToolbar } from "@/features/bible/components/ReaderToolbar"
import { VerseList } from "@/features/bible/components/VerseList"
import { ParallelColumnView } from "@/features/bible/components/ParallelColumnView"
import { ConcordanceDrawer } from "@/features/bible/components/ConcordanceDrawer"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { ArchaicSpellingNote } from "@/components/layout/ArchaicSpellingNote"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function BibleChapterPage() {
  const { t, i18n } = useTranslation("common")
  const navigate = useNavigate()
  const { versionId, book, chapter: chapterParam } = useParams<{
    versionId: string
    book: string
    chapter: string
  }>()
  const chapter = Number(chapterParam)

  const {
    interlinear,
    crossReferences,
    patristicCitations,
    concordanceActive,
    concordanceMode,
    parallelVersions,
    setInterlinear,
    setCrossReferences,
    setPatristicCitations,
    setConcordanceActive,
  } = useReaderStore()
  const setLastRead = useReadingHistoryStore((s) => s.setLastRead)

  // Inicializa os toggles a partir dos query params da URL de entrada (estado
  // partilhável/bookmark-ável), uma vez por navegação para um capítulo —
  // não escreve de volta para a URL a cada toggle, para evitar disparar
  // ciclos de re-render/refetch desnecessários.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setInterlinear(params.get("interlinear") === "1")
    setCrossReferences(params.get("xrefs") === "1")
    setPatristicCitations(params.get("citations") === "1")
    setConcordanceActive(params.get("concordance") === "1")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId, book, chapter])

  // Memoriza a posição de leitura para "continuar a ler" na página inicial.
  useEffect(() => {
    if (versionId && book && chapter) setLastRead({ versionId, book, chapter })
  }, [versionId, book, chapter, setLastRead])

  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const { data: books } = useQuery({
    queryKey: ["bible-books", versionId],
    queryFn: () => getBooksForVersion(versionId!),
    enabled: !!versionId,
  })
  const { data: verses, isLoading } = useChapter(versionId, book, chapter)
  const { data: chapterCount } = useChapterCount(versionId, book)
  const { data: interlinearWords } = useInterlinear(book, chapter, interlinear)
  const { data: crossRefs } = useCrossReferences(book, chapter, crossReferences)

  // Versículo a realçar ao chegar de um resultado de pesquisa (#v16 no hash).
  // O React Router reutiliza esta mesma instância de componente ao navegar
  // entre capítulos (mesmo padrão de rota), por isso isto tem de reagir a
  // versionId/book/chapter — um useState inicializado uma vez só funcionaria
  // no primeiro capítulo carregado na sessão do leitor.
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(undefined)
  useEffect(() => {
    const match = window.location.hash.match(/^#v(\d+)$/)
    const verseNum = match ? Number(match[1]) : undefined
    if (!verseNum) return
    setHighlightedVerse(verseNum)
    // Os versículos chegam de forma assíncrona (useChapter) — só nos
    // preocupamos em fazer scroll quando o elemento já existe no DOM,
    // por isso esperamos por `verses` em vez de só pelos params da rota.
    if (!verses) return
    const el = document.getElementById(`v${verseNum}`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    const timeout = setTimeout(() => setHighlightedVerse(undefined), 2500)
    return () => clearTimeout(timeout)
  }, [versionId, book, chapter, verses])

  const [concordanceQuery, setConcordanceQuery] = useState<string | null>(null)
  const [concordanceOpen, setConcordanceOpen] = useState(false)

  const currentVersion = versions?.find((v) => v.id === versionId)
  const showParallel = parallelVersions.length > 0 && versionId

  const testament = verses?.[0]?.testament
  const parallelCandidateVersionId =
    versionId && testament
      ? versions?.find((v) => v.id !== versionId && isVersionCompatibleWithTestament(v.id, testament))?.id
      : undefined

  function openConcordance(query: string) {
    setConcordanceQuery(query)
    setConcordanceOpen(true)
  }

  function jumpToBook(newBook: string) {
    navigate(`/bible/${versionId}/${newBook}/1`)
  }

  function jumpToChapter(newChapter: string) {
    navigate(`/bible/${versionId}/${book}/${newChapter}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("nav.bible"), to: "/bible" },
          { label: currentVersion?.name ?? versionId ?? "", to: `/bible/${versionId}` },
          { label: `${book ? bookDisplayName(book, i18n.language) : book} ${chapter}` },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl text-foreground">
          {book ? bookDisplayName(book, i18n.language) : book} {chapter}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {books && book && (
            <Select value={book} onValueChange={(v) => v && jumpToBook(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>{(value: string) => bookDisplayName(value, i18n.language)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {books.map((b) => (
                  <SelectItem key={b.book} value={b.book}>
                    {bookDisplayName(b.book, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!!chapterCount && (
            <Select value={String(chapter)} onValueChange={(v) => v && jumpToChapter(v)}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {chapter > 1 && (
            <Link to={`/bible/${versionId}/${book}/${chapter - 1}`}>
              <Button variant="outline" size="sm">
                ← {chapter - 1}
              </Button>
            </Link>
          )}
          {!!chapterCount && chapter < chapterCount && (
            <Link to={`/bible/${versionId}/${book}/${chapter + 1}`}>
              <Button variant="outline" size="sm">
                {chapter + 1} →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {versions && versionId && verses && verses[0] && (
        <ReaderToolbar versions={versions} currentVersionId={versionId} testament={verses[0].testament} />
      )}

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

      {versionId === "pt-jfaal" && (
        <div className="mt-4">
          <ArchaicSpellingNote />
        </div>
      )}

      <div className="mt-4">
        {showParallel && book ? (
          <ParallelColumnView versionIds={[versionId, ...parallelVersions]} book={book} chapter={chapter} />
        ) : (
          verses && (
            <VerseList
              verses={verses}
              showInterlinear={interlinear}
              interlinearWords={interlinearWords ?? []}
              showCrossReferences={crossReferences}
              crossReferences={crossRefs ?? []}
              showCitations={patristicCitations}
              concordanceClickable={concordanceActive}
              onTextWordClick={(word) => concordanceMode === "text" && openConcordance(word)}
              onStrongClick={(strong) => concordanceMode === "original" && openConcordance(strong)}
              highlightedVerse={highlightedVerse}
              parallelCandidateVersionId={parallelCandidateVersionId}
            />
          )
        )}
      </div>

      {currentVersion && <SourceAttribution sourceUrl={currentVersion.source_url} license={currentVersion.license} />}

      <ConcordanceDrawer
        open={concordanceOpen}
        onOpenChange={setConcordanceOpen}
        mode={concordanceMode}
        query={concordanceQuery}
        versionId={versionId}
      />
    </div>
  )
}
