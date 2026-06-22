import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseReference } from "@/features/bible/lib/referenceParser"

interface ReferenceJumpInputProps {
  versionId: string
}

export function ReferenceJumpInput({ versionId }: ReferenceJumpInputProps) {
  const { t } = useTranslation("bible")
  const navigate = useNavigate()
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ref = parseReference(value)
    if (!ref) {
      setError(true)
      return
    }
    setError(false)
    const params = new URLSearchParams()
    if (ref.verseStart) params.set("v", String(ref.verseStart))
    if (ref.verseEnd) params.set("vEnd", String(ref.verseEnd))
    const query = params.toString()
    void navigate(`/bible/${versionId}/${ref.book}/${ref.chapter}${query ? `?${query}` : ""}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError(false)
        }}
        placeholder={t("jump.placeholder")}
      />
      <Button type="submit">{t("jump.goButton")}</Button>
      {error && <p className="text-xs text-destructive">{t("jump.notRecognized")}</p>}
    </form>
  )
}
