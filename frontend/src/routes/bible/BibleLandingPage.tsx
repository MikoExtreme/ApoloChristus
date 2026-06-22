import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { Card, CardContent } from "@/components/ui/card"

export function BibleLandingPage() {
  const { t } = useTranslation(["bible", "common"])
  const { data: versions, isLoading } = useQuery({
    queryKey: ["bible-versions"],
    queryFn: getBibleVersions,
  })

  const byLanguage = new Map<string, typeof versions>()
  for (const version of versions ?? []) {
    const list = byLanguage.get(version.language) ?? []
    list.push(version)
    byLanguage.set(version.language, list)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("bible:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("bible:chooseVersion")}</p>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-6">
        {[...byLanguage.entries()].map(([language, langVersions]) => (
          <div key={language}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{language}</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {langVersions?.map((version) => (
                <Link key={version.id} to={`/bible/${version.id}`}>
                  <Card className="hover:bg-muted/50">
                    <CardContent className="py-3">
                      <p className="font-medium">{version.name}</p>
                      <p className="text-xs text-muted-foreground">{version.id}</p>
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
