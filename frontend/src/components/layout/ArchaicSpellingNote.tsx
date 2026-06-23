import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"

export function ArchaicSpellingNote() {
  const { t } = useTranslation("common")
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{t("archaicSpellingNote")}</p>
    </div>
  )
}
