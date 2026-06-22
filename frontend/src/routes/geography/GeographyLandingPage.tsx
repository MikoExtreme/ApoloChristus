import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getPlaces } from "@/lib/supabase/queries/geography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function GeographyLandingPage() {
  const { t } = useTranslation(["geography", "common"])
  const [query, setQuery] = useState("")
  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: getPlaces,
  })

  const filtered = query.trim()
    ? (places ?? []).filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : (places ?? [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">{t("geography:title")}</h1>
        <Link to="/geography/map">
          <Button variant="outline">{t("geography:map")}</Button>
        </Link>
      </div>

      <div className="mt-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("geography:searchPlaceholder")}
        />
      </div>

      {isLoading && <p className="mt-6 text-muted-foreground">{t("common:common.loading")}</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="mt-6 text-muted-foreground">{t("geography:noResults")}</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {filtered.map((place) => (
          <Link key={place.id} to={`/geography/${encodeURIComponent(place.name)}`}>
            <Card className="hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-2">
                <span>{place.name}</span>
                {place.confidence_pct != null && <Badge variant="secondary">{place.confidence_pct}%</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
