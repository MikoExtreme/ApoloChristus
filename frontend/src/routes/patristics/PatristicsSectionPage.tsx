import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSectionsForWork, getWorkById } from "@/lib/supabase/queries/patristics"
import { SourceAttribution } from "@/components/layout/SourceAttribution"

export function PatristicsSectionPage() {
  const { workId } = useParams<{ workId: string }>()
  const { t } = useTranslation("common")
  const { data: work } = useQuery({
    queryKey: ["patristic-work", workId],
    queryFn: () => getWorkById(workId!),
    enabled: !!workId,
  })
  const { data: sections, isLoading } = useQuery({
    queryKey: ["patristic-sections", workId],
    queryFn: () => getSectionsForWork(workId!),
    enabled: !!workId,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{work?.title ?? workId}</h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-4 font-serif text-lg leading-relaxed">
        {sections?.map((section) => (
          <p key={section.id}>{section.text}</p>
        ))}
      </div>

      {work && <SourceAttribution sourceUrl={work.source_url} license={work.license} />}
    </div>
  )
}
