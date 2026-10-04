import { useParams, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCreedById, getSectionsForWork } from "@/lib/supabase/queries/creeds"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { MachineTranslationWarning } from "@/components/layout/MachineTranslationWarning"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { OrnamentalDivider } from "@/components/layout/OrnamentalDivider"
import { OrnateFrame } from "@/components/layout/OrnateFrame"
import { DropCap } from "@/components/layout/DropCap"
import { useState, useEffect } from "react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { useBookmarksStore } from "@/features/shared/store/useBookmarksStore"

export function CreedsSectionPage() {
  const { workId } = useParams<{ workId: string }>()
  const { t, i18n } = useTranslation("common")
  const location = useLocation()
  const fromTimeline = Boolean((location.state as { fromTimeline?: boolean } | null)?.fromTimeline)
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
  const isMachineTranslated = showingPt && creed?.license_pt === "machine_translated"

  const [placing, setPlacing] = useState(false)
  const { addBookmark, bookmarks } = useBookmarksStore()

  function handleSectionClick(index: number, text: string) {
    const title = (i18n.language === "en" ? creed?.title : (creed?.title_pt ?? creed?.title)) ?? ""
    addBookmark({
      url: `${window.location.pathname}#section-${index}`,
      label: `${title} — ${text.slice(0, 60).trim()}…`,
    })
    setPlacing(false)
  }


  useEffect(() => {
    if (!sections?.length) return
    const hash = window.location.hash
    if (!hash) return
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [sections])

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          ...(fromTimeline ? [{ label: t("nav.timeline"), to: "/timeline" }] : []),
          { label: t("nav.creeds"), to: "/creeds" },
          { label: (i18n.language === "en" ? creed?.title : (creed?.title_pt ?? creed?.title)) ?? workId ?? "" },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">
        {(i18n.language === "en" ? creed?.title : (creed?.title_pt ?? creed?.title)) ?? workId}
      </h1>
      <OrnamentalDivider />

      <div className="mt-4">
        <BookmarkButton placing={placing} onToggle={() => setPlacing(!placing)} />
      </div>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

      {isMachineTranslated && (
        <div className="mt-6">
          <MachineTranslationWarning />
        </div>
      )}

      {sections && sections.length > 0 && (
        <OrnateFrame>
          <div className="flex flex-col gap-4 font-serif text-lg leading-relaxed">
            {sections?.map((section, i) => {
              const isBookmarked = bookmarks.some(
                (b) => b.url === `${window.location.pathname}#section-${i}`
              )
              return (
                <p
                  key={section.id}
                  id={`section-${i}`}
                  className={[
                    isBookmarked ? "border-l-4 border-primary pl-3 bg-primary/5" : "",
                    placing ? "cursor-pointer rounded transition-colors hover:bg-primary/10" : "",
                  ].join(" ") || undefined}
                  onClick={placing ? () => handleSectionClick(i, section.text) : undefined}
                >
                  {i === 0 ? <DropCap text={section.text} /> : section.text}
                </p>
              )
            })}
          </div>
        </OrnateFrame>
      )}

      {creed &&
        (showingPt ? (
          <SourceAttribution sourceUrl={creed.source_url_pt} license={creed.license_pt ?? "check_rights"} />
        ) : (
          <SourceAttribution sourceUrl={creed.source_url} license={creed.license} />
        ))}
    </div>
  )
}
