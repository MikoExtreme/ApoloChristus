import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReaderStore } from "@/features/bible/store/useReaderStore"
import { isVersionCompatibleWithTestament } from "@/features/bible/lib/versionRestrictions"
import type { BibleVersionRow, Testament } from "@/types/database.types"

interface ReaderToolbarProps {
  versions: BibleVersionRow[]
  currentVersionId: string
  testament: Testament
}

const NONE_VALUE = "__none__"

export function ReaderToolbar({ versions, currentVersionId, testament }: ReaderToolbarProps) {
  const { t } = useTranslation("bible")
  const {
    interlinear,
    crossReferences,
    patristicCitations,
    concordanceActive,
    concordanceMode,
    parallelVersions,
    setInterlinear,
    setCrossReferences,
    setPatristicCitations,
    setConcordanceActive,
    setConcordanceMode,
    setParallelVersions,
  } = useReaderStore()

  const isParallel = parallelVersions.length > 0
  const compatibleVersions = versions.filter(
    (v) => v.id !== currentVersionId && isVersionCompatibleWithTestament(v.id, testament)
  )

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <Button
        variant={interlinear ? "default" : "outline"}
        size="sm"
        disabled={isParallel}
        onClick={() => setInterlinear(!interlinear)}
      >
        {t("toggles.interlinear")}
      </Button>
      <Button
        variant={crossReferences ? "default" : "outline"}
        size="sm"
        disabled={isParallel}
        onClick={() => setCrossReferences(!crossReferences)}
      >
        {t("toggles.crossReferences")}
      </Button>
      <Button
        variant={patristicCitations ? "default" : "outline"}
        size="sm"
        disabled={isParallel}
        onClick={() => setPatristicCitations(!patristicCitations)}
      >
        {t("toggles.patristicCitations")}
      </Button>
      <Button
        variant={concordanceActive ? "default" : "outline"}
        size="sm"
        disabled={isParallel}
        onClick={() => setConcordanceActive(!concordanceActive)}
      >
        {t("toggles.concordance")}
      </Button>

      {concordanceActive && !isParallel && (
        <Select value={concordanceMode} onValueChange={(v) => v && setConcordanceMode(v as "text" | "original")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">{t("toggles.concordanceText")}</SelectItem>
            <SelectItem value="original">{t("toggles.concordanceOriginal")}</SelectItem>
          </SelectContent>
        </Select>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("toggles.parallel")}</span>
        <Select
          value={parallelVersions[0] ?? NONE_VALUE}
          onValueChange={(value) => setParallelVersions(!value || value === NONE_VALUE ? [] : [value])}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>—</SelectItem>
            {compatibleVersions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name} ({v.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
