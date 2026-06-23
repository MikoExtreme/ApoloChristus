import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface BookmarkedVerse {
  versionId: string
  book: string
  chapter: number
  verse: number
  text: string
  addedAt: number
}

function bookmarkKey(versionId: string, book: string, chapter: number, verse: number): string {
  return `${versionId}-${book}-${chapter}-${verse}`
}

interface BookmarksState {
  bookmarks: BookmarkedVerse[]
  add: (bookmark: Omit<BookmarkedVerse, "addedAt">) => void
  remove: (versionId: string, book: string, chapter: number, verse: number) => void
  has: (versionId: string, book: string, chapter: number, verse: number) => boolean
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      add: (bookmark) =>
        set((state) => {
          const key = bookmarkKey(bookmark.versionId, bookmark.book, bookmark.chapter, bookmark.verse)
          if (state.bookmarks.some((b) => bookmarkKey(b.versionId, b.book, b.chapter, b.verse) === key)) {
            return state
          }
          return { bookmarks: [...state.bookmarks, { ...bookmark, addedAt: Date.now() }] }
        }),
      remove: (versionId, book, chapter, verse) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (b) => bookmarkKey(b.versionId, b.book, b.chapter, b.verse) !== bookmarkKey(versionId, book, chapter, verse)
          ),
        })),
      has: (versionId, book, chapter, verse) => {
        const key = bookmarkKey(versionId, book, chapter, verse)
        return get().bookmarks.some((b) => bookmarkKey(b.versionId, b.book, b.chapter, b.verse) === key)
      },
    }),
    { name: "apolochristus-bookmarks" }
  )
)
