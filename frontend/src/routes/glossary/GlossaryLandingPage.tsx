import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getTermsByLetter, searchGlossaryTerms } from "@/lib/supabase/queries/glossary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function GlossaryLandingPage() {
  const { t } = useTranslation(["glossary", "common"])
  const [letter, setLetter] = useState("A")
  const [query, setQuery] = useState("")
  const isSearching = query.trim().length > 0

  const { data: lettered, isLoading: loadingLettered } = useQuery({
    queryKey: ["glossary-terms", letter],
    queryFn: () => getTermsByLetter(letter),
    enabled: !isSearching,
  })
  const { data: searched, isLoading: loadingSearch } = useQuery({
    queryKey: ["glossary-search", query],
    queryFn: () => searchGlossaryTerms(query),
    enabled: isSearching,
  })

  const terms = isSearching ? searched : lettered
  const isLoading = isSearching ? loadingSearch : loadingLettered
  const uniqueTerms = [...new Set((terms ?? []).map((t2) => t2.term))]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("glossary:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("glossary:browseAlphabetically")}</p>

      <div className="mt-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("glossary:searchPlaceholder")}
        />
      </div>

      {!isSearching && (
        <div className="mt-4 flex flex-wrap gap-1">
          {ALPHABET.map((char) => (
            <Button
              key={char}
              size="sm"
              variant={char === letter ? "default" : "outline"}
              onClick={() => setLetter(char)}
            >
              {char}
            </Button>
          ))}
        </div>
      )}

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {uniqueTerms.map((term) => (
          <Link key={term} to={`/glossary/${encodeURIComponent(term)}`} className="text-sm hover:underline">
            {term}
          </Link>
        ))}
      </div>
    </div>
  )
}
