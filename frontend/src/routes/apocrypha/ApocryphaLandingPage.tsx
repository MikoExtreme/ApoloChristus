import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getApocryphaCategories } from "@/lib/supabase/queries/apocrypha"
import { Card, CardContent } from "@/components/ui/card"

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

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories?.map((category) => (
          <Link key={category} to={`/apocrypha/${category}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-3 font-medium">{t(`apocrypha:categories.${category}`)}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
