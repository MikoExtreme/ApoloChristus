import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAuthorsByPeriod } from "@/lib/supabase/queries/patristics"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { ChevronRight } from "lucide-react"
import type { PatristicPeriod } from "@/types/database.types"

export function PatristicsAuthorPage() {
  const { period } = useParams<{ period: string }>()
  const { t } = useTranslation(["common", "patristics"])
  const { data: authors, isLoading } = useQuery({
    queryKey: ["patristic-authors", period],
    queryFn: () => getAuthorsByPeriod(period as PatristicPeriod),
    enabled: !!period,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("nav.patristics", { ns: "common" }), to: "/patristics" },
          { label: t(`patristics:periods.${period}`) },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">{t(`patristics:periods.${period}`)}</h1>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          : authors?.map((author) => {
              const initials = (author.name_pt ?? author.name ?? "?")
                .split(/[\s,]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w: string) => w[0].toUpperCase())
                .join("")

              return (
                <Link key={author.id} to={`/patristics/${period}/${author.id}`}>
                  <Card className="group hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center gap-4 py-3 px-5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground leading-snug truncate">
                          {author.name_pt ?? author.name}
                        </p>
                        {author.dates && (
                          <p className="text-xs text-muted-foreground">{author.dates}</p>
                        )}
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
      </div>

      {!isLoading && authors?.length === 0 && (
        <EmptyState icon="✍" title={t("common:common.notFound")} />
      )}
    </div>
  )
}
