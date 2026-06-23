import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "@/features/search/components/SearchBar"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import { useReadingHistoryStore } from "@/features/bible/store/useReadingHistoryStore"

const SECTIONS = [
  { path: "/bible", key: "nav.bible" },
  { path: "/patristics", key: "nav.patristics" },
  { path: "/apocrypha", key: "nav.apocrypha" },
  { path: "/creeds", key: "nav.creeds" },
  { path: "/glossary", key: "nav.glossary" },
  { path: "/lexicon", key: "nav.lexicon" },
  { path: "/geography", key: "nav.geography" },
] as const

export function HomePage() {
  const { t, i18n } = useTranslation(["common", "bible"])
  const lastRead = useReadingHistoryStore((s) => s.lastRead)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-serif text-4xl text-foreground">{t("appName")}</h1>
      <p className="mt-3 text-muted-foreground">{t("tagline")}</p>

      <div className="mx-auto mt-8 max-w-md">
        <SearchBar />
      </div>

      {lastRead && (
        <Link
          to={`/bible/${lastRead.versionId}/${lastRead.book}/${lastRead.chapter}`}
          className="mx-auto mt-6 block max-w-md"
        >
          <Card className="hover:bg-muted/50">
            <CardContent className="py-3 text-left">
              <p className="text-xs text-muted-foreground">{t("bible:continueReading.title")}</p>
              <p className="font-serif text-lg">
                {bookDisplayName(lastRead.book, i18n.language)} {lastRead.chapter}
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="mt-10 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
        {SECTIONS.map(({ path, key }) => (
          <Link key={path} to={path}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-4 text-center font-medium">{t(key)}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
