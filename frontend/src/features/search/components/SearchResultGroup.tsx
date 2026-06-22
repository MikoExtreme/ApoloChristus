import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SearchResult } from "@/types/content"

interface SearchResultItemProps {
  result: SearchResult
}

function SearchResultItem({ result }: SearchResultItemProps) {
  switch (result.type) {
    case "verse":
      return (
        <Link to={`/bible/${result.versionId}/${result.book}/${result.chapter}`}>
          <Card className="hover:bg-muted/50">
            <CardContent className="py-3">
              <Badge variant="secondary">
                {result.book} {result.chapter}:{result.verse}
              </Badge>
              <p className="mt-2 font-serif">{result.text}</p>
            </CardContent>
          </Card>
        </Link>
      )
    case "patristic-section":
      return (
        <Card>
          <CardContent className="py-3">
            <Badge variant="secondary">
              {result.authorName} — {result.workTitle}
            </Badge>
            <p className="mt-2 font-serif">{result.text}</p>
          </CardContent>
        </Card>
      )
    case "lexicon-entry":
      return (
        <Link to={`/lexicon/${result.dStrong}`}>
          <Card className="hover:bg-muted/50">
            <CardContent className="py-3">
              <Badge variant="secondary">{result.dStrong}</Badge>
              <p className="mt-2 font-serif">
                {result.word} {result.transliteration && `(${result.transliteration})`}
              </p>
              {result.gloss && <p className="text-sm text-muted-foreground">{result.gloss}</p>}
            </CardContent>
          </Card>
        </Link>
      )
  }
}

function resultKey(result: SearchResult): string {
  switch (result.type) {
    case "verse":
      return `verse-${result.versionId}-${result.book}-${result.chapter}-${result.verse}`
    case "patristic-section":
      return `patristic-${result.workId}-${result.sectionNum}`
    case "lexicon-entry":
      return `lexicon-${result.dStrong}`
  }
}

interface SearchResultGroupProps {
  results: SearchResult[]
}

export function SearchResultGroup({ results }: SearchResultGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      {results.map((result) => (
        <SearchResultItem key={resultKey(result)} result={result} />
      ))}
    </div>
  )
}
