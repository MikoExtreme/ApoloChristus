import { useQuery } from "@tanstack/react-query"
import { runSearch } from "@/lib/supabase/queries/search"
import { SEARCHABLE_SCOPES, type SearchScope } from "@/types/content"

interface UseSearchOptions {
  scope: SearchScope
  query: string
  enabled?: boolean
}

export function useSearch({ scope, query, enabled = true }: UseSearchOptions) {
  const isSearchable = scope === "all" || SEARCHABLE_SCOPES.includes(scope)

  const result = useQuery({
    queryKey: ["search", scope, query],
    queryFn: () => runSearch(scope, query),
    enabled: enabled && isSearchable && query.trim().length > 0,
  })

  return { ...result, isSearchable }
}
