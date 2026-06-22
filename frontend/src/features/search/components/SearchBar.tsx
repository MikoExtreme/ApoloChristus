import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className="min-w-0 flex-1"
      />
      <Button type="submit" className="shrink-0">
        {t("search.button")}
      </Button>
    </form>
  )
}
