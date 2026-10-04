import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, X } from "lucide-react"
import { getPlaces } from "@/lib/supabase/queries/geography"
import { PlacesMap, SELECTED_COLORS } from "@/features/geography/components/PlacesMap"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { BiblicalPlaceRow } from "@/types/database.types"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function GeographyLandingPage() {
  const { t } = useTranslation(["geography", "common"])
  const [query, setQuery] = useState("")
  const [letter, setLetter] = useState("A")
  // Array (não Set) para preservar a ordem de seleção — assim a cor
  // atribuída a cada local fica estável mesmo que se adicionem/removam
  // outros depois, em vez de baralhar sempre que a lista de selecionados
  // muda (o que aconteceria se a cor dependesse da posição alfabética).
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: getPlaces,
  })

  const isSearching = query.trim().length > 0
  const filtered = isSearching
    ? (places ?? []).filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : (places ?? []).filter((p) => p.name[0]?.toUpperCase() === letter)

  const selectedPlaces = useMemo(
    () =>
      selectedIds
        .map((id) => (places ?? []).find((p) => p.id === id))
        .filter((p): p is BiblicalPlaceRow => !!p),
    [places, selectedIds]
  )

  // Cor por local selecionado (mesma ordem/paleta usada pelos marcadores no
  // mapa) e cor por letra do alfabeto que tenha pelo menos um selecionado —
  // para não se perder a noção de "onde" se selecionou ao navegar para
  // outra letra.
  const colorByPlaceId = useMemo(() => {
    const map = new Map<string, string>()
    selectedPlaces.forEach((p, i) => map.set(p.id, SELECTED_COLORS[i % SELECTED_COLORS.length]))
    return map
  }, [selectedPlaces])

  const colorByLetter = useMemo(() => {
    const map = new Map<string, string>()
    selectedPlaces.forEach((p) => {
      const char = p.name[0]?.toUpperCase()
      const color = colorByPlaceId.get(p.id)
      if (char && color && !map.has(char)) map.set(char, color)
    })
    return map
  }, [selectedPlaces, colorByPlaceId])

  function toggleSelected(place: BiblicalPlaceRow) {
    setSelectedIds((prev) =>
      prev.includes(place.id) ? prev.filter((id) => id !== place.id) : [...prev, place.id]
    )
  }

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

      {!isSearching && (
        <div className="mt-4 flex flex-wrap gap-1">
          {ALPHABET.map((char) => {
            const dotColor = colorByLetter.get(char)
            return (
              <Button
                key={char}
                size="sm"
                variant={char === letter ? "default" : "outline"}
                onClick={() => setLetter(char)}
                className="relative"
                style={dotColor && char !== letter ? { borderColor: dotColor, borderWidth: 2 } : undefined}
              >
                {char}
                {dotColor && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 size-2 rounded-full ring-1 ring-background"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </Button>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{t("geography:compareHint")}</span>
        {selectedPlaces.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {t("geography:selectedCount", { count: selectedPlaces.length })}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              <X className="size-3.5" /> {t("geography:clearSelection")}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="order-2 flex min-w-0 max-h-[480px] flex-col gap-2 overflow-y-auto lg:order-1">
          {isLoading && <p className="text-muted-foreground">{t("common:common.loading")}</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground">{t("geography:noResults")}</p>
          )}
          {filtered.map((place) => {
            const color = colorByPlaceId.get(place.id)
            return (
              <Card
                key={place.id}
                className="min-w-0 shrink-0 cursor-pointer border-l-4 hover:bg-muted/50"
                style={
                  color
                    ? { borderLeftColor: color, backgroundColor: `${color}1A` }
                    : { borderLeftColor: "transparent" }
                }
                onClick={() => toggleSelected(place)}
              >
                <CardContent className="flex min-w-0 items-center justify-between gap-2 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium" style={color ? { color } : undefined}>
                      {place.name}
                    </span>
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
            )
          })}
        </div>

        <div className="order-1 lg:order-2">
          <PlacesMap places={places ?? []} selectedPlaces={selectedPlaces} height="h-[480px] lg:h-full lg:min-h-[480px]" />
        </div>
      </div>
    </div>
  )
}
