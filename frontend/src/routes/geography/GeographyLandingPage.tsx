import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { getPlaces } from "@/lib/supabase/queries/geography"
import { PlacesMap } from "@/features/geography/components/PlacesMap"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { BiblicalPlaceRow } from "@/types/database.types"

export function GeographyLandingPage() {
  const { t } = useTranslation(["geography", "common"])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<BiblicalPlaceRow | null>(null)
  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: getPlaces,
  })

  const filtered = query.trim()
    ? (places ?? []).filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : (places ?? [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{t("geography:title")}</h1>

      <div className="mt-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("geography:searchPlaceholder")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="order-2 flex min-w-0 max-h-[480px] flex-col gap-2 overflow-y-auto lg:order-1">
          {isLoading && <p className="text-muted-foreground">{t("common:common.loading")}</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground">{t("geography:noResults")}</p>
          )}
          {filtered.map((place) => (
            <Card
              key={place.id}
              className={`min-w-0 cursor-pointer hover:bg-muted/50 ${selected?.id === place.id ? "border-primary" : ""}`}
              onClick={() => setSelected(place)}
            >
              <CardContent className="flex min-w-0 items-center justify-between gap-2 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{place.name}</span>
                  {place.confidence_pct != null && (
                    <Badge variant="secondary" className="shrink-0">
                      {place.confidence_pct}%
                    </Badge>
                  )}
                </span>
                <Link
                  to={`/geography/${encodeURIComponent(place.name)}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t("geography:seeDetails")}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <PlacesMap places={places ?? []} selectedPlace={selected} height="h-[480px] lg:h-full lg:min-h-[480px]" />
        </div>
      </div>
    </div>
  )
}
