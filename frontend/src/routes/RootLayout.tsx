import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useThemeStore } from "@/features/theme/store/useThemeStore"
import { NavBar } from "@/components/layout/NavBar"

export function RootLayout() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="min-h-svh bg-background text-foreground font-sans">
      <NavBar />
      <Outlet />
    </div>
  )
}
