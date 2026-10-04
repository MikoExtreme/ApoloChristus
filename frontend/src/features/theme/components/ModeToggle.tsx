import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/features/theme/store/useThemeStore"

export function ModeToggle() {
  const { t } = useTranslation("common")
  const mode = useThemeStore((s) => s.mode)
  const toggleMode = useThemeStore((s) => s.toggleMode)
  const label = mode === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")

  return (
    <Button variant="ghost" size="icon" onClick={toggleMode} aria-label={label} title={label}>
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
