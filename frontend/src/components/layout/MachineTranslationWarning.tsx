import { useTranslation } from "react-i18next"
import { TriangleAlert } from "lucide-react"

export function MachineTranslationWarning() {
  const { t } = useTranslation("common")
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>{t("machineTranslationWarning")}</p>
    </div>
  )
}
