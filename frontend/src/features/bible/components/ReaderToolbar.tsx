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
export const INTERLINEAR_PARALLEL_VALUE = "__interlinear__"

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
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      {/* Ferramentas de estudo */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("reader.studyTools")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
            <Select
              value={concordanceMode}
              onValueChange={(v) => {
                if (!v) return
                setConcordanceMode(v as "text" | "original")
                // O modo "Original" precisa do painel interlinear visível para
                // ter palavras gregas/hebraicas em que clicar — sem isto, a
                // concordância original parecia simplesmente não fazer nada.
                if (v === "original") setInterlinear(true)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {(value: "text" | "original") =>
                    value === "original" ? t("toggles.concordanceOriginal") : t("toggles.concordanceText")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{t("toggles.concordanceText")}</SelectItem>
                <SelectItem value="original">{t("toggles.concordanceOriginal")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Comparar traduções */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("toggles.parallel")}
        </p>
        <div className="mt-2">
          <Select
            value={parallelVersions[0] ?? NONE_VALUE}
            onValueChange={(value) => setParallelVersions(!value || value === NONE_VALUE ? [] : [value])}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue>
                {(value: string) => {
                  if (!value || value === NONE_VALUE)
                    return <span className="text-muted-foreground">{t("reader.noComparison")}</span>
                  if (value === INTERLINEAR_PARALLEL_VALUE) return t("toggles.parallelInterlinear")
                  const v = compatibleVersions.find((item) => item.id === value)
                  return v?.name ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>{t("reader.noComparison")}</SelectItem>
              <SelectItem value={INTERLINEAR_PARALLEL_VALUE}>
                {t("toggles.parallelInterlinear")}
              </SelectItem>
              {compatibleVersions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex flex-col items-start">
                    <span>{v.name}</span>
                    <span className="text-[10px] text-muted-foreground">{v.id}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
