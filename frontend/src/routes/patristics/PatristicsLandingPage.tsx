import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getPeriods } from "@/lib/supabase/queries/patristics"
import { Card, CardContent } from "@/components/ui/card"

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

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {periods?.map((period) => (
          <Link key={period} to={`/patristics/${period}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-3 font-medium">{t(`patristics:periods.${period}`)}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
