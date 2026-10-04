import type { ReactNode } from "react"

// Moldura decorada para conteúdo central/canónico (texto de um credo,
// confissão, etc.) — borda dupla e cantos ornamentados, ao estilo de uma
// página de título iluminada, em vez de um <Card> genérico.
export function OrnateFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mt-6 border border-primary/40 p-px">
      <div className="border border-primary/25 px-6 py-8 sm:px-10">
        {/* Cantos — pequenos traços em L, repetidos nos 4 cantos via rotação. */}
        {[
          "left-[-1px] top-[-1px]",
          "right-[-1px] top-[-1px] rotate-90",
          "right-[-1px] bottom-[-1px] rotate-180",
          "left-[-1px] bottom-[-1px] -rotate-90",
        ].map((pos) => (
          <svg
            key={pos}
            viewBox="0 0 20 20"
            className={`pointer-events-none absolute size-5 text-accent ${pos}`}
            aria-hidden="true"
          >
            <path d="M0 0H10M0 0V10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="0" cy="0" r="2" fill="currentColor" />
          </svg>
        ))}
        {children}
      </div>
    </div>
  )
}
