import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "catholic" | "orthodox" | "protestant" | "agnostic"
export type ColorMode = "light" | "dark"

interface ThemeState {
  theme: Theme
  mode: ColorMode
  setTheme: (theme: Theme) => void
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
}

// Primeira visita: segue a preferência do sistema. Depois fica a escolha
// guardada em localStorage.
function systemMode(): ColorMode {
  if (typeof window === "undefined" || !window.matchMedia) return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "catholic",
      mode: systemMode(),
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((s) => ({ mode: s.mode === "dark" ? "light" : "dark" })),
    }),
    { name: "apolochristus-theme" }
  )
)
