import { Navigate } from "react-router-dom"

// A lista e o mapa foram fundidos numa só vista em /geography — esta rota
// fica só para não partir links antigos.
export function GeographyMapPage() {
  return <Navigate to="/geography" replace />
}
