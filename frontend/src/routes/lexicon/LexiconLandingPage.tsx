import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getEntriesByLanguage } from "@/lib/supabase/queries/lexicon"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "@/features/search/components/SearchBar"
import type { LexiconLanguage } from "@/types/database.types"

const LANGUAGES: LexiconLanguage[] = ["hebrew", "aramaic", "greek"]

export function LexiconLandingPage() {
  const { t } = useTranslation(["lexicon", "common"])
  const [language, setLanguage] = useState<LexiconLanguage>("hebrew")

  const { data: entries, isLoading } = useQuery({
    queryKey: ["lexicon-entries", language],
    queryFn: () => getEntriesByLanguage(language),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("lexicon:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("lexicon:browseByLanguage")}</p>

      <div className="mt-4">
        <SearchBar scope="lexicon" />
      </div>

      <Tabs value={language} onValueChange={(v) => v && setLanguage(v as LexiconLanguage)} className="mt-6">
        <TabsList>
          {LANGUAGES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`lexicon:languages.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {entries?.map((entry) => (
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
