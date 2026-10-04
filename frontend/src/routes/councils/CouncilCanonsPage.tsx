import { useMemo } from "react"
import { useParams, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCouncilById, getCanonsForCouncil } from "@/lib/supabase/queries/councils"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { OrnamentalDivider } from "@/components/layout/OrnamentalDivider"
import type { CouncilCanonRow } from "@/types/database.types"

type CanonGroup = { groupTitle: string | null; canons: CouncilCanonRow[] }

function groupCanons(canons: CouncilCanonRow[]): CanonGroup[] {
  // If titles are all unique and look like section headers (contain "–" or ":"),
  // group by title prefix so sections cluster under their heading.
  // Otherwise show as a flat list under a single null group.
  const hasSections = canons.some((c) => c.title && (c.title.includes("–") || c.title.includes(":")))
  if (!hasSections) return [{ groupTitle: null, canons }]

  const groups: CanonGroup[] = []
  let current: CanonGroup | null = null
  for (const canon of canons) {
    // Group key = everything before the last parenthetical "(Section N)" or the full title
    const groupKey = canon.title
      ? canon.title.replace(/\s*\(Section\s+\d+\)\s*$/, "").trim()
      : null
    if (!current || current.groupTitle !== groupKey) {
      current = { groupTitle: groupKey, canons: [] }
      groups.push(current)
    }
    current.canons.push(canon)
  }
  return groups
}

export function CouncilCanonsPage() {
  const { councilId } = useParams<{ councilId: string }>()
  const { t, i18n } = useTranslation(["councils", "common"])
  const location = useLocation()
  const fromTimeline = Boolean((location.state as { fromTimeline?: boolean } | null)?.fromTimeline)

  const { data: council } = useQuery({
    queryKey: ["council", councilId],
    queryFn: () => getCouncilById(councilId!),
    enabled: !!councilId,
  })

  const { data: canons, isLoading } = useQuery({
    queryKey: ["council-canons", councilId, "en"],
    queryFn: () => getCanonsForCouncil(councilId!, "en"),
    enabled: !!councilId,
  })

  const groups = useMemo(() => groupCanons(canons ?? []), [canons])

  const name =
    i18n.language === "pt" ? (council?.name_pt ?? council?.name) : council?.name

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          ...(fromTimeline ? [{ label: t("common:nav.timeline"), to: "/timeline" }] : []),
          { label: t("councils:title"), to: "/councils" },
          { label: name ?? councilId ?? "" },
        ]}
      />

      <h1 className="font-serif text-3xl text-foreground">{name ?? councilId}</h1>

      {council && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {council.year && (
            <span>
              {council.year}{council.year_end ? `–${council.year_end}` : ""} AD
            </span>
          )}
          {council.location && <span>· {council.location}</span>}
          {council.tradition && (
            <span>· {t(`councils:traditions.${council.tradition}`)}</span>
          )}
        </div>
      )}

      {council?.description && (
        <p className="mt-4 text-muted-foreground leading-relaxed">{council.description}</p>
      )}

      <OrnamentalDivider />

      {isLoading && <p className="text-muted-foreground">{t("common:common.loading")}</p>}

      {canons && canons.length === 0 && !isLoading && (
        <p className="text-muted-foreground">{t("councils:noCanons")}</p>
      )}

      {canons && canons.length > 0 && (
        <div className="flex flex-col gap-8">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.groupTitle && (
                <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                  {group.groupTitle}
                </h2>
              )}
              <div className="flex flex-col gap-6">
                {group.canons.map((canon) => {
                  // For grouped councils, show only the section number within the group
                  const sectionMatch = canon.title?.match(/\(Section\s+(\d+)\)/)
                  const sectionLabel = sectionMatch
                    ? `${t("councils:section")} ${sectionMatch[1]}`
                    : `${t("councils:canon")} ${canon.canon_num}`

                  return (
                    <div key={canon.id} id={`canon-${canon.canon_num}`} className="scroll-mt-20">
                      <h3 className="font-semibold text-foreground text-sm">
                        {group.groupTitle ? sectionLabel : (
                          <>
                            {t("councils:canon")} {canon.canon_num}
                            {canon.title && (
                              <span className="ml-2 font-normal text-muted-foreground">
                                — {canon.title}
                              </span>
                            )}
                          </>
                        )}
                      </h3>
                      <p className="mt-2 font-serif text-base leading-relaxed">{canon.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {council && (
        <div className="mt-8">
          <SourceAttribution sourceUrl={council.source_url} license={council.license} />
        </div>
      )}
    </div>
  )
}
