import { Fragment } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { CrossReferenceRow } from "@/types/database.types"

interface CrossReferencePanelProps {
  refs: CrossReferenceRow[]
  versionId: string
}

export function CrossReferencePanel({ refs, versionId }: CrossReferencePanelProps) {
  const { t } = useTranslation("bible")
  if (refs.length === 0) return null
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {t("crossReferences.seeAlso")}:{" "}
      {refs.map((r, i) => (
        <Fragment key={`${r.target_book}-${r.target_ch}-${r.target_v}`}>
          {i > 0 && "; "}
          <Link to={`/bible/${versionId}/${r.target_book}/${r.target_ch}`} className="hover:underline">
            {r.target_book} {r.target_ch}:{r.target_v}
          </Link>
        </Fragment>
      ))}
    </p>
  )
}
