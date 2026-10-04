import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getApocryphaCategories } from "@/lib/supabase/queries/apocrypha"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import { ChevronRight } from "lucide-react"

export function ApocryphaLandingPage() {
  const { t } = useTranslation(["apocrypha", "common"])
  const { data: categories, isLoading } = useQuery({
    queryKey: ["apocrypha-categories"],
    queryFn: getApocryphaCategories,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("apocrypha:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("apocrypha:browseByCategory")}</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          : categories?.map((category) => (
              <Link key={category} to={`/apocrypha/${category}`}>
                <Card className="group h-full hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <p className="font-medium text-foreground leading-snug">
                      {t(`apocrypha:categories.${category}`)}
                    </p>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {!isLoading && categories?.length === 0 && (
        <EmptyState title={t("common:common.notFound")} />
      )}
    </div>
  )
}
