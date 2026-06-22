// Workaround conhecido do Leaflet + bundlers (Vite/webpack): o ícone por
// omissão referencia caminhos relativos que não resolvem corretamente.
// Reaponta para os assets importados pelo Vite (URLs corretas após build).
import L from "leaflet"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

type IconDefaultPrototype = typeof L.Icon.Default.prototype & { _getIconUrl?: string }
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
