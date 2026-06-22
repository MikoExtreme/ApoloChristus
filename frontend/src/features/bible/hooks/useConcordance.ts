import { useQuery } from "@tanstack/react-query"
import { getConcordance } from "@/lib/supabase/queries/bible"
import { getOccurrencesByStrong } from "@/lib/supabase/queries/interlinear"
import type { ConcordanceMode } from "@/features/bible/store/useReaderStore"
import type { ConcordanceResult, InterlinearWordRow } from "@/types/database.types"

interface UseConcordanceOptions {
  mode: ConcordanceMode
  query: string | null
  version?: string
}

async function runConcordance(
  mode: ConcordanceMode,
  query: string,
  version?: string
): Promise<(ConcordanceResult | InterlinearWordRow)[]> {
  return mode === "text" ? getConcordance(query, version) : getOccurrencesByStrong(query)
}

export function useConcordance({ mode, query, version }: UseConcordanceOptions) {
  return useQuery({
    queryKey: ["concordance", mode, query, version],
    queryFn: () => runConcordance(mode, query!, version),
    enabled: !!query,
  })
}
