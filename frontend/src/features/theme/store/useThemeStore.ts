import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "catholic" | "orthodox" | "protestant"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "catholic",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "apolochristus-theme" }
  )
)
