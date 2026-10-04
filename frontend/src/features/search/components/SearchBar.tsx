import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { SearchScope } from "@/types/content"

interface SearchBarProps {
  scope?: SearchScope
}

export function SearchBar({ scope = "all" }: SearchBarProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const [value, setValue] = useState("")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const q = value.trim()
    if (!q) return
    const params = new URLSearchParams({ q })
    if (scope !== "all") params.set("scope", scope)
    void navigate(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className="pr-9"
      />
      <button
        type="submit"
        aria-label={t("search.button")}
        className="absolute right-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="size-4" />
      </button>
    </form>
  )
}
