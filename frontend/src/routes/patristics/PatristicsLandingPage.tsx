import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getPeriods } from "@/lib/supabase/queries/patristics"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import { ChevronRight } from "lucide-react"

const PERIOD_RANGE: Record<string, string> = {
  apostolic:   "c. 30–100",
  ante_nicene: "100–325",
  nicene:      "325–381",
  post_nicene: "381–600",
  medieval:    "600–1500",
  unknown:     "",
}

export function PatristicsLandingPage() {
  const { t } = useTranslation(["patristics", "common"])
  const { data: periods, isLoading } = useQuery({
    queryKey: ["patristic-periods"],
    queryFn: getPeriods,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("patristics:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("patristics:browseByPeriod")}</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          : periods?.map((period) => (
              <Link key={period} to={`/patristics/${period}`}>
                <Card className="group h-full hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div>
                      <p className="font-semibold text-foreground leading-snug">
                        {t(`patristics:periods.${period}`)}
                      </p>
                      {PERIOD_RANGE[period] && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {PERIOD_RANGE[period]} AD
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {!isLoading && periods?.length === 0 && (
        <EmptyState title={t("common:common.notFound")} />
      )}
    </div>
  )
}
