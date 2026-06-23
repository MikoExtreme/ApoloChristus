import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import { useBookmarksStore } from "@/features/bible/store/useBookmarksStore"

export function FavoritesPage() {
  const { t, i18n } = useTranslation("bible")
  const bookmarks = useBookmarksStore((s) => s.bookmarks)
  const remove = useBookmarksStore((s) => s.remove)

  const sorted = [...bookmarks].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("favorites.title")}</h1>

      {sorted.length === 0 && <p className="mt-6 text-muted-foreground">{t("favorites.empty")}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {sorted.map((b) => (
          <Card key={`${b.versionId}-${b.book}-${b.chapter}-${b.verse}`}>
            <CardContent className="flex items-start justify-between gap-3 py-3">
              <Link to={`/bible/${b.versionId}/${b.book}/${b.chapter}#v${b.verse}`} className="flex-1 hover:underline">
                <p className="text-xs text-muted-foreground">
                  {bookDisplayName(b.book, i18n.language)} {b.chapter}:{b.verse}
                </p>
                <p className="mt-1 font-serif">{b.text}</p>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("favorites.remove")}
                onClick={() => remove(b.versionId, b.book, b.chapter, b.verse)}
              >
                <X className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
