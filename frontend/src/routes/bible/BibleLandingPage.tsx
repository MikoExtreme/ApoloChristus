import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ScrollText } from "lucide-react"
import type { BibleVersionRow } from "@/types/database.types"

// Línguas originais das Escrituras — tudo o resto é tradução.
const ORIGINAL_LANGUAGES = new Set(["el", "he", "grc", "hbo"])

function VersionCard({
  version,
  original,
  languageLabel,
}: {
  version: BibleVersionRow
  original: boolean
  languageLabel: string
}) {
  const Icon = original ? ScrollText : BookOpen
  return (
    <Link to={`/bible/${version.id}`} className="group">
      <Card
        className={`h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          original ? "bg-primary/5 ring-primary/20 hover:ring-primary/35" : "hover:ring-primary/25"
        }`}
      >
        <CardContent className="flex gap-3.5 px-5 py-4">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${
              original
                ? "bg-primary text-primary-foreground ring-primary/30"
                : "bg-primary/10 text-primary ring-primary/15"
            }`}
          >
            <Icon className="size-4.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug text-foreground">{version.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {languageLabel}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{version.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function BibleLandingPage() {
  const { t } = useTranslation(["bible", "common"])
  const { data: versions, isLoading } = useQuery({
    queryKey: ["bible-versions"],
    queryFn: getBibleVersions,
  })

  const languageLabel = (code: string) =>
    t(`bible:landing.languages.${code.toLowerCase()}`, { defaultValue: code.toUpperCase() })

  const translations: BibleVersionRow[] = []
  const originals: BibleVersionRow[] = []
  for (const version of versions ?? []) {
    ;(ORIGINAL_LANGUAGES.has(version.language.toLowerCase()) ? originals : translations).push(version)
  }
  // Traduções agrupadas por língua, PT primeiro (audiência principal do site).
  const translationsByLanguage = new Map<string, BibleVersionRow[]>()
  for (const version of translations) {
    const key = version.language.toLowerCase()
    translationsByLanguage.set(key, [...(translationsByLanguage.get(key) ?? []), version])
  }
  const sortedTranslationLangs = [...translationsByLanguage.keys()].sort((a, b) =>
    a === "pt" ? -1 : b === "pt" ? 1 : a.localeCompare(b)
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("bible:title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("bible:chooseVersion")}</p>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}

      {/* Traduções */}
      {translations.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("bible:landing.translations")}
          </h2>
          <div className="mt-3 flex flex-col gap-5">
            {sortedTranslationLangs.map((lang) => (
              <div key={lang}>
                <h3 className="text-sm font-medium text-foreground/70">{languageLabel(lang)}</h3>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {translationsByLanguage.get(lang)?.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      original={false}
                      languageLabel={languageLabel(lang)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Texto original */}
      {originals.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("bible:landing.originals")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("bible:landing.originalsHint")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {originals.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                original
                languageLabel={languageLabel(version.language)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
