import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useChapter } from "@/features/bible/hooks/useChapter"
import { useInterlinear } from "@/features/bible/hooks/useInterlinear"
import { InterlinearWordRow } from "@/features/bible/components/InterlinearWordRow"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { Badge } from "@/components/ui/badge"
import type { InterlinearWordRow as InterlinearWordRowType } from "@/types/database.types"

interface InterlinearParallelViewProps {
  translationVersionId: string
  book: string
  chapter: number
}

export function InterlinearParallelView({ translationVersionId, book, chapter }: InterlinearParallelViewProps) {
  const { t } = useTranslation(["bible", "common"])

  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const translationName = versions?.find((v) => v.id === translationVersionId)?.name ?? translationVersionId

  const { data: interlinearWords, isLoading: loadingInterlinear } = useInterlinear(book, chapter, true)
  const { data: verses, isLoading: loadingVerses } = useChapter(translationVersionId, book, chapter)

  // Agrupa as palavras do interlinear por número de versículo
  const wordsByVerse = useMemo(() => {
    const map = new Map<number, InterlinearWordRowType[]>()
    for (const word of interlinearWords ?? []) {
      const list = map.get(word.verse) ?? []
      list.push(word)
      map.set(word.verse, list)
    }
    return map
  }, [interlinearWords])

  const verseMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const v of verses ?? []) map.set(v.verse, v.text)
    return map
  }, [verses])

  const verseNumbers = useMemo(() => {
    const nums = new Set([...wordsByVerse.keys(), ...verseMap.keys()])
    return [...nums].sort((a, b) => a - b)
  }, [wordsByVerse, verseMap])

  if (loadingInterlinear || loadingVerses) {
    return <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>
  }

  if (wordsByVerse.size === 0) {
    return <p className="mt-6 text-muted-foreground">{t("bible:interlinearParallel.noData")}</p>
  }

  return (
    <div className="space-y-1">
      {/* Cabeçalho com os dois rótulos lado a lado */}
      <div className="sticky top-0 z-10 flex gap-2 bg-background pb-2 text-sm font-semibold text-muted-foreground">
        <span className="flex-1">{t("bible:interlinearParallel.originalLabel")}</span>
        <span className="flex-1">{translationName}</span>
      </div>

      {verseNumbers.map((verseNum) => {
        const words = wordsByVerse.get(verseNum) ?? []
        const text = verseMap.get(verseNum)
        return (
          <div key={verseNum} className="border-t border-border py-3">
            <Badge variant="outline" className="mb-2 text-[10px]">
              {verseNum}
            </Badge>

            {/* Bloco de duas colunas: interlinear à esquerda, tradução à direita */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Coluna esquerda — interlinear palavra-a-palavra com glosa */}
              <div>
                {words.length > 0 ? (
                  <InterlinearWordRow
                    words={words}
                    clickable={false}
                    showGloss
                    onWordClick={() => {}}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground italic">—</span>
                )}
              </div>

              {/* Coluna direita — texto da tradução em prosa */}
              <div>
                {text ? (
                  <p className="font-serif text-base leading-relaxed">{text}</p>
                ) : (
                  <span className="text-xs text-muted-foreground italic">—</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
