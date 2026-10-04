import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useChapter } from "@/features/bible/hooks/useChapter"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import type { CrossReferenceRow } from "@/types/database.types"

interface CrossReferencePanelProps {
  refs: CrossReferenceRow[]
  versionId: string
}

interface CrossReferenceItemProps {
  crossRef: CrossReferenceRow
  versionId: string
  expanded: boolean
  onToggle: () => void
}

function CrossReferenceItem({ crossRef: r, versionId, expanded, onToggle }: CrossReferenceItemProps) {
  const { i18n } = useTranslation("bible")
  const { data: verses, isLoading } = useChapter(versionId, r.target_book, expanded ? r.target_ch : undefined)
  const verseText = verses?.find((v) => v.verse === r.target_v)?.text

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={onToggle}
        className="font-medium text-foreground hover:underline"
      >
        {bookDisplayName(r.target_book, i18n.language)} {r.target_ch}:{r.target_v}
      </button>
      {expanded && (
        <p className="mt-0.5 pl-2 text-muted-foreground italic leading-relaxed">
          {isLoading && "…"}
          {!isLoading && verseText && `"${verseText}"`}
          {!isLoading && !verseText && (
            <Link
              to={`/bible/${versionId}/${r.target_book}/${r.target_ch}#v${r.target_v}`}
              className="hover:underline"
            >
              {bookDisplayName(r.target_book, i18n.language)} {r.target_ch} →
            </Link>
          )}
        </p>
      )}
    </div>
  )
}

export function CrossReferencePanel({ refs, versionId }: CrossReferencePanelProps) {
  const { t } = useTranslation("bible")
  const [open, setOpen] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  if (refs.length === 0) return null

  const label = refs.length === 1
    ? t("crossReferences.refOne")
    : t("crossReferences.refMany", { count: refs.length })

  return (
    <div className="mt-1 border-l-2 border-accent/40 pl-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {label}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {refs.map((r) => {
            const key = `${r.target_book}-${r.target_ch}-${r.target_v}`
            return (
              <CrossReferenceItem
                key={key}
                crossRef={r}
                versionId={versionId}
                expanded={expandedKey === key}
                onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
