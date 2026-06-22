import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select
      value={i18n.resolvedLanguage}
      onValueChange={(value) => {
        if (value) void i18n.changeLanguage(value)
      }}
    >
      <SelectTrigger aria-label="Idioma" className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
