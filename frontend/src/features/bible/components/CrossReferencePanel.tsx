import { Fragment, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
    <span>
      <button type="button" onClick={onToggle} className="hover:underline">
        {bookDisplayName(r.target_book, i18n.language)} {r.target_ch}:{r.target_v}
      </button>
      {expanded && (
        <span className="mt-0.5 block pl-2 font-serif text-sm text-foreground">
          {isLoading && "…"}
          {!isLoading && verseText}
          {!isLoading && !verseText && (
            <Link
              to={`/bible/${versionId}/${r.target_book}/${r.target_ch}#v${r.target_v}`}
              className="hover:underline"
            >
              {bookDisplayName(r.target_book, i18n.language)} {r.target_ch} →
            </Link>
          )}
        </span>
      )}
    </span>
  )
}

export function CrossReferencePanel({ refs, versionId }: CrossReferencePanelProps) {
  const { t } = useTranslation("bible")
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  if (refs.length === 0) return null

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {t("crossReferences.seeAlso")}:{" "}
      {refs.map((r, i) => {
        const key = `${r.target_book}-${r.target_ch}-${r.target_v}`
        return (
          <Fragment key={key}>
            {i > 0 && "; "}
            <CrossReferenceItem
              crossRef={r}
              versionId={versionId}
              expanded={expandedKey === key}
              onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
            />
          </Fragment>
        )
      })}
    </p>
  )
}
