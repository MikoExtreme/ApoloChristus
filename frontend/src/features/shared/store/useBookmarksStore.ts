import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Bookmark {
  id: string
  url: string      // ex: /patristics/ante-nicene/42/123#section-5
  label: string    // ex: "Carta de Policarpo — Em verdade, todo aquele que..."
  createdAt: number
}

interface BookmarksState {
  bookmarks: Bookmark[]
  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void
  removeBookmark: (id: string) => void
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set) => ({
      bookmarks: [],
      addBookmark: (b) =>
        set((s) => ({
          bookmarks: [
            { ...b, id: crypto.randomUUID(), createdAt: Date.now() },
            ...s.bookmarks,
          ],
        })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    }),
    { name: "apolo-bookmarks" }
  )
)