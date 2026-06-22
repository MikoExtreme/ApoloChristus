import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConcordance } from "@/features/bible/hooks/useConcordance"
import type { ConcordanceMode } from "@/features/bible/store/useReaderStore"

interface ConcordanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ConcordanceMode
  query: string | null
  versionId?: string
}

export function ConcordanceDrawer({ open, onOpenChange, mode, query, versionId }: ConcordanceDrawerProps) {
  const { t } = useTranslation(["bible", "common"])
  const { data, isLoading } = useConcordance({ mode, query: open ? query : null, version: versionId })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("bible:concordanceDrawer.title")}: {query}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-muted-foreground">{t("common:common.loading")}</p>}

        <div className="flex flex-col gap-2">
          {mode === "text" &&
            data?.map((row) => {
              const r = row as { version_id: string; book: string; chapter: number; verse: number; text: string }
              return (
                <Link
                  key={`${r.book}-${r.chapter}-${r.verse}`}
                  to={`/bible/${r.version_id}/${r.book}/${r.chapter}`}
                  onClick={() => onOpenChange(false)}
                  className="text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {r.book} {r.chapter}:{r.verse}
                  </span>{" "}
                  <span className="font-serif">{r.text}</span>
                </Link>
              )
            })}
          {mode === "original" &&
            data?.map((row) => {
              const r = row as {
                book: string
                chapter: number
                verse: number
                word_position: number
                original_word: string
                gloss: string | null
              }
              return (
                <Link
                  key={`${r.book}-${r.chapter}-${r.verse}-${r.word_position}`}
                  to={`/bible/${versionId}/${r.book}/${r.chapter}`}
                  onClick={() => onOpenChange(false)}
                  className="text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {r.book} {r.chapter}:{r.verse}
                  </span>{" "}
                  <span className="font-serif">{r.original_word}</span>
                  {r.gloss && <span className="text-muted-foreground"> — {r.gloss}</span>}
                </Link>
              )
            })}
          {data && data.length === 0 && <p className="text-muted-foreground">{t("bible:concordanceDrawer.noResults")}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
