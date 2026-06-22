import { Link } from "react-router-dom"
import type { InterlinearWordRow as InterlinearWordRowType } from "@/types/database.types"

interface InterlinearWordRowProps {
  words: InterlinearWordRowType[]
  clickable: boolean
  onWordClick: (strongNumber: string) => void
}

export function InterlinearWordRow({ words, clickable, onWordClick }: InterlinearWordRowProps) {
  if (words.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-3 border-l-2 border-border pl-3">
      {words.map((word) => {
        const strong = word.strong_numbers?.[0]
        return (
          <div key={word.word_position} className="text-center">
            <button
              type="button"
              disabled={!clickable || !strong}
              onClick={() => strong && onWordClick(strong)}
              className={`font-serif text-base ${clickable && strong ? "cursor-pointer underline decoration-dotted hover:text-primary" : ""}`}
            >
              {word.original_word}
            </button>
            {word.transliteration && <p className="text-[10px] text-muted-foreground">{word.transliteration}</p>}
            {strong && (
              <Link to={`/lexicon/${strong}`} className="text-[10px] text-muted-foreground hover:underline">
                {strong}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
