import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSectionsForWork, getWorkById } from "@/lib/supabase/queries/apocrypha"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function ApocryphaSectionPage() {
  const { category, workId } = useParams<{ category: string; workId: string }>()
  const { t, i18n } = useTranslation(["common", "apocrypha"])
  const { data: work } = useQuery({
    queryKey: ["apocrypha-work", workId],
    queryFn: () => getWorkById(workId!),
    enabled: !!workId,
  })
  const { data: sections, isLoading } = useQuery({
    queryKey: ["apocrypha-sections", workId],
    queryFn: () => getSectionsForWork(workId!),
    enabled: !!workId,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("nav.apocrypha"), to: "/apocrypha" },
          { label: t(`apocrypha:categories.${category}`), to: `/apocrypha/${category}` },
          { label: (i18n.language === "en" ? work?.title_en : work?.title_pt) ?? workId ?? "" },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">
        {(i18n.language === "en" ? work?.title_en : work?.title_pt) ?? workId}
      </h1>

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
