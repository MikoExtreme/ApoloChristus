import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getEntriesForTerm } from "@/lib/supabase/queries/glossary"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GlossaryTermPage() {
  const { term } = useParams<{ term: string }>()
  const { t } = useTranslation(["common", "glossary"])
  const decoded = term ? decodeURIComponent(term) : ""
  const { data: entries, isLoading } = useQuery({
    queryKey: ["glossary-entries", decoded],
    queryFn: () => getEntriesForTerm(decoded),
    enabled: !!decoded,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{decoded}</h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {entries?.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="py-3">
              <Badge variant="secondary">{t(`glossary:sources.${entry.source}`)}</Badge>
              <p className="mt-2 font-serif">{entry.definition}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
