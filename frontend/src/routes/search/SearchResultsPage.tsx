import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSearch } from "@/features/search/hooks/useSearch"
import { SearchResultGroup } from "@/features/search/components/SearchResultGroup"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import type { SearchScope } from "@/types/content"

// Página de origem de cada âmbito de pesquisa — dá um caminho de regresso
// à secção onde a pesquisa foi feita (ex: Léxico > Resultados).
const SCOPE_HOME: Record<Exclude<SearchScope, "all">, { navKey: string; path: string }> = {
  bible:      { navKey: "nav.bible",      path: "/bible" },
  patristics: { navKey: "nav.patristics", path: "/patristics" },
  apocrypha:  { navKey: "nav.apocrypha",  path: "/apocrypha" },
  creeds:     { navKey: "nav.creeds",     path: "/creeds" },
  glossary:   { navKey: "nav.glossary",   path: "/glossary" },
  lexicon:    { navKey: "nav.lexicon",    path: "/lexicon" },
  councils:   { navKey: "nav.councils",   path: "/councils" },
}

export function SearchResultsPage() {
  const { t } = useTranslation(["search", "common"])
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const scope = (params.get("scope") as SearchScope | null) ?? "all"

  const { data, isLoading, isSearchable } = useSearch({ scope, query: q })

  const scopeHome = scope !== "all" ? SCOPE_HOME[scope] : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          scopeHome
            ? { label: t(`common:${scopeHome.navKey}`), to: scopeHome.path }
            : { label: t("common:nav.home"), to: "/" },
          { label: t("search:breadcrumb") },
        ]}
      />
      <h1 className="font-serif text-3xl text-foreground">{t("search:resultsFor", { query: q })}</h1>

      <div className="mt-6">
        {!isSearchable && <p className="text-muted-foreground">{t("common:search.notAvailable")}</p>}
        {isSearchable && isLoading && <p className="text-muted-foreground">{t("common:common.loading")}</p>}
        {isSearchable && !isLoading && data && data.length === 0 && (
          <p className="text-muted-foreground">{t("search:noResults")}</p>
        )}
        {isSearchable && !isLoading && data && data.length > 0 && <SearchResultGroup results={data} />}
      </div>
    </div>
  )
}
