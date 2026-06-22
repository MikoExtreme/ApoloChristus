import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useThemeStore, type Theme } from "@/features/theme/store/useThemeStore"

const THEME_LABELS: Record<Theme, string> = {
  catholic: "Católico",
  orthodox: "Ortodoxo",
  protestant: "Protestante",
}

export function ThemeSwitcher() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <Select
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value as Theme)
      }}
    >
      <SelectTrigger aria-label="Tema" className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(THEME_LABELS) as Theme[]).map((value) => (
          <SelectItem key={value} value={value}>
            {THEME_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
