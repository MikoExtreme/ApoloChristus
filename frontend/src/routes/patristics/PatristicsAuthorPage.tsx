import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAuthorsByPeriod } from "@/lib/supabase/queries/patristics"
import { Card, CardContent } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
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

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {authors?.map((author) => (
          <Link key={author.id} to={`/patristics/${period}/${author.id}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-3">
                <p className="font-medium">{author.name_pt}</p>
                <p className="text-xs text-muted-foreground">{author.dates}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
