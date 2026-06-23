import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "@/lib/leaflet-icon-fix"
import type { BiblicalPlaceRow } from "@/types/database.types"

// Ícone distinto para o local selecionado na lista — maior e de cor
// diferente, para se destacar mesmo quando há vários marcadores próximos
// uns dos outros ou agrupados num cluster.
const selectedIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
    background: #dc2626; border: 3px solid white; transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
})

interface PlacesMapProps {
  places: BiblicalPlaceRow[]
  selectedPlace?: BiblicalPlaceRow | null
  height?: string
}

// Centro/zoom por omissão: Terra Santa, abrange a maioria dos locais bíblicos.
const DEFAULT_CENTER: [number, number] = [31.5, 35]
const DEFAULT_ZOOM = 7
const SELECTED_ZOOM = 11

// Componente interno só para aceder à instância do mapa (useMap só funciona
// dentro de um <MapContainer>) e voar até ao local selecionado na lista.
function FlyToSelected({ place }: { place: BiblicalPlaceRow | null | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (place) map.flyTo([place.lat, place.lon], SELECTED_ZOOM)
  }, [place, map])
  return null
}

export function PlacesMap({ places, selectedPlace, height = "h-[480px]" }: PlacesMapProps) {
  const { t } = useTranslation("geography")
  const selectedMarkerRef = useRef<L.Marker>(null)

  useEffect(() => {
    if (selectedPlace) selectedMarkerRef.current?.openPopup()
  }, [selectedPlace])

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className={`${height} w-full rounded-lg`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected place={selectedPlace} />
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
      {/* Marcador dedicado para o local selecionado na lista — fora do
          cluster, para nunca ficar escondido dentro de uma bolha agrupada,
          mesmo com vários locais muito próximos uns dos outros. */}
      {selectedPlace && (
        <Marker
          key={`selected-${selectedPlace.id}`}
          position={[selectedPlace.lat, selectedPlace.lon]}
          icon={selectedIcon}
          ref={selectedMarkerRef}
          zIndexOffset={1000}
        >
          <Popup>
            <strong>{selectedPlace.name}</strong>
            {selectedPlace.is_approximate && <span> ({t("approximate")})</span>}
            {selectedPlace.confidence_pct != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("confidence")}: {selectedPlace.confidence_pct}%
              </p>
            )}
            <Link to={`/geography/${encodeURIComponent(selectedPlace.name)}`} className="mt-1 block text-xs underline">
              {t("seeDetails")}
            </Link>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
