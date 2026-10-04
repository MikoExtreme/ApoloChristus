import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getTimelineItems, type TimelineCategory } from "@/lib/supabase/queries/timeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const CATEGORY_COLORS: Record<TimelineCategory, string> = {
  council:   "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:border-violet-400/40",
  creed:     "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-400/40",
  father:    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40",
  apocrypha: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-400/40",
}

const DOT_COLORS: Record<TimelineCategory, string> = {
  council:   "bg-violet-500",
  creed:     "bg-sky-500",
  father:    "bg-amber-500",
  apocrypha: "bg-emerald-500",
}

type Era = {
  key: string
  from: number
  to: number
}

const ERAS: Era[] = [
  { key: "apostolic",   from: -Infinity, to: 99  },
  { key: "ante_nicene", from: 100,        to: 324 },
  { key: "nicene",      from: 325,        to: 787 },
  { key: "medieval",    from: 788,        to: 1516 },
  { key: "reformation", from: 1517,       to: Infinity },
]

function eraForYear(year: number): string {
  return ERAS.find((e) => year >= e.from && year <= e.to)?.key ?? "reformation"
}

type FilterOption = "all" | TimelineCategory

export function TimelinePage() {
  const { t, i18n } = useTranslation(["timeline", "common"])
  const [filter, setFilter] = useState<FilterOption>("all")

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: getTimelineItems,
  })

  const filtered = useMemo(
    () => filter === "all" ? allItems : allItems.filter((i) => i.category === filter),
    [allItems, filter]
  )

  // Group by era, inserting era headers
  const grouped = useMemo(() => {
    const result: Array<{ type: "era"; eraKey: string } | { type: "item"; item: (typeof allItems)[0] }> = []
    let currentEra = ""
    for (const item of filtered) {
      const era = eraForYear(item.year)
      if (era !== currentEra) {
        result.push({ type: "era", eraKey: era })
        currentEra = era
      }
      result.push({ type: "item", item })
    }
    return result
  }, [filtered])

  const FILTERS: { key: FilterOption; label: string }[] = [
    { key: "all",       label: t("timeline:filter.all") },
    { key: "council",   label: t("timeline:filter.council") },
    { key: "creed",     label: t("timeline:filter.creed") },
    { key: "father",    label: t("timeline:filter.father") },
    { key: "apocrypha", label: t("timeline:filter.apocrypha") },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("timeline:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("timeline:subtitle")}</p>

      {/* Filter buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Color legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {(["council", "creed", "father", "apocrypha"] as TimelineCategory[]).map((cat) => (
          <span key={cat} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${CATEGORY_COLORS[cat]}`}>
            <span className={`h-2 w-2 rounded-full ${DOT_COLORS[cat]}`} />
            {t(`timeline:categories.${cat}`)}
          </span>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-muted-foreground">{t("common:common.loading")}</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="mt-8 text-muted-foreground">{t("timeline:noDates")}</p>
      )}

      {/* Timeline */}
      <div className="relative mt-10 pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        {grouped.map((row, idx) => {
          if (row.type === "era") {
            return (
              <div key={`era-${row.eraKey}-${idx}`} className="relative mb-2 mt-8 first:mt-0">
                <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                </div>
                <p className="ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t(`timeline:eras.${row.eraKey}`)}
                </p>
              </div>
            )
          }

          const { item } = row
          const title = i18n.language === "pt" ? item.titlePt : item.titleEn
          const colorClass = CATEGORY_COLORS[item.category]
          const dotColor = DOT_COLORS[item.category]

          return (
            <div key={item.id} className="relative mb-4 mt-3">
              {/* Dot */}
              <div className={`absolute -left-[1.4rem] mt-1 h-3 w-3 rounded-full border-2 border-card ${dotColor}`} />

              <Link to={item.href} state={{ fromTimeline: true }} className="group block">
                <div className="rounded-lg border border-border bg-card p-3 transition-colors group-hover:bg-muted/50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-foreground leading-snug">{title}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.yearDisplay} AD
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${colorClass}`}
                      >
                        {t(`timeline:categories.${item.category}`)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
