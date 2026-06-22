import { Badge } from "@/components/ui/badge"
import { InterlinearWordRow } from "@/features/bible/components/InterlinearWordRow"
import { CrossReferencePanel } from "@/features/bible/components/CrossReferencePanel"
import { PatristicCitationsPanel } from "@/features/bible/components/PatristicCitationsPanel"
import type { VerseRow, CrossReferenceRow, InterlinearWordRow as InterlinearWordRowType } from "@/types/database.types"

interface VerseLineProps {
  verse: VerseRow
  showInterlinear: boolean
  interlinearWords: InterlinearWordRowType[]
  showCrossReferences: boolean
  crossReferences: CrossReferenceRow[]
  showCitations: boolean
  concordanceClickable: boolean
  onTextWordClick: (word: string) => void
  onStrongClick: (strongNumber: string) => void
}

export function VerseLine({
  verse,
  showInterlinear,
  interlinearWords,
  showCrossReferences,
  crossReferences,
  showCitations,
  concordanceClickable,
  onTextWordClick,
  onStrongClick,
}: VerseLineProps) {
  return (
    <div className="py-1">
      <p className="font-serif text-lg leading-relaxed">
        <Badge variant="outline" className="mr-2 align-super text-[10px]">
          {verse.verse}
        </Badge>
        {concordanceClickable
          ? verse.text.split(/(\s+)/).map((token, i) =>
              token.trim() ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => onTextWordClick(token.replace(/[.,;:!?"'()]/g, ""))}
                  className="cursor-pointer hover:bg-accent/30"
                >
                  {token}
                </button>
              ) : (
                <span key={i}>{token}</span>
              )
            )
          : verse.text}
      </p>

      {showInterlinear && (
        <InterlinearWordRow words={interlinearWords} clickable={concordanceClickable} onWordClick={onStrongClick} />
      )}
      {showCrossReferences && <CrossReferencePanel refs={crossReferences} versionId={verse.version_id} />}
      {showCitations && (
        <PatristicCitationsPanel book={verse.book} chapter={verse.chapter} verse={verse.verse} enabled={showCitations} />
      )}
    </div>
  )
}
