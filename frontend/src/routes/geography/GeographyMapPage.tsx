import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPlaces } from "@/lib/supabase/queries/geography"
import { PlacesMap } from "@/features/geography/components/PlacesMap"

export function GeographyMapPage() {
  const { t } = useTranslation(["geography", "common"])
  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: getPlaces,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("geography:map")}</h1>
      {isLoading && <p className="mt-4 text-muted-foreground">{t("common:common.loading")}</p>}
      <div className="mt-4">
        <PlacesMap places={places ?? []} />
      </div>
    </div>
  )
}
