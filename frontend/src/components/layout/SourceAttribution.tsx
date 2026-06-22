import { useTranslation } from "react-i18next"
import type { License } from "@/types/database.types"

interface SourceAttributionProps {
  sourceUrl: string | null
  license: License
}

export function SourceAttribution({ sourceUrl, license }: SourceAttributionProps) {
  const { t } = useTranslation("common")
  return (
    <p className="mt-6 text-xs text-muted-foreground">
      {t("common.source")}:{" "}
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline">
          {sourceUrl}
        </a>
      ) : (
        "—"
      )}
      {" · "}
      {t("common.license")}: {t(`licenses.${license}`)}
    </p>
  )
}
