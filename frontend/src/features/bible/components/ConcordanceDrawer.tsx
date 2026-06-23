import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConcordance } from "@/features/bible/hooks/useConcordance"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import type { ConcordanceMode } from "@/features/bible/store/useReaderStore"

interface ConcordanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ConcordanceMode
  query: string | null
  versionId?: string
}

// Realça a palavra pesquisada dentro do texto do versículo, para ser mais
// fácil ver de relance onde a ocorrência está em cada resultado.
function highlightWord(text: string, word: string) {
  if (!word.trim()) return text
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export function ConcordanceDrawer({ open, onOpenChange, mode, query, versionId }: ConcordanceDrawerProps) {
  const { t, i18n } = useTranslation(["bible", "common"])
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
                  to={`/bible/${r.version_id}/${r.book}/${r.chapter}#v${r.verse}`}
                  onClick={() => onOpenChange(false)}
                  className="text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {bookDisplayName(r.book, i18n.language)} {r.chapter}:{r.verse}
                  </span>{" "}
                  <span className="font-serif">{query ? highlightWord(r.text, query) : r.text}</span>
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
                  to={`/bible/${versionId}/${r.book}/${r.chapter}#v${r.verse}`}
                  onClick={() => onOpenChange(false)}
                  className="text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {bookDisplayName(r.book, i18n.language)} {r.chapter}:{r.verse}
                  </span>{" "}
                  <mark className="rounded bg-primary/20 px-0.5 font-serif text-foreground">{r.original_word}</mark>
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
