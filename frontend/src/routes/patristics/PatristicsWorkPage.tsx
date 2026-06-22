import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAuthorById, getWorksForAuthor } from "@/lib/supabase/queries/patristics"
import { Card, CardContent } from "@/components/ui/card"

export function PatristicsWorkPage() {
  const { period, authorId } = useParams<{ period: string; authorId: string }>()
  const { t } = useTranslation("common")
  const { data: author } = useQuery({
    queryKey: ["patristic-author", authorId],
    queryFn: () => getAuthorById(authorId!),
    enabled: !!authorId,
  })
  const { data: works, isLoading } = useQuery({
    queryKey: ["patristic-works", authorId],
    queryFn: () => getWorksForAuthor(authorId!),
    enabled: !!authorId,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{author?.name_pt ?? authorId}</h1>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common.loading")}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {works?.map((work) => (
          <Link key={work.id} to={`/patristics/${period}/${authorId}/${work.id}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-3 font-medium">{work.title}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
