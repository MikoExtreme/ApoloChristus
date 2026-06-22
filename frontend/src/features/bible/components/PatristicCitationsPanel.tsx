import { Fragment } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePatristicCitations } from "@/features/bible/hooks/usePatristicCitations"

interface PatristicCitationsPanelProps {
  book: string
  chapter: number
  verse: number
  enabled: boolean
}

export function PatristicCitationsPanel({ book, chapter, verse, enabled }: PatristicCitationsPanelProps) {
  const { t } = useTranslation("bible")
  const { data, isLoading } = usePatristicCitations(book, chapter, verse, enabled)

  if (!enabled) return null
  if (isLoading) return <p className="mt-1 text-xs text-muted-foreground">{t("citations.loading")}</p>
  if (!data || data.length === 0) return null

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {t("citations.citedBy")}:{" "}
      {data.map((c, i) => (
        <Fragment key={`${c.author_id}-${c.work_id}-${c.section_num}`}>
          {i > 0 && "; "}
          <Link to={`/patristics/${c.period}/${c.author_id}/${c.work_id}`} className="hover:underline">
            {c.author_name} ({c.work_title})
          </Link>
        </Fragment>
      ))}
    </p>
  )
}
