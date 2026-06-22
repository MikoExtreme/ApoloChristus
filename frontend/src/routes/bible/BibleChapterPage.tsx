import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { useChapter, useChapterCount } from "@/features/bible/hooks/useChapter"
import { useInterlinear } from "@/features/bible/hooks/useInterlinear"
import { useCrossReferences } from "@/features/bible/hooks/useCrossReferences"
import { useReaderStore } from "@/features/bible/store/useReaderStore"
import { ReaderToolbar } from "@/features/bible/components/ReaderToolbar"
import { VerseList } from "@/features/bible/components/VerseList"
import { ParallelColumnView } from "@/features/bible/components/ParallelColumnView"
import { ConcordanceDrawer } from "@/features/bible/components/ConcordanceDrawer"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Button } from "@/components/ui/button"

export function BibleChapterPage() {
  const { t } = useTranslation("common")
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

  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const { data: verses, isLoading } = useChapter(versionId, book, chapter)
  const { data: chapterCount } = useChapterCount(versionId, book)
  const { data: interlinearWords } = useInterlinear(book, chapter, interlinear)
  const { data: crossRefs } = useCrossReferences(book, chapter, crossReferences)

  const [concordanceQuery, setConcordanceQuery] = useState<string | null>(null)
  const [concordanceOpen, setConcordanceOpen] = useState(false)

  const currentVersion = versions?.find((v) => v.id === versionId)
  const showParallel = parallelVersions.length > 0 && versionId

  function openConcordance(query: string) {
    setConcordanceQuery(query)
    setConcordanceOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">
          {book} {chapter}
        </h1>
        <div className="flex gap-2">
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
