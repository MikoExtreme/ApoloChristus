import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getBibleVersions, getBooksForVersion } from "@/lib/supabase/queries/bible"
import { Card, CardContent } from "@/components/ui/card"

export function BibleBookPage() {
  const { versionId } = useParams<{ versionId: string }>()
  const { t } = useTranslation(["common", "bible"])
  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const { data: books, isLoading } = useQuery({
    queryKey: ["bible-books", versionId],
    queryFn: () => getBooksForVersion(versionId!),
    enabled: !!versionId,
  })

  const version = versions?.find((v) => v.id === versionId)
  const otBooks = books?.filter((b) => b.testament === "OT") ?? []
  const ntBooks = books?.filter((b) => b.testament === "NT") ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{version?.name ?? versionId}</h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      {[
        { label: t("bible:testaments.OT"), books: otBooks },
        { label: t("bible:testaments.NT"), books: ntBooks },
      ].map(
        ({ label, books: list }) =>
          list.length > 0 && (
            <div key={label} className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((book) => (
                  <Link key={book.book} to={`/bible/${versionId}/${book.book}/1`}>
                    <Card className="hover:bg-muted/50">
                      <CardContent className="py-2 text-center text-sm">{book.book}</CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  )
}
