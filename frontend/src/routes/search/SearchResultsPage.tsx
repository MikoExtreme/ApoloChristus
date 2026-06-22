import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSearch } from "@/features/search/hooks/useSearch"
import { SearchResultGroup } from "@/features/search/components/SearchResultGroup"
import type { SearchScope } from "@/types/content"

export function SearchResultsPage() {
  const { t } = useTranslation(["search", "common"])
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const scope = (params.get("scope") as SearchScope | null) ?? "all"

  const { data, isLoading, isSearchable } = useSearch({ scope, query: q })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
