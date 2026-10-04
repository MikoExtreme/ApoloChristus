import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import type { ApologeticsCategory } from "@/types/database.types"
import { getArgumentCountsByCategory } from "@/lib/supabase/queries/apologetics"

const CATEGORIES: ApologeticsCategory[] = ["existence_of_god", "gospel_reliability", "resurrection"]

export function ApologeticsPage() {
  const { t } = useTranslation(["apologetics", "common"])

  const { data: counts } = useQuery({
    queryKey: ["apologetics-counts"],
    queryFn: getArgumentCountsByCategory,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("apologetics:title")}</h1>
      <p className="mt-2 text-muted-foreground leading-relaxed">{t("apologetics:subtitle")}</p>

      <div className="mt-8 flex flex-col gap-3">
        {CATEGORIES.map((cat) => (
          <Link key={cat} to={`/apologetics/${cat}`}>
            <Card className="group hover:bg-muted/50 hover:border-primary/40 transition-all duration-200">
              <CardContent className="flex items-center gap-5 py-5 px-6">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-base">
                    {t(`apologetics:categories.${cat}`)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
                    {t(`apologetics:categorySubtitles.${cat}`)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {counts?.[cat] != null && (
                    <span className="text-xs text-muted-foreground">
                      {t("apologetics:argumentCount", { count: counts[cat] })}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
