import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp } from "lucide-react"
import { usePatristicCitations } from "@/features/bible/hooks/usePatristicCitations"

interface PatristicCitationsPanelProps {
  book: string
  chapter: number
  verse: number
  enabled: boolean
}

const PREVIEW_LEN = 180

export function PatristicCitationsPanel({ book, chapter, verse, enabled }: PatristicCitationsPanelProps) {
  const { t } = useTranslation("bible")
  const { data, isLoading } = usePatristicCitations(book, chapter, verse, enabled)
  const [open, setOpen] = useState(false)

  if (!enabled) return null
  if (isLoading) return <p className="mt-1 text-xs text-muted-foreground">{t("citations.loading")}</p>
  if (!data || data.length === 0) return null

  const label = data.length === 1
    ? t("citations.citedByOne")
    : t("citations.citedByMany", { count: data.length })

  return (
    <div className="mt-1 border-l-2 border-accent/40 pl-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        ✝ {label}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-3">
          {data.map((c) => (
            <div key={`${c.author_id}-${c.work_id}-${c.section_num}`} className="text-xs">
              <Link
                to={`/patristics/${c.period}/${c.author_id}/${c.work_id}`}
                className="font-medium text-foreground hover:underline"
              >
                {c.author_name}
              </Link>
              <span className="text-muted-foreground"> — {c.work_title}</span>
              <p className="mt-0.5 text-muted-foreground italic leading-relaxed">
                {c.section_text.length > PREVIEW_LEN
                  ? `"${c.section_text.slice(0, PREVIEW_LEN).trimEnd()}…"`
                  : `"${c.section_text}"`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
