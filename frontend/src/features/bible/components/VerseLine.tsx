import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Star, Copy, ClipboardCopy, Columns2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { InterlinearWordRow } from "@/features/bible/components/InterlinearWordRow"
import { CrossReferencePanel } from "@/features/bible/components/CrossReferencePanel"
import { PatristicCitationsPanel } from "@/features/bible/components/PatristicCitationsPanel"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import { useBookmarksStore } from "@/features/bible/store/useBookmarksStore"
import { useReaderStore } from "@/features/bible/store/useReaderStore"
import type { VerseRow, CrossReferenceRow, InterlinearWordRow as InterlinearWordRowType } from "@/types/database.types"

interface VerseLineProps {
  verse: VerseRow
  showInterlinear: boolean
  interlinearWords: InterlinearWordRowType[]
  showCrossReferences: boolean
  crossReferences: CrossReferenceRow[]
  showCitations: boolean
  concordanceClickable: boolean
  onTextWordClick: (word: string) => void
  onStrongClick: (strongNumber: string) => void
  highlighted: boolean
  parallelCandidateVersionId?: string
}

export function VerseLine({
  verse,
  showInterlinear,
  interlinearWords,
  showCrossReferences,
  crossReferences,
  showCitations,
  concordanceClickable,
  onTextWordClick,
  onStrongClick,
  highlighted,
  parallelCandidateVersionId,
}: VerseLineProps) {
  const { t, i18n } = useTranslation("bible")
  const navigate = useNavigate()
  const [copied, setCopied] = useState<"ref" | "text" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const isBookmarked = useBookmarksStore((s) => s.has(verse.version_id, verse.book, verse.chapter, verse.verse))
  const addBookmark = useBookmarksStore((s) => s.add)
  const removeBookmark = useBookmarksStore((s) => s.remove)
  const setParallelVersions = useReaderStore((s) => s.setParallelVersions)

  const reference = `${bookDisplayName(verse.book, i18n.language)} ${verse.chapter}:${verse.verse}`

  function copyReference() {
    void navigator.clipboard.writeText(reference)
    setCopied("ref")
    setTimeout(() => setCopied(null), 1500)
  }

  function copyText() {
    void navigator.clipboard.writeText(`${reference} — ${verse.text}`)
    setCopied("text")
    setTimeout(() => setCopied(null), 1500)
  }

  function toggleBookmark() {
    if (isBookmarked) {
      removeBookmark(verse.version_id, verse.book, verse.chapter, verse.verse)
    } else {
      addBookmark({
        versionId: verse.version_id,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      })
    }
  }

  function openInParallel() {
    if (!parallelCandidateVersionId) return
    // Fecha o menu explicitamente antes de navegar — o Base UI Menu não
    // limpa sempre o seu portal/backdrop a tempo quando a navegação
    // acontece a meio do clique, deixando a página inteira inclicável.
    setMenuOpen(false)
    setParallelVersions([parallelCandidateVersionId])
    navigate(`/bible/${verse.version_id}/${verse.book}/${verse.chapter}#v${verse.verse}`)
  }

  return (
    <div id={`v${verse.verse}`} className={`py-1 transition-colors ${highlighted ? "bg-accent/40 rounded-md" : ""}`}>
      <p className="font-serif text-lg leading-relaxed">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            nativeButton={false}
            render={
              <Badge
                variant="outline"
                className="mr-2 cursor-pointer align-super text-[10px] hover:bg-accent"
              >
                {verse.verse}
              </Badge>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={copyReference}>
              <Copy /> {copied === "ref" ? t("verseActions.copied") : t("verseActions.copyReference")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyText}>
              <ClipboardCopy /> {copied === "text" ? t("verseActions.copied") : t("verseActions.copyText")}
            </DropdownMenuItem>
            {parallelCandidateVersionId && (
              <DropdownMenuItem onClick={openInParallel}>
                <Columns2 /> {t("verseActions.openParallel")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={toggleBookmark}>
              <Star fill={isBookmarked ? "currentColor" : "none"} />
              {isBookmarked ? t("verseActions.removeBookmark") : t("verseActions.addBookmark")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {concordanceClickable
          ? verse.text.split(/(\s+)/).map((token, i) =>
              token.trim() ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => onTextWordClick(token.replace(/[.,;:!?"'()]/g, ""))}
                  className="cursor-pointer hover:bg-accent/30"
                >
                  {token}
                </button>
              ) : (
                <span key={i}>{token}</span>
              )
            )
          : verse.text}
      </p>

      {showInterlinear && (
        <InterlinearWordRow words={interlinearWords} clickable={concordanceClickable} onWordClick={onStrongClick} />
      )}
      {showCrossReferences && <CrossReferencePanel refs={crossReferences} versionId={verse.version_id} />}
      {showCitations && (
        <PatristicCitationsPanel book={verse.book} chapter={verse.chapter} verse={verse.verse} enabled={showCitations} />
      )}
    </div>
  )
}
