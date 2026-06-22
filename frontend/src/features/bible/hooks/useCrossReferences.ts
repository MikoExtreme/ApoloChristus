import { useQuery } from "@tanstack/react-query"
import { getCrossReferencesForChapter } from "@/lib/supabase/queries/crossReferences"

export function useCrossReferences(book: string | undefined, chapter: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["cross-references", book, chapter],
    queryFn: () => getCrossReferencesForChapter(book!, chapter!),
    enabled: enabled && !!book && !!chapter,
  })
}
