import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useThemeStore, type Theme } from "@/features/theme/store/useThemeStore"

const THEME_LABELS: Record<Theme, string> = {
  catholic:   "Católico",
  orthodox:   "Ortodoxo",
  protestant: "Protestante",
  agnostic:   "Agnóstico",
}

// Amostra da cor primária de cada tradição — identifica o tema à vista,
// sem depender de ícones abstratos.
const THEME_SWATCHES: Record<Theme, string> = {
  catholic:   "oklch(0.42 0.16 25)",
  orthodox:   "oklch(0.32 0.16 283)",
  protestant: "oklch(0.3 0.11 240)",
  agnostic:   "oklch(0.45 0.03 230)",
}

function ThemeOption({ value }: { value: Theme }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-full ring-1 ring-black/15"
        style={{ backgroundColor: THEME_SWATCHES[value] }}
        aria-hidden="true"
      />
      {THEME_LABELS[value] ?? value}
    </span>
  )
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
        <SelectValue>
          {(value: Theme) => <ThemeOption value={value} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(THEME_LABELS) as Theme[]).map((value) => (
          <SelectItem key={value} value={value}>
            <ThemeOption value={value} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
