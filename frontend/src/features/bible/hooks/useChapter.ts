import { useQuery } from "@tanstack/react-query"
import { getChapter, getChapterCount } from "@/lib/supabase/queries/bible"

export function useChapter(versionId: string | undefined, book: string | undefined, chapter: number | undefined) {
  return useQuery({
    queryKey: ["chapter", versionId, book, chapter],
    queryFn: () => getChapter(versionId!, book!, chapter!),
    enabled: !!versionId && !!book && !!chapter,
  })
}

export function useChapterCount(versionId: string | undefined, book: string | undefined) {
  return useQuery({
    queryKey: ["chapter-count", versionId, book],
    queryFn: () => getChapterCount(versionId!, book!),
    enabled: !!versionId && !!book,
  })
}
