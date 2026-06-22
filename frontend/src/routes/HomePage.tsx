import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "@/features/search/components/SearchBar"

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
  const { t } = useTranslation("common")

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-serif text-4xl text-foreground">{t("appName")}</h1>
      <p className="mt-3 text-muted-foreground">{t("tagline")}</p>

      <div className="mx-auto mt-8 max-w-md">
        <SearchBar />
      </div>

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
