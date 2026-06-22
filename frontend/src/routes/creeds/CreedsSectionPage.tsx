import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCreedById, getSectionsForWork } from "@/lib/supabase/queries/creeds"
import { SourceAttribution } from "@/components/layout/SourceAttribution"

export function CreedsSectionPage() {
  const { workId } = useParams<{ workId: string }>()
  const { t, i18n } = useTranslation("common")
  const { data: creed } = useQuery({
    queryKey: ["creed", workId],
    queryFn: () => getCreedById(workId!),
    enabled: !!workId,
  })

  const wantsPt = i18n.language === "pt"
  const { data: ptSections, isLoading: loadingPt } = useQuery({
    queryKey: ["creed-sections", workId, "pt"],
    queryFn: () => getSectionsForWork(workId!, "pt"),
    enabled: !!workId && wantsPt,
  })
  // Nem todos os credos têm tradução PT real encontrada — quando não há,
  // mostra-se o inglês em vez de uma página vazia.
  const needsEnFallback = wantsPt && !loadingPt && (ptSections?.length ?? 0) === 0
  const { data: enSections, isLoading: loadingEn } = useQuery({
    queryKey: ["creed-sections", workId, "en"],
    queryFn: () => getSectionsForWork(workId!, "en"),
    enabled: !!workId && (!wantsPt || needsEnFallback),
  })

  const sections = wantsPt && !needsEnFallback ? ptSections : enSections
  const isLoading = wantsPt ? loadingPt || (needsEnFallback && loadingEn) : loadingEn
  const showingPt = wantsPt && !needsEnFallback

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">
        {(i18n.language === "en" ? creed?.title : (creed?.title_pt ?? creed?.title)) ?? workId}
      </h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-4 font-serif text-lg leading-relaxed">
        {sections?.map((section) => (
          <p key={section.id}>{section.text}</p>
        ))}
      </div>

      {creed &&
        (showingPt ? (
          <SourceAttribution sourceUrl={creed.source_url_pt} license={creed.license_pt ?? "check_rights"} />
        ) : (
          <SourceAttribution sourceUrl={creed.source_url} license={creed.license} />
        ))}
    </div>
  )
}
