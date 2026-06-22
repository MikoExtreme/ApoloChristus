import { useQuery } from "@tanstack/react-query"
import { getCitationsForVerse } from "@/lib/supabase/queries/patristics"

export function usePatristicCitations(
  book: string | undefined,
  chapter: number | undefined,
  verse: number | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["patristic-citations", book, chapter, verse],
    queryFn: () => getCitationsForVerse(book!, chapter!, verse!),
    enabled: enabled && !!book && !!chapter && !!verse,
  })
}
