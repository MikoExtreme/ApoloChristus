import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "@/lib/leaflet-icon-fix"
import type { BiblicalPlaceRow } from "@/types/database.types"

interface PlaceMiniMapProps {
  place: BiblicalPlaceRow
}

export function PlaceMiniMap({ place }: PlaceMiniMapProps) {
  return (
    <MapContainer
      center={[place.lat, place.lon]}
      zoom={9}
      scrollWheelZoom={false}
      className="h-[280px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[place.lat, place.lon]}>
        <Popup>{place.name}</Popup>
      </Marker>
    </MapContainer>
  )
}
