import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPtTranslationForWork, getSectionsForWork, getWorkById } from "@/lib/supabase/queries/apocrypha"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { OrnamentalDivider } from "@/components/layout/OrnamentalDivider"
import { DropCap } from "@/components/layout/DropCap"
import { useState, useEffect } from "react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { EmptyState } from "@/components/layout/EmptyState"
import { isRestrictedApocryphon } from "@/lib/content/restrictedWorks"
import { useBookmarksStore } from "@/features/shared/store/useBookmarksStore"


export function ApocryphaSectionPage() {
  const { category, workId } = useParams<{ category: string; workId: string }>()
  const { t, i18n } = useTranslation(["common", "apocrypha"])
  const { data: work } = useQuery({
    queryKey: ["apocrypha-work", workId],
    queryFn: () => getWorkById(workId!),
    enabled: !!workId,
  })
  const wantsPt = i18n.language === "pt"
  const { data: ptWork, isLoading: loadingPtWork } = useQuery({
    queryKey: ["apocrypha-work-pt", workId],
    queryFn: () => getPtTranslationForWork(workId!),
    enabled: !!workId && wantsPt,
  })
  const showingPt = wantsPt && !!ptWork
  const activeWorkId = showingPt ? ptWork!.id : workId

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ["apocrypha-sections", activeWorkId],
    queryFn: () => getSectionsForWork(activeWorkId!),
    enabled: !!activeWorkId && (!wantsPt || !loadingPtWork),
  })

  const isLoading = (wantsPt && loadingPtWork) || loadingSections
  const attribution = showingPt ? ptWork : work

  const [placing, setPlacing] = useState(false)
  const { addBookmark, bookmarks } = useBookmarksStore()

  function handleSectionClick(index: number, text: string) {
    const title = showingPt
      ? (ptWork?.title_pt ?? ptWork?.title_en ?? "")
      : (i18n.language === "en" ? work?.title_en : work?.title_pt) ?? ""
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

  if (isRestrictedApocryphon(workId)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs
          items={[
            { label: t("nav.apocrypha"), to: "/apocrypha" },
            { label: t(`apocrypha:categories.${category}`), to: `/apocrypha/${category}` },
          ]}
        />
        <EmptyState title={t("apocrypha:restricted.title")} description={t("apocrypha:restricted.description")} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("nav.apocrypha"), to: "/apocrypha" },
          { label: t(`apocrypha:categories.${category}`), to: `/apocrypha/${category}` },
          { label: showingPt ? (ptWork?.title_pt ?? ptWork?.title_en ?? workId ?? "") : (i18n.language === "en" ? work?.title_en : work?.title_pt) ?? workId ?? "" },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">
        {showingPt
          ? (ptWork?.title_pt ?? ptWork?.title_en)
          : (i18n.language === "en" ? work?.title_en : work?.title_pt) ?? workId}
      </h1>
      <OrnamentalDivider />

      <div className="mt-4">
        <BookmarkButton placing={placing} onToggle={() => setPlacing(!placing)} />
      </div>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

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
