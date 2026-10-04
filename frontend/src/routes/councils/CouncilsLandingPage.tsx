import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getCouncils } from "@/lib/supabase/queries/councils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import { ChevronRight } from "lucide-react"

const TRADITION_COLORS: Record<string, string> = {
  ecumenical: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-400/40",
  catholic:   "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40",
  orthodox:   "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:border-violet-400/40",
  protestant: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-400/40",
  reformed:   "bg-green-100 text-green-800 border-green-300 dark:bg-green-400/15 dark:text-green-200 dark:border-green-400/40",
}

export function CouncilsLandingPage() {
  const { t, i18n } = useTranslation(["councils", "common"])
  const { data: councils, isLoading } = useQuery({
    queryKey: ["councils"],
    queryFn: getCouncils,
  })

  const byType = new Map<string, typeof councils>()
  for (const c of councils ?? []) {
    const list = byType.get(c.type) ?? []
    list.push(c)
    byType.set(c.type, list)
  }

  const typeOrder = ["ecumenical", "regional", "synod"]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("councils:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("councils:subtitle")}</p>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && councils?.length === 0 && (
        <EmptyState icon="⚖" title={t("common:common.notFound")} />
      )}

      <div className="mt-6 flex flex-col gap-8">
        {typeOrder.map((type) => {
          const list = byType.get(type)
          if (!list?.length) return null
          return (
            <div key={type}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`councils:types.${type}`)}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((council) => (
                  <Link key={council.id} to={`/councils/${council.id}`}>
                    <Card className="group hover:bg-muted/50 transition-colors">
                      <CardContent className="flex items-center gap-4 py-3 px-5">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground leading-snug">
                            {i18n.language === "pt" ? (council.name_pt ?? council.name) : council.name}
                          </p>
                          {council.location && (
                            <p className="text-xs text-muted-foreground mt-0.5">{council.location}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {council.year && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {council.year}{council.year_end ? `–${council.year_end}` : ""} AD
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${TRADITION_COLORS[council.tradition] ?? ""}`}
                          >
                            {t(`councils:traditions.${council.tradition}`)}
                          </Badge>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
