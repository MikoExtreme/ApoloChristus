import { Bookmark, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useBookmarksStore } from "@/features/shared/store/useBookmarksStore"

export function BookmarksPanel() {
  const { bookmarks, removeBookmark } = useBookmarksStore()

  function handleNavigate(id: string, url: string) {
    removeBookmark(id)
    window.location.href = url
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Marcadores">
            <Bookmark className="size-4" />
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Marcadores</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2 px-4">
          {bookmarks.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem marcadores guardados.</p>
          )}
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-start gap-2">
              <button
                className="flex-1 text-left text-sm hover:underline"
                onClick={() => handleNavigate(b.id, b.url)}
              >
                {b.label}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground"
                onClick={() => removeBookmark(b.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}