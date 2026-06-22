import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getCreeds } from "@/lib/supabase/queries/creeds"
import { Card, CardContent } from "@/components/ui/card"

export function CreedsLandingPage() {
  const { t, i18n } = useTranslation(["creeds", "common"])
  const { data: creeds, isLoading } = useQuery({
    queryKey: ["creeds"],
    queryFn: getCreeds,
  })

  const byTradition = new Map<string, typeof creeds>()
  for (const creed of creeds ?? []) {
    const key = creed.tradition ?? "—"
    const list = byTradition.get(key) ?? []
    list.push(creed)
    byTradition.set(key, list)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("creeds:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("creeds:browseByTradition")}</p>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-6">
        {[...byTradition.entries()].map(([tradition, list]) => (
          <div key={tradition}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {tradition === "—" ? tradition : t(`creeds:traditions.${tradition}`)}
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {list?.map((creed) => (
                <Link key={creed.id} to={`/creeds/${creed.id}`}>
                  <Card className="hover:bg-muted/50">
                    <CardContent className="py-3">
                      <p className="font-medium">
                        {i18n.language === "en" ? creed.title : (creed.title_pt ?? creed.title)}
                      </p>
                      <p className="text-xs text-muted-foreground">{creed.year}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
