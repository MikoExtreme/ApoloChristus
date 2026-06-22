import { useQuery } from "@tanstack/react-query"
import { getWordsForChapter } from "@/lib/supabase/queries/interlinear"

export function useInterlinear(book: string | undefined, chapter: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["interlinear", book, chapter],
    queryFn: () => getWordsForChapter(book!, chapter!),
    enabled: enabled && !!book && !!chapter,
  })
}
