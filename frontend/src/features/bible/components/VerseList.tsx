import { VerseLine } from "@/features/bible/components/VerseLine"
import type { VerseRow, CrossReferenceRow, InterlinearWordRow } from "@/types/database.types"

interface VerseListProps {
  verses: VerseRow[]
  showInterlinear: boolean
  interlinearWords: InterlinearWordRow[]
  showCrossReferences: boolean
  crossReferences: CrossReferenceRow[]
  showCitations: boolean
  concordanceClickable: boolean
  onTextWordClick: (word: string) => void
  onStrongClick: (strongNumber: string) => void
}

export function VerseList({
  verses,
  showInterlinear,
  interlinearWords,
  showCrossReferences,
  crossReferences,
  showCitations,
  concordanceClickable,
  onTextWordClick,
  onStrongClick,
}: VerseListProps) {
  return (
    <div className="flex flex-col">
      {verses.map((verse) => (
        <VerseLine
          key={verse.id}
          verse={verse}
          showInterlinear={showInterlinear}
          interlinearWords={interlinearWords.filter((w) => w.verse === verse.verse)}
          showCrossReferences={showCrossReferences}
          crossReferences={crossReferences.filter((r) => r.source_v === verse.verse)}
          showCitations={showCitations}
          concordanceClickable={concordanceClickable}
          onTextWordClick={onTextWordClick}
          onStrongClick={onStrongClick}
        />
      ))}
    </div>
  )
}
