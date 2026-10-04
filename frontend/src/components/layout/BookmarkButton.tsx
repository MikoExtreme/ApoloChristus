import { Bookmark, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookmarkButtonProps {
  placing: boolean
  onToggle: () => void
}

export function BookmarkButton({ placing, onToggle }: BookmarkButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-30">
      {placing ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary bg-card px-3 py-2 text-sm text-primary shadow-lg">
          <span>Clica num parágrafo para marcar</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={onToggle}
          aria-label="Marcar posição"
        >
          <Bookmark className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}