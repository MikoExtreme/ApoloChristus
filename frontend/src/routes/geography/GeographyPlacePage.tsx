import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPlaceByName } from "@/lib/supabase/queries/geography"
import { PlaceMiniMap } from "@/features/geography/components/PlaceMiniMap"
import { SourceAttribution } from "@/components/layout/SourceAttribution"
import { Badge } from "@/components/ui/badge"

export function GeographyPlacePage() {
  const { name } = useParams<{ name: string }>()
  const { t } = useTranslation(["geography", "common"])
  const decoded = name ? decodeURIComponent(name) : ""

  const { data: place, isLoading } = useQuery({
    queryKey: ["place", decoded],
    queryFn: () => getPlaceByName(decoded),
    enabled: !!decoded,
  })

  if (isLoading) return <p className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">{t("common:common.loading")}</p>
  if (!place) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/geography" className="text-sm text-muted-foreground hover:underline">
        ← {t("geography:backToList")}
      </Link>

      <div className="mt-2 flex items-center gap-2">
        <h1 className="font-serif text-3xl text-foreground">{place.name}</h1>
        {place.confidence_pct != null && <Badge variant="secondary">{place.confidence_pct}%</Badge>}
      </div>
      {place.is_approximate && <p className="text-sm text-muted-foreground">{t("geography:approximate")}</p>}

      <div className="mt-6">
        <PlaceMiniMap place={place} />
      </div>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("geography:coordinates")}</dt>
        <dd>
          {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
        </dd>
        {place.comment && (
          <>
            <dt className="text-muted-foreground">{t("geography:comment")}</dt>
            <dd>{place.comment}</dd>
          </>
        )}
        {place.verses && place.verses.length > 0 && (
          <>
            <dt className="text-muted-foreground">{t("geography:verses")}</dt>
            <dd>{place.verses.join(", ")}</dd>
          </>
        )}
        {place.sources && place.sources.length > 0 && (
          <>
            <dt className="text-muted-foreground">{t("geography:sources")}</dt>
            <dd>{place.sources.join(", ")}</dd>
          </>
        )}
      </dl>

      <SourceAttribution sourceUrl={place.source_url} license={place.license} />
    </div>
  )
}
