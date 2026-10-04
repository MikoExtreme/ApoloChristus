import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "@/lib/leaflet-icon-fix"
import type { BiblicalPlaceRow } from "@/types/database.types"

// Paleta para diferenciar vários locais selecionados em simultâneo —
// cicla por estas cores conforme a ordem de seleção. Exportada para a lista
// (GeographyLandingPage) usar exatamente as mesmas cores nos cartões e nas
// letras do alfabeto, em sincronia com os marcadores no mapa.
export const SELECTED_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2"]

function makeSelectedIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
      background: ${color}; border: 3px solid white; transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

interface PlacesMapProps {
  places: BiblicalPlaceRow[]
  selectedPlaces?: BiblicalPlaceRow[]
  height?: string
}

// Centro/zoom por omissão: Terra Santa, abrange a maioria dos locais bíblicos.
const DEFAULT_CENTER: [number, number] = [31.5, 35]
const DEFAULT_ZOOM = 7
const SELECTED_ZOOM = 11

// Componente interno só para aceder à instância do mapa (useMap só funciona
// dentro de um <MapContainer>) — voa até ao local selecionado, ou ajusta o
// enquadramento para abranger todos os locais quando há vários selecionados.
function FlyToSelected({ places }: { places: BiblicalPlaceRow[] }) {
  const map = useMap()
  useEffect(() => {
    if (places.length === 1) {
      map.flyTo([places[0].lat, places[0].lon], SELECTED_ZOOM)
    } else if (places.length > 1) {
      map.flyToBounds(L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number])), { padding: [40, 40] })
    }
  }, [places, map])
  return null
}

export function PlacesMap({ places, selectedPlaces = [], height = "h-[480px]" }: PlacesMapProps) {
  const { t } = useTranslation("geography")
  const hasSelection = selectedPlaces.length > 0

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className={`${height} w-full rounded-lg`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected places={selectedPlaces} />
      {/* Sem seleção: mostra todos os locais agrupados em clusters (1232
          locais de uma vez tornava o mapa ilegível). Com seleção: oculta
          os restantes para dar destaque exclusivo aos escolhidos. */}
      {!hasSelection && (
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
      )}
      {selectedPlaces.map((place, i) => (
        <Marker
          key={`selected-${place.id}`}
          position={[place.lat, place.lon]}
          icon={makeSelectedIcon(SELECTED_COLORS[i % SELECTED_COLORS.length])}
          zIndexOffset={1000}
        >
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
    </MapContainer>
  )
}
