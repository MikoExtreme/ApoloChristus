import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getWorksByCategory } from "@/lib/supabase/queries/apocrypha"
import { Card, CardContent } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function ApocryphaWorkPage() {
  const { category } = useParams<{ category: string }>()
  const { t, i18n } = useTranslation(["common", "apocrypha"])
  const { data: works, isLoading } = useQuery({
    queryKey: ["apocrypha-works", category],
    queryFn: () => getWorksByCategory(category!),
    enabled: !!category,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("nav.apocrypha"), to: "/apocrypha" },
          { label: t(`apocrypha:categories.${category}`) },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">{t(`apocrypha:categories.${category}`)}</h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {works?.map((work) => (
          <Link key={work.id} to={`/apocrypha/${category}/${work.id}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-3">
                <p className="font-medium">{i18n.language === "en" ? work.title_en : work.title_pt}</p>
                <p className="text-xs text-muted-foreground">{work.date_estimate}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
