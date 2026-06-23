import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ReadingPosition {
  versionId: string
  book: string
  chapter: number
  updatedAt: number
}

interface ReadingHistoryState {
  lastRead: ReadingPosition | null
  setLastRead: (position: Omit<ReadingPosition, "updatedAt">) => void
}

export const useReadingHistoryStore = create<ReadingHistoryState>()(
  persist(
    (set) => ({
      lastRead: null,
      setLastRead: (position) => set({ lastRead: { ...position, updatedAt: Date.now() } }),
    }),
    { name: "apolochristus-reading-history" }
  )
)
