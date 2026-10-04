import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAuthorById, getPtTranslationForWork, getSectionsForWork, getWorkById } from "@/lib/supabase/queries/patristics"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { MachineTranslationWarning } from "@/components/layout/MachineTranslationWarning"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { OrnamentalDivider } from "@/components/layout/OrnamentalDivider"
import { DropCap } from "@/components/layout/DropCap"
import { useState, useEffect } from "react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { useBookmarksStore } from "@/features/shared/store/useBookmarksStore"

export function PatristicsSectionPage() {
  const { period, authorId, workId } = useParams<{ period: string; authorId: string; workId: string }>()
  const { t, i18n } = useTranslation(["common", "patristics"])
  const { data: author } = useQuery({
    queryKey: ["patristic-author", authorId],
    queryFn: () => getAuthorById(authorId!),
    enabled: !!authorId,
  })
  const { data: work } = useQuery({
    queryKey: ["patristic-work", workId],
    queryFn: () => getWorkById(workId!),
    enabled: !!workId,
  })

  const wantsPt = i18n.language === "pt"
  const { data: ptWork, isLoading: loadingPtWork } = useQuery({
    queryKey: ["patristic-work-pt", workId],
    queryFn: () => getPtTranslationForWork(workId!),
    enabled: !!workId && wantsPt,
  })
  const showingPt = wantsPt && !!ptWork
  const activeWorkId = showingPt ? ptWork!.id : workId

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ["patristic-sections", activeWorkId],
    queryFn: () => getSectionsForWork(activeWorkId!),
    enabled: !!activeWorkId && (!wantsPt || !loadingPtWork),
  })

  const isLoading = (wantsPt && loadingPtWork) || loadingSections
  const isMachineTranslated = showingPt && ptWork?.license === "machine_translated"
  const attribution = showingPt ? ptWork : work

  const [placing, setPlacing] = useState(false)
  const { addBookmark, bookmarks } = useBookmarksStore()

  function handleSectionClick(index: number, text: string) {
    const title = (showingPt ? ptWork?.title : work?.title) ?? ""
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
          { label: t("nav.patristics"), to: "/patristics" },
          { label: t(`patristics:periods.${period}`), to: `/patristics/${period}` },
          { label: author?.name_pt ?? authorId ?? "", to: `/patristics/${period}/${authorId}` },
          { label: (showingPt ? ptWork?.title : work?.title) ?? workId ?? "" },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">{(showingPt ? ptWork?.title : work?.title) ?? workId}</h1>
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

      <div className="mt-6 flex flex-col gap-4 font-serif text-lg leading-relaxed">
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

      {attribution && <SourceAttribution sourceUrl={attribution.source_url} license={attribution.license} />}
    </div>
  )
}
