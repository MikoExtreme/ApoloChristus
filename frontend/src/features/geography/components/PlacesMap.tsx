import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "@/lib/leaflet-icon-fix"
import type { BiblicalPlaceRow } from "@/types/database.types"

interface PlacesMapProps {
  places: BiblicalPlaceRow[]
}

// Centro/zoom por omissão: Terra Santa, abrange a maioria dos locais bíblicos.
const DEFAULT_CENTER: [number, number] = [31.5, 35]
const DEFAULT_ZOOM = 7

export function PlacesMap({ places }: PlacesMapProps) {
  const { t } = useTranslation("geography")

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-[480px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Agrupa marcadores próximos em clusters — com 1232 locais, mostrar
          todos os pinos de uma vez tornava o mapa ilegível ao abrir. */}
      <MarkerClusterGroup chunkedLoading>
        {places.map((place) => (
          <Marker key={place.id} position={[place.lat, place.lon]}>
            <Popup>
              <strong>{place.name}</strong>
              {place.is_approximate && <span> ({t("approximate")})</span>}
              {place.confidence_pct != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("confidence")}: {place.confidence_pct}%
                </p>
              )}
              <Link to={`/geography/${encodeURIComponent(place.name)}`} className="mt-1 block text-xs underline">
                {t("seeDetails")}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
