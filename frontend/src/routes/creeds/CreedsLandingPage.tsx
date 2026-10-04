import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getCreeds } from "@/lib/supabase/queries/creeds"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import { ChevronRight } from "lucide-react"

export function CreedsLandingPage() {
  const { t, i18n } = useTranslation(["creeds", "common"])
  const { data: creeds, isLoading } = useQuery({
    queryKey: ["creeds"],
    queryFn: getCreeds,
  })

  const byTradition = new Map<string, typeof creeds>()
  for (const creed of creeds ?? []) {
    const key = creed.tradition ?? "ecumenical"
    const list = byTradition.get(key) ?? []
    list.push(creed)
    byTradition.set(key, list)
  }

  const TRADITION_ORDER = ["ecumenical", "catholic", "orthodox", "protestant"]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("creeds:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("creeds:browseByTradition")}</p>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && creeds?.length === 0 && (
        <EmptyState title={t("common:common.notFound")} />
      )}

      <div className="mt-6 flex flex-col gap-8">
        {TRADITION_ORDER.map((tradition) => {
          const list = byTradition.get(tradition)
          if (!list?.length) return null
          return (
            <div key={tradition}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`creeds:traditions.${tradition}`)}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((creed) => (
                  <Link key={creed.id} to={`/creeds/${creed.id}`}>
                    <Card className="group hover:bg-muted/50 transition-colors">
                      <CardContent className="flex items-center gap-4 py-3 px-5">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground leading-snug">
                            {i18n.language === "en" ? creed.title : (creed.title_pt ?? creed.title)}
                          </p>
                        </div>
                        {creed.year && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {creed.year}
                          </Badge>
                        )}
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
