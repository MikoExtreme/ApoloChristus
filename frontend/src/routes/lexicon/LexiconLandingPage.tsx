import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getEntriesByLanguage } from "@/lib/supabase/queries/lexicon"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/features/search/components/SearchBar"
import type { LexiconLanguage } from "@/types/database.types"

const LANGUAGES: LexiconLanguage[] = ["hebrew", "aramaic", "greek"]
const PAGE_SIZE = 60

export function LexiconLandingPage() {
  const { t } = useTranslation(["lexicon", "common"])
  const [language, setLanguage] = useState<LexiconLanguage>("hebrew")
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ["lexicon-entries", language, page],
    queryFn: () => getEntriesByLanguage(language, page),
  })

  function changeLanguage(value: LexiconLanguage) {
    setLanguage(value)
    setPage(0)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("lexicon:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("lexicon:browseByLanguage")}</p>

      <div className="mt-4">
        <SearchBar scope="lexicon" />
      </div>

      <Tabs value={language} onValueChange={(v) => v && changeLanguage(v as LexiconLanguage)} className="mt-6">
        <TabsList>
          {LANGUAGES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`lexicon:languages.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("lexicon:totalEntries", { count: data.total })}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← {t("lexicon:previous")}
            </Button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("lexicon:next")} →
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data?.entries.map((entry) => (
          <Link key={entry.d_strong} to={`/lexicon/${entry.d_strong}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="py-2 text-center">
                <p className="font-serif text-lg">{entry.word}</p>
                {entry.transliteration && <p className="text-xs text-muted-foreground">{entry.transliteration}</p>}
                {entry.gloss && <p className="text-xs text-muted-foreground">{entry.gloss}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">{entry.e_strong}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
