import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getBibleVersions } from "@/lib/supabase/queries/bible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReferenceJumpInput } from "@/features/bible/components/ReferenceJumpInput"

export function BibleJumpPage() {
  const { t } = useTranslation("bible")
  const { data: versions } = useQuery({ queryKey: ["bible-versions"], queryFn: getBibleVersions })
  const [versionId, setVersionId] = useState("pt-aa")

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("jump.title")}</h1>

      <div className="mt-6 flex flex-col gap-3">
        <Select value={versionId} onValueChange={(v) => v && setVersionId(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {versions?.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name} ({v.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ReferenceJumpInput versionId={versionId} />
      </div>
    </div>
  )
}
