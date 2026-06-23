import { Fragment } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useChapter } from "@/features/bible/hooks/useChapter"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { Badge } from "@/components/ui/badge"
import type { VerseRow } from "@/types/database.types"

interface ParallelColumnViewProps {
  versionIds: string[]
  book: string
  chapter: number
}

function indexByVerse(verses: VerseRow[] | undefined): Map<number, VerseRow> {
  const map = new Map<number, VerseRow>()
  for (const v of verses ?? []) map.set(v.verse, v)
  return map
}

export function ParallelColumnView({ versionIds, book, chapter }: ParallelColumnViewProps) {
  const { t } = useTranslation("common")
  const versionA = versionIds[0]
  const versionB = versionIds[1]

  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const nameFor = (id: string) => versions?.find((v) => v.id === id)?.name ?? id

  const { data: versesA, isLoading: loadingA } = useChapter(versionA, book, chapter)
  const { data: versesB, isLoading: loadingB } = useChapter(versionB, book, chapter)

  if (loadingA || loadingB) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>
  }

  // Alinha por número de versículo (não por ordem de chegada) — versões
  // diferentes podem ter contagens de versículos ligeiramente diferentes,
  // por isso cada lado mostra o seu próprio versículo N na mesma linha.
  const byVerseA = indexByVerse(versesA)
  const byVerseB = indexByVerse(versesB)
  const verseNumbers = [...new Set([...byVerseA.keys(), ...byVerseB.keys()])].sort((a, b) => a - b)

  return (
    <div className="grid grid-cols-2 gap-x-6">
      <h3 className="sticky top-0 bg-background pb-2 text-sm font-semibold text-muted-foreground">
        {nameFor(versionA)}
      </h3>
      <h3 className="sticky top-0 bg-background pb-2 text-sm font-semibold text-muted-foreground">
        {nameFor(versionB)}
      </h3>

      {verseNumbers.map((verseNum) => (
        <Fragment key={verseNum}>
          <p className="border-t border-border py-1 font-serif text-base leading-relaxed">
            {byVerseA.has(verseNum) && (
              <>
                <Badge variant="outline" className="mr-2 align-super text-[10px]">
                  {verseNum}
                </Badge>
                {byVerseA.get(verseNum)!.text}
              </>
            )}
          </p>
          <p className="border-t border-border py-1 font-serif text-base leading-relaxed">
            {byVerseB.has(verseNum) && (
              <>
                <Badge variant="outline" className="mr-2 align-super text-[10px]">
                  {verseNum}
                </Badge>
                {byVerseB.get(verseNum)!.text}
              </>
            )}
          </p>
        </Fragment>
      ))}
    </div>
  )
}
