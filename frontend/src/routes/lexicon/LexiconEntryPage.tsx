import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getEntryByDStrong } from "@/lib/supabase/queries/lexicon"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function LexiconEntryPage() {
  const { dStrong } = useParams<{ dStrong: string }>()
  const { t } = useTranslation(["common", "lexicon"])
  const { data: entry, isLoading } = useQuery({
    queryKey: ["lexicon-entry", dStrong],
    queryFn: () => getEntryByDStrong(dStrong!),
    enabled: !!dStrong,
  })

  if (isLoading) return <p className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">{t("common:common.loading")}</p>
  if (!entry) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs items={[{ label: t("nav.lexicon"), to: "/lexicon" }, { label: entry.word }]} />
      <h1 className="font-serif text-4xl text-foreground">{entry.word}</h1>
      {entry.transliteration && <p className="mt-1 text-muted-foreground">{entry.transliteration}</p>}

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("lexicon:fields.strongs")}</dt>
        <dd>
          {entry.e_strong} ({entry.d_strong})
        </dd>
        {entry.morph && (
          <>
            <dt className="text-muted-foreground">{t("lexicon:fields.morphology")}</dt>
            <dd>{entry.morph}</dd>
          </>
        )}
        {entry.gloss && (
          <>
            <dt className="text-muted-foreground">{t("lexicon:fields.gloss")}</dt>
            <dd>{entry.gloss}</dd>
          </>
        )}
      </dl>

      {entry.definition && <p className="mt-6 font-serif text-lg leading-relaxed">{entry.definition}</p>}

      <SourceAttribution sourceUrl={entry.source_url} license={entry.license} />
    </div>
  )
}
