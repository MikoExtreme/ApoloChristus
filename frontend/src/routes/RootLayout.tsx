import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useThemeStore } from "@/features/theme/store/useThemeStore"
import { NavBar } from "@/components/layout/NavBar"
import { Footer } from "@/components/layout/Footer"

export function RootLayout() {
  const theme = useThemeStore((state) => state.theme)
  const mode = useThemeStore((state) => state.mode)
  const location = useLocation()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark")
  }, [mode])

  // NOTA: sem bg-background neste wrapper — o padrão de fundo do tema vive
  // no body (ver themes.css) e seria tapado por uma cor sólida aqui.
  return (
    <div className="flex min-h-svh flex-col text-foreground font-sans">
      <NavBar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
